import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import HeicImage from '../components/HeicImage'
import SignaturePad from '../components/SignaturePad'
import { isHeic, heicUrlToJpegUrl } from '../lib/heic'
import logoImg from '../assets/logo.jpeg'

// ── helpers de fecha ──────────────────────────────────────────────────────────

const toISO = (d) => d.toISOString().split('T')[0]

const lunesDe = (d) => {
  const c = new Date(d)
  const dow = c.getDay() || 7
  c.setDate(c.getDate() - dow + 1)
  c.setHours(0, 0, 0, 0)
  return c
}

const domingoDE = (lunes) => {
  const d = new Date(lunes)
  d.setDate(d.getDate() + 6)
  return d
}

const primerDiaMes = (d) => {
  const c = new Date(d)
  c.setDate(1)
  c.setHours(0, 0, 0, 0)
  return c
}

const ultimoDiaMes = (d) => {
  const c = new Date(d)
  c.setMonth(c.getMonth() + 1, 0)
  c.setHours(0, 0, 0, 0)
  return c
}

const capitalizar = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const INF_ICON = {
  registros:    'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  horas:        'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  trabajadores: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  promedio:     'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z',
}

// ── estilos Excel (xlsx-js-style) ─────────────────────────────────────────────
const XL_NAVY = '12123A'
const XL_ORANGE = 'E8962E'
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
function buildStyledSheet(XLSX, { title, subtitle, headers, rows, colWidths, centerCols = [], totals }) {
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

const nH = (h) => (h % 1 === 0 ? h : +h.toFixed(1))

const XL_DET_HEADERS = ['Fecha', 'Hora', 'OT', 'Trabajador', 'Tipo', 'Tarea', 'Equipo', 'Planta', 'Aviso SAP', 'Descripción', 'Material', 'Horas', 'Estado', 'GPS', 'Revisado por', 'Fotos']
const XL_DET_WIDTHS = [11, 7, 12, 20, 18, 34, 24, 20, 12, 34, 26, 8, 16, 22, 18, 7]
const XL_DET_CENTER = [1, 11, 15]
const detRow = (r) => [
  fmtFecha(r.fecha), r.hora?.slice(0, 5) || '', r.ot || '', r.trabajador_nombre || '',
  r.tipo_trabajo || '', r.tarea || '', r.equipo_intervenido || '', r.planta || '',
  r.aviso_sap || '', r.descripcion || '', r.material_utilizado || '',
  r.horas_trabajadas ?? '', r.estado || '', r.ubicacion_texto || '', r.revisado_por || '',
  r.fotos?.length || 0,
]

function InfKpi({ value, label, color, icon }) {
  return (
    <div className="inf-kpi" style={{ borderColor: `${color}33` }}>
      <span className="inf-kpi-accent" style={{ background: color }} />
      <span className="inf-kpi-icon" style={{ background: `${color}22` }}>
        <svg viewBox="0 0 24 24" style={{ fill: color }}><path d={icon} /></svg>
      </span>
      <div className="inf-kpi-body">
        <div className="inf-kpi-val" style={{ color }}>{value}</div>
        <div className="inf-kpi-lbl">{label}</div>
      </div>
    </div>
  )
}

const fmtFecha = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const fmtShort = (d) =>
  d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', '')

// ── geocodificación inversa (Nominatim) ──────────────────────────────────────
const _geoCache = new Map()
const _coordRe = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/
async function resolverUbicacion(val) {
  if (!val) return val
  const m = val.trim().match(_coordRe)
  if (!m) return val
  const key = `${m[1]},${m[2]}`
  if (_geoCache.has(key)) return _geoCache.get(key)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${m[1]}&lon=${m[2]}&accept-language=es`,
      { headers: { 'User-Agent': 'DAIG-Informe/1.0 (daigchile.cl)' } }
    )
    const data = await res.json()
    const a = data.address || {}
    const nombre = a.suburb || a.quarter || a.neighbourhood ||
                   a.city || a.town || a.village || a.county || val
    _geoCache.set(key, nombre)
    return nombre
  } catch { return val }
}

// ── componente principal ──────────────────────────────────────────────────────

export default function InformeManager() {
  const [modo, setModo] = useState('semana') // 'semana' | 'mes'
  const [lunes, setLunes] = useState(() => lunesDe(new Date()))
  const [mesAncla, setMesAncla] = useState(() => primerDiaMes(new Date()))
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedWorker, setExpandedWorker] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [exportingWorker, setExportingWorker] = useState(null)

  const esMes = modo === 'mes'
  const domingo = domingoDE(lunes)
  const rangoDesde = esMes ? primerDiaMes(mesAncla) : lunes
  const rangoHasta = esMes ? ultimoDiaMes(mesAncla) : domingo
  const desdeISO = toISO(rangoDesde)
  const hastaISO = toISO(rangoHasta)

  const esPeriodoActual = esMes
    ? toISO(primerDiaMes(new Date())) === toISO(primerDiaMes(mesAncla))
    : toISO(lunesDe(new Date())) === toISO(lunes)

  // ── carga ─────────────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    setLoading(true)
    setExpandedWorker(null)
    const { data } = await supabase
      .from('registros_trabajo')
      .select('*')
      .gte('fecha', desdeISO)
      .lte('fecha', hastaISO)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
    setRegistros(data || [])
    setLoading(false)
  }, [desdeISO, hastaISO])

  useEffect(() => { cargar() }, [cargar])

  // ── navegación de semana ──────────────────────────────────────────────────

  const irAnterior = () => {
    if (esMes) { const d = new Date(mesAncla); d.setMonth(d.getMonth() - 1); setMesAncla(primerDiaMes(d)) }
    else { const d = new Date(lunes); d.setDate(d.getDate() - 7); setLunes(d) }
  }
  const irSiguiente = () => {
    if (esMes) { const d = new Date(mesAncla); d.setMonth(d.getMonth() + 1); setMesAncla(primerDiaMes(d)) }
    else { const d = new Date(lunes); d.setDate(d.getDate() + 7); setLunes(d) }
  }
  const irActual = () => {
    if (esMes) setMesAncla(primerDiaMes(new Date()))
    else setLunes(lunesDe(new Date()))
  }

  // ── métricas globales ─────────────────────────────────────────────────────

  const totalHoras = registros.reduce((s, r) => s + (r.horas_trabajadas || 0), 0)
  const trabajadoresActivos = new Set(registros.map(r => r.trabajador_id)).size

  const porTipo = registros.reduce((acc, r) => {
    const t = r.tipo_trabajo || 'Sin tipo'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  const porEstado = registros.reduce((acc, r) => {
    const e = r.estado || 'Sin estado'
    acc[e] = (acc[e] || 0) + 1
    return acc
  }, {})

  // ── agrupación por trabajador ─────────────────────────────────────────────

  const porTrabajador = Object.values(
    registros.reduce((acc, r) => {
      const id = r.trabajador_id || 'unknown'
      if (!acc[id]) {
        acc[id] = {
          id,
          nombre: r.trabajador_nombre || 'Desconocido',
          registros: [],
          horas: 0,
          tipos: new Set(),
          plantas: new Set(),
          equipos: new Set(),
        }
      }
      acc[id].registros.push(r)
      acc[id].horas += r.horas_trabajadas || 0
      if (r.tipo_trabajo) acc[id].tipos.add(r.tipo_trabajo)
      if (r.planta) acc[id].plantas.add(r.planta)
      if (r.equipo_intervenido) acc[id].equipos.add(r.equipo_intervenido)
      return acc
    }, {})
  ).sort((a, b) => b.horas - a.horas)

  // ── exportar Excel ────────────────────────────────────────────────────────

  const loadXLSX = async () => {
    const mod = await import('xlsx-js-style')
    return mod.default || mod
  }

  // Exporta TODO el período (resumen por trabajador + detalle), estilizado.
  const handleExport = async () => {
    if (!registros.length) return
    setExporting(true)
    try {
      const XLSX = await loadXLSX()
      const periodo = `${fmtFecha(desdeISO)} al ${fmtFecha(hastaISO)}`
      const tipoTxt = esMes ? 'mensual' : 'semanal'
      const wb = XLSX.utils.book_new()

      const wsRes = buildStyledSheet(XLSX, {
        title: `Resumen ${tipoTxt} de actividades`,
        subtitle: `DAIG SpA · ${periodo}`,
        headers: ['Trabajador', 'N° Registros', 'Horas', 'Tipos de trabajo', 'Plantas', 'Equipos'],
        colWidths: [24, 13, 10, 32, 26, 32],
        centerCols: [1, 2],
        rows: porTrabajador.map(w => [
          w.nombre, w.registros.length, nH(w.horas),
          [...w.tipos].join(', '), [...w.plantas].join(', '), [...w.equipos].join(', '),
        ]),
        totals: ['TOTAL', registros.length, nH(totalHoras), '', '', ''],
      })
      XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen')

      const wsDet = buildStyledSheet(XLSX, {
        title: `Detalle ${tipoTxt} de registros`,
        subtitle: `DAIG SpA · ${periodo}`,
        headers: XL_DET_HEADERS,
        colWidths: XL_DET_WIDTHS,
        centerCols: XL_DET_CENTER,
        rows: registros.map(detRow),
      })
      XLSX.utils.book_append_sheet(wb, wsDet, 'Detalle')

      XLSX.writeFile(wb, `informe_${tipoTxt}_${desdeISO}_al_${hastaISO}.xlsx`)
    } catch (e) {
      alert('Error al exportar: ' + e.message)
    }
    setExporting(false)
  }

  // Exporta el Excel de UN solo trabajador (sus registros del período).
  const exportWorkerExcel = async (worker) => {
    setExportingWorker(worker.id)
    try {
      const XLSX = await loadXLSX()
      const periodo = `${fmtFecha(desdeISO)} al ${fmtFecha(hastaISO)}`
      const tipoTxt = esMes ? 'mensual' : 'semanal'
      const wb = XLSX.utils.book_new()

      const ws = buildStyledSheet(XLSX, {
        title: `${worker.nombre} — Informe ${tipoTxt}`,
        subtitle: `DAIG SpA · ${periodo} · ${worker.registros.length} ${worker.registros.length === 1 ? 'registro' : 'registros'} · ${nH(worker.horas)} h`,
        headers: XL_DET_HEADERS,
        colWidths: XL_DET_WIDTHS,
        centerCols: XL_DET_CENTER,
        rows: worker.registros.map(detRow),
        totals: ['', '', '', '', '', '', '', '', '', '', 'TOTAL', nH(worker.horas), '', '', '', worker.registros.reduce((s, r) => s + (r.fotos?.length || 0), 0)],
      })
      XLSX.utils.book_append_sheet(wb, ws, 'Detalle')

      const nombre = worker.nombre.replace(/\s+/g, '-')
      XLSX.writeFile(wb, `Informe-${nombre}-${desdeISO}.xlsx`)
    } catch (e) {
      alert('Error al exportar: ' + e.message)
    }
    setExportingWorker(null)
  }

  // ── estado de pill ────────────────────────────────────────────────────────

  const estadoColor = (e) =>
    ['Terminado', 'Completado'].includes(e) ? '#22c55e'
    : ['En Proceso', 'En progreso'].includes(e) ? '#3b82f6'
    : '#f59e0b'

  // ── generar informe PDF (ventana imprimible) ──────────────────────────────

  const [generando, setGenerando] = useState(null) // trabajador_id en curso

  // Firma del supervisor para incrustar en los PDF (se guarda en este dispositivo)
  const [firma, setFirma] = useState(() => {
    try { return localStorage.getItem('daig_firma_informe') || null } catch { return null }
  })
  const [showFirma, setShowFirma] = useState(false)
  const guardarFirma = (dataUrl) => {
    try {
      if (dataUrl) localStorage.setItem('daig_firma_informe', dataUrl)
      else localStorage.removeItem('daig_firma_informe')
    } catch { /* almacenamiento no disponible */ }
    setFirma(dataUrl)
    setShowFirma(false)
  }

  const generarInforme = async (worker) => {
    setGenerando(worker.id)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const logoUrl = window.location.origin + logoImg
      const periodo = `${fmtFecha(desdeISO)} al ${fmtFecha(hastaISO)}`
      const tituloTipo = esMes ? 'MENSUALES' : 'SEMANALES'
      const tituloTipoCap = esMes ? 'Mensuales' : 'Semanales'
      const equipos = [...worker.equipos].join(', ') || '—'
      const estados = [...new Set(worker.registros.map(r => r.estado).filter(Boolean))].join(', ') || '—'

      // Resolver fotos HEIC a URLs mostrables
      const regsConFotos = await Promise.all(worker.registros.map(async (r) => {
        if (!r.fotos?.length) return { ...r, fotosResueltas: [] }
        const fotosResueltas = await Promise.all(r.fotos.map(async (url) => {
          try {
            return isHeic(url) ? await heicUrlToJpegUrl(url) : url
          } catch { return null }
        }))
        return { ...r, fotosResueltas: fotosResueltas.filter(Boolean) }
      }))

      // Geocodificar ubicaciones (convierte coordenadas a nombre de lugar)
      const geoMap = new Map()
      for (const r of regsConFotos) {
        if (r.planta && !geoMap.has(r.planta)) {
          geoMap.set(r.planta, await resolverUbicacion(r.planta))
        }
      }
      const regsGeo = regsConFotos.map(r => ({ ...r, plantaNombre: geoMap.get(r.planta) || r.planta }))
      const plantas = [...new Set(regsGeo.map(r => r.plantaNombre).filter(Boolean))].join(', ') || '—'

      const filaActividades = regsGeo.map((r, i) => `
        <tr>
          <td style="text-align:center;font-weight:700">${i + 1}</td>
          <td>${fmtFecha(r.fecha)}</td>
          <td>${r.tipo_trabajo || '—'}</td>
          <td>
            <strong>${r.tarea || ''}</strong>
            ${r.equipo_intervenido ? `<br><span style="color:#6b6b8a;font-size:0.82em">${r.equipo_intervenido}</span>` : ''}
          </td>
          <td>${r.estado || '—'}</td>
          <td style="text-align:right">${r.horas_trabajadas != null ? r.horas_trabajadas + ' h' : '—'}</td>
        </tr>`).join('')

      const tarjetasTrabajo = regsGeo.map((r, i) => {
        const campos = [
          r.ot            && `<div class="trab-campo"><span class="lbl">OT:</span> ${r.ot}</div>`,
          r.descripcion   && `<div class="trab-campo"><span class="lbl">Descripción:</span> ${r.descripcion}</div>`,
          r.material_utilizado && `<div class="trab-campo"><span class="lbl">Material utilizado:</span> ${r.material_utilizado}</div>`,
          r.plantaNombre  && `<div class="trab-campo"><span class="lbl">Planta / lugar:</span> ${r.plantaNombre}</div>`,
          r.aviso_sap     && `<div class="trab-campo"><span class="lbl">Aviso SAP:</span> ${r.aviso_sap}</div>`,
        ].filter(Boolean).join('')

        const fotoGrid = r.fotosResueltas.length > 0 ? `
          <div class="foto-grid">
            ${r.fotosResueltas.map((url, fi) => `
              <div class="foto-item">
                <img src="${url}" alt="Foto ${fi + 1}" onerror="this.parentElement.style.display='none'">
              </div>`).join('')}
          </div>` : ''

        return `
          <div class="trabajo-card">
            <div class="trabajo-header">
              <span class="trab-num">#${i + 1}</span>
              <span class="trab-tarea">${r.tarea || 'Sin descripción'}</span>
              <span class="trab-meta">${fmtFecha(r.fecha)}${r.hora ? ' · ' + r.hora.slice(0, 5) : ''} · ${r.tipo_trabajo || ''}</span>
            </div>
            <div class="trabajo-body">
              ${campos}
              ${fotoGrid}
            </div>
          </div>`
      }).join('')

      const css = `
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;font-size:11pt;background:#fff}
        :root{--navy:#12123a;--orange:#f5a623}
        .portada{height:1122px;display:flex;flex-direction:column;justify-content:center;
          align-items:center;text-align:center;background:#12123a;color:#fff;padding:3rem;position:relative}
        .portada-logo{width:90px;height:90px;object-fit:contain;border-radius:12px;margin-bottom:1.75rem}
        .portada-empresa{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;
          color:rgba(255,255,255,.5);margin-bottom:.3rem}
        .portada-sub{font-size:.8rem;color:rgba(255,255,255,.4);margin-bottom:2.5rem}
        .portada-titulo{font-size:2.4rem;font-weight:900;line-height:1.1;letter-spacing:-.02em}
        .portada-divider{width:56px;height:4px;background:#f5a623;border-radius:2px;margin:1.4rem auto}
        .portada-trabajador{font-size:1.5rem;font-weight:700;color:#f5a623}
        .portada-periodo{font-size:.95rem;color:rgba(255,255,255,.65);margin-top:.4rem}
        .portada-plantas{font-size:.8rem;color:rgba(255,255,255,.4);margin-top:.3rem}
        .portada-footer{position:absolute;bottom:1.75rem;font-size:.7rem;color:rgba(255,255,255,.25)}
        .inner-page{padding:0}
        .page-break{page-break-before:always;padding-top:0}
        .inner-header{display:flex;align-items:center;justify-content:space-between;
          padding-bottom:.65rem;border-bottom:3px solid #f5a623;margin-bottom:1.5rem}
        .ih-brand{display:flex;align-items:center;gap:.5rem}
        .ih-brand img{height:30px;border-radius:4px}
        .ih-brand span{font-weight:900;font-size:.95rem;color:#12123a}
        .ih-right{font-size:.72rem;color:#9a9ab0;text-align:right;line-height:1.4}
        .seccion{margin-bottom:2rem}
        .sec-titulo{font-size:.95rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;
          color:#12123a;border-left:4px solid #f5a623;padding:.45rem .75rem;
          background:#f8f8fc;margin-bottom:1rem}
        .sec-num{color:#f5a623;margin-right:.35rem}
        .tabla-datos{width:100%;border-collapse:collapse;margin-bottom:1.25rem;font-size:.88rem}
        .tabla-datos td{padding:7px 12px;border:1px solid #e0e0ec;vertical-align:top}
        .tabla-datos tr:nth-child(even) td{background:#f8f8fc}
        .tabla-datos td:first-child{font-weight:700;color:#12123a;width:38%;background:#f0f0f8}
        .tabla-act{width:100%;border-collapse:collapse;font-size:.85rem}
        .tabla-act th{background:#12123a;color:#fff;padding:7px 10px;text-align:left;
          font-size:.75rem;letter-spacing:.04em;font-weight:700}
        .tabla-act td{padding:6px 10px;border:1px solid #e0e0ec;vertical-align:top}
        .tabla-act tr:nth-child(even) td{background:#f8f8fc}
        .trabajo-card{border:1px solid #e0e0ec;border-radius:8px;margin-bottom:1.25rem;overflow:hidden}
        .trabajo-header{background:#12123a;color:#fff;padding:.65rem 1rem;
          display:flex;align-items:baseline;gap:.85rem;flex-wrap:wrap}
        .trab-num{font-weight:900;font-size:1rem;color:#f5a623;flex-shrink:0}
        .trab-tarea{font-weight:700;flex:1;font-size:.9rem}
        .trab-meta{font-size:.75rem;color:rgba(255,255,255,.6)}
        .trabajo-body{padding:.85rem 1rem}
        .trab-campo{margin-bottom:.35rem;font-size:.85rem;line-height:1.4}
        .lbl{font-weight:700;color:#12123a}
        .foto-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:.75rem}
        .foto-item img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:5px;
          border:1px solid #e0e0ec;display:block}
        .conclusion-box{background:#f8f8fc;border:1px solid #e0e0ec;border-radius:8px;
          padding:1.4rem;line-height:1.75;font-size:.9rem;margin-bottom:2.5rem}
        .firma{text-align:center;margin-top:3rem}
        .firma-linea{width:200px;height:1px;background:#333;margin:0 auto .5rem}
        .firma-nombre{font-weight:700;font-size:1rem}
        .firma-cargo{color:#6b6b8a;font-size:.85rem;margin-top:.15rem}
        .firma-contacto{color:#9a9ab0;font-size:.75rem;margin-top:.15rem}
      `

      const htmlContent = `
  <!-- ── PORTADA ── -->
  <div class="portada">
    <img class="portada-logo" src="${logoUrl}" alt="DAIG">
    <div class="portada-empresa">DAIG SpA</div>
    <div class="portada-sub">Ingeniería en Mecánica de Procesos y Mantenimiento Industrial</div>
    <div class="portada-titulo">INFORME DE<br>ACTIVIDADES<br>${tituloTipo}</div>
    <div class="portada-divider"></div>
    <div class="portada-periodo">${periodo}</div>
    ${plantas !== '—' ? `<div class="portada-plantas">${plantas}</div>` : ''}
    <div class="portada-footer">DAIG SpA · daigchile.cl</div>
  </div>

  <!-- ── DATOS + ACTIVIDADES ── -->
  <div class="inner-page page-break">
    <div class="inner-header">
      <div class="ih-brand">
        <img src="${logoUrl}" alt="DAIG">
        <span>DAIG SpA</span>
      </div>
      <div class="ih-right">Informe de Actividades ${tituloTipoCap}<br>${worker.nombre} · ${periodo}</div>
    </div>
    <div class="seccion">
      <div class="sec-titulo"><span class="sec-num">1.</span> DATOS DEL SERVICIO</div>
      <table class="tabla-datos">
        <tr><td>Empresa ejecutora</td><td>DAIG SpA | RUT: 77.702.886-3</td></tr>
        <tr><td>Trabajador</td><td>${worker.nombre}</td></tr>
        <tr><td>Período</td><td>${periodo}</td></tr>
        <tr><td>Total de registros</td><td>${worker.registros.length} ${worker.registros.length === 1 ? 'registro' : 'registros'}</td></tr>
        <tr><td>Estado de actividades</td><td>${estados}</td></tr>
        <tr><td>Plantas / Lugares</td><td>${plantas}</td></tr>
        <tr><td>Equipos intervenidos</td><td>${equipos !== '—' ? equipos : '—'}</td></tr>
      </table>
    </div>
    <div class="seccion">
      <div class="sec-titulo"><span class="sec-num">2.</span> ACTIVIDADES REALIZADAS</div>
      <table class="tabla-act">
        <thead><tr>
          <th style="width:40px">N°</th>
          <th style="width:80px">Fecha</th>
          <th style="width:130px">Tipo</th>
          <th>Tarea / Equipo</th>
          <th style="width:110px">Estado</th>
          <th style="width:50px;text-align:right">Hrs</th>
        </tr></thead>
        <tbody>${filaActividades}</tbody>
      </table>
    </div>
  </div>

  <!-- ── DETALLE Y FOTOS ── -->
  <div class="inner-page page-break">
    <div class="inner-header">
      <div class="ih-brand">
        <img src="${logoUrl}" alt="DAIG">
        <span>DAIG SpA</span>
      </div>
      <div class="ih-right">Registro Fotográfico<br>${worker.nombre} · ${periodo}</div>
    </div>
    <div class="seccion">
      <div class="sec-titulo"><span class="sec-num">3.</span> DETALLE DE TRABAJOS Y REGISTRO FOTOGRÁFICO</div>
      ${tarjetasTrabajo}
    </div>
  </div>

  <!-- ── CONCLUSIÓN ── -->
  <div class="inner-page page-break">
    <div class="inner-header">
      <div class="ih-brand">
        <img src="${logoUrl}" alt="DAIG">
        <span>DAIG SpA</span>
      </div>
      <div class="ih-right">Conclusión<br>${worker.nombre} · ${periodo}</div>
    </div>
    <div class="seccion">
      <div class="sec-titulo"><span class="sec-num">4.</span> CONCLUSIÓN Y ESTADO FINAL</div>
      <div class="conclusion-box">
        Las actividades de mantención e intervención fueron ejecutadas durante el período
        comprendido entre el ${periodo} por el técnico <strong>${worker.nombre}</strong>,
        completando un total de <strong>${worker.registros.length} ${worker.registros.length === 1 ? 'registro' : 'registros'}</strong>.
        ${[...worker.plantas].length > 0 ? `Los trabajos se realizaron en: <strong>${plantas}</strong>.` : ''}
        ${[...worker.equipos].length > 0 ? ` Los equipos intervenidos incluyeron: ${equipos}.` : ''}
      </div>
      <div class="firma">
        ${firma ? `<img src="${firma}" alt="Firma" style="height:70px;object-fit:contain;display:block;margin:0 auto 2px" />` : ''}
        <div class="firma-linea"></div>
        <div class="firma-nombre">Daniel Mena Vega</div>
        <div class="firma-cargo">Representante Legal · DAIG SpA</div>
        <div class="firma-contacto">daniel.mena@serviciosdaig.com | +56 9 8868 9400</div>
      </div>
    </div>
  </div>`

      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;top:-99999px;left:-99999px;width:794px'
      const style = document.createElement('style')
      style.textContent = css
      container.appendChild(style)
      const content = document.createElement('div')
      content.innerHTML = htmlContent
      container.appendChild(content)
      document.body.appendChild(container)

      const nombre = worker.nombre.replace(/\s+/g, '-')
      await html2pdf().set({
        margin: [15, 20, 15, 20],
        filename: `Informe-${nombre}-${desdeISO}.pdf`,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '.page-break' },
      }).from(container).save()

      document.body.removeChild(container)
    } catch (e) {
      alert('Error al generar informe: ' + e.message)
    }
    setGenerando(null)
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="inf-root">

      {showFirma && (
        <SignaturePad initial={firma} onSave={guardarFirma} onClose={() => setShowFirma(false)} />
      )}

      {/* ── cabecera de periodo ── */}
      <div className="inf-week-bar">
        <div className="inf-modo-toggle">
          <button className={!esMes ? 'active' : ''} onClick={() => setModo('semana')}>Semana</button>
          <button className={esMes ? 'active' : ''} onClick={() => setModo('mes')}>Mes</button>
        </div>

        <button className="inf-week-nav" onClick={irAnterior} title={esMes ? 'Mes anterior' : 'Semana anterior'}>
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>

        <div className="inf-week-label">
          <span className="inf-week-range">
            {esMes
              ? capitalizar(mesAncla.toLocaleDateString('es-CL', { month: 'long' }))
              : `${fmtShort(lunes)} – ${fmtShort(domingo)}`}
          </span>
          <span className="inf-week-year">{(esMes ? mesAncla : lunes).getFullYear()}</span>
          {esPeriodoActual && <span className="inf-week-badge">{esMes ? 'Mes actual' : 'Semana actual'}</span>}
        </div>

        <button className="inf-week-nav" onClick={irSiguiente} title={esMes ? 'Mes siguiente' : 'Semana siguiente'}>
          <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>

        {!esPeriodoActual && (
          <button className="inf-today-btn" onClick={irActual}>Hoy</button>
        )}

        <button className="inf-export-btn" onClick={() => setShowFirma(true)}
          style={firma ? { background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', color: '#4ade80' } : undefined}
          title="Configurar la firma que aparece en los informes PDF">
          <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          {firma ? 'Firma ✓' : 'Firma'}
        </button>
        <button className="inf-export-btn" onClick={handleExport} disabled={exporting || !registros.length}>
          <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          {exporting ? 'Exportando...' : 'Excel'}
        </button>
      </div>

      {loading && (
        <div className="admin-loading" style={{ minHeight: 120 }}>
          <div className="admin-spinner"></div>
        </div>
      )}

      {!loading && registros.length === 0 && (
        <div className="inf-empty">
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
          <p>Sin registros para {esMes ? 'este mes' : 'esta semana'}</p>
          <span>{fmtFecha(desdeISO)} al {fmtFecha(hastaISO)}</span>
        </div>
      )}

      {!loading && registros.length > 0 && (
        <>
          {/* ── KPIs ── */}
          <div className="inf-kpi-row">
            <InfKpi color="#f5a623" icon={INF_ICON.registros} label="Registros"
              value={registros.length} />
            <InfKpi color="#8b5cf6" icon={INF_ICON.horas} label="Horas totales"
              value={totalHoras % 1 === 0 ? totalHoras : totalHoras.toFixed(1)} />
            <InfKpi color="#22c55e" icon={INF_ICON.trabajadores} label="Trabajadores activos"
              value={trabajadoresActivos} />
            <InfKpi color="#3b82f6" icon={INF_ICON.promedio} label="Hrs / trabajador"
              value={totalHoras && trabajadoresActivos
                ? (totalHoras / trabajadoresActivos % 1 === 0
                  ? totalHoras / trabajadoresActivos
                  : (totalHoras / trabajadoresActivos).toFixed(1))
                : '—'} />
          </div>

          {/* ── tipo de trabajo y estado ── */}
          <div className="inf-chips-row">
            <div className="inf-chips-group">
              <div className="inf-chips-title">Por tipo de trabajo</div>
              <div className="inf-chips">
                {Object.entries(porTipo)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tipo, n]) => (
                    <span key={tipo} className="inf-chip inf-chip--tipo">
                      {tipo} <b>{n}</b>
                    </span>
                  ))}
              </div>
            </div>
            <div className="inf-chips-group">
              <div className="inf-chips-title">Por estado</div>
              <div className="inf-chips">
                {Object.entries(porEstado)
                  .sort((a, b) => b[1] - a[1])
                  .map(([est, n]) => (
                    <span key={est} className="inf-chip" style={{ borderColor: estadoColor(est) + '66', color: estadoColor(est) }}>
                      {est} <b>{n}</b>
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* ── tabla por trabajador ── */}
          <div className="inf-section-title">Detalle por trabajador</div>
          <div className="inf-worker-list">
            {porTrabajador.map(w => {
              const open = expandedWorker === w.id
              return (
                <div key={w.id} className={`inf-worker-card ${open ? 'inf-worker-card--open' : ''}`}>
                  <button
                    className="inf-worker-header"
                    onClick={() => setExpandedWorker(open ? null : w.id)}
                  >
                    <div className="inf-worker-avatar">
                      {w.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="inf-worker-meta">
                      <span className="inf-worker-name">{w.nombre}</span>
                      <span className="inf-worker-sub">
                        {w.registros.length} {w.registros.length === 1 ? 'registro' : 'registros'}
                        {w.horas > 0 && ` · ${w.horas % 1 === 0 ? w.horas : w.horas.toFixed(1)} hrs`}
                      </span>
                    </div>
                    <div className="inf-worker-tipos">
                      {[...w.tipos].map(t => (
                        <span key={t} className="inf-chip inf-chip--sm">{t}</span>
                      ))}
                    </div>
                    <svg className="inf-chevron" viewBox="0 0 24 24"
                      style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                  </button>

                  {open && (
                    <div className="inf-worker-body">
                      {/* botones de exportación por trabajador */}
                      <div className="inf-worker-actions">
                        <button
                          className="inf-generar-btn"
                          onClick={() => generarInforme(w)}
                          disabled={generando === w.id}
                        >
                          {generando === w.id ? (
                            <><div className="admin-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generando...</>
                          ) : (
                            <><svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 9H7v-2h4v2zm4-4H7v-2h8v2z"/></svg>Informe PDF</>
                          )}
                        </button>
                        <button
                          className="inf-generar-btn inf-generar-btn--excel"
                          onClick={() => exportWorkerExcel(w)}
                          disabled={exportingWorker === w.id}
                        >
                          {exportingWorker === w.id ? (
                            <><div className="admin-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generando...</>
                          ) : (
                            <><svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>Excel</>
                          )}
                        </button>
                      </div>

                      {/* plantas y equipos */}
                      {w.plantas.size > 0 && (
                        <div className="inf-worker-detail-row">
                          <span className="inf-detail-label">Plantas:</span>
                          <span>{[...w.plantas].join(', ')}</span>
                        </div>
                      )}
                      {w.equipos.size > 0 && (
                        <div className="inf-worker-detail-row">
                          <span className="inf-detail-label">Equipos:</span>
                          <span>{[...w.equipos].join(', ')}</span>
                        </div>
                      )}

                      {/* registros del trabajador */}
                      <div className="inf-reg-list">
                        {w.registros.map(r => (
                          <div key={r.id} className="inf-reg-item">
                            <div className="inf-reg-head">
                              <span className="inf-reg-fecha">{fmtFecha(r.fecha)}</span>
                              {r.hora && <span className="inf-reg-hora">{r.hora.slice(0,5)}</span>}
                              {r.estado && (
                                <span className="inf-reg-estado" style={{ color: estadoColor(r.estado), borderColor: estadoColor(r.estado) + '55' }}>
                                  {r.estado}
                                </span>
                              )}
                              {r.horas_trabajadas && (
                                <span className="inf-reg-horas">{r.horas_trabajadas} hrs</span>
                              )}
                            </div>
                            <div className="inf-reg-tarea">{r.tarea}</div>
                            {r.equipo_intervenido && (
                              <div className="inf-reg-equipo">{r.equipo_intervenido}</div>
                            )}
                            {r.descripcion && (
                              <div className="inf-reg-desc">{r.descripcion}</div>
                            )}
                            {r.material_utilizado && (
                              <div className="inf-reg-material">
                                <span>Material: </span>{r.material_utilizado}
                              </div>
                            )}
                            {r.ot && (
                              <div className="inf-reg-sap">OT: {r.ot}</div>
                            )}
                            {r.aviso_sap && (
                              <div className="inf-reg-sap">SAP: {r.aviso_sap}</div>
                            )}
                            {r.fotos?.length > 0 && (
                              <div className="inf-reg-fotos">
                                {r.fotos.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                    <HeicImage src={url} alt={`foto-${i+1}`} className="inf-reg-foto-thumb" />
                                  </a>
                                ))}
                              </div>
                            )}
                            {r.revisado_por && (
                              <div className="inf-reg-revisado">
                                ✓ Revisado por {r.revisado_por}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
