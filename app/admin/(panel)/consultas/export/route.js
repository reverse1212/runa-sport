import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { parseDias, sinceDays } from '@/lib/stats.js'
import { fdate } from '@/lib/util.js'
import { tableResponse } from '@/lib/export.js'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  await requireUser('queries')
  const sp = new URL(req.url).searchParams
  const q = (sp.get('q') || '').trim().slice(0, 60)
  const rows = await db.contactQuery.findMany({
    where: { createdAt: { gte: sinceDays(parseDias(sp.get('dias'))) }, ...(q && { productName: { contains: q, mode: 'insensitive' } }) },
    orderBy: { createdAt: 'desc' }, take: 10000, include: { category: { select: { name: true } } },
  })
  return tableResponse(sp.get('format') === 'xlsx' ? 'xlsx' : 'csv', 'consultas',
    [['Fecha', 'fecha', 20], ['Producto', 'producto', 34], ['Categoría', 'categoria', 18], ['Dispositivo', 'dispositivo', 14]],
    rows.map((r) => ({ fecha: fdate(r.createdAt), producto: r.productName, categoria: r.category?.name ?? '', dispositivo: r.device })))
}
