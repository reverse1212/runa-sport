import Link from 'next/link'
import ProductCard from '../../../components/shop/ProductCard.jsx'
import { getSettings, getCategories, getProducts } from '../../../lib/queries.js'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const s = await getSettings()
  const q = searchParams?.q
  const title = q
    ? `Búsqueda: "${q}" | ${s.brand_name || 'Runa Sport'}`
    : `Catálogo de Productos | ${s.brand_name || 'Runa Sport'}`
  return { title }
}

export default async function ProductsCatalogPage({ searchParams }) {
  const query = searchParams?.q || ''
  const catSlug = searchParams?.cat || ''
  const sort = searchParams?.sort || 'default'

  const [settings, categories, products] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({
      query,
      categorySlug: catSlug,
      sort,
    }),
  ])

  return (
    <div className="catalog-page-layout">
      <div className="wrap">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs" aria-label="Navegación secundaria">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <span className="current">Productos</span>
          {query && (
            <>
              <span>/</span>
              <span className="current">Búsqueda: "{query}"</span>
            </>
          )}
        </nav>

        {/* Encabezado */}
        <div className="catalog-header">
          <h1>Catálogo de Productos</h1>
          <p style={{ color: 'var(--slate)', marginTop: '8px' }}>
            {query ? (
              <>
                Resultados para "<strong>{query}</strong>" · {products.length} producto(s) encontrado(s)
              </>
            ) : (
              <>Mostrando {products.length} producto(s) disponibles</>
            )}
          </p>
        </div>

        {/* Barra de filtros por categoría */}
        <div className="catalog-filter-bar">
          <div className="catalog-chips">
            <Link
              href="/productos"
              className={`catalog-chip ${!catSlug && !query ? 'is-active' : ''}`}
            >
              Todos los productos
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                className={`catalog-chip ${catSlug === c.slug ? 'is-active' : ''}`}
              >
                {c.name} ({c.productCount})
              </Link>
            ))}
          </div>

          {/* Selector de orden */}
          <form method="GET" action="/productos" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {query && <input type="hidden" name="q" value={query} />}
            {catSlug && <input type="hidden" name="cat" value={catSlug} />}
            <label htmlFor="sort-select" style={{ fontSize: '0.85rem', color: 'var(--slate)', fontWeight: 600 }}>
              Ordenar por:
            </label>
            <select
              id="sort-select"
              name="sort"
              defaultValue={sort}
              className="catalog-sort-select"
              onInput="this.form.submit()"
            >
              <option value="default">Destacados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="newest">Más recientes</option>
            </select>
            <noscript>
              <button type="submit" className="btn" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                Filtrar
              </button>
            </noscript>
          </form>
        </div>

        {/* Grilla de productos */}
        {products.length === 0 ? (
          <div
            style={{
              background: '#fff',
              padding: '60px 20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #EEF2FA',
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔍</span>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>No encontramos productos</h2>
            <p style={{ color: 'var(--slate)', maxWidth: '400px', margin: '0 auto 24px' }}>
              Probá utilizando otros términos de búsqueda o explorá todas nuestras categorías disponibles.
            </p>
            <Link href="/productos" className="btn btn-sun">
              Ver todos los productos
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
