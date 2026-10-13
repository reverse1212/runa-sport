'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { db } from './db.js'
import { requireUser, getUser, startSession, endSession } from './auth.js'
import { logActivity, clientIp } from './log.js'
import { slugify, money } from './util.js'
import { saveImageBuffer, deleteImageFile, ALLOWED_TYPES, MAX_UPLOAD_BYTES } from './images.js'
import { createHash, randomBytes } from 'crypto'
import { sendMail } from './mail.js'
import { createBackup, restoreBackup, deleteBackupFile, BACKUP_NAME } from './backup.js'

const DUMMY = bcrypt.hashSync('x', 12)
const fails = new Map()

export async function login(_, fd) {
  const email = String(fd.get('email') || '').trim().toLowerCase().slice(0, 200)
  const password = String(fd.get('password') || '').slice(0, 200)
  const key = `${clientIp()}|${email}`
  const f = (fails.get(key) || []).filter((t) => Date.now() - t < 900000)
  if (f.length >= 5) return { error: 'Demasiados intentos. Probá de nuevo en 15 minutos.' }
  const user = await db.user.findUnique({ where: { email } })
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY)
  if (!user || !user.active || !ok) {
    f.push(Date.now()); fails.set(key, f)
    await logActivity(null, 'Login fallido', 'Sesión', null, `Intento con ${email}`)
    return { error: 'Email o contraseña incorrectos.' }
  }
  fails.delete(key)
  await startSession(user)
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await logActivity(user, 'Inicio de sesión', 'Sesión')
  redirect('/admin')
}

export async function logout() {
  const u = await getUser()
  await endSession()
  if (u) await logActivity(u, 'Cierre de sesión', 'Sesión')
  redirect('/admin/login')
}

// ---------- Productos ----------
const int = (v) => { const s = String(v ?? '').trim(); if (!s) return null; const n = Number(s); return Number.isInteger(n) && n >= 0 && n < 1e9 ? n : NaN }
const list = (v) => [...new Set(String(v || '').split(',').map((s) => s.trim().slice(0, 40)).filter(Boolean))].slice(0, 20)
const txt = (v, max) => String(v || '').trim().slice(0, max) || null

async function parseProduct(fd, creating) {
  const name = String(fd.get('name') || '').trim().slice(0, 120)
  const price = int(fd.get('price')), oldPrice = int(fd.get('oldPrice')), promoPrice = int(fd.get('promoPrice'))
  const minStock = int(fd.get('minStock')) ?? 5, stock = int(fd.get('stock')) ?? 0
  const status = String(fd.get('status'))
  const color = String(fd.get('swatchColor') || '')
  const categoryId = Number(fd.get('categoryId'))
  const slug = slugify(txt(fd.get('slug'), 120) || name)
  if (!name) return { error: 'El nombre es obligatorio.' }
  if (price == null || Number.isNaN(price)) return { error: 'El precio debe ser un número entero mayor o igual a 0.' }
  if ([oldPrice, promoPrice, minStock, stock].some(Number.isNaN)) return { error: 'Precios y stock deben ser números enteros positivos.' }
  if (promoPrice != null && promoPrice >= price) return { error: 'El precio promocional debe ser menor al precio.' }
  if (!['PUBLISHED', 'HIDDEN', 'DRAFT'].includes(status)) return { error: 'Estado inválido.' }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: 'Color inválido.' }
  if (!slug) return { error: 'La URL amigable no puede quedar vacía.' }
  if (!(await db.category.findUnique({ where: { id: categoryId } }))) return { error: 'Elegí una categoría válida.' }
  return {
    sizes: list(fd.get('sizes')), colors: list(fd.get('colors')), minStock, stock: creating ? stock : 0,
    data: { name, slug, categoryId, price, oldPrice, promoPrice, status, swatchColor: color, swatchDark: fd.get('swatchDark') === 'on', featured: fd.get('featured') === 'on',
      description: txt(fd.get('description'), 2000), sku: txt(fd.get('sku'), 60), internalCode: txt(fd.get('internalCode'), 60), tags: list(fd.get('tags')),
      metaTitle: txt(fd.get('metaTitle'), 120), metaDescription: txt(fd.get('metaDescription'), 300) },
  }
}

