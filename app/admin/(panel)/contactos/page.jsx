import { db } from '@/lib/db.js'
import { requireUser } from '@/lib/auth.js'
import { parseDias, sinceDays, eventsPerDay, CONTACT_TYPES } from '@/lib/stats.js'
import { BarChart, HBars, PeriodTabs } from '@/components/admin/Charts.jsx'

const LABELS = { click_whatsapp: 'WhatsApp', click_telefono: 'Teléfono', click_email: 'Email', click_mapa: 'Google Maps', click_instagram: 'Instagram', click_facebook: 'Facebook', consulta: 'Consultas por producto' }
const DEVICE = { mobile: 'Celular', tablet: 'Tablet', desktop: 'Computadora' }

export default async function Contactos({ searchParams }) {
  await requireUser('queries')
  const dias = parseDias(searchParams.dias)
  const where = { type: { in: [...CONTACT_TYPES, 'consulta'] }, createdAt: { gte: sinceDays(dias) } }
  const [byType, byDevice, perDay] = await Promise.all([
    db.analyticsEvent.groupBy({ by: ['type'], where, _count: { _all: true } }),
    db.analyticsEvent.groupBy({ by: ['device'], where, _count: { _all: true } }),
    eventsPerDay([...CONTACT_TYPES, 'consulta'], 14),
  ])
  const counts = Object.fromEntries(byType.map((r) => [r.type, r._count._all]))
  const total = byType.reduce((a, r) => a + r._count._all, 0)
  return (
    <>
      <h1>Clientes / Contactos</h1>
      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ margin: 0 }}>El sitio <b>no guarda nombres, teléfonos ni emails</b> de quienes lo visitan. Acá ves cuánta gente usó cada canal de contacto, que es la información útil sin recolectar datos personales. Las conversaciones en sí quedan en tu WhatsApp.</p>
      </div>
      <PeriodTabs base="/admin/contactos" current={dias} />
      <div className="cols">
        <div className="card"><h2>Contactos en {dias} días</h2><div className="stat"><b>{total}</b><span>toques en canales de contacto</span></div></div>
        <div className="card"><h2>Por canal</h2><HBars items={Object.keys(LABELS).map((k) => ({ label: LABELS[k], value: counts[k] || 0 })).filter((i) => i.value > 0).sort((a, b) => b.value - a.value)} empty="Sin contactos en este período." /></div>
        <div className="card"><h2>Por dispositivo</h2><HBars items={byDevice.map((d) => ({ label: DEVICE[d.device] || d.device, value: d._count._all }))} empty="Sin datos." /></div>
      </div>
      <div className="card" style={{ marginTop: 14 }}><h2>Contactos por día (últimos 14 días)</h2><BarChart data={perDay} /></div>
    </>
  )
}
