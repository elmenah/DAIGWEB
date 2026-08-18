import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 25

const toISO = (d) => d.toISOString().split('T')[0]
const hoy = () => toISO(new Date())
const ayer = () => { const d = new Date(); d.setDate(d.getDate() - 1); return toISO(d) }
const lunesDeEstaSemana = () => {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return toISO(d)
}

const QUICK_FILTERS = [
  { label: 'Hoy',         desde: hoy,              hasta: hoy },
  { label: 'Ayer',        desde: ayer,              hasta: ayer },
  { label: 'Esta semana', desde: lunesDeEstaSemana, hasta: hoy },
]

const ESTADOS = ['Terminado', 'En Proceso', 'Pendiente repuesto']

function estadoClass(estado) {
  if (['Terminado', 'Completado'].includes(estado)) return 'ok'
  if (['En Proceso', 'En progreso'].includes(estado)) return 'wip'
  return 'pending'
}

function PhotoModal({ url, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="reg-modal-overlay" onClick={onClose}>
      <button className="reg-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
      <img src={url} className="reg-modal-img" onClick={(e) => e.stopPropagation()} alt="foto registro" />
    </div>
  )
}

const COLUMNS = [
  { key: 'trabajador_nombre', label: 'Trabajador' },
  { key: 'fecha',             label: 'Fecha' },
  { key: 'tipo_trabajo',      label: 'Tipo' },
  { key: 'tarea',             label: 'Tarea / Equipo' },
  { key: 'estado',            label: 'Estado' },
  { key: 'horas_trabajadas',  label: 'Hrs' },
]

function SortIcon({ active, asc }) {
  return (
    <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: '0.7rem' }}>
      {active ? (asc ? '▲' : '▼') : '▲▼'}
    </span>
  )
}