const LABELS = { name: 'nombre', price: 'precio', oldPrice: 'precio anterior', promoPrice: 'precio promocional', status: 'estado', categoryId: 'categoría', sku: 'SKU', slug: 'URL', featured: 'destacado', description: 'descripción' }
function diff(b, d, sizes) {
  const out = []
  for (const [k, label] of Object.entries(LABELS)) {
    if (String(b[k] ?? '') === String(d[k] ?? '')) continue
    out.push(k === 'description' || k === 'categoryId' ? `${label} modificada` : `${label}: ${/rice/.test(k) ? money(b[k]) : (b[k] ?? '—')} → ${/rice/.test(k) ? money(d[k]) : (d[k] ?? '—')}`)
  }
  const old = b.sizes.map((s) => s.label).join('/')
  if (old !== sizes.join('/')) out.push(`talles: ${old || '—'} → ${sizes.join('/') || '—'}`)
  return out.join('; ') || 'Sin cambios de datos'
}

export async function saveProduct(_, fd) {
  const user = await requireUser('products')
  const id = Number(fd.get('id')) || null
  const r = await parseProduct(fd, !id)
  if (r.error) return { error: r.error }
  const { data, sizes, colors, minStock, stock } = r
  const nested = { sizes: { create: sizes.map((label, position) => ({ label, position })) }, colors: { create: colors.map((name) => ({ name })) } }
  let saved
  try {
    if (id) {
      const before = await db.product.findUnique({ where: { id }, include: { sizes: { orderBy: { position: 'asc' } } } })
      if (!before) return { error: 'El producto no existe.' }
      saved = await db.$transaction(async (tx) => {
        await tx.productSize.deleteMany({ where: { productId: id } })
        await tx.productColor.deleteMany({ where: { productId: id } })
        await tx.inventory.upsert({ where: { productId: id }, update: { minStock }, create: { productId: id, quantity: 0, minStock } })
        return tx.product.update({ where: { id }, data: { ...data, ...nested } })
      })
      await logActivity(user, 'Editar producto', 'Producto', id, `${saved.name} — ${diff(before, data, sizes)}`)
    } else {
      saved = await db.product.create({ data: { ...data, ...nested, inventory: { create: { quantity: stock, minStock } },
        ...(stock > 0 && { movements: { create: { userId: user.id, previous: 0, next: stock, delta: stock, note: 'Alta de producto' } } }) } })
      await logActivity(user, 'Crear producto', 'Producto', saved.id, `${saved.name} — ${money(saved.price)}`)
    }
  } catch (e) {
    if (e.code === 'P2002') return { error: 'Ya existe un producto con ese SKU o esa URL amigable.' }
    throw e
  }
  redirect('/admin/productos')
}

export async function deleteProduct(id) {
  const user = await requireUser('products')
  const p = await db.product.findUnique({ where: { id }, include: { images: true } })
  if (p) {
    await db.product.delete({ where: { id } })
    for (const img of p.images) await removeImageFiles(img)
    await logActivity(user, 'Eliminar producto', 'Producto', id, p.name)
  }
  revalidatePath('/admin', 'layout'); revalidatePath('/')
}

export async function toggleProduct(id) {
  const user = await requireUser('products')
  const p = await db.product.findUnique({ where: { id } })
  if (!p) return
  const status = p.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED'
  await db.product.update({ where: { id }, data: { status } })
  await logActivity(user, status === 'PUBLISHED' ? 'Publicar producto' : 'Ocultar producto', 'Producto', id, p.name)
  revalidatePath('/admin', 'layout')
}

export async function duplicateProduct(id) {
  const user = await requireUser('products')
  const p = await db.product.findUnique({ where: { id }, include: { sizes: true, colors: true, inventory: true } })
  if (!p) return
  const { id: _i, createdAt, updatedAt, sizes, colors, inventory, sku, ...rest } = p
  const copy = await db.product.create({ data: { ...rest, name: `${p.name} (copia)`, slug: `${p.slug}-copia-${Date.now().toString(36)}`, status: 'HIDDEN',
    sizes: { create: sizes.map((s) => ({ label: s.label, position: s.position })) }, colors: { create: colors.map((c) => ({ name: c.name, hex: c.hex })) },
    inventory: { create: { quantity: 0, minStock: inventory?.minStock ?? 5 } } } })
  await logActivity(user, 'Duplicar producto', 'Producto', copy.id, `Copia de ${p.name} (oculta, stock 0)`)
  revalidatePath('/admin', 'layout')
}

