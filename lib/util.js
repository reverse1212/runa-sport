export const slugify = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const money = (n) => (n == null ? '—' : '$' + n.toLocaleString('es-AR'))
export const fdate = (d) => new Date(d).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
export function ago(d) {
  const m = Math.round((Date.now() - new Date(d)) / 60000)
  if (m < 1) return 'Hace un momento'
  if (m < 60) return `Hace ${m} min`
  const h = Math.round(m / 60)
  return h < 24 ? `Hace ${h} h` : `Hace ${Math.round(h / 24)} d`
}
export const stockState = (q, min) => (q === 0 ? ['b-out', '🔴 Sin stock'] : q <= min ? ['b-low', '🟡 Stock bajo'] : ['b-ok', '🟢 Disponible'])
export const STATUS = { PUBLISHED: 'Publicado', HIDDEN: 'Oculto', DRAFT: 'Borrador' }
const ci = (v) => ({ contains: v, mode: 'insensitive' })
export const activityWhere = (q) => (q ? { OR: [{ action: ci(q) }, { entity: ci(q) }, { detail: ci(q) }, { user: { name: ci(q) } }] } : {})
