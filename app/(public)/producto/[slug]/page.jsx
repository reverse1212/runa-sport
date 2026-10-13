import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductGallery from '../../../../components/shop/ProductGallery.jsx'
import ProductDetailActions from '../../../../components/shop/ProductDetailActions.jsx'
import ProductCard from '../../../../components/shop/ProductCard.jsx'
import { getSettings, getProductBySlug } from '../../../../lib/queries.js'

export const dynamic = 'force-dynamic'

const money = (n) =>
  n == null ? '' : '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })

export async function generateMetadata({ params }) {
  const [s, product] = await Promise.all([
    getSettings(),
    getProductBySlug(params.slug),
  ])

  if (!product) return { title: 'Producto no encontrado' }

  return {
    title: product.metaTitle || `${product.name} | ${s.brand_name || 'Runa Sport'}`,
    description: product.metaDescription || product.description || `Comprar ${product.name} en ${s.brand_name || 'Runa Sport'}`,
  }
}

export default async function ProductDetailPage({ params }) {
  const { slug } = params
  const [settings, product] = await Promise.all([
    getSettings(),
    getProductBySlug(slug),
  ])

  if (!product) {
    notFound()
  }

  const hasDiscount = product.compareAt && product.compareAt > product.priceEffective
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAt - product.priceEffective) / product.compareAt) * 100)
    : null

  return (
    <div className="product-page-wrap">
      <div className="wrap">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs" aria-label="Navegación secundaria">
          <Link href="/">Inicio</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/categoria/${product.category.slug}`}>{product.category.name}</Link>
              <span>/</span>
            </>
          )}
          <span className="current">{product.name}</span>
        </nav>

        {/* Detalle Principal */}
        <div className="product-detail-layout">
          {/* Galería de imágenes */}
          <div className="product-detail-media">
            <ProductGallery
              images={product.images}
              name={product.name}
              swatchColor={product.swatchColor}
              swatchDark={product.swatchDark}
            />
          </div>

          {/* Información y Compra */}
          <div className="product-detail-info">
            {product.category && (
              <Link href={`/categoria/${product.category.slug}`} className="product-detail-category">
                {product.category.name}
              </Link>
            )}

            <h1 className="product-detail-title">{product.name}</h1>

            {product.sku && (
              <span style={{ fontSize: '0.82rem', color: 'var(--slate)', textTransform: 'uppercase' }}>
                SKU: {product.sku}
              </span>
            )}

            {/* Precios */}
            <div className="product-detail-pricing">
              <span className="product-detail-price">{money(product.priceEffective)}</span>
              {hasDiscount && (
                <>
                  <s className="product-detail-compare">{money(product.compareAt)}</s>
                  <span className="badge badge-sale">{discountPercent}% OFF</span>
                </>
              )}
            </div>

            {/* Descripción */}
            {product.description && (
              <div className="product-detail-desc">
                <p>{product.description}</p>
              </div>
            )}

            {/* Acciones interactivas (Talles, Colores, Cantidad, Carrito y WhatsApp) */}
            <ProductDetailActions
              product={{
                id: product.id,
                name: product.name,
                sizes: product.sizes,
                colors: product.colors,
                stock: product.stock,
                minStock: product.minStock,
                variants: product.variants,
              }}
              whatsappNumber={settings.whatsapp_number}
              whatsappTemplate={settings.whatsapp_template || 'Hola, quiero consultar por: {producto}'}
            />
          </div>
        </div>

        {/* Productos Relacionados */}
        {product.related && product.related.length > 0 && (
          <section className="section-home" style={{ borderTop: '1px solid #EEF2FA', marginTop: '32px' }}>
            <div className="section-home-head">
              <div>
                <h2>También te puede interesar</h2>
                <p>Completá tu conjunto con estos productos recomendados</p>
              </div>
            </div>
            <div className="product-grid">
              {product.related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
