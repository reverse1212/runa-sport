import ExcelJS from 'exceljs'

export async function toXlsx(sheetName, columns, rows) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName)
  ws.columns = columns.map(([header, key, width]) => ({ header, key, width: width || 20 }))
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  rows.forEach((r) => ws.addRow(r))
  return Buffer.from(await wb.xlsx.writeBuffer())
}
