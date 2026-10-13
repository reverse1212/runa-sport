// Helpers para interactuar con el carrito desde Client Components en el navegador

export const CART_COOKIE_NAME = 'rs_cart'

/**
 * Consulta el estado resuelto del carrito llamando a GET /api/cart.
 */
export async function fetchCart() {
  const res = await fetch('/api/cart', { method: 'GET', cache: 'no-store' })
  if (!res.ok) throw new Error('Error al obtener el carrito')
  const data = await res.json()
  return data.cart
}

/**
 * Agrega, modifica o elimina un item del carrito llamando a POST /api/cart.
 * Despacha el evento personalizado 'cart-updated' para mantener sincronizado el CartIcon.
 */
export async function updateCartItem(action, productId, qty = 1) {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, productId, qty }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Error al actualizar carrito')
  }

  const data = await res.json()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart: data.cart } }))
  }
  return data.cart
}
