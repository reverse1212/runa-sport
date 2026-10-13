import { db } from '../../../lib/db.js'

export const dynamic = 'force-dynamic'

const TYPES = new Set([
  'vista_pagina',
  'click_ver_ropa',
  'nav_ver_ropa',
  'stock_visto',
  'filtro',
  'consulta',
  'click_mapa',
  'click_telefono',
  'click_whatsapp',
  'click_email',
  'agregar_carrito',
  'finalizar_compra_wa',
])

// Límite simple en memoria. La IP solo se usa para esto: no se guarda.
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const h = (hits.get(ip) || []).filter((t) => now - t < 60000)
  h.push(now)
  hits.set(ip, h)
  if (hits.size > 5000) hits.clear()
  return h.length > 60
}
const deviceOf = (ua) => (/ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop')

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
  if (limited(ip)) return new Response(null, { status: 429 })
  let b
  try { b = await req.json() } catch { return new Response(null, { status: 400 }) }
  if (!b || !TYPES.has(b.type)) return new Response(null, { status: 400 })

  const device = deviceOf(req.headers.get('user-agent') || '')
  const product = Number.isInteger(b.productId)
    ? await db.product.findUnique({ where: { id: b.productId }, select: { id: true, name: true, categoryId: true } })
    : null

  await db.analyticsEvent.create({
    data: {
      type: b.type,
      detail: String(b.detail || '').slice(0, 120),
      sessionId: String(b.sid || '').slice(0, 16),
      device,
      productId: product?.id ?? null,
      categoryId: product?.categoryId ?? null,
    },
  })
  if (b.type === 'consulta' && product) {
    await db.contactQuery.create({ data: { productId: product.id, productName: product.name, categoryId: product.categoryId, device } })
  }
  return new Response(null, { status: 204 })
}
