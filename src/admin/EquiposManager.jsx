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
