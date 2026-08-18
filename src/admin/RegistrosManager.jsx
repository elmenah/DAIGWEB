import React, { useState, useEffect, useCallback } from 'react'
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
  { label: 'Hoy',        desde: hoy,               hasta: hoy },
  { label: 'Ayer',       desde: ayer,               hasta: ayer },
  { label: 'Esta semana',desde: lunesDeEstaSemana,  hasta: hoy },
]

function PhotoModal({ url, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="reg-modal-overlay" onClick={onClose}>
      <button className="reg-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
      <img
        src={url}
        className="reg-modal-img"
        onClick={(e) => e.stopPropagation()}
        alt="foto registro"
      />
    </div>
  )
}

function RegistrosManager() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [modalUrl, setModalUrl] = useState(null)

  const [filtroTrabajador, setFiltroTrabajador] = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [quickActive, setQuickActive] = useState(null)

  const [trabajadores, setTrabajadores] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('registros_trabajo')
      .select('*', { count: 'exact' })
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (filtroTrabajador) query = query.eq('trabajador_id', filtroTrabajador)
    if (filtroFechaDesde) query = query.gte('fecha', filtroFechaDesde)
    if (filtroFechaHasta) query = query.lte('fecha', filtroFechaHasta)

    const { data, count } = await query
    setRegistros(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [filtroTrabajador, filtroFechaDesde, filtroFechaHasta, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username, email')
      .eq('role', 'trabajador')
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
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
    setQuickActive(null)
    setPage(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="admin-section">
      {modalUrl && <PhotoModal url={modalUrl} onClose={() => setModalUrl(null)} />}

      <div className="admin-section-header">
        <h3>Registros de Trabajadores</h3>
        <span className="admin-badge">{total} registros</span>
      </div>

      {/* Filtros */}
      <div className="reg-filters">
        <div className="reg-filter-group">
          <label>Trabajador</label>
          <select
            value={filtroTrabajador}
            onChange={(e) => { setFiltroTrabajador(e.target.value); setPage(0) }}
          >
            <option value="">Todos</option>
            {trabajadores.map(t => (
              <option key={t.id} value={t.id}>
                {t.username || t.email}
              </option>
            ))}
          </select>
        </div>

        <div className="reg-filter-group">
          <label>Desde</label>
          <input
            type="date"
            value={filtroFechaDesde}
            onChange={(e) => { setFiltroFechaDesde(e.target.value); setQuickActive(null); setPage(0) }}
          />
        </div>

        <div className="reg-filter-group">
          <label>Hasta</label>
          <input
            type="date"
            value={filtroFechaHasta}
            onChange={(e) => { setFiltroFechaHasta(e.target.value); setQuickActive(null); setPage(0) }}
          />
        </div>

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

        <button className="reg-clear-btn" onClick={clearAll}>Limpiar</button>
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
                <th>Trabajador</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Tarea / Equipo</th>
                <th>Estado</th>
                <th>Hrs</th>
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
                        ? <span className={`reg-estado-badge reg-estado-badge--${r.estado === 'Terminado' ? 'ok' : r.estado === 'En Proceso' ? 'wip' : 'pending'}`}>
                            {r.estado}
                          </span>
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
                              <img
                                key={i}
                                src={url}
                                className="reg-thumb"
                                alt=""
                                onClick={(e) => { e.stopPropagation(); setModalUrl(url) }}
                              />
                            ))}
                            {r.fotos.length > 3 && (
                              <span className="reg-thumb-more">+{r.fotos.length - 3}</span>
                            )}
                          </div>
                        : <span className="reg-empty-cell">—</span>
                      }
                    </td>
                    <td>
                      <svg
                        className="reg-chevron"
                        viewBox="0 0 24 24"
                        style={{ transform: expandedId === r.id ? 'rotate(180deg)' : 'none' }}
                      >
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
                              <span className="reg-label">Ubicación completa</span>
                              <p>{r.ubicacion_texto}</p>
                              {r.ubicacion_lat && (
                                <a
                                  href={`https://maps.google.com/?q=${r.ubicacion_lat},${r.ubicacion_lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="reg-maps-link"
                                >
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
                                  <img
                                    key={i}
                                    src={url}
                                    className="reg-foto"
                                    alt=""
                                    onClick={() => setModalUrl(url)}
                                  />
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

      {/* Paginación */}
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
