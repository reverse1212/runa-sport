import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'
import { db } from './db.js'

export const BACKUP_DIR = path.join(process.cwd(), 'backups')
const UPLOADS = path.join(process.cwd(), 'public', 'uploads')
export const BACKUP_NAME = /^runa-backup-\d{8}-\d{6}(-pre)?\.zip$/

// [tabla SQL, delegado Prisma], en orden de dependencias (padres primero).
const TABLES = [
  ['User', 'user'], ['Category', 'category'], ['Product', 'product'], ['ProductImage', 'productImage'],
  ['ProductSize', 'productSize'], ['ProductColor', 'productColor'], ['Inventory', 'inventory'],
  ['InventoryMovement', 'inventoryMovement'], ['SiteSetting', 'siteSetting'], ['AnalyticsEvent', 'analyticsEvent'],
  ['ContactQuery', 'contactQuery'], ['ActivityLog', 'activityLog'],
]

export async function createBackup(userId, tag = '') {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const data = {}
  for (const [, d] of TABLES) data[d] = await db[d].findMany()
  const zip = new AdmZip()
  zip.addFile('db.json', Buffer.from(JSON.stringify({ version: 1, createdAt: new Date().toISOString(), data })))
  if (fs.existsSync(UPLOADS)) zip.addLocalFolder(UPLOADS, 'uploads')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '').replace('T', '-')
  const filename = `runa-backup-${stamp}${tag}.zip`
  zip.writeZip(path.join(BACKUP_DIR, filename))
  const sizeBytes = fs.statSync(path.join(BACKUP_DIR, filename)).size
  return db.backup.create({ data: { filename, sizeBytes, createdById: userId ?? null } })
}

export async function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return []
  const rows = await db.backup.findMany({ include: { createdBy: { select: { name: true } } } })
  const meta = new Map(rows.map((r) => [r.filename, r]))
  return fs.readdirSync(BACKUP_DIR).filter((f) => BACKUP_NAME.test(f)).sort().reverse().map((filename) => {
    const st = fs.statSync(path.join(BACKUP_DIR, filename))
    const m = meta.get(filename)
    return { filename, size: st.size, createdAt: m?.createdAt ?? st.mtime, by: m?.createdBy?.name ?? null }
  })
}

export function backupPath(filename) {
  if (!BACKUP_NAME.test(filename)) return null
  const p = path.join(BACKUP_DIR, filename)
  return fs.existsSync(p) ? p : null
}

export async function deleteBackupFile(filename) {
  const p = backupPath(filename)
  if (!p) return false
  fs.unlinkSync(p)
  await db.backup.deleteMany({ where: { filename } })
  return true
}

export async function restoreBackup(filename) {
  const p = backupPath(filename)
  if (!p) throw new Error('El backup no existe.')
  const zip = new AdmZip(p)
  const entry = zip.getEntry('db.json')
  if (!entry) throw new Error('El archivo no es un backup válido.')
  const parsed = JSON.parse(entry.getData().toString('utf8'))
  if (parsed.version !== 1 || !parsed.data) throw new Error('Versión de backup no compatible.')
  for (const [, d] of TABLES) if (!Array.isArray(parsed.data[d])) throw new Error('El backup está incompleto.')

  await db.$transaction(async (tx) => {
    for (const [, d] of [...TABLES].reverse()) await tx[d].deleteMany()
    for (const [, d] of TABLES) {
      const rows = parsed.data[d]
      for (let i = 0; i < rows.length; i += 500) await tx[d].createMany({ data: rows.slice(i, i + 500) })
    }
    for (const [t, d] of TABLES) {
      if (d === 'inventory' || d === 'siteSetting') continue // sin id autoincremental
      await tx.$queryRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${t}"','id'), GREATEST((SELECT COALESCE(MAX(id),0) FROM "${t}"),1), (SELECT COUNT(*) > 0 FROM "${t}"))`)
    }
  }, { timeout: 180000, maxWait: 10000 })

  // Imágenes: se reemplaza la carpeta por la del backup.
  const files = zip.getEntries().filter((e) => !e.isDirectory && e.entryName.startsWith('uploads/'))
  if (fs.existsSync(UPLOADS)) {
    for (const item of fs.readdirSync(UPLOADS)) if (item !== '.gitignore') fs.rmSync(path.join(UPLOADS, item), { recursive: true, force: true })
  }
  for (const e of files) {
    const target = path.join(process.cwd(), 'public', e.entryName)
    if (!target.startsWith(UPLOADS + path.sep)) continue
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, e.getData())
  }
}
