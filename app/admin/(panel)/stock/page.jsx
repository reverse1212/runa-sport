import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { adjustStock } from '@/lib/actions.js'
import { stockState, fdate } from '@/lib/util.js'

export default async function Stock({ searchParams }) {
  await requireUser('stock')
  const q = String(searchParams.q || '').trim().slice(0, 60)
  const ci = { contains: q, mode: 'insensitive' }
  const [rows, moves] = await Promise.all([
    db.inventory.findMany({ where: q ? { product: { OR: [{ name: ci }, { sku: ci }] } } : {}, include: { product: true }, orderBy: { productId: 'asc' } }),
    db.inventoryMovement.findMany({ orderBy: { createdAt: 'desc' }, take: 15, include: { product: { select: { name: true } }, user: { select: { name: true } } } }),
  ])
  return (
    <>
      <h1>Stock</h1>
      <form className="bar"><input name="q" placeholder="Buscar producto o SKU" defaultValue={q} /><button className="abtn alt">Buscar</button></form>
      <div className="tw"><table>
        <thead><tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Mín.</th><th>Estado</th><th>Acción</th></tr></thead>
        <tbody>{rows.map((i) => {
          const [cls, label] = stockState(i.quantity, i.minStock)
          return (
            <tr key={i.productId}>
              <td><b>{i.product.name}</b></td><td>{i.product.sku ?? '—'}</td><td><b>{i.quantity}</b></td><td>{i.minStock}</td>
              <td><span className={`badge ${cls}`}>{label}</span></td>
              <td><div className="arow">
                <form action={adjustStock} className="arow"><input type="hidden" name="productId" value={i.productId} />
                  {[-5, -1, 1, 5].map((d) => <button key={d} name="delta" value={d} className="abtn sm alt">{d > 0 ? `+${d}` : d}</button>)}</form>
                <form action={adjustStock} className="arow"><input type="hidden" name="productId" value={i.productId} />
                  <input className="qty" name="qty" type="number" min="0" placeholder="Cantidad" aria-label="Nueva cantidad" /><button className="abtn sm">Fijar</button></form>
              </div></td>
            </tr>
          )
        })}</tbody>
      </table></div>
      <h2 style={{ marginTop: 24 }}>Últimos movimientos</h2>
      <div className="tw"><table>
        <thead><tr><th>Producto</th><th>Anterior</th><th>Nuevo</th><th>Cambio</th><th>Usuario</th><th>Fecha</th></tr></thead>
        <tbody>{moves.map((m) => <tr key={m.id}><td>{m.product.name}</td><td>{m.previous}</td><td>{m.next}</td><td>{m.delta > 0 ? `+${m.delta}` : m.delta}</td><td>{m.user?.name ?? '—'}</td><td>{fdate(m.createdAt)}</td></tr>)}</tbody>
      </table></div>
    </>
  )
}
