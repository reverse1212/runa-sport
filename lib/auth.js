import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash, randomBytes } from 'crypto'
import { db } from './db.js'
import { can } from './perms.js'

const COOKIE = 'rs_session'
const TTL = 8 * 3600 * 1000 // la sesión expira a las 8 horas
const hash = (t) => createHash('sha256').update(t).digest('hex')

export async function startSession(user) {
  const token = randomBytes(32).toString('hex')
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  await db.session.create({ data: { tokenHash: hash(token), userId: user.id, expiresAt: new Date(Date.now() + TTL) } })
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: TTL / 1000 })
}

export async function endSession() {
  const t = cookies().get(COOKIE)?.value
  if (t) await db.session.deleteMany({ where: { tokenHash: hash(t) } })
  cookies().delete(COOKIE)
}

export const getUser = cache(async () => {
  const t = cookies().get(COOKIE)?.value
  if (!t) return null
  const s = await db.session.findUnique({ where: { tokenHash: hash(t) }, include: { user: true } })
  return s && s.expiresAt > new Date() && s.user.active ? s.user : null
})

// Se llama en cada página y en cada acción del panel: la validación real está siempre en el servidor.
export async function requireUser(perm) {
  const u = await getUser()
  if (!u) redirect('/admin/login')
  if (perm && !can(u, perm)) redirect('/admin')
  return u
}
