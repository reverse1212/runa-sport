'use client'

import { useState } from 'react'

export default function ProductGallery({ images = [], name = 'Producto', swatchColor = '#2450F5', swatchDark = false }) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div
        className={`product-gallery-fallback ${swatchDark ? 'is-dark' : ''}`}
        style={{ '--c': swatchColor }}
      >
        <span>{name}</span>
      </div>
    )
  }

  const currentImage = images[selectedIdx] || images[0]

  return (
    <div className="product-gallery">
      {/* Imagen Principal */}
      <div className="product-gallery-main">
        <img
          src={currentImage.url}
          alt={currentImage.alt || name}
          className="product-gallery-img"
        />
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="product-gallery-thumbs" role="tablist" aria-label="Miniaturas de imágenes">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              className={`gallery-thumb-btn ${idx === selectedIdx ? 'is-active' : ''}`}
              onClick={() => setSelectedIdx(idx)}
              aria-label={`Ver imagen ${idx + 1}`}
            >
              <img src={img.url} alt={img.alt || `${name} ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
