import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const ROOT = path.join(process.cwd(), 'public', 'uploads')
const TYPES = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }

export async function GET(_req, { params }) {
  const file = path.join(ROOT, ...params.path)
  const type = TYPES[path.extname(file).toLowerCase()]
  if (!type || !file.startsWith(ROOT + path.sep) || !fs.existsSync(file)) return new Response('No encontrado', { status: 404 })
  return new Response(fs.readFileSync(file), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } })
}
