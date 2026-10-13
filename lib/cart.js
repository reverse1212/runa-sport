import { cookies } from 'next/headers'
import { db } from './db.js'

export const CART_COOKIE_NAME = 'rs_cart'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 días

/**
 * Lee y parsea de manera segura la cookie rs_cart desde el header o el store de cookies.
 * Nunca arroja error 500 si la cookie no existe, es null o contiene JSON mal formado.
 */
export function readCartCookie(cookieSource) {
  let rawValue = null

  if (typeof cookieSource === 'string') {
    // Es un string de Cookie header tipo "a=1; rs_cart=...; c=3" o el valor directo codificado
    if (cookieSource.includes(CART_COOKIE_NAME + '=')) {
      const match = cookieSource.match(new RegExp('(^|;\\s*)' + CART_COOKIE_NAME + '=([^;]*)'))
      rawValue = match ? match[2] : null
    } else {
      rawValue = cookieSource
    }
  } else if (cookieSource && typeof cookieSource.get === 'function') {
    // Es NextRequest.cookies o cookies() de next/headers
    rawValue = cookieSource.get(CART_COOKIE_NAME)?.value || null
  } else {
    // Intenta leer cookies() del contexto de Next.js si está disponible
    try {
      rawValue = cookies().get(CART_COOKIE_NAME)?.value || null
    } catch {
      rawValue = null
    }
  }

  if (!rawValue) return []

  try {
    const decoded = decodeURIComponent(rawValue)
    const parsed = JSON.parse(decoded)
    if (!Array.isArray(parsed)) return []

    // Sanitizar estructura básica [{ productId: number, qty: number }]
    return parsed
      .map((item) => {
        const productId = parseInt(item.productId ?? item.id, 10)
        const qty = parseInt(item.qty ?? item.quantity, 10)
        if (!productId || isNaN(productId) || productId <= 0) return null
        if (!qty || isNaN(qty) || qty <= 0) return null
        return { productId, qty: Math.min(qty, 999) }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Serializa los items crudos para guardar en la cookie (solo productId y qty).
 */
export function serializeCart(items) {
  const clean = (items || [])
    .map((i) => ({ productId: Number(i.productId), qty: Number(i.qty) }))
    .filter((i) => i.productId > 0 && i.qty > 0)
  return encodeURIComponent(JSON.stringify(clean))
}

/**
 * Resuelve el carrito contra la base de datos real:
 * - Descarta productos que no existen o no están PUBLISHED.
 * - Recalcula precios actuales en el servidor.
 * - Valida y ajusta la cantidad contra el inventario real disponible.
 * - Devuelve items resueltos, subtotales, totales y flag 'ajustado'.
 */
export async function resolveCart(rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return {
      items: [],
      rawItems: [],
      subtotal: 0,
      shipping: 0,
      total: 0,
      totalCount: 0,
      ajustado: false,
      ajustes: [],
    }
  }

  // Agrupar cantidades si viniera el mismo productId duplicado
  const qtyMap = new Map()
  for (const item of rawItems) {
    const id = Number(item.productId)
    const q = Number(item.qty) || 1
    if (id > 0 && q > 0) {
      qtyMap.set(id, (qtyMap.get(id) || 0) + q)
    }
  }

  const productIds = Array.from(qtyMap.keys())
  if (productIds.length === 0) {
    return {
      items: [],
      rawItems: [],
      subtotal: 0,
      shipping: 0,
      total: 0,
      totalCount: 0,
      ajustado: false,
      ajustes: [],
    }
  }

  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
      status: 'PUBLISHED',
      category: { visible: true },
    },
    include: {
      category: true,
      inventory: true,
      images: { orderBy: { position: 'asc' } },
    },
  })

  let anyAdjusted = false
  const ajustes = []
  const resolvedItems = []
  const validRawItems = []

  for (const p of products) {
    const requestedQty = qtyMap.get(p.id) || 1
    const availableStock = p.inventory?.quantity ?? 0
    let finalQty = requestedQty
    let itemAdjusted = false
    let motivo = null

    if (availableStock <= 0) {
      // Sin stock disponible: se descarta o se notifica
      anyAdjusted = true
      itemAdjusted = true
      motivo = `"${p.name}" ya no tiene stock disponible y fue retirado del carrito.`
      ajustes.push(motivo)
      continue // No se incluye en el carrito activo si el stock es 0
    } else if (requestedQty > availableStock) {
      finalQty = availableStock
      anyAdjusted = true
      itemAdjusted = true
      motivo = `Ajustamos "${p.name}" a ${finalQty} unidad(es) porque es el stock máximo disponible.`
      ajustes.push(motivo)
    }

    const unitPrice = p.promoPrice ?? p.price
    const compareAt = p.promoPrice ? p.price : p.oldPrice
    const lineSubtotal = unitPrice * finalQty
    const img = p.images.find((i) => i.isPrimary) || p.images[0]

    resolvedItems.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category.name,
      price: unitPrice,
      compareAt: compareAt && compareAt > unitPrice ? compareAt : null,
      image: img ? { url: img.url, alt: img.alt || p.name } : null,
      color: p.swatchColor,
      dark: p.swatchDark,
      stock: availableStock,
      minStock: p.inventory?.minStock ?? 5,
      qty: finalQty,
      subtotal: lineSubtotal,
      ajustado: itemAdjusted,
      motivoAjuste: motivo,
    })

    validRawItems.push({ productId: p.id, qty: finalQty })
  }

  // Si algún producto solicitado en la cookie ni siquiera vino de la base (borrado o despublicado)
  if (products.length < productIds.length) {
    anyAdjusted = true
    ajustes.push('Algunos productos que tenías en el carrito ya no están disponibles.')
  }

  const subtotal = resolvedItems.reduce((acc, item) => acc + item.subtotal, 0)
  const totalCount = resolvedItems.reduce((acc, item) => acc + item.qty, 0)
  const shipping = 0 // En Fase 6 el envío es $0 / a coordinar
  const total = subtotal + shipping

  return {
    items: resolvedItems,
    rawItems: validRawItems,
    subtotal,
    shipping,
    total,
    totalCount,
    ajustado: anyAdjusted,
    ajustes,
  }
}

/**
 * Escribe la cookie en una instancia de NextResponse o en un objeto de cookies.
 */
export function writeCartCookie(response, items) {
  const serialized = serializeCart(items)
  if (response && response.cookies && typeof response.cookies.set === 'function') {
    response.cookies.set({
      name: CART_COOKIE_NAME,
      value: serialized,
      path: '/',
      maxAge: MAX_AGE,
      sameSite: 'lax',
      httpOnly: false, // Accesible por JS para badge rápido
    })
  }
}

