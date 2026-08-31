import React, { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import HeicImage from '../components/HeicImage'

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
