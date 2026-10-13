import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { can } from '@/lib/perms.js'
import { fdate, ago } from '@/lib/util.js'
import { getDashboardStats } from '@/lib/stats.js'
import { BarChart, LineChart, HBars } from '@/components/admin/Charts.jsx'

export default async function Dashboard() {
  const user = await requireUser()
  const [published, cats, inv, recent, lastBackup, st] = await Promise.all([
    db.product.count({ where: { status: 'PUBLISHED' } }),
    db.category.count(),
    can(user, 'stock') ? db.inventory.findMany({ where: { product: { status: 'PUBLISHED' } }, include: { product: { select: { name: true } } } }) : [],
    can(user, 'activity') ? db.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: { name: true } } } }) : [],
    can(user, 'backups') ? db.backup.findFirst({ orderBy: { createdAt: 'desc' } }) : null,
    can(user, 'stats') ? getDashboardStats() : null,
  ])
  const out = inv.filter((i) => i.quantity === 0)
  const low = inv.filter((i) => i.quantity > 0 && i.quantity <= i.minStock)
  const cards = [['Productos publicados', published]]
  if (can(user, 'stock')) cards.push(['Sin stock', out.length], ['Stock bajo', low.length])
  cards.push(['Categorías', cats])
  if (st) cards.push(['Consultas recibidas', st.totalQueries], ['Clics en WhatsApp', st.whatsappClicks], ['Visitas', st.totalVisits])
  if (recent[0]) cards.push(['Última actividad', ago(recent[0].createdAt)])
  if (can(user, 'backups')) cards.push(['Último backup', lastBackup ? ago(lastBackup.createdAt) : 'Nunca'])
  return (
    <>
      <h1>Dashboard</h1>
      <div className="cards">{cards.map(([l, n]) => <div className="card stat" key={l}><b>{n}</b><span>{l}</span></div>)}</div>
      {st && (
        <div className="cols">
          <div className="card"><h2>Visitas por día</h2><BarChart data={st.visits} /></div>
          <div className="card"><h2>Consultas por día</h2><BarChart data={st.queries} color="var(--ink)" /></div>
          <div className="card"><h2>Productos más consultados (30 días)</h2><HBars items={st.topProducts} empty="Todavía no hay consultas." /></div>
          <div className="card"><h2>Categorías más vistas (30 días)</h2><HBars items={st.topCategories} empty="Todavía nadie usó los filtros de categoría." /></div>
          <div className="card"><h2>Evolución del stock (unidades totales)</h2><LineChart data={st.stock} /></div>
        </div>
      )}
      <div className="cols" style={{ marginTop: 14 }}>
        {can(user, 'stock') && (
          <div className="card">
            <h2>Alertas</h2>
            <ul className="alist">
              {out.map((i) => <li key={i.productId}>🔴 <b>Sin stock</b><small>{i.product.name} está sin stock.</small></li>)}
              {low.map((i) => <li key={i.productId}>⚠️ <b>Stock bajo</b><small>{i.product.name} tiene solamente {i.quantity} unidades.</small></li>)}
              {!out.length && !low.length && <li>Sin alertas de stock.</li>}
            </ul>
          </div>
        )}
        {can(user, 'activity') && (
          <div className="card">
            <h2>Actividad reciente</h2>
            <ul className="alist">{recent.map((a) => <li key={a.id}>{a.user?.name ?? 'Sistema'}: {a.action}<small>{a.detail} · {ago(a.createdAt)} ({fdate(a.createdAt)})</small></li>)}</ul>
          </div>
        )}
      </div>
    </>
  )
}
