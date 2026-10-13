import Link from 'next/link'

export default function ShopFooter({ settings = {}, categories = [] }) {
  const currentYear = new Date().getFullYear()
  const brandName = settings.brand_name || 'Runa Sport'

  return (
    <footer className="shop-footer">
      <div className="wrap">
        <div className="shop-footer-grid">
          {/* Columna 1: Marca y descripción */}
          <div className="shop-footer-col">
            <h3 className="footer-brand">{brandName}</h3>
            <p className="footer-desc">
              {settings.hero_subtitle || 'Indumentaria y calzado deportivo de primera calidad para entrenamiento y competición.'}
            </p>
            {(settings.social_instagram || settings.social_facebook || settings.social_tiktok) && (
              <div className="footer-social">
                {settings.social_instagram && (
                  <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    📷 Instagram
                  </a>
                )}
                {settings.social_facebook && (
                  <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    👍 Facebook
                  </a>
                )}
                {settings.social_tiktok && (
                  <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                    🎵 TikTok
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Columna 2: Navegación */}
          <div className="shop-footer-col">
            <h4>Navegación</h4>
            <ul className="footer-links">
              <li><Link href="/">Inicio</Link></li>
              <li><Link href="/productos">Catálogo Completo</Link></li>
              <li><Link href="/ofertas">Ofertas especiales</Link></li>
              <li><Link href="/contacto">Sucursal y Contacto</Link></li>
              <li><Link href="/carrito">Mi Carrito</Link></li>
            </ul>
          </div>

          {/* Columna 3: Categorías */}
          <div className="shop-footer-col">
            <h4>Categorías</h4>
            <ul className="footer-links">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug || c.id}>
                  <Link href={`/categoria/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div className="shop-footer-col">
            <h4>Contacto</h4>
            <ul className="footer-contact-list">
              {settings.address && (
                <li>
                  <strong>Dirección:</strong>{' '}
                  {settings.maps_url ? (
                    <a href={settings.maps_url} target="_blank" rel="noopener noreferrer">
                      {settings.address}
                    </a>
                  ) : (
                    settings.address
                  )}
                </li>
              )}
              {settings.hours && <li><strong>Horario:</strong> {settings.hours}</li>}
              {settings.phone_display && (
                <li>
                  <strong>Tel:</strong>{' '}
                  <a href={`tel:${settings.phone_tel || settings.phone_display}`}>{settings.phone_display}</a>
                </li>
              )}
              {settings.whatsapp_display && (
                <li>
                  <strong>WhatsApp:</strong>{' '}
                  <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener noreferrer">
                    {settings.whatsapp_display}
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="shop-footer-bottom">
          <p>© {currentYear} {brandName}. Todos los derechos reservados.</p>
          <div className="footer-bottom-actions">
            <Link href="/contacto">Términos y condiciones</Link>
            <a href="/admin" className="adm-open">Acceso Admin</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
