import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductCard from '../../../../components/shop/ProductCard.jsx'
import { getSettings, getCategories, getCategoryBySlug } from '../../../../lib/queries.js'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const [s, category] = await Promise.all([
    getSettings(),
    getCategoryBySlug(params.slug),
  ])

  if (!category) return { title: 'Categoría no encontrada' }

  return {
    title: `${category.name} | ${s.brand_name || 'Runa Sport'}`,
    description: category.description || `Explorá indumentaria de ${category.name} en ${s.brand_name || 'Runa Sport'}`,
  }
}

export default async function CategoryDetailPage({ params }) {
  const { slug } = params
  const [settings, categories, category] = await Promise.all([
    getSettings(),
    getCategories(),
    getCategoryBySlug(slug),
  ])

  if (!category) {
    notFound()
  }

  const products = category.products.map((p) => {
    const img = p.images?.find((i) => i.isPrimary) || p.images?.[0]
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: category.name,
      categorySlug: category.slug,
      price: p.promoPrice ?? p.price,
      compareAt: p.promoPrice ? p.price : p.oldPrice,
      sizes: p.sizes?.map((s) => s.label).join(' / ') || '',
      stock: p.inventory?.quantity ?? 0,
      minStock: p.inventory?.minStock ?? 5,
      color: p.swatchColor,
      dark: p.swatchDark,
      featured: p.featured,
      onSale: p.onSale,
      image: img ? { url: img.url, alt: img.alt } : null,
    }
  })

  return (
    <div className="catalog-page-layout">
      <div className="wrap">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs" aria-label="Navegación secundaria">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <Link href="/productos">Categorías</Link>
          <span>/</span>
          <span className="current">{category.name}</span>
        </nav>

        {/* Encabezado de la categoría */}
        <div className="catalog-header">
          <h1>{category.name}</h1>
          {category.description && (
            <p style={{ color: 'var(--slate)', fontSize: '1.1rem', marginTop: '8px', maxWidth: '600px' }}>
              {category.description}
            </p>
          )}
          <span style={{ fontSize: '0.9rem', color: 'var(--slate)', display: 'block', marginTop: '6px' }}>
            {products.length} {products.length === 1 ? 'producto disponible' : 'productos disponibles'}
          </span>
        </div>

        {/* Barra de categorías para fácil cambio */}
        <div className="catalog-filter-bar">
          <div className="catalog-chips">
            <Link href="/productos" className="catalog-chip">
              ← Ver todos
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                className={`catalog-chip ${c.slug === slug ? 'is-active' : ''}`}
              >
                {c.name} ({c.productCount})
              </Link>
            ))}
          </div>
        </div>

        {/* Listado de productos */}
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
            <p style={{ fontSize: '1.2rem', color: 'var(--slate)', marginBottom: '18px' }}>
              No hay productos publicados en esta categoría por el momento.
            </p>
            <Link href="/productos" className="btn btn-sun">
              Ver otros productos
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