// ---------- Categorías ----------
export async function saveCategory(_, fd) {
  const user = await requireUser('products')
  const id = Number(fd.get('id')) || null
  const name = String(fd.get('name') || '').trim().slice(0, 60)
  const position = int(fd.get('position')) ?? 0
  if (!name || Number.isNaN(position)) return { error: 'Revisá el nombre y la posición.' }
  const data = { name, description: txt(fd.get('description'), 300), position, visible: fd.get('visible') === 'on' }
  try {
    if (id) await db.category.update({ where: { id }, data })
    else await db.category.create({ data: { ...data, slug: slugify(name) } })
  } catch (e) {
    if (e.code === 'P2002') return { error: 'Ya existe una categoría con ese nombre.' }
    throw e
  }
  await logActivity(user, id ? 'Editar categoría' : 'Crear categoría', 'Categoría', id, name)
  revalidatePath('/admin', 'layout')
  return { ok: 'Guardado' }
}

export async function deleteCategory(id) {
  const user = await requireUser('products')
  const c = await db.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } })
  if (!c || c._count.products > 0) return
  await db.category.delete({ where: { id } })
  await logActivity(user, 'Eliminar categoría', 'Categoría', id, c.name)
  revalidatePath('/admin', 'layout')
}

// ---------- Stock ----------
export async function adjustStock(fd) {
  const user = await requireUser('stock')
  const productId = Number(fd.get('productId'))
  const d = fd.get('delta'), q = String(fd.get('qty') ?? '').trim()
  if (d !== null ? ![-5, -1, 1, 5].includes(Number(d)) : !q) return
  const res = await db.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({ where: { productId }, include: { product: { select: { name: true } } } })
    if (!inv) return null
    let next = d !== null ? inv.quantity + Number(d) : Number(q)
    if (!Number.isInteger(next)) return null
    next = Math.min(Math.max(next, 0), 1000000)
    const delta = next - inv.quantity
    if (!delta) return null
    await tx.inventory.update({ where: { productId }, data: { quantity: next } })
    await tx.inventoryMovement.create({ data: { productId, userId: user.id, previous: inv.quantity, next, delta } })
    return { name: inv.product.name, prev: inv.quantity, next, delta }
  })
  if (res) await logActivity(user, 'Modificar stock', 'Producto', productId, `${res.name}: ${res.prev} → ${res.next} (${res.delta > 0 ? '+' : ''}${res.delta})`)
  revalidatePath('/admin', 'layout')
}

// ---------- Imágenes de producto ----------
const keyOf = (url) => (url && url.startsWith('/uploads/') ? url.slice('/uploads/'.length) : null)
async function removeImageFiles(img) {
  await deleteImageFile(img.storageKey)
  await deleteImageFile(keyOf(img.previousUrl))
}
async function readImageFile(fd, field) {
  const f = fd.get(field)
  if (!(f instanceof File) || f.size === 0) return null
  if (!ALLOWED_TYPES.has(f.type)) throw new Error('Formato no permitido. Usá JPG, PNG o WEBP.')
  if (f.size > MAX_UPLOAD_BYTES) throw new Error('La imagen pesa demasiado (máximo 8 MB).')
  return Buffer.from(await f.arrayBuffer())
}

export async function uploadProductImage(fd) {
  const user = await requireUser('images')
  const productId = Number(fd.get('productId'))
  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) return { error: 'El producto no existe.' }
  let buf
  try { buf = await readImageFile(fd, 'file') } catch (e) { return { error: e.message } }
  if (!buf) return { error: 'Elegí un archivo de imagen.' }
  const { url, storageKey } = await saveImageBuffer(buf, { subdir: `products/${productId}` })
  const count = await db.productImage.count({ where: { productId } })
  await db.productImage.create({ data: { productId, url, storageKey, alt: String(fd.get('alt') || product.name).slice(0, 160), title: String(fd.get('title') || '').slice(0, 160), position: count, isPrimary: count === 0 } })
  await logActivity(user, 'Subir imagen', 'Producto', productId, `${product.name}: nueva imagen`)
  revalidatePath('/admin', 'layout'); revalidatePath('/')
  return { ok: 'Imagen subida' }
}

