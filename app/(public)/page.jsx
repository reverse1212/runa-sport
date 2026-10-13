import Link from 'next/link'
import CategoryCard from '../../components/shop/CategoryCard.jsx'
import ProductCard from '../../components/shop/ProductCard.jsx'
import { getSettings, getCategories, getFeaturedProducts } from '../../lib/queries.js'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const s = await getSettings()
  return {
    title: s.seo_title || `${s.brand_name || 'Runa Sport'} · Tienda Oficial`,
    description: s.seo_description || s.hero_subtitle,
  }
}

export default async function HomePage() {
  const [settings, categories, featured] = await Promise.all([
    getSettings(),
    getCategories(),
    getFeaturedProducts(8),
  ])

  const brandName = settings.brand_name || 'Runa Sport'
  const heroTitle = settings.hero_title || 'EQUIPATE PARA GANAR'
  const heroSubtitle =
    settings.hero_subtitle ||
    'Ropa deportiva y calzado de alto rendimiento para entrenar con máxima comodidad, estilo y durabilidad.'

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <h1>{heroTitle}</h1>
              <p className="lead">{heroSubtitle}</p>
              <div className="actions">
                <Link href="/productos" className="btn btn-sun">
                  Ver catálogo completo →
                </Link>
                <Link href="/contacto" className="btn btn-line">
                  Dónde encontrarnos
                </Link>
              </div>
            </div>

            <aside className="info" aria-labelledby="quick-info">
              <h2 id="quick-info">Atención rápida</h2>
              <dl>
                <div>
                  <dt>WhatsApp Directo</dt>
                  <dd>
                    <a
                      href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent('Hola, quiero consultar por productos de la tienda.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {settings.whatsapp_display || 'Consultar por WhatsApp'}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Sucursal</dt>
                  <dd>{settings.address || 'Buenos Aires, Argentina'}</dd>
                </div>
                <div>
                  <dt>Horarios</dt>
                  <dd>{settings.hours || 'Lunes a Sábado de 9:00 a 20:00'}</dd>
                </div>
              </dl>
              <div className="actions" style={{ marginTop: '16px' }}>
                <Link href="/contacto" className="link-see-all">
                  Ver mapa y todos los datos de contacto →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Barra de beneficios */}
      <div className="benefits-bar">
        <div className="wrap">
          <div className="benefits-grid">
            <div className="benefit-item">
              <span className="benefit-icon">🚚</span>
              <div>
                <div className="benefit-title">Envíos a todo el país</div>
                <div className="benefit-desc">Recibí tu pedido en la puerta de tu casa</div>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">💳</span>
              <div>
                <div className="benefit-title">Medios de pago flexibles</div>
                <div className="benefit-desc">Transferencia, efectivo y medios digitales</div>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🔄</span>
              <div>
                <div className="benefit-title">Cambios sin vueltas</div>
                <div className="benefit-desc">Garantía de talle y satisfacción</div>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">💬</span>
              <div>
                <div className="benefit-title">Asesoramiento directo</div>
                <div className="benefit-desc">Te ayudamos a elegir por WhatsApp</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Categorías */}
      {categories.length > 0 && (
        <section className="section-home">
          <div className="wrap">
            <div className="section-home-head">
              <div>
                <h2>Explorá por categoría</h2>
                <p>Encontrá indumentaria pensada para cada tipo de entrenamiento</p>
              </div>
              <Link href="/productos" className="link-see-all">
                Ver todos los productos →
              </Link>
            </div>
            <div className="category-grid">
              {categories.map((cat) => (
                <CategoryCard key={cat.slug || cat.id} category={cat} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sección Productos Destacados */}
      <section className="section-home" style={{ background: '#fff', borderTop: '1px solid #EEF2FA' }}>
        <div className="wrap">
          <div className="section-home-head">
            <div>
              <h2>Productos destacados</h2>
              <p>Lo más elegido por nuestros clientes esta temporada</p>
            </div>
            <Link href="/productos" className="link-see-all">
              Ver catálogo completo ({featured.length} disponibles) →
            </Link>
          </div>

          {featured.length === 0 ? (
            <p style={{ color: 'var(--slate)' }}>No hay productos destacados en este momento.</p>
          ) : (
            <div className="product-grid">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link href="/productos" className="btn btn-sun" style={{ padding: '14px 36px', fontSize: '1.05rem' }}>
              Ver todos los productos →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
