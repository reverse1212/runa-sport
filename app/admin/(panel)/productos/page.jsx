import Link from 'next/link'
import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { ConfirmForm } from '@/components/admin/ActionForm.jsx'
import { deleteProduct, toggleProduct, duplicateProduct } from '@/lib/actions.js'
import { money, STATUS, stockState } from '@/lib/util.js'

export default async function Productos({ searchParams }) {
  await requireUser('products')
  const q = String(searchParams.q || '').trim().slice(0, 60)
  const st = STATUS[searchParams.estado] ? searchParams.estado : undefined
  const ci = { contains: q, mode: 'insensitive' }
  const rows = await db.product.findMany({
    where: { ...(st && { status: st }), ...(q && { OR: [{ name: ci }, { sku: ci }, { category: { name: ci } }] }) },
    include: { category: true, inventory: true }, orderBy: { id: 'asc' },
  })
  return (
    <>
      <h1>Productos</h1>
      <form className="bar">
        <input name="q" placeholder="Buscar por nombre, SKU o categoría" defaultValue={q} />
        <select name="estado" defaultValue={st || ''}><option value="">Todos los estados</option>{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <button className="abtn alt">Filtrar</button>
        <Link className="abtn" href="/admin/productos/nuevo">+ Nuevo producto</Link>
      </form>
      <div className="tw"><table>
        <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{rows.map((p) => {
          const inv = p.inventory, [cls, label] = stockState(inv?.quantity ?? 0, inv?.minStock ?? 5)
          return (
            <tr key={p.id}>
              <td><Link href={`/admin/productos/${p.id}`}><b>{p.name}</b></Link></td>
              <td>{p.category.name}</td>
              <td>{p.promoPrice ? <><b>{money(p.promoPrice)}</b> <s>{money(p.price)}</s></> : money(p.price)}</td>
              <td><span className={`badge ${cls}`}>{label} ({inv?.quantity ?? 0})</span></td>
              <td><span className={`badge ${p.status === 'PUBLISHED' ? 'b-ok' : 'b-off'}`}>{STATUS[p.status]}</span></td>
              <td><div className="arow">
                <Link className="abtn sm" href={`/admin/productos/${p.id}`}>Editar</Link>
                <form action={duplicateProduct.bind(null, p.id)}><button className="abtn sm alt">Duplicar</button></form>
                <form action={toggleProduct.bind(null, p.id)}><button className="abtn sm alt">{p.status === 'PUBLISHED' ? 'Ocultar' : 'Publicar'}</button></form>
                <ConfirmForm action={deleteProduct.bind(null, p.id)} message={`¿Seguro que querés eliminar "${p.name}"?`} second="Última confirmación: se van a borrar también su stock, sus imágenes y su historial. No se puede deshacer."><button className="abtn sm warn">Eliminar</button></ConfirmForm>
              </div></td>
            </tr>
          )
        })}{!rows.length && <tr><td colSpan={6}>No hay productos.</td></tr>}</tbody>
      </table></div>
    </>
  )
}
