import Link from 'next/link'
import NavLink from '@/components/admin/NavLink.jsx'
import { requireUser } from '@/lib/auth.js'
import { can, ROLE_LABEL } from '@/lib/perms.js'
import { logout } from '@/lib/actions.js'
import { db } from '@/lib/db.js'

export const dynamic = 'force-dynamic'

const NAV = [
  ['/admin', 'Dashboard', null],
  ['/admin/productos', 'Productos', 'products'],
  ['/admin/categorias', 'Categorías', 'products'],
  ['/admin/imagenes', 'Imágenes', 'images'],
  ['/admin/stock', 'Stock', 'stock'],
  ['/admin/consultas', 'Consultas', 'queries'],
  ['/admin/contactos', 'Clientes/Contactos', 'queries'],
  ['/admin/pagina-principal', 'Página principal', 'content'],
  ['/admin/configuracion', 'Configuración', 'content'],
  ['/admin/usuarios', 'Usuarios', 'users'],
  ['/admin/backups', 'Backups', 'backups'],
  ['/admin/actividad', 'Registro de actividad', 'activity'],
]

async function getAlerts(user) {
  const items = []
  if (can(user, 'stock')) {
    const inv = await db.inventory.findMany({ where: { product: { status: 'PUBLISHED' } }, include: { product: { select: { name: true } } } })
    for (const i of inv.filter((x) => x.quantity === 0)) items.push(['🔴', 'Sin stock', `${i.product.name} está sin stock.`])
    for (const i of inv.filter((x) => x.quantity > 0 && x.quantity <= x.minStock)) items.push(['⚠️', 'Stock bajo', `${i.product.name} tiene solamente ${i.quantity} unidades.`])
  }
  if (can(user, 'activity')) {
    const n = await db.activityLog.count({ where: { action: 'Editar producto', createdAt: { gt: new Date(Date.now() - 86400000) } } })
    if (n) items.push(['ℹ️', 'Actividad', `Se actualizaron ${n} producto(s) en las últimas 24 horas.`])
  }
  return items
}

export default async function Panel({ children }) {
  const user = await requireUser()
  const alerts = await getAlerts(user)
  return (
    <div className="shell">
      <input type="checkbox" id="nav" className="navchk" aria-hidden="true" tabIndex={-1} />
      <aside className="side">
        <div className="alogo">RUNA<span>SPORT</span></div>
        <nav>{NAV.filter(([, , p]) => !p || can(user, p)).map(([h, l]) => <NavLink key={h} href={h}>{l}</NavLink>)}</nav>
        <form action={logout}><button className="logout">Cerrar sesión</button></form>
      </aside>
      <label htmlFor="nav" className="scrim" />
      <div className="amain">
        <header className="atop">
          <label htmlFor="nav" className="burger" aria-label="Menú">☰</label>
          <form action="/admin/buscar" className="tsearch" role="search">
            <input name="q" placeholder="Buscar producto, SKU, categoría, consulta…" aria-label="Buscar" />
          </form>
          <details className="bell">
            <summary aria-label="Notificaciones">🔔{alerts.length > 0 && <span className="bellcount">{alerts.length}</span>}</summary>
            <div className="bellpanel">
              {alerts.length === 0 ? <p>Sin alertas.</p> : <ul className="alist">{alerts.slice(0, 12).map(([icon, title, text], i) => <li key={i}>{icon} <b>{title}</b><small>{text}</small></li>)}</ul>}
            </div>
          </details>
          <Link href="/admin/cuenta" className="tuser">{user.name} · {ROLE_LABEL[user.role]}</Link>
        </header>
        <div className="acontent">{children}</div>
      </div>
    </div>
  )
}
