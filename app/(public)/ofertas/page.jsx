import Link from 'next/link'
import ProductCard from '../../../components/shop/ProductCard.jsx'
import { getSettings, getProducts } from '../../../lib/queries.js'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const s = await getSettings()
  return {
    title: `Ofertas Especiales | ${s.brand_name || 'Runa Sport'}`,
    description: `Aprovechá las mejores ofertas y promociones en indumentaria deportiva de ${s.brand_name || 'Runa Sport'}.`,
  }
}

export default async function OffersPage() {
  const [settings, allProducts] = await Promise.all([
    getSettings(),
    getProducts({ limit: 50 }),
  ])

  // Filtrar productos marcados onSale o que tengan precio rebajado
  const offers = allProducts.filter((p) => p.onSale || (p.compareAt && p.compareAt > p.price))

  return (
    <div className="catalog-page-layout">
      <div className="wrap">
        <nav className="breadcrumbs" aria-label="Navegación secundaria">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <span className="current">Ofertas Especiales</span>
        </nav>

        <div className="catalog-header">
          <h1>Ofertas y Descuentos</h1>
          <p style={{ color: 'var(--slate)', marginTop: '8px' }}>
            Prendas seleccionadas con precios promocionales y descuentos exclusivos.
          </p>
        </div>

        {offers.length === 0 ? (
          <div
            style={{
              background: '#fff',
              padding: '60px 20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #EEF2FA',
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '14px' }}>🏷️</span>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No hay ofertas activas en este momento</h2>
            <p style={{ color: 'var(--slate)', maxWidth: '420px', margin: '0 auto 24px' }}>
              Estamos preparando nuevas promociones. Podés ver todo nuestro catálogo regular disponible.
            </p>
            <Link href="/productos" className="btn btn-sun">
              Ver catálogo completo
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {offers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
