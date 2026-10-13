import { NextResponse } from 'next/server'
import { readCartCookie, resolveCart, writeCartCookie } from '../../../lib/cart.js'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const rawItems = readCartCookie(req.cookies)
    const resolved = await resolveCart(rawItems)

    const res = NextResponse.json({ ok: true, cart: resolved })
    // Si hubo ajuste automático por stock, sincronizar la cookie con las cantidades válidas
    if (resolved.ajustado) {
      writeCartCookie(res, resolved.rawItems)
    }
    return res
  } catch (error) {
    console.error('GET /api/cart error:', error)
    return NextResponse.json({ ok: false, error: 'Error al consultar el carrito' }, { status: 500 })
  }
}

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Solicitud vacía' }, { status: 400 })
  }

  const { action, productId, qty = 1 } = body
  const id = parseInt(productId, 10)

  if (!id || isNaN(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: 'productId inválido' }, { status: 400 })
  }

  if (!['add', 'set', 'remove'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'action inválida. Debe ser add, set o remove' }, { status: 400 })
  }

  const parsedQty = parseInt(qty, 10)
  if (action !== 'remove' && (isNaN(parsedQty) || parsedQty <= 0 || parsedQty > 999)) {
    return NextResponse.json({ ok: false, error: 'qty debe ser un entero positivo entre 1 y 999' }, { status: 400 })
  }

  try {
    // 1. Leer items actuales de la cookie
    let rawItems = readCartCookie(req.cookies)
    const existingIndex = rawItems.findIndex((item) => item.productId === id)

    // 2. Aplicar mutación
    if (action === 'remove') {
      rawItems = rawItems.filter((item) => item.productId !== id)
    } else if (action === 'set') {
      if (existingIndex >= 0) {
        rawItems[existingIndex].qty = parsedQty
      } else {
        rawItems.push({ productId: id, qty: parsedQty })
      }
    } else if (action === 'add') {
      if (existingIndex >= 0) {
        rawItems[existingIndex].qty += parsedQty
      } else {
        rawItems.push({ productId: id, qty: parsedQty })
      }
    }

    // 3. Resolver contra la base de datos real (valida stock y precios en servidor)
    const resolved = await resolveCart(rawItems)

    // 4. Preparar respuesta con cookie actualizada
    const res = NextResponse.json({
      ok: true,
      cart: resolved,
      message: resolved.ajustes.length > 0 ? resolved.ajustes[0] : null,
    })

    writeCartCookie(res, resolved.rawItems)
    return res
  } catch (error) {
    console.error('POST /api/cart error:', error)
    return NextResponse.json({ ok: false, error: 'Error al procesar el carrito' }, { status: 500 })
  }
}
