import Link from 'next/link'
import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { activityWhere, fdate } from '@/lib/util.js'

const SIZE = 25

export default async function Actividad({ searchParams }) {
  await requireUser('activity')
  const q = String(searchParams.q || '').trim().slice(0, 60)
  const page = Math.max(1, Number(searchParams.p) || 1)
  const where = activityWhere(q)
  const [total, rows] = await Promise.all([
    db.activityLog.count({ where }),
    db.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * SIZE, take: SIZE, include: { user: { select: { name: true } } } }),
  ])
  const pages = Math.max(1, Math.ceil(total / SIZE))
  const href = (p) => `/admin/actividad?${new URLSearchParams({ ...(q && { q }), p })}`
  return (
    <>
      <h1>Registro de actividad</h1>
      <form className="bar">
        <input name="q" placeholder="Buscar acción, elemento, usuario o detalle" defaultValue={q} />
        <button className="abtn alt">Buscar</button>
        <a className="abtn" href={`/admin/actividad/export?${new URLSearchParams({ ...(q && { q }), format: 'csv' })}`}>Exportar CSV</a>
        <a className="abtn" href={`/admin/actividad/export?${new URLSearchParams({ ...(q && { q }), format: 'xlsx' })}`}>Exportar Excel</a>
      </form>
      <div className="tw"><table>
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Elemento</th><th>IP</th><th>Detalles</th></tr></thead>
        <tbody>{rows.map((a) => <tr key={a.id}><td>{fdate(a.createdAt)}</td><td>{a.user?.name ?? '—'}</td><td>{a.action}</td><td>{a.entity}{a.entityId ? ` #${a.entityId}` : ''}</td><td>{a.ip ?? '—'}</td><td>{a.detail}</td></tr>)}</tbody>
      </table></div>
      <div className="pager">
        {page > 1 && <Link className="abtn sm alt" href={href(page - 1)}>← Anterior</Link>}
        <span>Página {page} de {pages} · {total} registros</span>
        {page < pages && <Link className="abtn sm alt" href={href(page + 1)}>Siguiente →</Link>}
      </div>
    </>
  )
}
