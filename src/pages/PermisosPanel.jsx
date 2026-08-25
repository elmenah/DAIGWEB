import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { usePermisosAuth } from '../permisos/PermisosAuthContext'
import logoImg from '../assets/logo.jpeg'

const ESTADO = {
  formulario_ejecucion: { label: 'Borrador',           pill: 'permisos-pill--borrador' },
  pendiente_aprobacion: { label: 'Pend. Aprobación',   pill: 'permisos-pill--pendiente' },
  permiso_ejecucion:    { label: 'Activo',              pill: 'permisos-pill--activo' },
  completado:           { label: 'Completado',          pill: 'permisos-pill--completado' },
  rechazado:            { label: 'Rechazado',           pill: 'permisos-pill--rechazado' },
  caducado:             { label: 'Caducado',            pill: 'permisos-pill--caducado' },
}

const STATS = [
  { key: 'pendiente_aprobacion', label: 'Pendientes',  cls: 'permisos-stat--pendiente' },
  { key: 'permiso_ejecucion',    label: 'Activos',     cls: 'permisos-stat--activo' },
  { key: 'completado',           label: 'Completados', cls: 'permisos-stat--completado' },
  { key: 'rechazado',            label: 'Rechazados',  cls: 'permisos-stat--rechazado' },
  { key: 'caducado',             label: 'Caducados',   cls: 'permisos-stat--caducado' },
]

function EstadoPill({ estado }) {
  const e = ESTADO[estado] || { label: estado, pill: '' }
  return <span className={`permisos-pill ${e.pill}`}>{e.label}</span>
}

