import Link from 'next/link'
import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'

export default async function Imagenes() {
  await requireUser('images')
  const products = await db.product.findMany({ orderBy: { id: 'asc' }, include: { images: { orderBy: { position: 'asc' } }, category: true } })
  return (
    <>
      <h1>Imágenes</h1>
      <p>Elegí un producto para subir, recortar, reordenar o reemplazar sus fotos.</p>
      <div className="cols">
        {products.map((p) => {
          const main = p.images.find((i) => i.isPrimary) || p.images[0]
          return (
            <Link key={p.id} href={`/admin/productos/${p.id}#imagenes`} className="card imgcard">
              <div className="pic" style={{ '--c': p.swatchColor }}>{main ? <img src={main.url} alt={main.alt || p.name} loading="lazy" /> : <span>{p.category.name}</span>}</div>
              <b>{p.name}</b>
              <small>{p.images.length ? `${p.images.length} imagen(es)` : 'Sin imágenes'}</small>
            </Link>
          )
        })}
      </div>
    </>
  )
}
