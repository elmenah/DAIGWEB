import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const IND_COLOR = {
  'Bueno':             '#22c55e',
  'Regular':           '#f59e0b',
  'Requiere atención': '#f97316',
  'Crítico':           '#ef4444',
}

function estadoClass(e) {
  if (['Terminado','Completado'].includes(e)) return 'ok'
  if (['En Proceso','En progreso'].includes(e)) return 'wip'
  return 'pending'
}

function estadoColor(e) {
  if (['Terminado','Completado'].includes(e)) return '#22c55e'
  if (['En Proceso','En progreso'].includes(e)) return '#f59e0b'
  return '#ef4444'
}

function fmtFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ── Generador de OT PDF ───────────────────────────────────────────────────────
function generarOT(r, allRegistros, equipoNombre) {
  const otNum = r.ot || String(r.id).padStart(4, '0')

  // Agrupar por OT si hay número; sino solo este registro
  const otGrupo = r.ot
    ? allRegistros.filter(x => x.ot === r.ot).sort((a, b) => a.id - b.id)
    : [r]

  // KPIs últimos 12 meses
  const hace12 = new Date(); hace12.setFullYear(hace12.getFullYear() - 1)
  const recientes = allRegistros.filter(x => x.fecha && x.fecha >= hace12.toISOString().split('T')[0])
  const base = recientes.length ? recientes : allRegistros
  const preventivos = base.filter(x => (x.tipo_trabajo || '').toLowerCase().includes('prevent'))
  const correctivos = base.filter(x => (x.tipo_trabajo || '').toLowerCase().includes('correct'))
  const totalInter  = base.length
  const totalHoras  = base.reduce((s, x) => s + (x.horas_trabajadas || 0), 0)
  const pctPrev     = totalInter ? Math.round(preventivos.length / totalInter * 100) : 0
  const pctCorr     = totalInter ? Math.round(correctivos.length / totalInter * 100) : 0
  const disponib    = correctivos.length === 0 ? '100,0%' : `${(100 - correctivos.length / totalInter * 100).toFixed(1).replace('.', ',')}%`
  const confiab     = correctivos.length === 0 ? '100,0%' : `${(preventivos.length / totalInter * 100).toFixed(1).replace('.', ',')}%`

  // Clase y prioridad
  const tipoLower = (r.tipo_trabajo || '').toLowerCase()
  const clase     = tipoLower.includes('prevent') ? 'Preventivo' : tipoLower.includes('correct') ? 'Correctivo' : r.tipo_trabajo || 'Mantención'
  const prioridad = r.indicador_mantenimiento === 'Crítico' ? 'Alta' :
                    r.indicador_mantenimiento === 'Requiere atención' ? 'Media' : 'Normal'

  // Rango de fechas del OT
  const fechas     = otGrupo.map(x => x.fecha).filter(Boolean).sort()
  const fechaRange = fechas.length > 1
    ? `${fmtFecha(fechas[0])} al ${fmtFecha(fechas[fechas.length - 1])}`
    : fmtFecha(r.fecha)

  // Horas del OT
  const horasOT = otGrupo.reduce((s, x) => s + (x.horas_trabajadas || 0), 0)

  // Materiales (únicos, de todos los registros del OT)
  const materiales = [...new Set(
    otGrupo.flatMap(x => (x.material_utilizado || '').split(/[,;\n]/).map(m => m.trim()).filter(Boolean))
  )]

  // Notas
  const notas = otGrupo.map(x => x.descripcion).filter(Boolean).join(' ')

  // Mes/año del registro
  const mesAnio = r.fecha
    ? new Date(r.fecha + 'T12:00:00').toLocaleString('es-CL', { month: 'long', year: 'numeric' })
    : ''

  const hoy = new Date().toLocaleDateString('es-CL')

  const tareasHTML = otGrupo.map((x, i) => `
    <tr>
      <td style="text-align:center;font-size:14px;color:#1a4480;">☑</td>
      <td style="text-align:center;">${i + 1}</td>
      <td>
        <strong>${x.tarea || x.tipo_trabajo || 'Intervención'}</strong>
        ${x.descripcion ? `<br/><span style="font-size:9.5px;color:#555;">${x.descripcion}</span>` : ''}
        ${x.trabajador_nombre && otGrupo.length > 1 ? `<span style="font-size:9px;color:#999;"> — ${x.trabajador_nombre}</span>` : ''}
      </td>
    </tr>`).join('')

  const materialesHTML = materiales.length
    ? materiales.map(m => `<tr><td>${m}</td></tr>`).join('')
    : `<tr><td style="color:#999;">—</td></tr>`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>OT-${otNum} · ${equipoNombre}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;}
  .page{max-width:800px;margin:0 auto;padding:24px;}
  .ot-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:2.5px solid #1a4480;margin-bottom:16px;}
  .logo-wrap{display:flex;align-items:center;gap:12px;}
  .logo-circle{width:54px;height:54px;border-radius:50%;border:2.5px solid #1a4480;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .logo-text{font-weight:900;font-size:15px;color:#1a4480;letter-spacing:-0.5px;}
  .title-area h1{font-size:22px;color:#1a4480;font-weight:800;line-height:1.1;}
  .title-area p{font-size:11px;color:#666;margin-top:3px;}
  .ot-badge{text-align:right;border:1.5px solid #1a4480;padding:8px 14px;min-width:145px;}
  .ot-badge-num{font-size:20px;font-weight:800;color:#1a4480;}
  .ot-badge-row{font-size:10px;color:#444;margin-top:2px;}
  .info-grid{width:100%;border-collapse:collapse;border:1px solid #ccc;margin-bottom:4px;}
  .info-grid td{padding:5px 10px;font-size:10.5px;border-bottom:1px solid #e0e0e0;border-right:1px solid #e0e0e0;}
  .info-grid td:last-child{border-right:none;}
  .info-grid tr:last-child td{border-bottom:none;}
  .lbl{color:#1a4480;font-weight:bold;}
  .sec-title{background:#1a4480;color:#fff;padding:5px 10px;font-weight:bold;font-size:10.5px;margin-top:14px;}
  .data-table{width:100%;border-collapse:collapse;font-size:10.5px;}
  .data-table th{background:#1a4480;color:#fff;padding:5px 8px;text-align:left;font-weight:bold;font-size:10px;}
  .data-table td{padding:5px 8px;border-bottom:1px solid #e8e8e8;vertical-align:top;}
  .data-table tr:nth-child(even) td{background:#f8f9ff;}
  .kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px;}
  .kpi-card{border:1px solid #c5d3e8;padding:9px 11px;background:#f4f7fc;}
  .kpi-lbl{font-size:8.5px;font-weight:bold;color:#1a4480;text-transform:uppercase;letter-spacing:.05em;}
  .kpi-val{font-size:21px;font-weight:800;color:#1a4480;margin:3px 0 2px;line-height:1;}
  .kpi-sub{font-size:8.5px;color:#777;}
  .period-note{font-size:9px;color:#777;margin-top:8px;padding-top:6px;border-top:1px solid #e0e0e0;}
  .notes-box{border-left:3px solid #1a4480;padding:7px 12px;margin-top:12px;background:#f4f7fc;font-size:10.5px;}
  .notes-box strong{color:#1a4480;}
  .signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:32px;}
  .sig-lbl{font-size:9px;color:#888;margin-bottom:28px;}
  .sig-line{border-top:1px solid #666;padding-top:5px;font-size:10px;color:#444;}
  .ot-footer{margin-top:16px;font-size:8.5px;color:#aaa;text-align:center;padding-top:8px;border-top:1px solid #e0e0e0;}
  @media print{@page{margin:15mm;}.no-print{display:none!important;}body{font-size:10px;}}
</style>
</head>
<body>
<div class="page">

<div class="ot-header">
  <div class="logo-wrap">
    <div class="logo-circle"><div class="logo-text">DAIG</div></div>
    <div class="title-area">
      <h1>Orden de Trabajo OT-${otNum}</h1>
      <p>Mantención ${equipoNombre}${mesAnio ? ' — ' + mesAnio : ''}</p>
    </div>
  </div>
  <div class="ot-badge">
    <div class="ot-badge-num">OT-${otNum}</div>
    <div class="ot-badge-row">Estado: ${r.estado || '—'}</div>
    <div class="ot-badge-row">Clase: ${clase}</div>
  </div>
</div>

<table class="info-grid">
  <tr>
    <td width="50%"><span class="lbl">Cliente / Mandante:</span> ${r.planta || '—'}</td>
    <td><span class="lbl">Equipo:</span> ${equipoNombre}</td>
  </tr>
  <tr>
    <td><span class="lbl">OT:</span> ${otNum}</td>
    <td><span class="lbl">Prioridad:</span> ${prioridad}</td>
  </tr>
  <tr>
    <td><span class="lbl">Taller / Responsable:</span> DAIG SpA</td>
    <td><span class="lbl">Realizó:</span> ${r.trabajador_nombre || '—'}</td>
  </tr>
  <tr>
    <td><span class="lbl">Mantención realizada:</span> ${fechaRange}</td>
    <td><span class="lbl">Horas trabajadas:</span> ${horasOT % 1 === 0 ? horasOT : horasOT.toFixed(1)} h</td>
  </tr>
</table>

<div class="sec-title">TAREAS REALIZADAS</div>
<table class="data-table">
  <thead><tr><th style="width:28px;">✓</th><th style="width:32px;">N°</th><th>Actividad y alcance</th></tr></thead>
  <tbody>${tareasHTML}</tbody>
</table>

<div class="sec-title">REPUESTOS Y MATERIALES UTILIZADOS</div>
<table class="data-table">
  <thead><tr><th>Ítem</th></tr></thead>
  <tbody>${materialesHTML}</tbody>
</table>

<div class="sec-title">INDICADORES DEL EQUIPO</div>
<div class="kpi-row">
  <div class="kpi-card"><div class="kpi-lbl">DISPONIBILIDAD</div><div class="kpi-val">${disponib}</div><div class="kpi-sub">últimos 12 meses</div></div>
  <div class="kpi-card"><div class="kpi-lbl">CONFIABILIDAD</div><div class="kpi-val">${confiab}</div><div class="kpi-sub">objetivo 500 h</div></div>
  <div class="kpi-card"><div class="kpi-lbl">INTERVENCIONES</div><div class="kpi-val">${preventivos.length || totalInter}</div><div class="kpi-sub">preventivas</div></div>
  <div class="kpi-card"><div class="kpi-lbl">N° FALLAS (CORRECTIVOS)</div><div class="kpi-val">${correctivos.length}</div><div class="kpi-sub">${correctivos.length === 0 ? 'sin fallas' : 'correctivas'}</div></div>
</div>
<div class="kpi-row" style="margin-top:8px;">
  <div class="kpi-card"><div class="kpi-lbl">% PREVENTIVO</div><div class="kpi-val">${pctPrev}%</div><div class="kpi-sub">mezcla del período</div></div>
  <div class="kpi-card"><div class="kpi-lbl">% CORRECTIVO</div><div class="kpi-val">${pctCorr}%</div><div class="kpi-sub"></div></div>
  <div class="kpi-card"><div class="kpi-lbl">TIEMPO OPERATIVO</div><div class="kpi-val">${totalHoras % 1 === 0 ? totalHoras : totalHoras.toFixed(1)} h</div><div class="kpi-sub">estimado</div></div>
  <div class="kpi-card"><div class="kpi-lbl">MTBF / MTTR</div><div class="kpi-val">—</div><div class="kpi-sub">${correctivos.length === 0 ? 'sin fallas' : ''}</div></div>
</div>
<div class="period-note">Período: últimos 12 meses · Confiabilidad–Mantenibilidad–Disponibilidad (CMD) calculada por el software de gestión Mantención de Flota — DAIG.</div>

${notas ? `<div class="notes-box"><strong>Notas:</strong> ${notas}</div>` : ''}

<div class="signatures">
  <div><div class="sig-lbl">Realizó</div><div class="sig-line">${r.trabajador_nombre || ''} · DAIG SpA</div></div>
  <div><div class="sig-lbl">Revisó / Supervisor</div><div class="sig-line">${r.revisado_por || ''}</div></div>
  <div><div class="sig-lbl">Recibió conforme</div><div class="sig-line">${r.planta || ''}</div></div>
</div>

<div class="ot-footer">Generado por el software de gestión Mantención de Flota — DAIG SpA · Ingeniería y Servicios Industriales · ${hoy}.</div>
</div>
<script>window.onload=function(){window.print();};</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=750')
  if (win) { win.document.write(html); win.document.close() }
}

// ── Vista detalle de un equipo ────────────────────────────────────────────────
function EquipoDetalle({ nombre, onBack }) {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase
      .from('registros_trabajo')
      .select('id, fecha, hora, trabajador_nombre, tipo_trabajo, tarea, descripcion, estado, horas_trabajadas, indicador_mantenimiento, planta, ot, material_utilizado, revisado_por')
      .eq('equipo_intervenido', nombre)
      .order('fecha', { ascending: false })
      .order('id', { ascending: false })
      .then(({ data }) => { setRegistros(data || []); setLoading(false) })
  }, [nombre])

  const totalHoras   = registros.reduce((s, r) => s + (r.horas_trabajadas || 0), 0)
  const ultimoEstado = registros[0]?.estado
  const ultimoInd    = registros[0]?.indicador_mantenimiento

  const porEstado = registros.reduce((acc, r) => {
    const k = r.estado || 'Sin estado'; acc[k] = (acc[k] || 0) + 1; return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, color: '#c8c8e0', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem',
        }}>← Volver</button>
        <div>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1.15rem' }}>{nombre}</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
            {registros.length} intervenciones · {totalHoras % 1 === 0 ? totalHoras : totalHoras.toFixed(1)}h totales
          </p>
        </div>
        {ultimoEstado && (
          <span className={`reg-estado-badge reg-estado-badge--${estadoClass(ultimoEstado)}`} style={{ marginLeft: 'auto' }}>
            Último: {ultimoEstado}
          </span>
        )}
        {ultimoInd && (() => {
          const c = IND_COLOR[ultimoInd] || '#9a9ab0'
          return (
            <span className="ind-badge" style={{ background: `${c}22`, color: c, border: `1px solid ${c}55` }}>
              <span className="ind-dot" style={{ background: c }} />{ultimoInd}
            </span>
          )
        })()}
      </div>

      {/* Resumen rápido */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {Object.entries(porEstado).map(([estado, n]) => (
          <div key={estado} style={{
            background: `${estadoColor(estado)}18`, border: `1px solid ${estadoColor(estado)}44`,
            borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: estadoColor(estado), display: 'inline-block' }} />
            <span style={{ color: '#c8c8e0', fontSize: '0.82rem' }}>{estado}</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{n}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skel-kpi" style={{ minHeight: 72, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : registros.length === 0 ? (
        <p className="reg-empty">Sin registros para este equipo.</p>
      ) : (
        <div className="equipo-timeline">
          {registros.map((r, idx) => {
            const ec = estadoColor(r.estado)
            const ic = IND_COLOR[r.indicador_mantenimiento]
            return (
              <div key={r.id} className="equipo-tl-item">
                <div className="equipo-tl-line">
                  <div className="equipo-tl-dot" style={{ background: ec, boxShadow: `0 0 0 3px ${ec}33` }} />
                  {idx < registros.length - 1 && <div className="equipo-tl-track" />}
                </div>
                <div className="equipo-tl-card">
                  <div className="equipo-tl-top">
                    <span className="equipo-tl-fecha">{fmtFecha(r.fecha)}{r.hora ? ` · ${r.hora.slice(0,5)}` : ''}</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {r.estado && <span className={`reg-estado-badge reg-estado-badge--${estadoClass(r.estado)}`}>{r.estado}</span>}
                      {r.indicador_mantenimiento && ic && (
                        <span className="ind-badge" style={{ background: `${ic}22`, color: ic, border: `1px solid ${ic}55` }}>
                          <span className="ind-dot" style={{ background: ic }} />{r.indicador_mantenimiento}
                        </span>
                      )}
                      {r.revisado_por && (
                        <span style={{ fontSize: '0.72rem', color: '#22c55e' }}>✓ Revisado</span>
                      )}
                      <button
                        onClick={() => generarOT(r, registros, nombre)}
                        title="Generar Orden de Trabajo (PDF)"
                        style={{
                          background: 'rgba(26,68,128,0.15)', border: '1px solid rgba(26,68,128,0.4)',
                          borderRadius: 6, color: '#7aadff', padding: '2px 8px', cursor: 'pointer',
                          fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: 'currentColor' }}>
                          <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                        </svg>
                        OT
                      </button>
                    </div>
                  </div>
                  <div className="equipo-tl-body">
                    {r.trabajador_nombre && (
                      <span className="equipo-tl-worker">
                        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: 'currentColor', flexShrink: 0 }}>
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                        </svg>
                        {r.trabajador_nombre}
                      </span>
                    )}
                    {r.tipo_trabajo && <span className="equipo-tl-tipo">{r.tipo_trabajo}</span>}
                    {r.ot && <span className="equipo-tl-tipo" style={{ color: 'rgba(255,255,255,0.35)' }}>OT {r.ot}</span>}
                  </div>
                  {r.tarea && <p className="equipo-tl-tarea">{r.tarea}</p>}
                  {r.descripcion && <p className="equipo-tl-desc">{r.descripcion}</p>}
                  {r.material_utilizado && (
                    <p className="equipo-tl-desc" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Material: {r.material_utilizado}
                    </p>
                  )}
                  {r.horas_trabajadas > 0 && (
                    <span className="equipo-tl-horas">{r.horas_trabajadas}h</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Vista lista de equipos ────────────────────────────────────────────────────
function EquiposManager() {
  const [equipos, setEquipos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [busqueda, setBusqueda]       = useState('')
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('registros_trabajo')
      .select('equipo_intervenido, fecha, estado, indicador_mantenimiento, horas_trabajadas, planta')
      .not('equipo_intervenido', 'is', null)
      .neq('equipo_intervenido', '')
      .order('fecha', { ascending: false })
      .then(({ data }) => {
        const map = {}
        for (const r of (data || [])) {
          const k = r.equipo_intervenido
          if (!map[k]) {
            map[k] = { nombre: k, total: 0, horas: 0, ultimaFecha: r.fecha, ultimoEstado: r.estado, ultimoIndicador: r.indicador_mantenimiento, plantas: new Set() }
          }
          map[k].total++
          map[k].horas += r.horas_trabajadas || 0
          if (r.planta) map[k].plantas.add(r.planta)
          // la más reciente ya viene primero por el order
          if (!map[k].ultimaFecha || r.fecha > map[k].ultimaFecha) {
            map[k].ultimaFecha = r.fecha
            map[k].ultimoEstado = r.estado
            map[k].ultimoIndicador = r.indicador_mantenimiento
          }
        }
        const lista = Object.values(map).sort((a, b) => (b.ultimaFecha || '').localeCompare(a.ultimaFecha || ''))
        setEquipos(lista)
        setLoading(false)
      })
  }, [])

  if (equipoSeleccionado) {
    return (
      <div className="admin-section">
        <EquipoDetalle nombre={equipoSeleccionado} onBack={() => setEquipoSeleccionado(null)} />
      </div>
    )
  }

  const filtrados = equipos.filter(e =>
    !busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Equipos que tienen "En Proceso" como último estado
  const enProceso = filtrados.filter(e => ['En Proceso','En progreso'].includes(e.ultimoEstado))
  const resto     = filtrados.filter(e => !['En Proceso','En progreso'].includes(e.ultimoEstado))

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h3>Equipos</h3>
        <span className="admin-badge">{equipos.length} equipos</span>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar equipo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width: '100%', maxWidth: 360,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 9, color: '#fff', padding: '8px 14px', fontSize: '0.88rem',
          }}
        />
      </div>

      {loading ? (
        <div className="equipo-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skel-kpi" style={{ minHeight: 130, animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <p className="reg-empty">No hay equipos registrados con los filtros actuales.</p>
      ) : (
        <>
          {enProceso.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '0.6rem' }}>
                En proceso ahora
              </p>
              <div className="equipo-grid">
                {enProceso.map(eq => <EquipoCard key={eq.nombre} eq={eq} onClick={() => setEquipoSeleccionado(eq.nombre)} />)}
              </div>
            </div>
          )}

          {resto.length > 0 && (
            <div>
              {enProceso.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '0.6rem' }}>
                  Historial
                </p>
              )}
              <div className="equipo-grid">
                {resto.map(eq => <EquipoCard key={eq.nombre} eq={eq} onClick={() => setEquipoSeleccionado(eq.nombre)} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EquipoCard({ eq, onClick }) {
  const ic = IND_COLOR[eq.ultimoIndicador]
  const ec = estadoColor(eq.ultimoEstado)
  const enCurso = ['En Proceso','En progreso'].includes(eq.ultimoEstado)

  return (
    <div className="equipo-card" onClick={onClick} style={{ borderColor: enCurso ? '#f59e0b55' : undefined }}>
      {enCurso && <div className="equipo-card-pulse" />}
      <div className="equipo-card-top">
        <span className="equipo-card-nombre">{eq.nombre}</span>
        {eq.ultimoIndicador && ic && (
          <span className="ind-badge" style={{ background: `${ic}22`, color: ic, border: `1px solid ${ic}55`, fontSize: '0.7rem' }}>
            <span className="ind-dot" style={{ background: ic }} />{eq.ultimoIndicador}
          </span>
        )}
      </div>

      <div className="equipo-card-stats">
        <div className="equipo-card-stat">
          <span className="equipo-card-stat-val">{eq.total}</span>
          <span className="equipo-card-stat-lbl">intervenciones</span>
        </div>
        <div className="equipo-card-stat">
          <span className="equipo-card-stat-val">{eq.horas % 1 === 0 ? eq.horas : eq.horas.toFixed(1)}h</span>
          <span className="equipo-card-stat-lbl">horas totales</span>
        </div>
      </div>

      <div className="equipo-card-footer">
        <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.35)' }}>
          Última: {fmtFecha(eq.ultimaFecha)}
        </span>
        {eq.ultimoEstado && (
          <span className={`reg-estado-badge reg-estado-badge--${estadoClass(eq.ultimoEstado)}`} style={{ fontSize: '0.7rem', padding: '2px 7px' }}>
            {eq.ultimoEstado}
          </span>
        )}
      </div>

      {eq.plantas.size > 0 && (
        <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.3)', margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📍 {[...eq.plantas].join(', ')}
        </p>
      )}
    </div>
  )
}

export default EquiposManager
