import Link from 'next/link'
import { getSettings } from '../../../lib/queries.js'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const s = await getSettings()
  return {
    title: `Contacto & Sucursal | ${s.brand_name || 'Runa Sport'}`,
    description: `Ponete en contacto con ${s.brand_name || 'Runa Sport'}. Conocé nuestra ubicación, horarios de atención y canales de consulta.`,
  }
}

export default async function ContactPage() {
  const s = await getSettings()
  const brandName = s.brand_name || 'Runa Sport'

  return (
    <div className="contact-page-wrap" style={{ padding: '32px 0 64px' }}>
      <div className="wrap">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs" aria-label="Navegación secundaria">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <span className="current">Contacto</span>
        </nav>

        <div className="catalog-header" style={{ marginBottom: '36px' }}>
          <h1>Atención & Sucursal</h1>
          <p style={{ color: 'var(--slate)', fontSize: '1.1rem', marginTop: '8px' }}>
            Estamos a tu disposición para ayudarte con consultas sobre talles, modelos, envíos y compras mayoristas o minoristas.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
          {/* Tarjeta WhatsApp & Teléfono */}
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', border: '1px solid #EEF2FA', boxShadow: '0 2px 10px rgba(14,26,58,0.04)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '14px' }}>💬</span>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: 'var(--ink)' }}>Atención por WhatsApp</h2>
            <p style={{ color: 'var(--slate)', marginBottom: '20px', lineHeight: 1.5 }}>
              Escribinos directamente para recibir asesoramiento en el momento, confirmar stock y coordinar compras.
            </p>
            <a
              href={`https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent('Hola! Me gustaría hacer una consulta.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa-buy"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Iniciar chat de WhatsApp
            </a>

            {s.phone_display && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #EEF2FA' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--slate)', display: 'block' }}>Teléfono fijo / móvil:</span>
                <a href={`tel:${s.phone_tel || s.phone_display}`} style={{ fontWeight: 700, color: 'var(--blue)', fontSize: '1.1rem' }}>
                  {s.phone_display}
                </a>
              </div>
            )}
          </div>

          {/* Tarjeta Sucursal & Ubicación */}
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', border: '1px solid #EEF2FA', boxShadow: '0 2px 10px rgba(14,26,58,0.04)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '14px' }}>📍</span>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: 'var(--ink)' }}>Nuestra Tienda</h2>
            <p style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--ink)', marginBottom: '8px' }}>
              {s.address || 'Buenos Aires, Argentina'}
            </p>
            <p style={{ color: 'var(--slate)', marginBottom: '20px', lineHeight: 1.5 }}>
              <strong>Horarios de atención:</strong> {s.hours || 'Lunes a Sábado de 9:00 a 20:00'}
            </p>

            {s.maps_url && (
              <a
                href={s.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sun"
                style={{ width: '100%', textAlign: 'center', display: 'block' }}
              >
                Abrir en Google Maps →
              </a>
            )}

            {s.email && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #EEF2FA' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--slate)', display: 'block' }}>Correo electrónico:</span>
                <a href={`mailto:${s.email}`} style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {s.email}
                </a>
              </div>
            )}
          </div>

          {/* Tarjeta Redes y Comunidad */}
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', border: '1px solid #EEF2FA', boxShadow: '0 2px 10px rgba(14,26,58,0.04)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '14px' }}>⚡</span>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: 'var(--ink)' }}>Redes Sociales</h2>
            <p style={{ color: 'var(--slate)', marginBottom: '20px', lineHeight: 1.5 }}>
              Seguinos en nuestras redes para no perderte nuevos lanzamientos, promociones exclusivas y tips de entrenamiento.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {s.social_instagram && (
                <a
                  href={s.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', color: '#fff' }}
                >
                  Seguinos en Instagram
                </a>
              )}
              {s.social_facebook && (
                <a
                  href={s.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: '#1877F2', color: '#fff' }}
                >
                  Seguinos en Facebook
                </a>
              )}
              {s.social_tiktok && (
                <a
                  href={s.social_tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: '#000', color: '#fff' }}
                >
                  Seguinos en TikTok
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
