import React, { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import HeicImage from '../components/HeicImage'
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

const fmtFecha = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const fmtShort = (d) =>
  d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', '')

// ── componente principal ──────────────────────────────────────────────────────

export default function InformeManager() {
  const [lunes, setLunes] = useState(() => lunesDe(new Date()))
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedWorker, setExpandedWorker] = useState(null)
  const [exporting, setExporting] = useState(false)

  const domingo = domingoDE(lunes)
  const desdeISO = toISO(lunes)
  const hastaISO = toISO(domingo)

  const esSemanActual = toISO(lunesDe(new Date())) === desdeISO

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

  const semanaAnterior = () => {
    const d = new Date(lunes); d.setDate(d.getDate() - 7); setLunes(d)
  }
  const semanaSiguiente = () => {
    const d = new Date(lunes); d.setDate(d.getDate() + 7); setLunes(d)
  }
  const semanaActual = () => setLunes(lunesDe(new Date()))

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

  const handleExport = async () => {
    if (!registros.length) return
    setExporting(true)
    try {
      const wb = XLSX.utils.book_new()

      // Hoja 1: resumen por trabajador
      const resumen = porTrabajador.map(w => ({
        'Trabajador': w.nombre,
        'N° Registros': w.registros.length,
        'Total Horas': w.horas % 1 === 0 ? w.horas : parseFloat(w.horas.toFixed(1)),
        'Tipos de trabajo': [...w.tipos].join(', '),
        'Plantas': [...w.plantas].join(', '),
        'Equipos': [...w.equipos].join(', '),
      }))
      const wsRes = XLSX.utils.json_to_sheet(resumen)
      wsRes['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 13 }, { wch: 30 }, { wch: 24 }, { wch: 30 }]
      XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen')

      // Hoja 2: detalle de registros
      const detalle = registros.map(r => ({
        'Fecha': r.fecha,
        'Hora': r.hora?.slice(0, 5) || '',
        'Trabajador': r.trabajador_nombre || '',
        'Tipo': r.tipo_trabajo || '',
        'Tarea': r.tarea || '',
        'Equipo': r.equipo_intervenido || '',
        'Planta': r.planta || '',
        'Aviso SAP': r.aviso_sap || '',
        'Descripción': r.descripcion || '',
        'Material': r.material_utilizado || '',
        'Horas': r.horas_trabajadas ?? '',
        'Estado': r.estado || '',
        'GPS': r.ubicacion_texto || '',
        'Revisado por': r.revisado_por || '',
        'N° Fotos': r.fotos?.length || 0,
      }))
      const wsDet = XLSX.utils.json_to_sheet(detalle)
      wsDet['!cols'] = Object.keys(detalle[0] || {}).map(k => ({ wch: Math.max(k.length + 2, 14) }))
      XLSX.utils.book_append_sheet(wb, wsDet, 'Detalle')

      const semStr = `${desdeISO}_al_${hastaISO}`
      XLSX.writeFile(wb, `informe_semanal_${semStr}.xlsx`)
    } catch (e) {
      alert('Error al exportar: ' + e.message)
    }
    setExporting(false)
  }

  // ── estado de pill ────────────────────────────────────────────────────────

  const estadoColor = (e) =>
    ['Terminado', 'Completado'].includes(e) ? '#22c55e'
    : ['En Proceso', 'En progreso'].includes(e) ? '#3b82f6'
    : '#f59e0b'

  // ── generar informe PDF (ventana imprimible) ──────────────────────────────

  const [generando, setGenerando] = useState(null) // trabajador_id en curso

  const generarInforme = async (worker) => {
    setGenerando(worker.id)
    try {
      const logoUrl = window.location.origin + logoImg
      const periodo = `${fmtFecha(desdeISO)} al ${fmtFecha(hastaISO)}`
      const plantas = [...worker.plantas].join(', ') || '—'
      const equipos = [...worker.equipos].join(', ') || '—'
      const horasTotal = worker.horas % 1 === 0 ? worker.horas : worker.horas.toFixed(1)
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

      const filaActividades = regsConFotos.map((r, i) => `
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

      const tarjetasTrabajo = regsConFotos.map((r, i) => {
        const campos = [
          r.descripcion   && `<div class="trab-campo"><span class="lbl">Descripción:</span> ${r.descripcion}</div>`,
          r.material_utilizado && `<div class="trab-campo"><span class="lbl">Material utilizado:</span> ${r.material_utilizado}</div>`,
          r.planta        && `<div class="trab-campo"><span class="lbl">Planta / lugar:</span> ${r.planta}</div>`,
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
              <span class="trab-meta">${fmtFecha(r.fecha)}${r.hora ? ' · ' + r.hora.slice(0, 5) : ''} · ${r.tipo_trabajo || ''} ${r.horas_trabajadas != null ? '· ' + r.horas_trabajadas + ' hrs' : ''}</span>
            </div>
            <div class="trabajo-body">
              ${campos}
              ${fotoGrid}
            </div>
          </div>`
      }).join('')

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe – ${worker.nombre} – ${periodo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;font-size:11pt}
    :root{--navy:#12123a;--orange:#f5a623}

    /* BARRA SUPERIOR (no se imprime) */
    .print-bar{position:fixed;top:0;left:0;right:0;background:var(--navy);color:#fff;
      padding:.6rem 1.5rem;display:flex;align-items:center;justify-content:space-between;z-index:1000}
    .print-btn{background:var(--orange);color:var(--navy);border:none;border-radius:6px;
      padding:.45rem 1.4rem;font-weight:900;font-size:.92rem;cursor:pointer}
    .print-spacer{height:46px}

    /* PORTADA */
    .portada{min-height:100vh;display:flex;flex-direction:column;justify-content:center;
      align-items:center;text-align:center;background:var(--navy);color:#fff;
      page-break-after:always;padding:3rem;position:relative}
    .portada-logo{width:90px;height:90px;object-fit:contain;border-radius:12px;margin-bottom:1.75rem}
    .portada-empresa{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;
      color:rgba(255,255,255,.5);margin-bottom:.3rem}
    .portada-sub{font-size:.8rem;color:rgba(255,255,255,.4);margin-bottom:2.5rem}
    .portada-titulo{font-size:2.4rem;font-weight:900;line-height:1.1;letter-spacing:-.02em}
    .portada-divider{width:56px;height:4px;background:var(--orange);border-radius:2px;margin:1.4rem auto}
    .portada-trabajador{font-size:1.5rem;font-weight:700;color:var(--orange)}
    .portada-periodo{font-size:.95rem;color:rgba(255,255,255,.65);margin-top:.4rem}
    .portada-plantas{font-size:.8rem;color:rgba(255,255,255,.4);margin-top:.3rem}
    .portada-footer{position:absolute;bottom:1.75rem;font-size:.7rem;color:rgba(255,255,255,.25)}

    /* PÁGINAS INTERIORES */
    .inner-page{padding:0}
    .inner-header{display:flex;align-items:center;justify-content:space-between;
      padding-bottom:.65rem;border-bottom:3px solid var(--orange);margin-bottom:1.5rem}
    .ih-brand{display:flex;align-items:center;gap:.5rem}
    .ih-brand img{height:30px;border-radius:4px}
    .ih-brand span{font-weight:900;font-size:.95rem;color:var(--navy)}
    .ih-right{font-size:.72rem;color:#9a9ab0;text-align:right;line-height:1.4}

    /* SECCIÓN TÍTULO */
    .seccion{margin-bottom:2rem}
    .sec-titulo{font-size:.95rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;
      color:var(--navy);border-left:4px solid var(--orange);padding:.45rem .75rem;
      background:#f8f8fc;margin-bottom:1rem}
    .sec-num{color:var(--orange);margin-right:.35rem}

    /* TABLA DATOS */
    .tabla-datos{width:100%;border-collapse:collapse;margin-bottom:1.25rem;font-size:.88rem}
    .tabla-datos td{padding:7px 12px;border:1px solid #e0e0ec;vertical-align:top}
    .tabla-datos tr:nth-child(even) td{background:#f8f8fc}
    .tabla-datos td:first-child{font-weight:700;color:var(--navy);width:38%;background:#f0f0f8}

    /* TABLA ACTIVIDADES */
    .tabla-act{width:100%;border-collapse:collapse;font-size:.85rem}
    .tabla-act th{background:var(--navy);color:#fff;padding:7px 10px;text-align:left;
      font-size:.75rem;letter-spacing:.04em;font-weight:700}
    .tabla-act td{padding:6px 10px;border:1px solid #e0e0ec;vertical-align:top}
    .tabla-act tr:nth-child(even) td{background:#f8f8fc}

    /* TARJETAS DE TRABAJO */
    .trabajo-card{border:1px solid #e0e0ec;border-radius:8px;margin-bottom:1.25rem;
      overflow:hidden;page-break-inside:avoid}
    .trabajo-header{background:var(--navy);color:#fff;padding:.65rem 1rem;
      display:flex;align-items:baseline;gap:.85rem;flex-wrap:wrap}
    .trab-num{font-weight:900;font-size:1rem;color:var(--orange);flex-shrink:0}
    .trab-tarea{font-weight:700;flex:1;font-size:.9rem}
    .trab-meta{font-size:.75rem;color:rgba(255,255,255,.6);white-space:nowrap}
    .trabajo-body{padding:.85rem 1rem}
    .trab-campo{margin-bottom:.35rem;font-size:.85rem;line-height:1.4}
    .lbl{font-weight:700;color:var(--navy)}

    /* FOTOS */
    .foto-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:.75rem}
    .foto-item img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:5px;
      border:1px solid #e0e0ec;display:block}

    /* CONCLUSIÓN */
    .conclusion-box{background:#f8f8fc;border:1px solid #e0e0ec;border-radius:8px;
      padding:1.4rem;line-height:1.75;font-size:.9rem;margin-bottom:2.5rem}
    .firma{text-align:center;margin-top:3rem}
    .firma-linea{width:200px;height:1px;background:#333;margin:0 auto .5rem}
    .firma-nombre{font-weight:700;font-size:1rem}
    .firma-cargo{color:#6b6b8a;font-size:.85rem;margin-top:.15rem}
    .firma-contacto{color:#9a9ab0;font-size:.75rem;margin-top:.15rem}

    /* PRINT */
    @page{margin:15mm 20mm}
    @media print{
      .no-print,.print-bar,.print-spacer{display:none!important}
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .portada{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
    .page-break{page-break-before:always;padding-top:0}
  </style>
</head>
<body>

  <!-- Barra superior -->
  <div class="print-bar no-print">
    <span style="font-size:.88rem">Informe de actividades — <strong>${worker.nombre}</strong> | ${periodo}</span>
    <button class="print-btn" onclick="window.print()">🖨&nbsp; Imprimir / Guardar PDF</button>
  </div>
  <div class="print-spacer no-print"></div>

  <!-- ── PORTADA ── -->
  <div class="portada">
    <img class="portada-logo" src="${logoUrl}" alt="DAIG">
    <div class="portada-empresa">DAIG SpA</div>
    <div class="portada-sub">Ingeniería en Mecánica de Procesos y Mantenimiento Industrial</div>
    <div class="portada-titulo">INFORME DE<br>ACTIVIDADES<br>SEMANALES</div>
    <div class="portada-divider"></div>
    <div class="portada-trabajador">${worker.nombre}</div>
    <div class="portada-periodo">${periodo}</div>
    ${plantas !== '—' ? `<div class="portada-plantas">${plantas}</div>` : ''}
    <div class="portada-footer">DAIG SpA · daigchile.cl</div>
  </div>

  <!-- ── DATOS DEL SERVICIO + ACTIVIDADES ── -->
  <div class="inner-page page-break" style="padding-top:0">
    <div class="inner-header">
      <div class="ih-brand">
        <img src="${logoUrl}" alt="DAIG">
        <span>DAIG SpA</span>
      </div>
      <div class="ih-right">Informe de Actividades Semanales<br>${worker.nombre} · ${periodo}</div>
    </div>

    <div class="seccion">
      <div class="sec-titulo"><span class="sec-num">1.</span> DATOS DEL SERVICIO</div>
      <table class="tabla-datos">
        <tr><td>Empresa ejecutora</td><td>DAIG SpA | RUT: 77.702.886-3</td></tr>
        <tr><td>Trabajador</td><td>${worker.nombre}</td></tr>
        <tr><td>Período</td><td>${periodo}</td></tr>
        <tr><td>Total de registros</td><td>${worker.registros.length} ${worker.registros.length === 1 ? 'registro' : 'registros'}</td></tr>
        <tr><td>Horas trabajadas</td><td>${horasTotal} hrs</td></tr>
        <tr><td>Estado de actividades</td><td>${estados}</td></tr>
        <tr><td>Plantas / Lugares</td><td>${plantas}</td></tr>
        <tr><td>Equipos intervenidos</td><td>${equipos !== '—' ? equipos : '—'}</td></tr>
      </table>
    </div>

    <div class="seccion">
      <div class="sec-titulo"><span class="sec-num">2.</span> ACTIVIDADES REALIZADAS</div>
      <table class="tabla-act">
        <thead>
          <tr>
            <th style="width:40px">N°</th>
            <th style="width:80px">Fecha</th>
            <th style="width:130px">Tipo</th>
            <th>Tarea / Equipo</th>
            <th style="width:110px">Estado</th>
            <th style="width:50px;text-align:right">Hrs</th>
          </tr>
        </thead>
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
        completando un total de <strong>${worker.registros.length} ${worker.registros.length === 1 ? 'registro' : 'registros'}</strong>
        con <strong>${horasTotal} horas trabajadas</strong>.
        ${[...worker.plantas].length > 0 ? `Los trabajos se realizaron en: <strong>${plantas}</strong>.` : ''}
        ${[...worker.equipos].length > 0 ? ` Los equipos intervenidos incluyeron: ${equipos}.` : ''}
      </div>
      <div class="firma">
        <div class="firma-linea"></div>
        <div class="firma-nombre">Daniel Mena Vega</div>
        <div class="firma-cargo">Representante Legal · DAIG SpA</div>
        <div class="firma-contacto">daniel.mena@serviciosdaig.com | +56 9 8868 9400</div>
      </div>
    </div>
  </div>

</body>
</html>`

      const popup = window.open('', '_blank', 'width=900,height=700')
      popup.document.write(html)
      popup.document.close()
    } catch (e) {
      alert('Error al generar informe: ' + e.message)
    }
    setGenerando(null)
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="inf-root">

      {/* ── cabecera de semana ── */}
      <div className="inf-week-bar">
        <button className="inf-week-nav" onClick={semanaAnterior} title="Semana anterior">
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>

        <div className="inf-week-label">
          <span className="inf-week-range">
            {fmtShort(lunes)} – {fmtShort(domingo)}
          </span>
          <span className="inf-week-year">{lunes.getFullYear()}</span>
          {esSemanActual && <span className="inf-week-badge">Semana actual</span>}
        </div>

        <button className="inf-week-nav" onClick={semanaSiguiente} title="Semana siguiente">
          <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>

        {!esSemanActual && (
          <button className="inf-today-btn" onClick={semanaActual}>Hoy</button>
        )}

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
          <p>Sin registros para esta semana</p>
          <span>{fmtFecha(desdeISO)} al {fmtFecha(hastaISO)}</span>
        </div>
      )}

      {!loading && registros.length > 0 && (
        <>
          {/* ── KPIs ── */}
          <div className="inf-kpi-row">
            <div className="inf-kpi">
              <div className="inf-kpi-val" style={{ color: '#f5a623' }}>{registros.length}</div>
              <div className="inf-kpi-lbl">Registros</div>
            </div>
            <div className="inf-kpi">
              <div className="inf-kpi-val" style={{ color: '#8b5cf6' }}>
                {totalHoras % 1 === 0 ? totalHoras : totalHoras.toFixed(1)}
              </div>
              <div className="inf-kpi-lbl">Horas totales</div>
            </div>
            <div className="inf-kpi">
              <div className="inf-kpi-val" style={{ color: '#22c55e' }}>{trabajadoresActivos}</div>
              <div className="inf-kpi-lbl">Trabajadores activos</div>
            </div>
            <div className="inf-kpi">
              <div className="inf-kpi-val" style={{ color: '#3b82f6' }}>
                {totalHoras && trabajadoresActivos
                  ? (totalHoras / trabajadoresActivos % 1 === 0
                    ? totalHoras / trabajadoresActivos
                    : (totalHoras / trabajadoresActivos).toFixed(1))
                  : '—'}
              </div>
              <div className="inf-kpi-lbl">Hrs / trabajador</div>
            </div>
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
                      {/* botón generar informe */}
                      <button
                        className="inf-generar-btn"
                        onClick={() => generarInforme(w)}
                        disabled={generando === w.id}
                      >
                        {generando === w.id ? (
                          <><div className="admin-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generando...</>
                        ) : (
                          <><svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 9H7v-2h4v2zm4-4H7v-2h8v2z"/></svg>Generar Informe PDF</>
                        )}
                      </button>

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
