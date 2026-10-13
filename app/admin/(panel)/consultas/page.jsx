import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { parseDias, sinceDays } from '@/lib/stats.js'
import { fdate } from '@/lib/util.js'
import { HBars, PeriodTabs } from '@/components/admin/Charts.jsx'

const DEVICE = { mobile: 'Celular', tablet: 'Tablet', desktop: 'Computadora' }

export default async function Consultas({ searchParams }) {
  await requireUser('queries')
  const dias = parseDias(searchParams.dias)
  const q = String(searchParams.q || '').trim().slice(0, 60)
  const where = { createdAt: { gte: sinceDays(dias) }, ...(q && { productName: { contains: q, mode: 'insensitive' } }) }
  const [ranking, recent, devices, total] = await Promise.all([
    db.contactQuery.groupBy({ by: ['productName'], where, _count: { _all: true }, _max: { createdAt: true }, orderBy: { _count: { productName: 'desc' } }, take: 50 }),
    db.contactQuery.findMany({ where, orderBy: { createdAt: 'desc' }, take: 25, include: { category: { select: { name: true } } } }),
    db.contactQuery.groupBy({ by: ['device'], where, _count: { _all: true } }),
    db.contactQuery.count({ where }),
  ])
  const exp = `dias=${dias}${q ? `&q=${encodeURIComponent(q)}` : ''}`
  return (
    <>
      <h1>Consultas</h1>
      <p>Cada vez que alguien toca “Consultar” en un producto se registra acá. No se guardan datos personales.</p>
      <PeriodTabs base="/admin/consultas" current={dias} extra={q ? `&q=${encodeURIComponent(q)}` : ''} />
      <form className="bar">
        <input type="hidden" name="dias" value={dias} />
        <input name="q" placeholder="Buscar producto" defaultValue={q} />
        <button className="abtn alt">Buscar</button>
        <a className="abtn" href={`/admin/consultas/export?format=csv&${exp}`}>Exportar CSV</a>
        <a className="abtn" href={`/admin/consultas/export?format=xlsx&${exp}`}>Exportar Excel</a>
      </form>
      <div className="cols">
        <div className="card"><h2>Total en {dias} días</h2><div className="stat"><b>{total}</b><span>consultas</span></div></div>
        <div className="card"><h2>Por dispositivo</h2><HBars items={devices.map((d) => ({ label: DEVICE[d.device] || d.device, value: d._count._all }))} empty="Sin consultas en este período." /></div>
      </div>
      <h2 style={{ marginTop: 20 }}>Productos más consultados</h2>
      <div className="tw"><table>
        <thead><tr><th>Producto</th><th>Consultas</th><th>Última consulta</th></tr></thead>
        <tbody>{ranking.map((r) => <tr key={r.productName}><td><b>{r.productName}</b></td><td>{r._count._all}</td><td>{fdate(r._max.createdAt)}</td></tr>)}
          {!ranking.length && <tr><td colSpan={3}>No hay consultas en este período.</td></tr>}</tbody>
      </table></div>
      <h2 style={{ marginTop: 20 }}>Últimas consultas</h2>
      <div className="tw"><table>
        <thead><tr><th>Fecha</th><th>Producto</th><th>Categoría</th><th>Dispositivo</th></tr></thead>
        <tbody>{recent.map((r) => <tr key={r.id}><td>{fdate(r.createdAt)}</td><td>{r.productName}</td><td>{r.category?.name ?? '—'}</td><td>{DEVICE[r.device] || r.device}</td></tr>)}
          {!recent.length && <tr><td colSpan={4}>Sin datos.</td></tr>}</tbody>
      </table></div>
    </>
  )
}
