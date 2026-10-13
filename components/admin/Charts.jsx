import Link from 'next/link'

export function BarChart({ data, color = 'var(--blue)' }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const W = 560, H = 150, pad = 8, bw = (W - pad) / data.length
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="Gráfico de barras" style={{ width: '100%', height: 'auto' }}>
      <line x1={pad} y1={H} x2={W} y2={H} stroke="var(--line)" />
      {data.map((d, i) => {
        const h = Math.round((d.value / max) * (H - 20))
        const x = pad + i * bw + bw * 0.15
        const cx = x + bw * 0.35
        return (
          <g key={`${d.label}-${i}`}>
            <rect x={x} y={H - h} width={bw * 0.7} height={h} rx="3" fill={color}><title>{`${d.label}: ${d.value}`}</title></rect>
            {d.value > 0 && <text x={cx} y={H - h - 4} fontSize="10" textAnchor="middle" fill="var(--slate)">{d.value}</text>}
            {i % 2 === 0 && <text x={cx} y={H + 15} fontSize="10" textAnchor="middle" fill="var(--slate)">{d.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}

export function LineChart({ data, color = 'var(--blue)' }) {
  const W = 560, H = 150, left = 34
  const vals = data.map((d) => d.value)
  const max = Math.max(...vals, 1), min = Math.min(...vals, max)
  const span = max - min || 1
  const x = (i) => left + (i * (W - left - 6)) / Math.max(1, data.length - 1)
  const y = (v) => 10 + (H - 20) - ((v - min) / span) * (H - 20)
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')
  const first = data[0], last = data[data.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="Gráfico de línea" style={{ width: '100%', height: 'auto' }}>
      <line x1={left} y1={H} x2={W} y2={H} stroke="var(--line)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.value)} r="2.5" fill={color}><title>{`${d.label}: ${d.value}`}</title></circle>)}
      <text x="2" y="14" fontSize="10" fill="var(--slate)">{max}</text>
      <text x="2" y={H - 2} fontSize="10" fill="var(--slate)">{min}</text>
      <text x={left} y={H + 16} fontSize="10" fill="var(--slate)">{first?.label}</text>
      <text x={W - 6} y={H + 16} fontSize="10" textAnchor="end" fill="var(--slate)">{last?.label} · {last?.value}</text>
    </svg>
  )
}

export function HBars({ items, empty = 'Todavía no hay datos.' }) {
  if (!items.length) return <p><small>{empty}</small></p>
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="hb">
      {items.map((i) => (
        <div className="hbrow" key={i.label}>
          <span>{i.label}</span>
          <span className="hbbar"><i style={{ width: `${(i.value / max) * 100}%` }} /></span>
          <b>{i.value}</b>
        </div>
      ))}
    </div>
  )
}

export function PeriodTabs({ base, current, extra = '' }) {
  return (
    <div className="tabs">
      {[7, 30, 90].map((d) => <Link key={d} href={`${base}?dias=${d}${extra}`} className={`abtn sm ${d === current ? '' : 'alt'}`}>{d} días</Link>)}
    </div>
  )
}
