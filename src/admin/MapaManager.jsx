import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'

const toISO = (d) => d.toISOString().split('T')[0]
const hoy = () => toISO(new Date())
const ayer = () => { const d = new Date(); d.setDate(d.getDate() - 1); return toISO(d) }
const lunesDeEstaSemana = () => {
  const d = new Date(); const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1); return toISO(d)
}
const primerDiaDelMes = () => { const d = new Date(); d.setDate(1); return toISO(d) }

const QUICK = [
  { label: 'Hoy',         desde: hoy,              hasta: hoy },
  { label: 'Ayer',        desde: ayer,              hasta: ayer },
  { label: 'Esta semana', desde: lunesDeEstaSemana, hasta: hoy },
  { label: 'Este mes',    desde: primerDiaDelMes,   hasta: hoy },
]

const estadoColor = (e) => {
  if (['Terminado', 'Completado'].includes(e)) return '#22c55e'
  if (['En Proceso', 'En progreso'].includes(e)) return '#f59e0b'
  return '#ef4444'
}

const makeIcon = (color) => L.divIcon({
  html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 5px rgba(0,0,0,0.5)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
  className: '',
})

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [points, map])
  return null
}

function MapaManager() {
  const [registros, setRegistros]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [quickActive, setQuickActive] = useState(null)
  const [filtroTrabajador, setFiltroTrabajador] = useState('')
  const [trabajadores, setTrabajadores]         = useState([])

  useEffect(() => {
    supabase.from('profiles').select('id, username, nombre').eq('role', 'trabajador').order('nombre')
      .then(({ data }) => setTrabajadores(data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    let q = supabase
      .from('registros_trabajo')
      .select('id, trabajador_nombre, trabajador_id, fecha, hora, tarea, planta, estado, tipo_trabajo, ubicacion_lat, ubicacion_lng, ubicacion_texto')
      .not('ubicacion_lat', 'is', null)
      .order('fecha', { ascending: false })
    if (filtroDesde) q = q.gte('fecha', filtroDesde)
    if (filtroHasta) q = q.lte('fecha', filtroHasta)
    if (filtroTrabajador) q = q.eq('trabajador_id', filtroTrabajador)
    q.then(({ data }) => {
      setRegistros((data || []).filter(r => r.ubicacion_lat && r.ubicacion_lng))
      setLoading(false)
    })
  }, [filtroDesde, filtroHasta, filtroTrabajador])

  const applyQuick = (qf) => {
    const idx = QUICK.indexOf(qf)
    if (quickActive === idx) {
      setQuickActive(null); setFiltroDesde(''); setFiltroHasta('')
    } else {
      setQuickActive(idx); setFiltroDesde(qf.desde()); setFiltroHasta(qf.hasta())
    }
  }

  const points = useMemo(() => registros.map(r => ({ lat: Number(r.ubicacion_lat), lng: Number(r.ubicacion_lng), r })), [registros])

  const defaultCenter = points.length ? [points[0].lat, points[0].lng] : [-33.45, -70.65]

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h3>Mapa de ubicaciones</h3>
        <span className="admin-badge">{registros.length} registros con GPS</span>
      </div>

      {/* Filtros */}
      <div className="reg-filters" style={{ marginBottom: '1rem' }}>
        <div className="reg-filter-group">
          <label>Trabajador</label>
          <select value={filtroTrabajador} onChange={e => setFiltroTrabajador(e.target.value)}>
            <option value="">Todos</option>
            {[...trabajadores].sort((a,b) => (a.nombre||a.username||'').localeCompare(b.nombre||b.username||'','es'))
              .map(t => <option key={t.id} value={t.id}>{t.nombre || t.username}</option>)}
          </select>
        </div>
        <div className="reg-filter-group">
          <label>Desde</label>
          <input type="date" value={filtroDesde} onChange={e => { setFiltroDesde(e.target.value); setQuickActive(null) }} />
        </div>
        <div className="reg-filter-group">
          <label>Hasta</label>
          <input type="date" value={filtroHasta} onChange={e => { setFiltroHasta(e.target.value); setQuickActive(null) }} />
        </div>
        <div className="reg-quick-filters">
          {QUICK.map((qf, i) => (
            <button key={qf.label}
              className={`reg-quick-btn ${quickActive === i ? 'reg-quick-btn--active' : ''}`}
              onClick={() => applyQuick(qf)}>{qf.label}</button>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mapa-legend">
        <span><span className="mapa-dot" style={{ background: '#22c55e' }} /> Terminado</span>
        <span><span className="mapa-dot" style={{ background: '#f59e0b' }} /> En Proceso</span>
        <span><span className="mapa-dot" style={{ background: '#ef4444' }} /> Pendiente repuesto</span>
      </div>

      {loading && <div className="reg-loading"><div className="admin-spinner"></div></div>}

      {!loading && registros.length === 0 && (
        <p className="reg-empty">No hay registros con ubicación GPS para los filtros seleccionados.</p>
      )}

      {!loading && registros.length > 0 && (
        <div className="mapa-wrap">
          <MapContainer center={defaultCenter} zoom={12} style={{ width: '100%', height: '100%' }} key={registros.length + filtroDesde + filtroHasta + filtroTrabajador}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />
            {points.map(({ lat, lng, r }) => (
              <Marker key={r.id} position={[lat, lng]} icon={makeIcon(estadoColor(r.estado))}>
                <Popup maxWidth={240}>
                  <div className="mapa-popup">
                    <div className="mapa-popup-name">{r.trabajador_nombre || '—'}</div>
                    <div className="mapa-popup-fecha">{r.fecha} {r.hora?.slice(0,5) || ''}</div>
                    {r.tipo_trabajo && <div className="mapa-popup-tipo">{r.tipo_trabajo}</div>}
                    {r.tarea && <div className="mapa-popup-tarea">{r.tarea}</div>}
                    {r.planta && <div className="mapa-popup-planta">📍 {r.planta}</div>}
                    {r.ubicacion_texto && <div className="mapa-popup-coord">{r.ubicacion_texto}</div>}
                    <a
                      href={`https://maps.google.com/?q=${lat},${lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mapa-popup-gmaps"
                    >Ver en Google Maps →</a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  )
}

export default MapaManager
