import sharp from 'sharp'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const ROOT = path.join(process.cwd(), 'public', 'uploads')

// Optimiza automáticamente: corrige orientación, redimensiona y comprime (WEBP por defecto, PNG para favicon).
export async function saveImageBuffer(buffer, { subdir, maxWidth = 1600, square = false, quality = 82, format = 'webp' } = {}) {
  const safeSub = subdir.replace(/[^a-zA-Z0-9/_-]/g, '')
  const dir = path.join(ROOT, safeSub)
  await mkdir(dir, { recursive: true })
  const ext = format === 'png' ? 'png' : 'webp'
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
  let img = sharp(buffer, { failOn: 'none' }).rotate()
  const meta = await img.metadata()
  if (square) {
    const side = Math.min(meta.width || maxWidth, meta.height || maxWidth, maxWidth)
    img = img.resize(side, side, { fit: 'cover' })
  } else if ((meta.width || 0) > maxWidth) {
    img = img.resize({ width: maxWidth })
  }
  const out = ext === 'png' ? await img.png({ compressionLevel: 9 }).toBuffer() : await img.webp({ quality }).toBuffer()
  await writeFile(path.join(dir, name), out)
  return { url: `/uploads/${safeSub}/${name}`, storageKey: `${safeSub}/${name}` }
}

export async function deleteImageFile(storageKey) {
  if (!storageKey) return
  const file = path.join(ROOT, storageKey)
  if (!file.startsWith(ROOT + path.sep)) return
  try { await unlink(file) } catch {}
}

export const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
