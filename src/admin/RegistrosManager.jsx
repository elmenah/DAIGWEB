import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import HeicImage from '../components/HeicImage'

const PAGE_SIZE = 25

const toISO = (d) => d.toISOString().split('T')[0]
const hoy = () => toISO(new Date())
const ayer = () => { const d = new Date(); d.setDate(d.getDate() - 1); return toISO(d) }
const lunesDeEstaSemana = () => {
  const d = new Date(); const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1); return toISO(d)
}
const primerDiaDelMes = () => {
  const d = new Date(); d.setDate(1); return toISO(d)
}

const QUICK_FILTERS = [
  { label: 'Hoy',         desde: hoy,              hasta: hoy },
  { label: 'Ayer',        desde: ayer,              hasta: ayer },
  { label: 'Esta semana', desde: lunesDeEstaSemana, hasta: hoy },
  { label: 'Este mes',    desde: primerDiaDelMes,   hasta: hoy },
]

const ESTADOS = ['Terminado', 'En Proceso', 'Pendiente repuesto']

const COLUMNS = [
  { key: 'trabajador_nombre', label: 'Trabajador' },
  { key: 'fecha',             label: 'Fecha' },
  { key: 'tipo_trabajo',      label: 'Tipo' },
  { key: 'tarea',             label: 'Tarea / Equipo' },
  { key: 'estado',            label: 'Estado' },
  { key: 'horas_trabajadas',  label: 'Hrs' },
]

function estadoClass(e) {
  if (['Terminado','Completado'].includes(e)) return 'ok'
  if (['En Proceso','En progreso'].includes(e)) return 'wip'
  return 'pending'
}

