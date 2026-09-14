// Función PROGRAMADA (ver schedule en netlify.toml): envía cada lunes un
// resumen de la actividad de la semana anterior al supervisor.
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import XLSX from 'xlsx-js-style'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const resend = new Resend(process.env.RESEND_API_KEY)

const DEST_EMAILS = (process.env.WEEKLY_DIGEST_EMAIL || process.env.NOTIFY_REGISTRO_EMAIL || 'daniel.mena@serviciosdaig.com, lasercncdaig@gmail.com')
  .split(/[,;]/)
  .map((e) => e.trim())
  .filter(Boolean)
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'daigchile.cl'
const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || `https://${SITE_DOMAIN}/logo.jpeg`

const iso = (d) => d.toISOString().split('T')[0]
const fmt = (isoStr) => { const [y, m, d] = isoStr.split('-'); return `${d}/${m}/${y}` }
const nH = (h) => (h % 1 === 0 ? h : +h.toFixed(1))

// ── estilos Excel (mismos que InformeManager) ────────────────────────────────
const XL_NAVY   = '12123A'
const XL_ORANGE = 'E8962E'
const XL_LIGHT  = 'F4F4FA'
const XL_BORDER = 'D9D9E3'
const xlBorder  = { style: 'thin', color: { rgb: XL_BORDER } }
const ALL_B     = { top: xlBorder, bottom: xlBorder, left: xlBorder, right: xlBorder }
const XL_TITLE  = { font: { bold: true, sz: 15, color: { rgb: XL_NAVY } } }
const XL_SUB    = { font: { sz: 10, color: { rgb: '7A7A8C' } } }
const XL_HEADER = { font: { bold: true, sz: 10.5, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: XL_NAVY } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: ALL_B }
const xlCell    = (alt) => ({ font: { sz: 10, color: { rgb: '1A1A2E' } }, alignment: { vertical: 'top', wrapText: true }, border: ALL_B, ...(alt ? { fill: { fgColor: { rgb: XL_LIGHT } } } : {}) })
const xlCellC   = (alt) => ({ ...xlCell(alt), alignment: { vertical: 'top', horizontal: 'center', wrapText: true } })
const XL_TOTAL  = { font: { bold: true, sz: 10.5, color: { rgb: XL_NAVY } }, fill: { fgColor: { rgb: 'ECECF6' } }, border: ALL_B }

function buildSheet({ title, subtitle, headers, rows, colWidths, centerCols = [], totals }) {
  const lastCol = headers.length - 1
  const aoa = [[title], [subtitle], [], headers]
  rows.forEach((r) => aoa.push(r))
  const totalRow = totals ? aoa.length : -1
  if (totals) aoa.push(totals)
  const headerRow = 3

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
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: headerRow, c: 0 }, e: { r: headerRow + rows.length, c: lastCol } }) }

  set(0, 0, XL_TITLE)
  set(1, 0, XL_SUB)
  headers.forEach((_, c) => set(headerRow, c, XL_HEADER))
  rows.forEach((_, ri) => {
    const r = headerRow + 1 + ri
    headers.forEach((_, c) => set(r, c, centerCols.includes(c) ? xlCellC(ri % 2 === 1) : xlCell(ri % 2 === 1)))
  })
  if (totals) headers.forEach((_, c) => set(totalRow, c, XL_TOTAL))
  return ws
}