function RegistrosManager() {
  const [registros, setRegistros]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [expandedId, setExpandedId]     = useState(null)
  const [modalUrl, setModalUrl]         = useState(null)

  const [filtroTrabajador, setFiltroTrabajador] = useState('')
  const [filtroEstado, setFiltroEstado]         = useState('')
  const [filtroTexto, setFiltroTexto]           = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [quickActive, setQuickActive]           = useState(null)

  const [sortCol, setSortCol]   = useState('fecha')
  const [sortAsc, setSortAsc]   = useState(false)

  const [trabajadores, setTrabajadores] = useState([])
  const [page, setPage]   = useState(0)
  const [total, setTotal] = useState(0)

  // Debounce texto para no disparar query en cada tecla
  const [textoDebounced, setTextoDebounced] = useState('')
  const debounceRef = useRef(null)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setTextoDebounced(filtroTexto), 350)
    return () => clearTimeout(debounceRef.current)
  }, [filtroTexto])

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(a => !a)
    } else {
      setSortCol(col)
      setSortAsc(false)
    }
    setPage(0)
  }

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
      query = query.or(
        `tarea.ilike.%${t}%,descripcion.ilike.%${t}%,equipo_intervenido.ilike.%${t}%,trabajador_nombre.ilike.%${t}%,material_utilizado.ilike.%${t}%`
      )
    }

    const { data, count } = await query
    setRegistros(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [filtroTrabajador, filtroEstado, filtroFechaDesde, filtroFechaHasta, textoDebounced, sortCol, sortAsc, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username, nombre')
      .eq('role', 'trabajador')
      .order('nombre')
      .then(({ data }) => setTrabajadores(data || []))
  }, [])

  const applyQuick = (qf) => {
    const idx = QUICK_FILTERS.indexOf(qf)
    if (quickActive === idx) {
      setQuickActive(null)
      setFiltroFechaDesde('')
      setFiltroFechaHasta('')
    } else {
      setQuickActive(idx)
      setFiltroFechaDesde(qf.desde())
      setFiltroFechaHasta(qf.hasta())
    }
    setPage(0)
  }

  const clearAll = () => {
    setFiltroTrabajador('')
    setFiltroEstado('')
    setFiltroTexto('')
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
    setQuickActive(null)
    setPage(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hayFiltros = filtroTrabajador || filtroEstado || filtroTexto || filtroFechaDesde || filtroFechaHasta

  return (
    <div className="admin-section">
      {modalUrl && <PhotoModal url={modalUrl} onClose={() => setModalUrl(null)} />}

      <div className="admin-section-header">
        <h3>Registros de Trabajadores</h3>
        <span className="admin-badge">{total} registros</span>
      </div>

      {/* Filtros */}
      <div className="reg-filters">
        {/* Búsqueda de texto */}
        <div className="reg-filter-group reg-filter-group--wide">
          <label>Buscar</label>
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => { setFiltroTexto(e.target.value); setPage(0) }}
            placeholder="Tarea, equipo, descripción, trabajador..."
          />
        </div>

        {/* Trabajador */}
        <div className="reg-filter-group">
          <label>Trabajador</label>
          <select value={filtroTrabajador} onChange={(e) => { setFiltroTrabajador(e.target.value); setPage(0) }}>
            <option value="">Todos (A–Z)</option>
            {[...trabajadores]
              .sort((a, b) => (a.nombre || a.username || '').localeCompare(b.nombre || b.username || '', 'es'))
              .map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre || t.username}
                </option>
              ))}
          </select>
        </div>

        {/* Estado */}
        <div className="reg-filter-group">
          <label>Estado</label>
          <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPage(0) }}>
            <option value="">Todos</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Fechas */}
        <div className="reg-filter-group">
          <label>Desde</label>
          <input type="date" value={filtroFechaDesde}
            onChange={(e) => { setFiltroFechaDesde(e.target.value); setQuickActive(null); setPage(0) }} />
        </div>
        <div className="reg-filter-group">
          <label>Hasta</label>
          <input type="date" value={filtroFechaHasta}
            onChange={(e) => { setFiltroFechaHasta(e.target.value); setQuickActive(null); setPage(0) }} />
        </div>

        {/* Quick filters + limpiar */}
        <div className="reg-quick-filters">
          {QUICK_FILTERS.map((qf, i) => (
            <button
              key={qf.label}
              className={`reg-quick-btn ${quickActive === i ? 'reg-quick-btn--active' : ''}`}
              onClick={() => applyQuick(qf)}
            >
              {qf.label}
            </button>
          ))}
        </div>

        {hayFiltros && (
          <button className="reg-clear-btn" onClick={clearAll}>Limpiar</button>
        )}
      </div>

      {/* Tabla */}
      {loading && <div className="reg-loading"><div className="admin-spinner"></div></div>}

      {!loading && registros.length === 0 && (
        <p className="reg-empty">No hay registros con los filtros seleccionados.</p>
      )}

      {!loading && registros.length > 0 && (
        <div className="reg-table-wrap">
          <table className="reg-table">
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                  >
                    {col.label}
                    <SortIcon active={sortCol === col.key} asc={sortAsc} />
                  </th>
                ))}
                <th>Fotos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {registros.map(r => (
                <React.Fragment key={r.id}>
                  <tr
                    className={`reg-row ${expandedId === r.id ? 'reg-row--open' : ''}`}
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <td className="reg-td-worker">
                      {r.trabajador_nombre || r.trabajador_id?.slice(0, 8)}
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
                        : <span className="reg-empty-cell">—</span>
                      }
                    </td>
                    <td className="reg-td-hrs">
                      {r.horas_trabajadas ? `${r.horas_trabajadas}h` : <span className="reg-empty-cell">—</span>}
                    </td>
                    <td className="reg-td-fotos">
                      {r.fotos?.length > 0
                        ? <div className="reg-thumb-row">
                            {r.fotos.slice(0, 3).map((url, i) => (
                              <img key={i} src={url} className="reg-thumb" alt=""
                                onClick={(e) => { e.stopPropagation(); setModalUrl(url) }} />
                            ))}
                            {r.fotos.length > 3 && <span className="reg-thumb-more">+{r.fotos.length - 3}</span>}
                          </div>
                        : <span className="reg-empty-cell">—</span>
                      }
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
                                {r.fotos.map((url, i) => (
                                  <img key={i} src={url} className="reg-foto" alt=""
                                    onClick={() => setModalUrl(url)} />
                                ))}
                              </div>
                            </div>
                          )}
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
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
        </div>
      )}
    </div>
  )
}

export default RegistrosManager