export async function replaceProductImage(fd) {
  const user = await requireUser('images')
  const imageId = Number(fd.get('imageId'))
  const existing = await db.productImage.findUnique({ where: { id: imageId }, include: { product: { select: { name: true } } } })
  if (!existing) return { error: 'La imagen no existe.' }
  let buf
  try { buf = await readImageFile(fd, 'file') } catch (e) { return { error: e.message } }
  if (!buf) return { error: 'Elegí un archivo de imagen.' }
  const { url, storageKey } = await saveImageBuffer(buf, { subdir: `products/${existing.productId}` })
  await db.productImage.update({ where: { id: imageId }, data: { previousUrl: existing.url, url, storageKey } })
  await deleteImageFile(keyOf(existing.previousUrl)) // la copia de hace dos versiones ya no se puede restaurar
  await logActivity(user, 'Reemplazar imagen', 'Producto', existing.productId, existing.product.name)
  revalidatePath('/admin', 'layout'); revalidatePath('/')
  return { ok: 'Imagen reemplazada' }
}

export async function restoreProductImage(id) {
  const user = await requireUser('images')
  const img = await db.productImage.findUnique({ where: { id }, include: { product: { select: { name: true } } } })
  if (!img?.previousUrl) return
  await db.productImage.update({ where: { id }, data: { url: img.previousUrl, previousUrl: null, storageKey: keyOf(img.previousUrl) } })
  await deleteImageFile(img.storageKey)
  await logActivity(user, 'Restaurar imagen anterior', 'Producto', img.productId, img.product.name)
  revalidatePath('/admin', 'layout'); revalidatePath('/')
}

export async function setImageMeta(fd) {
  await requireUser('images')
  const id = Number(fd.get('id'))
  await db.productImage.update({ where: { id }, data: { alt: String(fd.get('alt') || '').slice(0, 160), title: String(fd.get('title') || '').slice(0, 160) } })
  revalidatePath('/admin', 'layout'); revalidatePath('/')
}

export async function setPrimaryImage(id, productId) {
  await requireUser('images')
  await db.$transaction([
    db.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
    db.productImage.update({ where: { id }, data: { isPrimary: true } }),
  ])
  revalidatePath('/admin', 'layout'); revalidatePath('/')
}

export async function deleteProductImage(id) {
  const user = await requireUser('images')
  const img = await db.productImage.findUnique({ where: { id }, include: { product: { select: { name: true } } } })
  if (!img) return
  await db.productImage.delete({ where: { id } })
  await removeImageFiles(img)
  if (img.isPrimary) {
    const next = await db.productImage.findFirst({ where: { productId: img.productId }, orderBy: { position: 'asc' } })
    if (next) await db.productImage.update({ where: { id: next.id }, data: { isPrimary: true } })
  }
  await logActivity(user, 'Eliminar imagen', 'Producto', img.productId, img.product.name)
  revalidatePath('/admin', 'layout'); revalidatePath('/')
}

export async function reorderProductImages(productId, orderedIds) {
  await requireUser('images')
  const ids = orderedIds.map(Number).filter(Number.isInteger)
  await db.$transaction(ids.map((id, position) => db.productImage.updateMany({ where: { id, productId }, data: { position } })))
  revalidatePath('/admin', 'layout'); revalidatePath('/')
}

// ---------- Página principal / Configuración ----------
const SETTINGS_FIELDS = {
  hero: ['hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_cta_url'],
  store: ['brand_name', 'address', 'maps_url', 'phone_display', 'phone_tel', 'whatsapp_number', 'whatsapp_display', 'whatsapp_template', 'email', 'hours', 'footer_text', 'social_instagram', 'social_facebook'],
  seo: ['seo_title', 'seo_description'],
  design: ['color_blue', 'color_dark', 'color_yellow', 'color_bg'],
  texts: ['stock_title', 'stock_subtitle'],
}
const HEX = /^#[0-9a-fA-F]{6}$/

export async function saveSettings(_, fd) {
  const user = await requireUser('content')
  const group = String(fd.get('_group') || '')
  const keys = SETTINGS_FIELDS[group]
  if (!keys) return { error: 'Sección inválida.' }
  const values = {}
  for (const k of keys) {
    let v = String(fd.get(k) ?? '').trim()
    if (k === 'whatsapp_number') v = v.replace(/\D/g, '')
    if (k.startsWith('color_') && v && !HEX.test(v)) return { error: 'Los colores deben tener formato #RRGGBB.' }
    values[k] = v.slice(0, 2000)
  }
  await db.$transaction(Object.entries(values).map(([key, value]) => db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })))
  await logActivity(user, 'Editar configuración', 'Configuración', null, group)
  revalidatePath('/admin', 'layout'); revalidatePath('/')
  return { ok: 'Guardado' }
}

