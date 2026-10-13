'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchCart } from '../../lib/cart-client.js'

export default function CartIcon() {
  const [totalCount, setTotalCount] = useState(0)

  const loadCart = async () => {
    try {
      const cart = await fetchCart()
      setTotalCount(cart?.totalCount || 0)
    } catch {
      // Ignorar errores de red temporales
    }
  }

  useEffect(() => {
    loadCart()

    const handleCartUpdated = (e) => {
      if (e?.detail?.cart) {
        setTotalCount(e.detail.cart.totalCount || 0)
      } else {
        loadCart()
      }
    }

    window.addEventListener('cart-updated', handleCartUpdated)
    return () => window.removeEventListener('cart-updated', handleCartUpdated)
  }, [])

  return (
    <Link href="/carrito" className="shop-cart-btn" aria-label={`Carrito de compras, ${totalCount} artículos`}>
      <span className="cart-icon" aria-hidden="true">🛒</span>
      <span className="cart-label">Carrito</span>
      {totalCount > 0 && (
        <span className="cart-badge" aria-label={`${totalCount} productos en carrito`}>
          {totalCount}
        </span>
      )}
    </Link>
  )
}
