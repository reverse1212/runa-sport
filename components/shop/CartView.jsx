'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateCartItem } from '../../lib/cart-client.js'
import { track } from '../../lib/track.js'

const money = (n) =>
  n == null ? '' : '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })

export default function CartView({ initialCart, whatsappNumber = '5491100000000', brandName = 'Runa Sport' }) {
  const [cart, setCart] = useState(initialCart || { items: [], subtotal: 0, total: 0, ajustado: false, ajustes: [] })
  const [loadingId, setLoadingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const handleAction = async (action, productId, qty) => {
    setLoadingId(productId)
    setErrorMessage(null)
    try {
      const updated = await updateCartItem(action, productId, qty)
      setCart(updated)
    } catch (err) {
      setErrorMessage(err.message || 'No se pudo actualizar el producto')
    } finally {
      setLoadingId(null)
    }
  }

  const handleFinalizeWhatsApp = () => {
    if (!cart.items || cart.items.length === 0) return

    track('finalizar_compra_wa', { detail: `Total: ${money(cart.total)} (${cart.totalCount} items)` })

    let text = `Hola ${brandName}! Quiero encargar los siguientes productos de mi carrito:\n\n`
    cart.items.forEach((item) => {
      text += `• ${item.qty}x ${item.name} (${money(item.price)} c/u) = ${money(item.subtotal)}\n`
    })
    text += `\n*Total a pagar: ${money(cart.total)}*\n\n¿Me confirman disponibilidad para coordinar el pago y envío?`

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="cart-empty-box">
        <span className="cart-empty-icon" aria-hidden="true">🛒</span>
        <h2>Tu carrito está vacío</h2>
        <p>No tenés ningún producto seleccionado en este momento. ¡Explorá nuestro catálogo y sumá lo que más te guste!</p>
        <Link href="/productos" className="btn btn-sun">
          Explorar catálogo de productos →
        </Link>
      </div>
    )
  }

  return (
    <div className="cart-view-container">
      {/* Alertas de ajustes de stock */}
      {cart.ajustado && cart.ajustes && cart.ajustes.length > 0 && (
        <div className="cart-stock-alert" role="alert">
          <div className="cart-alert-title">⚠️ Aviso sobre tu pedido:</div>
          <ul className="cart-alert-list">
            {cart.ajustes.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {errorMessage && (
        <div className="cart-error-alert" role="alert">
          <span>⚠️ {errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="cart-alert-close">✕</button>
        </div>
      )}

      <div className="cart-layout-grid">
        {/* Tabla / Lista de Items */}
        <div className="cart-items-section">
          <div className="cart-table-head">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Subtotal</span>
          </div>

          <div className="cart-items-list">
            {cart.items.map((item) => {
              const isBusy = loadingId === item.productId
              return (
                <article key={item.productId} className={`cart-item-row ${isBusy ? 'is-loading' : ''}`}>
                  {/* Foto y Nombre */}
                  <div className="cart-item-info">
                    <Link href={`/producto/${item.slug}`} className="cart-item-thumb">
                      {item.image ? (
                        <img src={item.image.url} alt={item.image.alt || item.name} />
                      ) : (
                        <div className="cart-item-placeholder" style={{ '--c': item.color || '#2450F5' }}>
                          ⚡
                        </div>
                      )}
                    </Link>

                    <div className="cart-item-meta">
                      <span className="cart-item-cat">{item.category}</span>
                      <h3 className="cart-item-name">
                        <Link href={`/producto/${item.slug}`}>{item.name}</Link>
                      </h3>
                      <div className="cart-item-price-unit">
                        <span>{money(item.price)} unitario</span>
                        {item.compareAt && <s className="cart-item-was">{money(item.compareAt)}</s>}
                      </div>
                      {item.motivoAjuste && (
                        <span className="cart-item-warning">{item.motivoAjuste}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAction('remove', item.productId)}
                        className="cart-remove-link"
                        disabled={isBusy}
                      >
                        Quitar producto
                      </button>
                    </div>
                  </div>

                  {/* Controles de Cantidad (+/- e input) */}
                  <div className="cart-item-qty-col">
                    <div className="qty-control">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => {
                          if (item.qty <= 1) {
                            handleAction('remove', item.productId)
                          } else {
                            handleAction('set', item.productId, item.qty - 1)
                          }
                        }}
                        disabled={isBusy}
                        aria-label="Disminuir cantidad"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val) && val > 0) {
                            handleAction('set', item.productId, Math.min(val, item.stock))
                          }
                        }}
                        className="qty-input"
                        disabled={isBusy}
                        aria-label={`Cantidad de ${item.name}`}
                      />
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleAction('set', item.productId, item.qty + 1)}
                        disabled={isBusy || item.qty >= item.stock}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                    {item.qty >= item.stock && (
                      <span className="cart-max-stock-hint">Máx. {item.stock} un.</span>
                    )}
                  </div>

                  {/* Subtotal por ítem */}
                  <div className="cart-item-subtotal-col">
                    <span className="cart-line-subtotal">{money(item.subtotal)}</span>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="cart-actions-footer">
            <Link href="/productos" className="btn btn-line" style={{ color: 'var(--ink)', borderColor: 'var(--ink)' }}>
              ← Seguir explorando productos
            </Link>
          </div>
        </div>

        {/* Resumen de Compra */}
        <aside className="cart-summary-card">
          <h2 className="cart-summary-title">Resumen del pedido</h2>

          <div className="cart-summary-lines">
            <div className="summary-line">
              <span>Subtotal ({cart.totalCount} {cart.totalCount === 1 ? 'artículo' : 'artículos'}):</span>
              <strong className="summary-value">{money(cart.subtotal)}</strong>
            </div>

            <div className="summary-line">
              <span>Envío:</span>
              <span className="summary-shipping">A coordinar / Por transporte</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-line summary-total">
              <span>Total estimado:</span>
              <span className="summary-total-val">{money(cart.total)}</span>
            </div>
          </div>

          {/* Botón Finalizar Compra WhatsApp (Opción A) */}
          <button
            type="button"
            className="btn btn-wa-buy cart-checkout-btn"
            onClick={handleFinalizeWhatsApp}
          >
            <span>💬 Finalizar compra por WhatsApp</span>
          </button>

          <p className="cart-safe-note">
            🛡️ Tus productos quedan reservados al coordinar con la tienda. No cobramos cargos sorpresa.
          </p>
        </aside>
      </div>
    </div>
  )
}