export default function PermisosPanel() {
  const { nombre, role, logout } = usePermisosAuth()
  const navigate = useNavigate()

  const [tab, setTab]             = useState('pendientes')
  const [permisos, setPermisos]   = useState([])
  const [stats, setStats]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [busqueda, setBusqueda]   = useState('')
  const [exporting, setExporting] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('adv_permisos')
      .select('id, empresa, subgerencia, turno, fecha, estado, nombre_responsable, created_at')
      .order('created_at', { ascending: false })

    if (tab === 'pendientes') query = query.eq('estado', 'pendiente_aprobacion')

    const [{ data }, { data: statsData }] = await Promise.all([
      query,
      supabase.from('adv_permisos').select('estado'),
    ])
    setPermisos(data || [])
    const counts = {}
    ;(statsData || []).forEach(p => { counts[p.estado] = (counts[p.estado] || 0) + 1 })
    setStats(counts)
    setLoading(false)
  }, [tab])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = permisos.filter(p =>
    !busqueda ||
    p.empresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.nombre_responsable?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.subgerencia?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data } = await supabase
        .from('adv_permisos')
        .select('*')
        .order('created_at', { ascending: false })

      const ESTADO_LABEL = {
        formulario_ejecucion: 'Borrador',
        pendiente_aprobacion: 'Pendiente aprobación',
        permiso_ejecucion:    'Activo',
        completado:           'Completado',
        rechazado:            'Rechazado',
        caducado:             'Caducado',
      }

      const rows = (data || []).map(p => ({
        'ID':                  p.id,
        'Estado':              ESTADO_LABEL[p.estado] || p.estado,
        'Empresa':             p.empresa || '',
        'N° Contrato':         p.contrato || '',
        'Gerencia':            p.gerencia || '',
        'Subgerencia':         p.subgerencia || '',
        'Lugar':               p.lugar || '',
        'Turno':               p.turno || '',
        'Fecha':               p.fecha || '',
        'Hora inicio':         p.hora_inicio || '',
        'Hora término':        p.hora_termino || '',
        'Tipo de trabajo':     Array.isArray(p.tipo_trabajo) ? p.tipo_trabajo.join(', ') : '',
        'Responsable':         p.nombre_responsable || '',
        'RUT responsable':     p.rut_responsable || '',
        'Cargo responsable':   p.cargo_responsable || '',
        'Riesgos (AST)':       Array.isArray(p.ast_riesgos) ? p.ast_riesgos.join(', ') : '',
        'EPP requerido':       Array.isArray(p.ast_epp) ? p.ast_epp.join(', ') : '',
        'Procedimientos':      p.procedimientos || '',
        'Firma solicitante':   p.firma_solicitante ? 'Sí' : 'No',
        'Firma supervisor':    p.firma_supervisor  ? 'Sí' : 'No',
        'Firma seguridad':     p.firma_seguridad   ? 'Sí' : 'No',
        'N° fotos':            Array.isArray(p.fotos) ? p.fotos.length : 0,
        'Creado':              p.created_at ? new Date(p.created_at).toLocaleString('es-CL') : '',
        'Actualizado':         p.updated_at ? new Date(p.updated_at).toLocaleString('es-CL') : '',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Permisos')

      // Ancho de columnas automático
      const cols = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length, 12) }))
      ws['!cols'] = cols

      const fecha = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `permisos_${fecha}.xlsx`)
    } catch (e) {
      alert('Error al exportar: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/permisos', { replace: true })
  }

  return (
    <div className="trab-panel">
      <header className="trab-header">
        <div className="trab-header-inner">
          <div className="trab-header-brand">
            <img src={logoImg} alt="DAIG" className="trab-logo" />
            <span>Permisos de Trabajo</span>
          </div>
          <div className="trab-header-right">
            {nombre && <span className="trab-worker-name">{nombre} · <span style={{ textTransform: 'capitalize' }}>{role}</span></span>}
            <button
              className="trab-logout-btn"
              onClick={handleExport}
              disabled={exporting}
              style={{ background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', color: '#4ade80', marginRight: 6 }}
            >
              {exporting ? 'Exportando...' : '↓ Excel'}
            </button>
            <button className="trab-logout-btn" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="permisos-stats-bar">
        {STATS.map(s => (
          <div key={s.key} className={`permisos-stat ${s.cls} ${tab === 'pendientes' && s.key === 'pendiente_aprobacion' ? 'permisos-stat--active' : ''}`}>
            <span className="permisos-stat-num">{stats[s.key] || 0}</span>
            <span className="permisos-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="trab-tabs">
        <button className={`trab-tab ${tab === 'pendientes' ? 'trab-tab--active' : ''}`} onClick={() => setTab('pendientes')}>
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          Mis Pendientes
        </button>
        <button className={`trab-tab ${tab === 'todos' ? 'trab-tab--active' : ''}`} onClick={() => setTab('todos')}>
          <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
          Todos
        </button>
      </div>

      <main className="trab-main">
        {/* Buscador */}
        <div className="permisos-search-bar">
          <input
            type="text"
            placeholder="Buscar por empresa, responsable o área..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="permisos-search-input"
          />
          <button className="admin-btn-outline" onClick={cargar} style={{ whiteSpace: 'nowrap' }}>
            Actualizar
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="trab-hist-loading"><div className="admin-spinner"></div></div>
        ) : filtrados.length === 0 ? (
          <p className="trab-empty">
            {tab === 'pendientes' ? 'No hay permisos esperando aprobación.' : 'No hay permisos registrados.'}
          </p>
        ) : (
          <div className="permisos-list">
            {filtrados.map(p => (
              <div key={p.id} className="permisos-card" onClick={() => navigate(`/permisos/panel/${p.id}`)}>
                <div className="permisos-card-top">
                  <span className="permisos-card-id">#{p.id}</span>
                  <EstadoPill estado={p.estado} />
                </div>
                <div className="permisos-card-empresa">{p.empresa || '—'}</div>
                <div className="permisos-card-meta">
                  <span><b>Responsable:</b> {p.nombre_responsable || '—'}</span>
                  <span><b>Área:</b> {p.subgerencia || '—'}</span>
                  <span><b>Fecha:</b> {p.fecha || '—'}</span>
                  <span><b>Turno:</b> {p.turno || '—'}</span>
                </div>
                <div className="permisos-card-footer">
                  Ver informe →
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
