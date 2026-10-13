import { getCatalog } from '../../../lib/queries.js'

export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(await getCatalog(), { headers: { 'Cache-Control': 'public, s-maxage=60' } })
}