export const handler = async () => {
  if (!SERVICE_ROLE_KEY) {
    console.error('weekly-digest: falta SUPABASE_SERVICE_ROLE_KEY')
    return { statusCode: 500, body: 'config' }
  }

  let fromEmail
  try { fromEmail = getFromEmail() } catch (e) {
    console.error('weekly-digest: remitente Resend no configurado', e)
    return { statusCode: 500, body: 'from' }
  }

  // Rango: los 7 días anteriores a hoy (semana recién terminada).
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const desde = new Date(hoy); desde.setDate(hoy.getDate() - 7)
  const hasta = new Date(hoy); hasta.setDate(hoy.getDate() - 1)
  const desdeISO = iso(desde), hastaISO = iso(hasta)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('registros_trabajo')
    .select('trabajador_nombre, estado, horas_trabajadas, fecha, hora, ot, tipo_trabajo, tarea, equipo_intervenido, planta, aviso_sap, descripcion, material_utilizado, ubicacion_texto, revisado_por, fotos')
    .gte('fecha', desdeISO)
    .lte('fecha', hastaISO)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  if (error) {
    console.error('weekly-digest: error consultando registros', error.message)
    return { statusCode: 500, body: 'query' }
  }

  const regs = data || []
  const totalHoras = regs.reduce((s, r) => s + (r.horas_trabajadas || 0), 0)

  const porTrab = {}
  const porEstado = {}
  for (const r of regs) {
    const n = r.trabajador_nombre || 'Sin nombre'
    porTrab[n] = porTrab[n] || { count: 0, horas: 0 }
    porTrab[n].count++; porTrab[n].horas += r.horas_trabajadas || 0
    const e = r.estado || 'Sin estado'
    porEstado[e] = (porEstado[e] || 0) + 1
  }
  const trabajadores = Object.keys(porTrab).length
  const filasTrab = Object.entries(porTrab).sort((a, b) => b[1].count - a[1].count)
  const filasEstado = Object.entries(porEstado).sort((a, b) => b[1] - a[1])

  // ── generar Excel ───────────────────────────────────────────────────────────
  const periodo = `${fmt(desdeISO)} al ${fmt(hastaISO)}`
  const wb = XLSX.utils.book_new()

  // Hoja 1: Resumen por trabajador
  const wsRes = buildSheet({
    title: 'Resumen semanal de actividades',
    subtitle: `DAIG SpA · ${periodo}`,
    headers: ['Trabajador', 'Registros', 'Horas'],
    rows: filasTrab.map(([n, v]) => [n, v.count, nH(v.horas)]),
    colWidths: [28, 12, 12],
    centerCols: [1, 2],
    totals: ['TOTAL', regs.length, nH(totalHoras)],
  })
  XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen')

  // Hoja 2: Detalle de todos los registros
  if (regs.length > 0) {
    const wsDet = buildSheet({
      title: 'Detalle semanal de registros',
      subtitle: `DAIG SpA · ${periodo}`,
      headers: ['Fecha', 'Hora', 'OT', 'Trabajador', 'Tipo', 'Tarea', 'Equipo', 'Planta', 'Aviso SAP', 'Descripción', 'Material', 'Horas', 'Estado', 'GPS', 'Revisado por', 'Fotos'],
      rows: regs.map((r) => [
        fmt(r.fecha), r.hora?.slice(0, 5) || '', r.ot || '', r.trabajador_nombre || '',
        r.tipo_trabajo || '', r.tarea || '', r.equipo_intervenido || '', r.planta || '',
        r.aviso_sap || '', r.descripcion || '', r.material_utilizado || '',
        r.horas_trabajadas || '', r.estado || '', r.ubicacion_texto || '',
        r.revisado_por || '', r.fotos?.length || 0,
      ]),
      colWidths: [11, 7, 12, 20, 18, 34, 24, 20, 12, 34, 26, 8, 16, 22, 18, 7],
      centerCols: [1, 11, 15],
    })
    XLSX.utils.book_append_sheet(wb, wsDet, 'Detalle')
  }

  // Convertir a base64 para el adjunto
  const xlsxBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
  const xlsxFilename = `resumen_semanal_${desdeISO}_al_${hastaISO}.xlsx`

  // ── HTML del correo ─────────────────────────────────────────────────────────
  const html = `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;background:#08080F;color:#fff;padding:32px;border-radius:12px;border:1px solid rgba(232,150,46,0.2)">
      <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(232,150,46,0.2)">
        <img src="${EMAIL_LOGO_URL}" alt="DAIG" style="height:44px" />
        <h2 style="color:#E8962E;margin:12px 0 2px;font-size:1.15rem">Resumen semanal</h2>
        <p style="margin:0;color:#9a9ab0;font-size:0.9rem">${fmt(desdeISO)} al ${fmt(hastaISO)}</p>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:20px">
        ${tile('Registros', regs.length, '#E8962E')}
        ${tile('Horas', nH(totalHoras), '#8b5cf6')}
        ${tile('Trabajadores', trabajadores, '#22c55e')}
      </div>
      ${regs.length === 0 ? `<p style="color:#9a9ab0">No hubo registros esta semana.</p>` : `
      <p style="color:#9a9ab0;font-size:0.8rem;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em">Por trabajador</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px">
        ${filasTrab.map(([n, v]) => `
          <tr>
            <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06)">${escapeHtml(n)}</td>
            <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;color:#cfd2dc">${v.count} reg · ${nH(v.horas)} h</td>
          </tr>`).join('')}
      </table>
      <p style="color:#9a9ab0;font-size:0.8rem;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em">Por estado</p>
      <div>${filasEstado.map(([e, n]) => `<span style="display:inline-block;background:rgba(255,255,255,0.06);border-radius:20px;padding:4px 12px;margin:0 6px 6px 0;font-size:0.85rem">${escapeHtml(e)} · <b>${n}</b></span>`).join('')}</div>
      <p style="margin-top:14px;color:#9a9ab0;font-size:0.85rem">📎 Adjunto: Excel con resumen y detalle completo de la semana.</p>
      `}
      <div style="margin-top:24px;text-align:center">
        <a href="https://${SITE_DOMAIN}/admin/dashboard" style="display:inline-block;background:#E8962E;color:#000;font-weight:700;font-size:0.9rem;padding:12px 28px;border-radius:8px;text-decoration:none">Ver panel completo</a>
      </div>
      <p style="margin-top:24px;font-size:0.75rem;color:#9a9ab0;text-align:center">Resumen automático semanal · ${SITE_DOMAIN}</p>
    </div>`

  try {
    await resend.emails.send({
      from: fromEmail,
      to: DEST_EMAILS,
      subject: `[DAIG] Resumen semanal · ${fmt(desdeISO)} al ${fmt(hastaISO)} · ${regs.length} registros`,
      html,
      attachments: [
        {
          filename: xlsxFilename,
          content: xlsxBase64,
        },
      ],
    })
    return { statusCode: 200, body: 'ok' }
  } catch (err) {
    console.error('weekly-digest: error enviando correo', err)
    return { statusCode: 500, body: 'send' }
  }
}

function tile(label, value, color) {
  return `<div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid ${color}44;border-radius:10px;padding:12px 14px">
    <div style="font-size:1.6rem;font-weight:800;color:${color};line-height:1">${value}</div>
    <div style="font-size:0.75rem;color:#9a9ab0;margin-top:4px">${label}</div>
  </div>`
}

function getFromEmail() {
  const address = process.env.RESEND_FROM_EMAIL || (process.env.NODE_ENV !== 'production' ? 'onboarding@resend.dev' : '')
  if (!address) throw new Error('RESEND_FROM_EMAIL no configurado')
  if (address.includes('<') || address.includes('>')) return address
  const name = process.env.RESEND_FROM_NAME || 'DAIG Web'
  return `${name} <${address}>`
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