const SITE_IMAGE_KEYS = { hero_image_url: { subdir: 'site', maxWidth: 1920 }, logo_url: { subdir: 'site', maxWidth: 480 }, favicon_url: { subdir: 'site', maxWidth: 128, square: true, format: 'png' } }

export async function uploadSiteImage(fd) {
  const user = await requireUser('content')
  const key = String(fd.get('key') || '')
  const conf = SITE_IMAGE_KEYS[key]
  if (!conf) return { error: 'Campo inválido.' }
  let buf
  try { buf = await readImageFile(fd, 'file') } catch (e) { return { error: e.message } }
  if (!buf) return { error: 'Elegí un archivo de imagen.' }
  const { url } = await saveImageBuffer(buf, conf)
  await db.siteSetting.upsert({ where: { key }, update: { value: url }, create: { key, value: url } })
  await logActivity(user, 'Actualizar imagen del sitio', 'Configuración', null, key)
  revalidatePath('/admin', 'layout'); revalidatePath('/')
  return { ok: 'Imagen actualizada' }
}

// ---------- Contraseñas ----------
const sha = (t) => createHash('sha256').update(t).digest('hex')
const resetHits = new Map()
const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR']

export async function requestReset(_, fd) {
  const email = String(fd.get('email') || '').trim().toLowerCase().slice(0, 200)
  const ip = clientIp() || 'local'
  const hits = (resetHits.get(ip) || []).filter((t) => Date.now() - t < 3600000)
  if (hits.length >= 5) return { error: 'Demasiados pedidos. Probá de nuevo en una hora.' }
  hits.push(Date.now()); resetHits.set(ip, hits)
  const user = email ? await db.user.findUnique({ where: { email } }) : null
  if (user?.active) {
    const token = randomBytes(32).toString('hex')
    await db.passwordReset.create({ data: { userId: user.id, tokenHash: sha(token), expiresAt: new Date(Date.now() + 3600000) } })
    const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    try {
      await sendMail({ to: user.email, subject: 'Recuperar contraseña - Runa Sport', text: `Entrá a este enlace para elegir una contraseña nueva (vale 1 hora):\n${base}/admin/restablecer?token=${token}\n\nSi no lo pediste vos, ignorá este mensaje.` })
    } catch (e) { console.error('No se pudo enviar el mail de recuperación:', e) }
    await logActivity(null, 'Pedido de recuperación de contraseña', 'Usuario', user.id, user.email)
  }
  // Misma respuesta exista o no el email, para no revelar qué cuentas existen.
  return { ok: 'Si el email corresponde a una cuenta, te enviamos un enlace para restablecer la contraseña.' }
}

export async function resetPassword(_, fd) {
  const token = String(fd.get('token') || '')
  const p1 = String(fd.get('password') || ''), p2 = String(fd.get('password2') || '')
  if (p1.length < 10) return { error: 'La contraseña debe tener al menos 10 caracteres.' }
  if (p1 !== p2) return { error: 'Las contraseñas no coinciden.' }
  const r = await db.passwordReset.findUnique({ where: { tokenHash: sha(token) }, include: { user: true } })
  if (!r || r.usedAt || r.expiresAt < new Date() || !r.user.active) return { error: 'El enlace no es válido o venció. Pedí uno nuevo.' }
  const passwordHash = await bcrypt.hash(p1, 12)
  await db.$transaction([
    db.user.update({ where: { id: r.userId }, data: { passwordHash } }),
    db.passwordReset.update({ where: { id: r.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: r.userId } }),
  ])
  await logActivity(r.user, 'Contraseña restablecida', 'Usuario', r.userId, r.user.email)
  redirect('/admin/login?reset=1')
}

export async function changeOwnPassword(_, fd) {
  const user = await requireUser()
  const current = String(fd.get('current') || ''), p1 = String(fd.get('password') || ''), p2 = String(fd.get('password2') || '')
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: 'La contraseña actual no es correcta.' }
  if (p1.length < 10) return { error: 'La contraseña nueva debe tener al menos 10 caracteres.' }
  if (p1 !== p2) return { error: 'Las contraseñas nuevas no coinciden.' }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(p1, 12) } })
  await db.session.deleteMany({ where: { userId: user.id } }) // cierra las demás sesiones abiertas
  await startSession(user)
  await logActivity(user, 'Cambiar contraseña', 'Usuario', user.id, user.email)
  return { ok: 'Contraseña actualizada.' }
}

