'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateCartItem } from '../../lib/cart-client.js'
import { track } from '../../lib/track.js'

export default function ProductDetailActions({
  product,
  whatsappNumber = '5491100000000',
  whatsappTemplate = 'Hola, quiero consultar por: {producto}',
}) {
  const router = useRouter()
  const { id, name, sizes = [], colors = [], stock = 0, minStock = 5 } = product

  const [selectedSize, setSelectedSize] = useState(sizes[0]?.label || '')
  const [selectedColor, setSelectedColor] = useState(colors[0]?.name || '')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const isOutOfStock = stock <= 0
  const isLowStock = !isOutOfStock && stock <= minStock

  const handleAddToCart = async () => {
    if (isOutOfStock || loading) return
    setLoading(true)
    try {
      await updateCartItem('add', id, Number(qty) || 1)
      track('agregar_carrito', { productId: id, detail: `${name} (${qty} un.)` })
      setToastMessage(`¡"${name}" agregado al carrito!`)
      setTimeout(() => {
        setToastMessage(null)
      }, 4500)
    } catch (err) {
      alert(err.message || 'No se pudo agregar al carrito')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = async () => {
    if (isOutOfStock || loading) return
    setLoading(true)
    try {
      await updateCartItem('add', id, Number(qty) || 1)
      track('agregar_carrito', { productId: id, detail: `${name} (Comprar ahora)` })
      router.push('/carrito')
    } catch (err) {
      alert(err.message || 'No se pudo procesar la compra')
      setLoading(false)
    }
  }

  // Armar mensaje WhatsApp
  let waText = whatsappTemplate.replace('{producto}', name)
  const details = []
  if (selectedSize) details.push(`Talle: ${selectedSize}`)
  if (selectedColor) details.push(`Color: ${selectedColor}`)
  if (qty > 1) details.push(`Cantidad: ${qty}`)
  if (details.length > 0) {
    waText += ` (${details.join(', ')})`
  }
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waText)}`

  return (
    <div className="product-detail-actions">
      {/* Toast de confirmación */}
      {toastMessage && (
        <div className="cart-toast" role="alert">
          <div className="cart-toast-content">
            <span className="cart-toast-icon">✓</span>
            <div>
              <strong>{toastMessage}</strong>
              <div className="cart-toast-links">
                <Link href="/carrito" className="cart-toast-cta">
                  Ir al Carrito →
                </Link>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="cart-toast-close"
            onClick={() => setToastMessage(null)}
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      )}

      {/* Selector de talles */}
      {sizes.length > 0 && (
        <div className="action-group">
          <label className="action-label">
            Talle: <strong>{selectedSize || 'Seleccioná un talle'}</strong>
          </label>
          <div className="size-selector" role="radiogroup" aria-label="Talles">
            {sizes.map((s) => (
              <button
                key={s.id || s.label}
                type="button"
                className={`size-btn ${selectedSize === s.label ? 'is-selected' : ''}`}
                onClick={() => setSelectedSize(s.label)}
                role="radio"
                aria-checked={selectedSize === s.label}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selector de colores */}
      {colors.length > 0 && (
        <div className="action-group">
          <label className="action-label">
            Color: <strong>{selectedColor || 'Seleccioná un color'}</strong>
          </label>
          <div className="color-selector" role="radiogroup" aria-label="Colores">
            {colors.map((c) => (
              <button
                key={c.id || c.name}
                type="button"
                className={`color-btn ${selectedColor === c.name ? 'is-selected' : ''}`}
                onClick={() => setSelectedColor(c.name)}
                role="radio"
                aria-checked={selectedColor === c.name}
                style={{ backgroundColor: c.hex || '#2450F5' }}
                title={c.name}
              >
                <span className="sr-only">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado del stock */}
      <div className="stock-status-box">
        {isOutOfStock ? (
          <span className="stock-indicator out">🔴 Producto sin stock disponible</span>
        ) : isLowStock ? (
          <span className="stock-indicator low">⚠️ ¡Últimas {stock} unidades disponibles!</span>
        ) : (
          <span className="stock-indicator ok">🟢 Stock disponible ({stock} unidades)</span>
        )}
      </div>

      {/* Selector de cantidad y botones de compra */}
      <div className="action-buttons-wrap">
        {!isOutOfStock && (
          <div className="qty-control" style={{ marginBottom: '4px' }}>
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={qty <= 1 || loading}
              aria-label="Disminuir cantidad"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={stock}
              value={qty}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (val >= 1 && val <= stock) setQty(val)
              }}
              className="qty-input"
              disabled={loading}
              aria-label="Cantidad"
            />
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQty(Math.min(stock, qty + 1))}
              disabled={qty >= stock || loading}
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        )}

        {/* Botón Agregar al Carrito */}
        <button
          type="button"
          className={`btn btn-add-cart ${isOutOfStock ? 'btn-disabled' : ''}`}
          onClick={handleAddToCart}
          disabled={isOutOfStock || loading}
        >
          {isOutOfStock ? 'Sin stock disponible' : loading ? 'Agregando...' : '🛒 Agregar al carrito'}
        </button>

        {/* Botón Comprar Ahora */}
        <button
          type="button"
          className={`btn btn-buy-now ${isOutOfStock ? 'btn-disabled' : ''}`}
          onClick={handleBuyNow}
          disabled={isOutOfStock || loading}
        >
          ⚡ Comprar ahora
        </button>

        {/* Botón WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-wa-buy"
          onClick={() => track('consulta', { productId: id, detail: `${name} (WhatsApp)` })}
        >
          <span>💬 Consultar por WhatsApp</span>
        </a>
      </div>
    </div>
  )
}
