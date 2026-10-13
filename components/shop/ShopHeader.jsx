'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import CartIcon from './CartIcon.jsx'

export default function ShopHeader({ brandName = 'Runa Sport', logoUrl = null, categories = [] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const q = searchParams?.get('q') || ''
    setSearchQuery(q)
  }, [searchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/productos?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false)
    } else {
      router.push('/productos')
    }
  }

  return (
    <header className="shop-header-sticky">
      <div className="shop-topbar">
        <div className="wrap shop-topbar-wrap">
          <span>⚡ Envíos a todo el país · Indumentaria deportiva de alto rendimiento</span>
          <div className="shop-topbar-links">
            <Link href="/contacto">Ayuda & Contacto</Link>
            <a href="/admin" className="topbar-admin-link">Panel Admin</a>
          </div>
        </div>
      </div>

      <div className="shop-header-main">
        <div className="wrap shop-header-wrap">
          {/* Botón hamburguesa móvil */}
          <button
            className="mobile-menu-btn"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          {/* Logo / Marca */}
          <Link href="/" className="shop-brand" onClick={() => setMobileMenuOpen(false)}>
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="shop-brand-logo" />
            ) : (
              <span className="shop-brand-text">
                {brandName.toUpperCase()}
              </span>
            )}
          </Link>

          {/* Buscador central */}
          <form className="shop-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              placeholder="Buscar remeras, calzas, zapatillas, camperas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shop-search-input"
            />
            <button type="submit" className="shop-search-btn" aria-label="Buscar">
              🔍
            </button>
          </form>

          {/* Acciones: Carrito */}
          <div className="shop-header-actions">
            <CartIcon />
          </div>
        </div>
      </div>

      {/* Navegación secundaria / Categorías */}
      <nav className={`shop-nav-bar ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="wrap shop-nav-wrap">
          <ul className="shop-nav-links">
            <li>
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                Inicio
              </Link>
            </li>
            <li>
              <Link href="/productos" onClick={() => setMobileMenuOpen(false)}>
                Todos los productos
              </Link>
            </li>
            {categories.slice(0, 5).map((cat) => (
              <li key={cat.slug || cat.id}>
                <Link href={`/categoria/${cat.slug}`} onClick={() => setMobileMenuOpen(false)}>
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contacto" onClick={() => setMobileMenuOpen(false)}>
                Contacto
              </Link>
            </li>
          </ul>

          {/* Buscador móvil dentro del menú */}
          <div className="mobile-search-wrapper">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="search"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shop-search-input"
              />
            </form>
          </div>
        </div>
      </nav>
    </header>
  )
}