// ---------- Usuarios (solo Super Admin) ----------
export async function createUser(_, fd) {
  const actor = await requireUser('users')
  const name = String(fd.get('name') || '').trim().slice(0, 80)
  const email = String(fd.get('email') || '').trim().toLowerCase().slice(0, 200)
  const role = String(fd.get('role') || '')
  const password = String(fd.get('password') || '')
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Completá un nombre y un email válido.' }
  if (!ROLES.includes(role)) return { error: 'Rol inválido.' }
  if (password.length < 10) return { error: 'La contraseña debe tener al menos 10 caracteres.' }
  if (await db.user.findUnique({ where: { email } })) return { error: 'Ya existe un usuario con ese email.' }
  const u = await db.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 12) } })
  await logActivity(actor, 'Crear usuario', 'Usuario', u.id, `${name} (${email}) — ${role}`)
  revalidatePath('/admin/usuarios')
  return { ok: 'Usuario creado.' }
}

export async function updateUser(_, fd) {
  const actor = await requireUser('users')
  const id = Number(fd.get('id'))
  const name = String(fd.get('name') || '').trim().slice(0, 80)
  const target = await db.user.findUnique({ where: { id } })
  if (!target || !name) return { error: 'Revisá los datos.' }
  const data = { name }
  if (id !== actor.id) { // nadie puede cambiarse el rol ni desactivarse a sí mismo
    const role = String(fd.get('role') || ''), active = fd.get('active') === 'on'
    if (!ROLES.includes(role)) return { error: 'Rol inválido.' }
    if (target.role === 'SUPER_ADMIN' && (role !== 'SUPER_ADMIN' || !active)) {
      const others = await db.user.count({ where: { role: 'SUPER_ADMIN', active: true, id: { not: id } } })
      if (!others) return { error: 'Tiene que quedar al menos un Super Admin activo.' }
    }
    data.role = role; data.active = active
  }
  await db.user.update({ where: { id }, data })
  if (data.active === false) await db.session.deleteMany({ where: { userId: id } })
  await logActivity(actor, 'Editar usuario', 'Usuario', id, `${target.email}${data.role ? ` — ${data.role}${data.active ? '' : ' (desactivado)'}` : ''}`)
  revalidatePath('/admin/usuarios')
  return { ok: 'Guardado' }
}

export async function adminResetPassword(_, fd) {
  const actor = await requireUser('users')
  const id = Number(fd.get('id')), password = String(fd.get('password') || '')
  if (password.length < 10) return { error: 'La contraseña debe tener al menos 10 caracteres.' }
  const target = await db.user.findUnique({ where: { id } })
  if (!target) return { error: 'El usuario no existe.' }
  await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 12) } })
  if (id !== actor.id) await db.session.deleteMany({ where: { userId: id } })
  await logActivity(actor, 'Cambiar contraseña de usuario', 'Usuario', id, target.email)
  return { ok: 'Contraseña actualizada.' }
}

// ---------- Backups (solo Super Admin) ----------
export async function makeBackup() {
  const user = await requireUser('backups')
  const b = await createBackup(user.id)
  await logActivity(user, 'Crear backup', 'Backup', b.id, b.filename)
  revalidatePath('/admin/backups')
}

export async function deleteBackup(filename) {
  const user = await requireUser('backups')
  if (!BACKUP_NAME.test(filename)) return
  if (await deleteBackupFile(filename)) await logActivity(user, 'Eliminar backup', 'Backup', null, filename)
  revalidatePath('/admin/backups')
}

export async function restoreBackupAction(_, fd) {
  const user = await requireUser('backups')
  const file = String(fd.get('file') || '')
  if (!BACKUP_NAME.test(file)) return { error: 'Backup inválido.' }
  if (String(fd.get('confirm') || '').trim() !== 'RESTAURAR') return { error: 'Escribí RESTAURAR (en mayúsculas) para confirmar.' }
  try {
    await createBackup(user.id, '-pre') // resguardo automático del estado actual, por si te arrepentís
    await restoreBackup(file)
  } catch (e) {
    console.error('Error al restaurar el backup:', e)
    return { error: `No se pudo restaurar: ${e.message || 'error desconocido'}` }
  }
  await logActivity(null, 'Restaurar backup', 'Backup', null, `${file} (restaurado por ${user.email})`)
  redirect('/admin/login')
}