function SortIcon({ active, asc }) {
  return <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: '0.7rem' }}>{active ? (asc ? '▲' : '▼') : '▲▼'}</span>
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}44`,
      borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 120,
    }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: '#9a9ab0', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function PhotoModal({ url, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="reg-modal-overlay" onClick={onClose}>
      <button className="reg-modal-close" onClick={onClose}>×</button>
      <HeicImage src={url} className="reg-modal-img" onClick={e => e.stopPropagation()} alt="" />
    </div>
  )
}

function RegistrosManager() {
  const { user } = useAuth()
  const [adminNombre, setAdminNombre] = useState('')

  const [registros, setRegistros]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [modalUrl, setModalUrl]     = useState(null)

  const [filtroTrabajador, setFiltroTrabajador] = useState('')
  const [filtroEstado, setFiltroEstado]         = useState('')
  const [filtroTexto, setFiltroTexto]           = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [quickActive, setQuickActive]           = useState(null)

  const [sortCol, setSortCol] = useState('fecha')
  const [sortAsc, setSortAsc] = useState(false)

  const [trabajadores, setTrabajadores] = useState([])
  const [page, setPage]   = useState(0)
  const [total, setTotal] = useState(0)

  const [stats, setStats] = useState({ horas: 0, terminados: 0, enProceso: 0, pendientes: 0 })

  // Comment & review state per row
  const [comentarios, setComentarios] = useState({})
  const [savingComment, setSavingComment] = useState(null)
  const [markingReviewed, setMarkingReviewed] = useState(null)

  // Debounce texto
  const [textoDebounced, setTextoDebounced] = useState('')
  const debounceRef = useRef(null)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setTextoDebounced(filtroTexto), 350)
    return () => clearTimeout(debounceRef.current)
  }, [filtroTexto])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('nombre, username').eq('id', user.id).single()
      .then(({ data }) => { if (data) setAdminNombre(data.nombre || data.username || '') })
  }, [user])

  const loadStats = useCallback(async () => {
    const { data: semana } = await supabase
      .from('registros_trabajo').select('horas_trabajadas').gte('fecha', lunesDeEstaSemana())
    const horas = semana?.reduce((s, r) => s + (r.horas_trabajadas || 0), 0) || 0

    const { data: estados } = await supabase.from('registros_trabajo').select('estado')
    const terminados = estados?.filter(r => ['Terminado','Completado'].includes(r.estado)).length || 0
    const enProceso  = estados?.filter(r => ['En Proceso','En progreso'].includes(r.estado)).length || 0
    const pendientes = estados?.filter(r => r.estado === 'Pendiente repuesto').length || 0
    setStats({ horas, terminados, enProceso, pendientes })
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('registros_trabajo')
      .select('*', { count: 'exact' })
      .order(sortCol, { ascending: sortAsc })
      .order('hora', { ascending: sortAsc })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (filtroTrabajador) query = query.eq('trabajador_id', filtroTrabajador)
    if (filtroEstado)     query = query.eq('estado', filtroEstado)
    if (filtroFechaDesde) query = query.gte('fecha', filtroFechaDesde)
    if (filtroFechaHasta) query = query.lte('fecha', filtroFechaHasta)
    if (textoDebounced) {
      const t = textoDebounced.trim()
      query = query.or(`tarea.ilike.%${t}%,descripcion.ilike.%${t}%,equipo_intervenido.ilike.%${t}%,trabajador_nombre.ilike.%${t}%,material_utilizado.ilike.%${t}%,aviso_sap.ilike.%${t}%,planta.ilike.%${t}%`)
    }

    const { data, count } = await query
    setRegistros(data || [])
    setTotal(count || 0)

    // Pre-fill comentarios state
    const cm = {}
    ;(data || []).forEach(r => { cm[r.id] = r.comentario_admin || '' })
    setComentarios(prev => ({ ...cm, ...prev }))

    setLoading(false)
  }, [filtroTrabajador, filtroEstado, filtroFechaDesde, filtroFechaHasta, textoDebounced, sortCol, sortAsc, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase.from('profiles').select('id, username, nombre').eq('role', 'trabajador').order('nombre')
      .then(({ data }) => setTrabajadores(data || []))
  }, [])

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(a => !a)
    else { setSortCol(col); setSortAsc(false) }
    setPage(0)
  }

  const applyQuick = (qf) => {
    const idx = QUICK_FILTERS.indexOf(qf)
    if (quickActive === idx) {
      setQuickActive(null); setFiltroFechaDesde(''); setFiltroFechaHasta('')
    } else {
      setQuickActive(idx); setFiltroFechaDesde(qf.desde()); setFiltroFechaHasta(qf.hasta())
    }
    setPage(0)
  }

  const clearAll = () => {
    setFiltroTrabajador(''); setFiltroEstado(''); setFiltroTexto('')
    setFiltroFechaDesde(''); setFiltroFechaHasta(''); setQuickActive(null); setPage(0)
  }

  const exportCSV = async () => {
    let query = supabase.from('registros_trabajo').select('*').order(sortCol, { ascending: sortAsc })
    if (filtroTrabajador) query = query.eq('trabajador_id', filtroTrabajador)
    if (filtroEstado)     query = query.eq('estado', filtroEstado)
    if (filtroFechaDesde) query = query.gte('fecha', filtroFechaDesde)
    if (filtroFechaHasta) query = query.lte('fecha', filtroFechaHasta)
    if (textoDebounced) {
      const t = textoDebounced.trim()
      query = query.or(`tarea.ilike.%${t}%,descripcion.ilike.%${t}%,equipo_intervenido.ilike.%${t}%,trabajador_nombre.ilike.%${t}%,aviso_sap.ilike.%${t}%,planta.ilike.%${t}%`)
    }
    const { data } = await query
    if (!data?.length) return

    const headers = ['Trabajador','Fecha','Hora','Tipo','Equipo','Planta','Aviso SAP','Tarea','Descripcion','Material','Horas','Estado','Ubicacion','Revisado por','Comentario']
    const rows = data.map(r => [
      r.trabajador_nombre || '', r.fecha || '', r.hora?.slice(0,5) || '',
      r.tipo_trabajo || '', r.equipo_intervenido || '', r.planta || '', r.aviso_sap || '', r.tarea || '',
      r.descripcion || '', r.material_utilizado || '',
      r.horas_trabajadas || '', r.estado || '', r.ubicacion_texto || '',
      r.revisado_por || '', r.comentario_admin || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `registros_${hoy()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const printRecord = (r) => {
    const estadoBadge = () => {
      if (['Terminado','Completado'].includes(r.estado)) return `<span style="background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:8px;font-size:12px">${r.estado}</span>`
      if (['En Proceso','En progreso'].includes(r.estado)) return `<span style="background:#fef3c7;color:#d97706;padding:2px 8px;border-radius:8px;font-size:12px">${r.estado}</span>`
      return `<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:8px;font-size:12px">${r.estado}</span>`
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Registro ${r.fecha}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:2cm;color:#111;font-size:13px}
      h2{color:#12122a;margin:0}p{margin:2px 0;color:#888;font-size:12px}
      hr{border:none;border-top:2px solid #e8962e;margin:16px 0}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{background:#12122a;color:white;padding:7px 10px;text-align:left;font-size:12px}
      td{padding:6px 10px;border-bottom:1px solid #eee;font-size:12px}
      tr:nth-child(even) td{background:#f9f9f9}
      .fotos{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
      .fotos img{width:140px;height:105px;object-fit:cover;border-radius:4px}
      .footer{margin-top:24px;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:8px}
    </style></head><body>
    <h2>Registro de Trabajo</h2>
    <p>DAIG Chile — daigchile.cl</p><hr/>
    <table>
      <tr><th colspan="2">Detalle del registro</th></tr>
      <tr><td><b>Trabajador</b></td><td>${r.trabajador_nombre||'—'}</td></tr>
      <tr><td><b>Fecha</b></td><td>${r.fecha||'—'}</td></tr>
      <tr><td><b>Hora</b></td><td>${r.hora?.slice(0,5)||'—'}</td></tr>
      <tr><td><b>Tipo de trabajo</b></td><td>${r.tipo_trabajo||'—'}</td></tr>
      <tr><td><b>Estado</b></td><td>${r.estado ? estadoBadge() : '—'}</td></tr>
      <tr><td><b>Equipo / Activo</b></td><td>${r.equipo_intervenido||'—'}</td></tr>
      <tr><td><b>Planta / lugar</b></td><td>${r.planta||'—'}</td></tr>
      <tr><td><b>Aviso SAP</b></td><td>${r.aviso_sap||'—'}</td></tr>
      <tr><td><b>Tarea realizada</b></td><td>${r.tarea||'—'}</td></tr>
      <tr><td><b>Descripción</b></td><td>${r.descripcion||'—'}</td></tr>
      <tr><td><b>Material utilizado</b></td><td>${r.material_utilizado||'—'}</td></tr>
      <tr><td><b>Horas trabajadas</b></td><td>${r.horas_trabajadas ? r.horas_trabajadas+'h' : '—'}</td></tr>
      <tr><td><b>Ubicación GPS</b></td><td>${r.ubicacion_texto||'—'}</td></tr>
      ${r.revisado_por ? `<tr><td><b>Revisado por</b></td><td>${r.revisado_por} — ${new Date(r.revisado_at).toLocaleDateString('es-CL')}</td></tr>` : ''}
      ${r.comentario_admin ? `<tr><td><b>Comentario supervisor</b></td><td>${r.comentario_admin}</td></tr>` : ''}
    </table>
    ${r.fotos?.length ? `<h3 style="margin-top:20px">Fotografías (${r.fotos.length})</h3><div class="fotos">${r.fotos.map(u=>`<img src="${u}"/>`).join('')}</div>` : ''}
    <div class="footer">Generado el ${new Date().toLocaleDateString('es-CL')} — DAIG Chile</div>
    </body></html>`

    const win = window.open('', '_blank', 'width=800,height=700')
    win.document.write(html); win.document.close(); win.focus()
    setTimeout(() => win.print(), 600)
  }

  const saveComment = async (id) => {
    setSavingComment(id)
    await supabase.from('registros_trabajo').update({ comentario_admin: comentarios[id] || null }).eq('id', id)
    setSavingComment(null)
    setRegistros(prev => prev.map(r => r.id === id ? { ...r, comentario_admin: comentarios[id] } : r))
    loadStats()
  }

  const markReviewed = async (id) => {
    setMarkingReviewed(id)
    const now = new Date().toISOString()
    await supabase.from('registros_trabajo').update({ revisado_por: adminNombre, revisado_at: now }).eq('id', id)
    setMarkingReviewed(null)
    setRegistros(prev => prev.map(r => r.id === id ? { ...r, revisado_por: adminNombre, revisado_at: now } : r))
    loadStats()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hayFiltros = filtroTrabajador || filtroEstado || filtroTexto || filtroFechaDesde || filtroFechaHasta

  return (
    <div className="admin-section">
      {modalUrl && <PhotoModal url={modalUrl} onClose={() => setModalUrl(null)} />}

      <div className="admin-section-header">
        <h3>Registros de Trabajadores</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="admin-badge">{total} registros</span>
          <button className="admin-btn-outline" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={exportCSV}>
            ↓ Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <StatCard label="Horas esta semana"    value={stats.horas % 1 === 0 ? stats.horas : stats.horas.toFixed(1)} color="#e8962e" sub="lun–hoy" />
        <StatCard label="Terminados"           value={stats.terminados}  color="#22c55e" />
        <StatCard label="En Proceso"           value={stats.enProceso}   color="#f59e0b" />
        <StatCard label="Pendiente repuesto"   value={stats.pendientes}  color="#ef4444" sub={stats.pendientes > 0 ? 'requieren atención' : ''} />
      </div>

      {/* Filtros */}
      <div className="reg-filters">
        <div className="reg-filter-group reg-filter-group--wide">
          <label>Buscar</label>
          <input type="text" value={filtroTexto}
            onChange={e => { setFiltroTexto(e.target.value); setPage(0) }}
            placeholder="Tarea, equipo, planta, SAP, trabajador..." />
        </div>
        <div className="reg-filter-group">
          <label>Trabajador</label>
          <select value={filtroTrabajador} onChange={e => { setFiltroTrabajador(e.target.value); setPage(0) }}>
            <option value="">Todos (A–Z)</option>
            {[...trabajadores].sort((a,b) => (a.nombre||a.username||'').localeCompare(b.nombre||b.username||'','es'))
              .map(t => <option key={t.id} value={t.id}>{t.nombre || t.username}</option>)}
          </select>
        </div>
        <div className="reg-filter-group">
          <label>Estado</label>
          <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(0) }}>
            <option value="">Todos</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="reg-filter-group">
          <label>Desde</label>
          <input type="date" value={filtroFechaDesde}
            onChange={e => { setFiltroFechaDesde(e.target.value); setQuickActive(null); setPage(0) }} />
        </div>
        <div className="reg-filter-group">
          <label>Hasta</label>
          <input type="date" value={filtroFechaHasta}
            onChange={e => { setFiltroFechaHasta(e.target.value); setQuickActive(null); setPage(0) }} />
        </div>
        <div className="reg-quick-filters">
          {QUICK_FILTERS.map((qf, i) => (
            <button key={qf.label}
              className={`reg-quick-btn ${quickActive === i ? 'reg-quick-btn--active' : ''}`}
              onClick={() => applyQuick(qf)}>{qf.label}</button>
          ))}
        </div>
        {hayFiltros && <button className="reg-clear-btn" onClick={clearAll}>Limpiar</button>}
      </div>

      {loading && <div className="reg-loading"><div className="admin-spinner"></div></div>}
      {!loading && registros.length === 0 && <p className="reg-empty">No hay registros con los filtros seleccionados.</p>}

      {!loading && registros.length > 0 && (
        <div className="reg-table-wrap">
          <table className="reg-table">
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    {col.label}<SortIcon active={sortCol === col.key} asc={sortAsc} />
                  </th>
                ))}
                <th>Fotos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {registros.map(r => (
                <React.Fragment key={r.id}>
                  <tr className={`reg-row ${expandedId === r.id ? 'reg-row--open' : ''}`}
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    <td className="reg-td-worker">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {r.revisado_por && <span title={`Revisado por ${r.revisado_por}`} style={{ color: '#22c55e', fontSize: '0.75rem' }}>✓</span>}
                        {r.trabajador_nombre || r.trabajador_id?.slice(0,8)}
                      </div>
                    </td>
                    <td className="reg-td-fecha">{r.fecha}</td>
                    <td className="reg-td-tipo">{r.tipo_trabajo || <span className="reg-empty-cell">—</span>}</td>
                    <td className="reg-td-tarea">
                      <div>{r.tarea}</div>
                      {r.equipo_intervenido && <div className="reg-equipo-sub">{r.equipo_intervenido}</div>}
                    </td>
                    <td>
                      {r.estado
                        ? <span className={`reg-estado-badge reg-estado-badge--${estadoClass(r.estado)}`}>{r.estado}</span>
                        : <span className="reg-empty-cell">—</span>}
                    </td>
                    <td className="reg-td-hrs">{r.horas_trabajadas ? `${r.horas_trabajadas}h` : <span className="reg-empty-cell">—</span>}</td>
                    <td className="reg-td-fotos">
                      {r.fotos?.length > 0
                        ? <div className="reg-thumb-row">
                            {r.fotos.slice(0,3).map((url,i) => (
                              <HeicImage key={i} src={url} className="reg-thumb" alt=""
                                onClick={e => { e.stopPropagation(); setModalUrl(url) }} />
                            ))}
                            {r.fotos.length > 3 && <span className="reg-thumb-more">+{r.fotos.length-3}</span>}
                          </div>
                        : <span className="reg-empty-cell">—</span>}
                    </td>
                    <td>
                      <svg className="reg-chevron" viewBox="0 0 24 24"
                        style={{ transform: expandedId === r.id ? 'rotate(180deg)' : 'none' }}>
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                      </svg>
                    </td>
                  </tr>

                  {expandedId === r.id && (
                    <tr className="reg-expanded-row">
                      <td colSpan={8}>
                        <div className="reg-expanded-body">
                          {r.equipo_intervenido && (
                            <div className="reg-field">
                              <span className="reg-label">Equipo / Activo intervenido</span>
                              <p>{r.equipo_intervenido}</p>
                            </div>
                          )}
                          {r.planta && (
                            <div className="reg-field">
                              <span className="reg-label">Planta / lugar de trabajo</span>
                              <p>{r.planta}</p>
                            </div>
                          )}
                          {r.aviso_sap && (
                            <div className="reg-field">
                              <span className="reg-label">Aviso SAP</span>
                              <p>{r.aviso_sap}</p>
                            </div>
                          )}
                          {r.descripcion && (
                            <div className="reg-field">
                              <span className="reg-label">Descripción</span>
                              <p>{r.descripcion}</p>
                            </div>
                          )}
                          {r.material_utilizado && (
                            <div className="reg-field">
                              <span className="reg-label">Material utilizado</span>
                              <p>{r.material_utilizado}</p>
                            </div>
                          )}
                          {r.ubicacion_texto && (
                            <div className="reg-field">
                              <span className="reg-label">Ubicación</span>
                              <p>{r.ubicacion_texto}</p>
                              {r.ubicacion_lat && (
                                <a href={`https://maps.google.com/?q=${r.ubicacion_lat},${r.ubicacion_lng}`}
                                  target="_blank" rel="noopener noreferrer" className="reg-maps-link">
                                  Ver en Google Maps →
                                </a>
                              )}
                            </div>
                          )}
                          {r.fotos?.length > 0 && (
                            <div className="reg-field">
                              <span className="reg-label">Todas las fotos ({r.fotos.length})</span>
                              <div className="reg-foto-grid">
                                {r.fotos.map((url,i) => (
                                  <HeicImage key={i} src={url} className="reg-foto" alt="" onClick={() => setModalUrl(url)} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Comentario del supervisor */}
                          <div className="reg-field">
                            <span className="reg-label">Comentario supervisor</span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: 4 }}>
                              <textarea
                                value={comentarios[r.id] ?? ''}
                                onChange={e => setComentarios(prev => ({ ...prev, [r.id]: e.target.value }))}
                                onClick={e => e.stopPropagation()}
                                placeholder="Agregar comentario o nota interna..."
                                rows={2}
                                style={{
                                  flex: 1, background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
                                  color: '#fff', padding: '6px 8px', fontSize: '0.85rem', resize: 'vertical',
                                }}
                              />
                              <button
                                className="admin-btn-outline"
                                style={{ fontSize: '0.78rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
                                onClick={e => { e.stopPropagation(); saveComment(r.id) }}
                                disabled={savingComment === r.id}
                              >
                                {savingComment === r.id ? 'Guardando...' : 'Guardar'}
                              </button>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                            {r.revisado_por ? (
                              <span style={{ fontSize: '0.8rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                                ✓ Revisado por {r.revisado_por} — {new Date(r.revisado_at).toLocaleDateString('es-CL')}
                              </span>
                            ) : (
                              <button
                                className="admin-btn-outline"
                                style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                                onClick={e => { e.stopPropagation(); markReviewed(r.id) }}
                                disabled={markingReviewed === r.id}
                              >
                                {markingReviewed === r.id ? 'Marcando...' : '✓ Marcar como revisado'}
                              </button>
                            )}
                            <button
                              className="admin-btn-outline"
                              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                              onClick={e => { e.stopPropagation(); printRecord(r) }}
                            >
                              🖨 Exportar PDF
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="reg-pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p-1)}>← Anterior</button>
          <span>{page+1} / {totalPages}</span>
          <button disabled={page >= totalPages-1} onClick={() => setPage(p => p+1)}>Siguiente →</button>
        </div>
      )}
    </div>
  )
}

export default RegistrosManager
