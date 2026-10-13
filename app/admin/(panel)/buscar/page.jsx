import Link from 'next/link'
import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { can } from '@/lib/perms.js'
import { activityWhere, fdate, money, stockState } from '@/lib/util.js'

export default async function Buscar({ searchParams }) {
  const user = await requireUser()
  const q = String(searchParams.q || '').trim().slice(0, 60)
  const ok = q.length >= 2
  const ci = { contains: q, mode: 'insensitive' }
  const [products, cats, queries, activity, events] = await Promise.all([
    ok && can(user, 'products') ? db.product.findMany({ where: { OR: [{ name: ci }, { sku: ci }, { internalCode: ci }, { category: { name: ci } }] }, include: { category: true, inventory: true }, orderBy: { name: 'asc' }, take: 10 }) : [],
    ok && can(user, 'products') ? db.category.findMany({ where: { name: ci }, take: 10 }) : [],
    ok && can(user, 'queries') ? db.contactQuery.findMany({ where: { OR: [{ productName: ci }, { category: { name: ci } }] }, include: { category: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }) : [],
    ok && can(user, 'activity') ? db.activityLog.findMany({ where: activityWhere(q), include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }) : [],
    ok && can(user, 'stats') ? db.analyticsEvent.findMany({ where: { OR: [{ type: ci }, { detail: ci }] }, orderBy: { createdAt: 'desc' }, take: 10 }) : [],
  ])
  const none = ok && ![products, cats, queries, activity, events].some((r) => r.length)
  return (
    <>
      <h1>Buscar</h1>
      <form className="bar"><input name="q" placeholder="Producto, SKU, categoría, consulta o evento" defaultValue={q} autoFocus /><button className="abtn">Buscar</button></form>
      {!ok && <p>Escribí al menos 2 letras.</p>}
      {none && <p>No encontramos resultados para “{q}”.</p>}
      {products.length > 0 && <>
        <h2>Productos</h2>
        <ul className="alist card">{products.map((p) => { const [cls, label] = stockState(p.inventory?.quantity ?? 0, p.inventory?.minStock ?? 5); return (
          <li key={p.id}><Link href={`/admin/productos/${p.id}`}><b>{p.name}</b></Link> <span className={`badge ${cls}`}>{label}</span><small>{p.category.name} · {money(p.price)}{p.sku ? ` · SKU ${p.sku}` : ''}</small></li>) })}</ul>
      </>}
      {cats.length > 0 && <>
        <h2>Categorías</h2>
        <ul className="alist card">{cats.map((c) => <li key={c.id}><Link href="/admin/categorias">{c.name}</Link></li>)}</ul>
      </>}
      {queries.length > 0 && <>
        <h2>Consultas</h2>
        <ul className="alist card">{queries.map((r) => <li key={r.id}>{r.productName}<small>{fdate(r.createdAt)} · {r.category?.name ?? '—'} · {r.device}</small></li>)}</ul>
      </>}
      {events.length > 0 && <>
        <h2>Eventos</h2>
        <ul className="alist card">{events.map((e) => <li key={e.id}>{e.type}{e.detail ? ` — ${e.detail}` : ''}<small>{fdate(e.createdAt)} · {e.device}</small></li>)}</ul>
      </>}
      {activity.length > 0 && <>
        <h2>Actividad</h2>
        <ul className="alist card">{activity.map((a) => <li key={a.id}>{a.user?.name ?? 'Sistema'}: {a.action}<small>{a.detail} · {fdate(a.createdAt)}</small></li>)}</ul>
      </>}
    </>
  )
}
