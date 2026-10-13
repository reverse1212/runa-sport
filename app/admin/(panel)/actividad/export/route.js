import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { activityWhere, fdate } from '@/lib/util.js'
import { tableResponse } from '@/lib/export.js'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  await requireUser('activity')
  const sp = new URL(req.url).searchParams
  const q = (sp.get('q') || '').trim().slice(0, 60)
  const rows = await db.activityLog.findMany({ where: activityWhere(q), orderBy: { createdAt: 'desc' }, take: 10000, include: { user: { select: { name: true } } } })
  return tableResponse(sp.get('format') === 'xlsx' ? 'xlsx' : 'csv', 'actividad',
    [['Fecha', 'fecha', 20], ['Usuario', 'usuario', 18], ['Acción', 'accion', 28], ['Elemento', 'elemento', 22], ['IP', 'ip', 16], ['Detalles', 'detalles', 70]],
    rows.map((a) => ({ fecha: fdate(a.createdAt), usuario: a.user?.name ?? '', accion: a.action, elemento: `${a.entity}${a.entityId ? ' #' + a.entityId : ''}`, ip: a.ip ?? '', detalles: a.detail })))
}
