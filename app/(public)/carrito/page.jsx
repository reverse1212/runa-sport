import Link from 'next/link'
import { cookies } from 'next/headers'
import CartView from '../../../components/shop/CartView.jsx'
import { readCartCookie, resolveCart } from '../../../lib/cart.js'
import { getSettings } from '../../../lib/queries.js'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const s = await getSettings()
  return {
    title: `Mi Carrito | ${s.brand_name || 'Runa Sport'}`,
    description: `Revisá y completá tu pedido en ${s.brand_name || 'Runa Sport'}.`,
  }
}

export default async function CartPage() {
  const [settings, rawItems] = await Promise.all([
    getSettings(),
    readCartCookie(cookies()),
  ])

  const initialCart = await resolveCart(rawItems)

  return (
    <div className="cart-page-wrapper" style={{ padding: '28px 0 72px' }}>
      <div className="wrap">
        <nav className="breadcrumbs" aria-label="Navegación secundaria">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <span className="current">Carrito de compras</span>
        </nav>

        <div className="catalog-header" style={{ marginBottom: '28px' }}>
          <h1>Carrito de Compras</h1>
          <p style={{ color: 'var(--slate)', marginTop: '6px' }}>
            Los precios y disponibilidad de stock se calculan en tiempo real.
          </p>
        </div>

        <CartView
          initialCart={initialCart}
          whatsappNumber={settings.whatsapp_number}
          brandName={settings.brand_name || 'Runa Sport'}
        />
      </div>
    </div>
  )
}
