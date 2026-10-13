import { toXlsx } from './xlsx.js'

// Evita inyección de fórmulas al abrir el CSV en Excel.
const csvCell = (v) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"` }

// columns: [[encabezado, clave, ancho]], rows: [{clave: valor}]
export async function tableResponse(format, name, columns, rows) {
  const stamp = new Date().toISOString().slice(0, 10)
  if (format === 'xlsx') {
    return new Response(await toXlsx(name, columns, rows), {
      headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}-${stamp}.xlsx"` },
    })
  }
  const lines = [columns.map((c) => c[0]), ...rows.map((r) => columns.map((c) => r[c[1]]))]
  return new Response('\uFEFF' + lines.map((l) => l.map(csvCell).join(';')).join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}-${stamp}.csv"` },
  })
}
