// Utilidades compartidas para generar hojas Excel con la marca DAIG
// usando xlsx-js-style (carga diferida).

export const loadXLSX = async () => {
  const mod = await import('xlsx-js-style')
  return mod.default || mod
}

const XL_NAVY = '12123A'
const XL_LIGHT = 'F4F4FA'
const XL_BORDER = 'D9D9E3'
const xlBorderSide = { style: 'thin', color: { rgb: XL_BORDER } }
const XL_ALL_BORDERS = { top: xlBorderSide, bottom: xlBorderSide, left: xlBorderSide, right: xlBorderSide }
const XL_TITLE = { font: { bold: true, sz: 15, color: { rgb: XL_NAVY } } }
const XL_SUB = { font: { sz: 10, color: { rgb: '7A7A8C' } } }
const XL_HEADER = {
  font: { bold: true, sz: 10.5, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: XL_NAVY } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: XL_ALL_BORDERS,
}
const xlCell = (alt, extra = {}) => ({
  font: { sz: 10, color: { rgb: '1A1A2E' } },
  alignment: { vertical: 'top', wrapText: true },
  border: XL_ALL_BORDERS,
  ...(alt ? { fill: { fgColor: { rgb: XL_LIGHT } } } : {}),
  ...extra,
})
const XL_TOTAL = {
  font: { bold: true, sz: 10.5, color: { rgb: XL_NAVY } },
  fill: { fgColor: { rgb: 'ECECF6' } },
  border: XL_ALL_BORDERS,
}

// Construye una hoja con encabezado de marca, título, tabla estilizada,
// autofiltro y (opcional) fila de totales. `rows` son arrays de celdas.
export function buildStyledSheet(XLSX, { title, subtitle, headers, rows, colWidths, centerCols = [], totals }) {
  const lastCol = headers.length - 1
  const aoa = [[title], [subtitle], []]
  const headerRow = aoa.length
  aoa.push(headers)
  rows.forEach((r) => aoa.push(r))
  const totalRow = totals ? aoa.length : -1
  if (totals) aoa.push(totals)

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const set = (r, c, s) => {
    const addr = XLSX.utils.encode_cell({ r, c })
    if (!ws[addr]) ws[addr] = { t: 's', v: '' }
    ws[addr].s = s
  }

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ]
  ws['!cols'] = colWidths.map((w) => ({ wch: w }))
  ws['!rows'] = []
  ws['!rows'][0] = { hpt: 22 }
  ws['!rows'][headerRow] = { hpt: 26 }
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: headerRow, c: 0 }, e: { r: headerRow + rows.length, c: lastCol } }),
  }

  set(0, 0, XL_TITLE)
  set(1, 0, XL_SUB)
  headers.forEach((_, c) => set(headerRow, c, XL_HEADER))
  rows.forEach((_, ri) => {
    const r = headerRow + 1 + ri
    headers.forEach((_, c) => {
      set(r, c, xlCell(ri % 2 === 1, centerCols.includes(c) ? { alignment: { vertical: 'top', horizontal: 'center', wrapText: true } } : {}))
    })
  })
  if (totals) headers.forEach((_, c) => set(totalRow, c, XL_TOTAL))
  return ws
}
