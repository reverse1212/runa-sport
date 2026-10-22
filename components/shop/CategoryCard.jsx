import Link from 'next/link'

export default function CategoryCard({ category }) {
  const { name, slug, description, imageUrl, productCount = 0, firstProductImage } = category

  return (
    <Link href={`/categoria/${slug}`} className="category-card">
      <div className="category-card-bg">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" />
        ) : firstProductImage ? (
          <img
            src={firstProductImage}
            alt={name} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="category-card-fallback">
            <span className="category-icon">⚡</span>
          </div>
        )}
        <div className="category-card-overlay" />
      </div>
      <div className="category-card-content">
        <h3 className="category-card-title">{name}</h3>
        {description && <p className="category-card-desc">{description}</p>}
        <span className="category-card-count">
          {productCount} {productCount === 1 ? 'producto' : 'productos'} →
        </span>
      </div>
    </Link>
  )
}
