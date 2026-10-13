import { headers } from 'next/headers'
import { db } from './db.js'

export function clientIp() {
  const h = headers()
  return h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || null
}

export async function logActivity(user, action, entity, entityId = null, detail = '') {
  try {
    await db.activityLog.create({ data: { userId: user?.id ?? null, action, entity, entityId: entityId == null ? null : String(entityId), detail: String(detail).slice(0, 1000), ip: clientIp() } })
  } catch (e) { console.error('activity log failed', e) }
}
