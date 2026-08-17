import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { supabase } from '../lib/supabase'
import logoImg from '../assets/logo.jpeg'

const today = () => new Date().toISOString().split('T')[0]
const nowTime = () => new Date().toTimeString().slice(0, 5)

function TrabajadoresPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState('form') // 'form' | 'historial'
  const [workerName, setWorkerName] = useState('')

  // Form state
  const [fecha, setFecha] = useState(today())
  const [hora, setHora] = useState(nowTime())
  const [tarea, setTarea] = useState('')
  const [tipoTrabajo, setTipoTrabajo] = useState('')
  const [equipoIntervenido, setEquipoIntervenido] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [materialUtilizado, setMaterialUtilizado] = useState('')
  const [horasTrabajadas, setHorasTrabajadas] = useState('')
  const [estado, setEstado] = useState('Completado')
  const [ubicacion, setUbicacion] = useState('')
  const [ubicacionLat, setUbicacionLat] = useState(null)
  const [ubicacionLng, setUbicacionLng] = useState(null)
  const [fotos, setFotos] = useState([])
  const [fotosPreviews, setFotosPreviews] = useState([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null) // 'ok' | 'error'
  const fileInputRef = useRef(null)

  // Historial state
  const [registros, setRegistros] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.username) setWorkerName(data.username)
      })
  }, [user])

  useEffect(() => {
    if (view === 'historial') loadHistorial()
  }, [view])

  const loadHistorial = async () => {
    setHistLoading(true)
    const { data } = await supabase
      .from('registros_trabajo')
      .select('*')
      .eq('trabajador_id', user.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .limit(50)
    setRegistros(data || [])
    setHistLoading(false)
  }

  const getGPS = () => {
    if (!navigator.geolocation) {
      setUbicacion('Geolocalización no disponible en este dispositivo')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacionLat(pos.coords.latitude)
        setUbicacionLng(pos.coords.longitude)
        setUbicacion(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`)
        setGpsLoading(false)
      },
      () => {
        setGpsLoading(false)
        setUbicacion('No se pudo obtener ubicación — ingresa manualmente')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleFotos = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setFotos(prev => [...prev, ...files])
    const previews = files.map(f => URL.createObjectURL(f))
    setFotosPreviews(prev => [...prev, ...previews])
  }

  const removeFoto = (idx) => {
    setFotos(prev => prev.filter((_, i) => i !== idx))
    setFotosPreviews(prev => {
      URL.revokeObjectURL(prev[idx])
      return prev.filter((_, i) => i !== idx)
    })
  }

  const uploadFotos = async () => {
    const urls = []
    for (const file of fotos) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('registros-fotos')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (!error) {
        const { data: urlData } = supabase.storage
          .from('registros-fotos')
          .getPublicUrl(path)
        urls.push(urlData.publicUrl)
      }
    }
    return urls
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!tarea.trim()) return
    setSending(true)
    setSendStatus(null)

    try {
      const fotosUrls = fotos.length > 0 ? await uploadFotos() : []
      const { error } = await supabase.from('registros_trabajo').insert({
        trabajador_id: user.id,
        trabajador_nombre: workerName,
        fecha,
        hora,
        tipo_trabajo: tipoTrabajo,
        equipo_intervenido: equipoIntervenido.trim(),
        tarea: tarea.trim(),
        descripcion: descripcion.trim(),
        material_utilizado: materialUtilizado.trim(),
        horas_trabajadas: horasTrabajadas ? parseFloat(horasTrabajadas) : null,
        estado,
        ubicacion_texto: ubicacion.trim(),
        ubicacion_lat: ubicacionLat,
        ubicacion_lng: ubicacionLng,
        fotos: fotosUrls,
      })
      if (error) throw error
      setSendStatus('ok')
      // reset form
      setTarea('')
      setTipoTrabajo('')
      setEquipoIntervenido('')
      setDescripcion('')
      setMaterialUtilizado('')
      setHorasTrabajadas('')
      setEstado('Completado')
      setUbicacion('')
      setUbicacionLat(null)
      setUbicacionLng(null)
      setFotos([])
      setFotosPreviews([])
      setFecha(today())
      setHora(nowTime())
    } catch {
      setSendStatus('error')
    }
    setSending(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/trabajadores', { replace: true })
  }

  return (
    <div className="trab-panel">
      {/* Header */}
      <header className="trab-header">
        <div className="trab-header-inner">
          <div className="trab-header-brand">
            <img src={logoImg} alt="DAIG" className="trab-logo" />
            <span>Portal Trabajadores</span>
          </div>
          <div className="trab-header-right">
            {workerName && <span className="trab-worker-name">{workerName}</span>}
            <button className="trab-logout-btn" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="trab-tabs">
        <button
          className={`trab-tab ${view === 'form' ? 'trab-tab--active' : ''}`}
          onClick={() => { setView('form'); setSendStatus(null) }}
        >
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
          Nuevo registro
        </button>
        <button
          className={`trab-tab ${view === 'historial' ? 'trab-tab--active' : ''}`}
          onClick={() => setView('historial')}
        >
          <svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
          Mi historial
        </button>
      </div>

      <main className="trab-main">
        {view === 'form' && (
          <div className="trab-form-section">
            <h2 className="trab-section-title">Registro de trabajo del día</h2>

            {sendStatus === 'ok' && (
              <div className="trab-alert trab-alert--ok">
                ✓ Registro enviado correctamente.
              </div>
            )}
            {sendStatus === 'error' && (
              <div className="trab-alert trab-alert--error">
                Error al enviar. Verifica tu conexión e intenta nuevamente.
              </div>
            )}

            <form onSubmit={handleSubmit} className="trab-form">
              <div className="trab-row">
                <div className="trab-field">
                  <label htmlFor="t-fecha">Fecha</label>
                  <input
                    id="t-fecha"
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    required
                  />
                </div>
                <div className="trab-field">
                  <label htmlFor="t-hora">Hora</label>
                  <input
                    id="t-hora"
                    type="time"
                    value={hora}
                    onChange={e => setHora(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="trab-row">
                <div className="trab-field">
                  <label htmlFor="t-tipo">Tipo de trabajo</label>
                  <select id="t-tipo" value={tipoTrabajo} onChange={e => setTipoTrabajo(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    <option>Mantención preventiva</option>
                    <option>Mantención correctiva</option>
                    <option>Instalación</option>
                    <option>Inspección</option>
                    <option>Soldadura</option>
                    <option>Piping</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div className="trab-field">
                  <label htmlFor="t-estado">Estado</label>
                  <select id="t-estado" value={estado} onChange={e => setEstado(e.target.value)}>
                    <option>Completado</option>
                    <option>En progreso</option>
                    <option>Pendiente repuesto</option>
                  </select>
                </div>
              </div>

              <div className="trab-field">
                <label htmlFor="t-equipo">Equipo / Activo intervenido</label>
                <input
                  id="t-equipo"
                  type="text"
                  value={equipoIntervenido}
                  onChange={e => setEquipoIntervenido(e.target.value)}
                  placeholder="Ej: Bomba centrífuga B-03, Compresor sector norte"
                />
              </div>

              <div className="trab-field">
                <label htmlFor="t-tarea">Tarea realizada *</label>
                <input
                  id="t-tarea"
                  type="text"
                  value={tarea}
                  onChange={e => setTarea(e.target.value)}
                  placeholder="Ej: Cambio de rodamiento y sello mecánico"
                  required
                />
              </div>

              <div className="trab-field">
                <label htmlFor="t-desc">Descripción / Lo que se reparó</label>
                <textarea
                  id="t-desc"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Describe el trabajo realizado, observaciones, dificultades..."
                  rows={3}
                />
              </div>

              <div className="trab-row">
                <div className="trab-field">
                  <label htmlFor="t-material">Material utilizado</label>
                  <textarea
                    id="t-material"
                    value={materialUtilizado}
                    onChange={e => setMaterialUtilizado(e.target.value)}
                    placeholder="Ej: Rodamiento 6205, 2m tubo 2&quot;, cinta teflón"
                    rows={2}
                  />
                </div>
                <div className="trab-field">
                  <label htmlFor="t-horas">Horas trabajadas</label>
                  <input
                    id="t-horas"
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={horasTrabajadas}
                    onChange={e => setHorasTrabajadas(e.target.value)}
                    placeholder="Ej: 3.5"
                  />
                </div>
              </div>

              <div className="trab-field">
                <label>Ubicación</label>
                <div className="trab-location-row">
                  <input
                    type="text"
                    value={ubicacion}
                    onChange={e => setUbicacion(e.target.value)}
                    placeholder="Ej: Planta norte, sector 2 — o usa el GPS"
                  />
                  <button
                    type="button"
                    className="trab-gps-btn"
                    onClick={getGPS}
                    disabled={gpsLoading}
                  >
                    <svg viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                    {gpsLoading ? 'Obteniendo...' : 'GPS'}
                  </button>
                </div>
              </div>

              {/* Fotos */}
              <div className="trab-field">
                <label>Registro fotográfico</label>
                <div
                  className="trab-drop-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  <span>Toca para agregar fotos</span>
                  <small>JPG, PNG, HEIC — múltiples fotos permitidas</small>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFotos}
                    style={{ display: 'none' }}
                  />
                </div>

                {fotosPreviews.length > 0 && (
                  <div className="trab-foto-grid">
                    {fotosPreviews.map((src, i) => (
                      <div className="trab-foto-thumb" key={i}>
                        <img src={src} alt={`foto-${i + 1}`} />
                        <button
                          type="button"
                          className="trab-foto-remove"
                          onClick={() => removeFoto(i)}
                          aria-label="Quitar foto"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="trab-submit-btn" disabled={sending}>
                {sending ? (
                  <>
                    <span className="trab-spinner"></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    Enviar registro
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {view === 'historial' && (
          <div className="trab-historial-section">
            <h2 className="trab-section-title">Mi historial de registros</h2>
            {histLoading && (
              <div className="trab-hist-loading">
                <div className="admin-spinner"></div>
              </div>
            )}
            {!histLoading && registros.length === 0 && (
              <p className="trab-empty">Aún no tienes registros enviados.</p>
            )}
            <div className="trab-hist-list">
              {registros.map(r => (
                <div
                  className={`trab-hist-card ${expandedId === r.id ? 'trab-hist-card--open' : ''}`}
                  key={r.id}
                >
                  <button
                    className="trab-hist-header"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <div className="trab-hist-header-left">
                      <span className="trab-hist-fecha">{r.fecha}</span>
                      <span className="trab-hist-hora">{r.hora?.slice(0, 5)}</span>
                      {r.estado && (
                        <span className={`trab-estado-pill trab-estado-pill--${r.estado === 'Completado' ? 'ok' : r.estado === 'En progreso' ? 'wip' : 'pending'}`}>
                          {r.estado}
                        </span>
                      )}
                      <span className="trab-hist-tarea">{r.tarea}</span>
                    </div>
                    <svg
                      className="trab-hist-chevron"
                      viewBox="0 0 24 24"
                      style={{ transform: expandedId === r.id ? 'rotate(180deg)' : 'none' }}
                    >
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                  </button>

                  {expandedId === r.id && (
                    <div className="trab-hist-body">
                      {r.tipo_trabajo && (
                        <div className="trab-hist-field">
                          <span className="trab-hist-label">Tipo de trabajo</span>
                          <p>{r.tipo_trabajo}</p>
                        </div>
                      )}
                      {r.equipo_intervenido && (
                        <div className="trab-hist-field">
                          <span className="trab-hist-label">Equipo / Activo</span>
                          <p>{r.equipo_intervenido}</p>
                        </div>
                      )}
                      {r.descripcion && (
                        <div className="trab-hist-field">
                          <span className="trab-hist-label">Descripción</span>
                          <p>{r.descripcion}</p>
                        </div>
                      )}
                      {r.material_utilizado && (
                        <div className="trab-hist-field">
                          <span className="trab-hist-label">Material utilizado</span>
                          <p>{r.material_utilizado}</p>
                        </div>
                      )}
                      {r.horas_trabajadas && (
                        <div className="trab-hist-field">
                          <span className="trab-hist-label">Horas trabajadas</span>
                          <p>{r.horas_trabajadas} hrs</p>
                        </div>
                      )}
                      {r.ubicacion_texto && (
                        <div className="trab-hist-field">
                          <span className="trab-hist-label">Ubicación</span>
                          <p>{r.ubicacion_texto}</p>
                          {r.ubicacion_lat && (
                            <a
                              href={`https://maps.google.com/?q=${r.ubicacion_lat},${r.ubicacion_lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="trab-maps-link"
                            >
                              Ver en Google Maps →
                            </a>
                          )}
                        </div>
                      )}
                      {r.fotos?.length > 0 && (
                        <div className="trab-hist-field">
                          <span className="trab-hist-label">Fotos ({r.fotos.length})</span>
                          <div className="trab-hist-foto-grid">
                            {r.fotos.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`foto-${i + 1}`} className="trab-hist-foto" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default TrabajadoresPanel
