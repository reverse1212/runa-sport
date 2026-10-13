import Link from 'next/link'

const money = (n) =>
  n == null ? '' : '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })

export default function ProductCard({ product }) {
  const {
    slug,
    name,
    category,
    categorySlug,
    price,
    compareAt,
    sizes,
    stock,
    minStock = 5,
    image,
    color = '#2450F5',
    dark = false,
    featured = false,
    onSale = false,
  } = product

  const isOutOfStock = stock === 0
  const isLowStock = !isOutOfStock && stock <= minStock
  const hasDiscount = compareAt && compareAt > price

  return (
    <article className="product-card">
      <Link href={`/producto/${slug}`} className="product-card-img-link">
        <div
          className={`product-card-image ${image ? 'has-img' : ''} ${dark ? 'is-dark' : ''}`}
          style={{ '--c': color }}
        >
          {image ? (
            <img src={image.url} alt={image.alt || name} loading="lazy" />
          ) : (
            <span className="product-card-placeholder">{category}</span>
          )}

          {/* Badges superiores */}
          <div className="product-card-badges">
            {hasDiscount && <span className="badge badge-sale">OFERTA</span>}
            {featured && <span className="badge badge-featured">DESTACADO</span>}
          </div>

          {/* Badge de stock */}
          <div className="product-card-stock-badge">
            {isOutOfStock ? (
              <span className="badge badge-out">Sin stock</span>
            ) : isLowStock ? (
              <span className="badge badge-low">¡Últimas {stock} un.!</span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="product-card-body">
        {category && (
          <Link
            href={categorySlug ? `/categoria/${categorySlug}` : '/productos'}
            className="product-card-category"
          >
            {category}
          </Link>
        )}

        <h3 className="product-card-title">
          <Link href={`/producto/${slug}`}>{name}</Link>
        </h3>

        <div className="product-card-pricing">
          <span className="product-card-price">{money(price)}</span>
          {hasDiscount && <s className="product-card-compare">{money(compareAt)}</s>}
        </div>

        {sizes && <span className="product-card-sizes">Talles: {sizes}</span>}

        <div className="product-card-action">
          <Link
            href={`/producto/${slug}`}
            className={`btn btn-card ${isOutOfStock ? 'btn-disabled' : ''}`}
          >
            {isOutOfStock ? 'Ver producto (Agotado)' : 'Ver detalle'}
          </Link>
        </div>
      </div>
    </article>
  )
}
