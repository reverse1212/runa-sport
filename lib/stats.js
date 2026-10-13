import { Prisma } from '@prisma/client'
import { db } from './db.js'

const TZ = 'America/Argentina/Buenos_Aires'
export const CONTACT_TYPES = ['click_whatsapp', 'click_telefono', 'click_email', 'click_mapa', 'click_instagram', 'click_facebook']

export const parseDias = (v) => ([7, 30, 90].includes(Number(v)) ? Number(v) : 30)
export const sinceDays = (n) => new Date(Date.now() - n * 86400000)

function lastDays(n) {
  const out = []
  for (let i = n - 1; i >= 0; i--) out.push(new Date(Date.now() - i * 86400000).toLocaleDateString('en-CA', { timeZone: TZ }))
  return out
}
const fill = (rows, days) => {
  const map = new Map(rows.map((r) => [r.d, Number(r.n)]))
  return lastDays(days).map((d) => ({ label: `${d.slice(8, 10)}/${d.slice(5, 7)}`, value: map.get(d) || 0 }))
}
const DAY = Prisma.sql`to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}::text, 'YYYY-MM-DD')`

export async function eventsPerDay(types, days = 14) {
  const rows = await db.$queryRaw`SELECT ${DAY} AS d, COUNT(*)::int AS n FROM "AnalyticsEvent" WHERE "type" IN (${Prisma.join(types)}) AND "createdAt" > NOW() - INTERVAL '40 days' GROUP BY 1`
  return fill(rows, days)
}

export async function queriesPerDay(days = 14) {
  const rows = await db.$queryRaw`SELECT ${DAY} AS d, COUNT(*)::int AS n FROM "ContactQuery" WHERE "createdAt" > NOW() - INTERVAL '40 days' GROUP BY 1`
  return fill(rows, days)
}

export async function stockEvolution(days = 30) {
  const rows = await db.$queryRaw`SELECT ${DAY} AS d, SUM("delta")::int AS n FROM "InventoryMovement" WHERE "createdAt" > NOW() - INTERVAL '60 days' GROUP BY 1`
  const delta = new Map(rows.map((r) => [r.d, Number(r.n)]))
  const total = (await db.inventory.aggregate({ _sum: { quantity: true } }))._sum.quantity || 0
  const ds = lastDays(days)
  const out = []
  let cur = total
  for (let i = ds.length - 1; i >= 0; i--) {
    out.unshift({ label: `${ds[i].slice(8, 10)}/${ds[i].slice(5, 7)}`, value: cur })
    cur -= delta.get(ds[i]) || 0
  }
  return out
}

export async function getDashboardStats() {
  const since = sinceDays(30)
  const [visits, queries, stock, top, cats, totalQueries, totalVisits, whatsappClicks] = await Promise.all([
    eventsPerDay(['vista_pagina'], 14),
    queriesPerDay(14),
    stockEvolution(30),
    db.contactQuery.groupBy({ by: ['productName'], where: { createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { productName: 'desc' } }, take: 5 }),
    db.analyticsEvent.groupBy({ by: ['detail'], where: { type: 'filtro', detail: { notIn: ['Todo', ''] }, createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { detail: 'desc' } }, take: 5 }),
    db.contactQuery.count(),
    db.analyticsEvent.count({ where: { type: 'vista_pagina' } }),
    db.analyticsEvent.count({ where: { type: 'click_whatsapp' } }),
  ])
  return {
    visits, queries, stock, totalQueries, totalVisits, whatsappClicks,
    topProducts: top.map((r) => ({ label: r.productName, value: r._count._all })),
    topCategories: cats.map((r) => ({ label: r.detail, value: r._count._all })),
  }
}
