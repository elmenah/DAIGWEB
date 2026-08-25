import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePermisosAuth } from '../permisos/PermisosAuthContext'
import logoImg from '../assets/logo.jpeg'

const ESTADO = {
  formulario_ejecucion: { label: 'Borrador',          pill: 'permisos-pill--borrador' },
  pendiente_aprobacion: { label: 'Pend. Aprobación',  pill: 'permisos-pill--pendiente' },
  permiso_ejecucion:    { label: 'Activo',             pill: 'permisos-pill--activo' },
  completado:           { label: 'Completado',         pill: 'permisos-pill--completado' },
  rechazado:            { label: 'Rechazado',          pill: 'permisos-pill--rechazado' },
  caducado:             { label: 'Caducado',           pill: 'permisos-pill--caducado' },
}

function EstadoPill({ estado }) {
  const e = ESTADO[estado] || { label: estado, pill: '' }
  return <span className={`permisos-pill ${e.pill}`}>{e.label}</span>
}

function Section({ title, children }) {
  return (
    <div className="permisos-detalle-section">
      <div className="permisos-detalle-section-title">{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="permisos-detalle-row">
      <span className="permisos-detalle-label">{label}</span>
      <span className="permisos-detalle-value">{String(value)}</span>
    </div>
  )
}

function Chip({ text, warning }) {
  return (
    <span className={`permisos-chip ${warning ? 'permisos-chip--warning' : ''}`}>{text}</span>
  )
}

function FirmaCard({ label, uri }) {
  return (
    <div className="permisos-firma-card">
      <div className="permisos-firma-header">
        <span>{label}</span>
        {uri
          ? <span className="permisos-firma-ok">✓ Firmado</span>
          : <span className="permisos-firma-pending">Pendiente</span>
        }
      </div>
      <div className="permisos-firma-body">
        {uri
          ? <img src={uri} alt={`Firma ${label}`} style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }} />
          : <span className="permisos-firma-empty">Sin firma</span>
        }
      </div>
    </div>
  )
}

export default function PermisoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role, logout } = usePermisosAuth()

  const [permiso, setPermiso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)

  const canApprove =
    permiso?.estado === 'pendiente_aprobacion' &&
    (role === 'supervisor' || role === 'seguridad' || role === 'admin')

  const fetchPermiso = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('adv_permisos').select('*').eq('id', id).single()
    if (data) setPermiso(data)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchPermiso() }, [fetchPermiso])

  const handleAction = async (nuevoEstado) => {
    const accion = nuevoEstado === 'permiso_ejecucion' ? 'aprobar' : 'rechazar'
    if (!window.confirm(`¿Confirmas ${accion} este permiso?`)) return
    setActioning(true)
    await supabase
      .from('adv_permisos')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', id)
    await fetchPermiso()
    setActioning(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/permisos', { replace: true })
  }

  if (loading) {
    return <div className="admin-loading"><div className="admin-spinner"></div></div>
  }

  if (!permiso) {
    return (
      <div className="trab-panel">
        <p className="trab-empty">Permiso no encontrado.</p>
      </div>
    )
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
            <button className="trab-logout-btn" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="trab-main">
        {/* Volver */}
        <button className="permisos-back-btn" onClick={() => navigate('/permisos/panel')}>
          ← Volver a la lista
        </button>

        {/* Card principal */}
        <div className="permisos-detalle-header-card">
          <div>
            <div className="permisos-detalle-id">PT-{String(permiso.id).padStart(4, '0')}</div>
            <div className="permisos-detalle-empresa">{permiso.empresa || '—'}</div>
            <div className="permisos-detalle-fecha">
              Creado: {permiso.created_at
                ? new Date(permiso.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '—'}
            </div>
          </div>
          <EstadoPill estado={permiso.estado} />
        </div>

        <Section title="Antecedentes del Trabajo">
          <Row label="Empresa"       value={permiso.empresa} />
          <Row label="N° Contrato"   value={permiso.contrato} />
          <Row label="Gerencia"      value={permiso.gerencia} />
          <Row label="Subgerencia"   value={permiso.subgerencia} />
          <Row label="Lugar"         value={permiso.lugar} />
          <Row label="Turno"         value={permiso.turno} />
          <Row label="Hora inicio"   value={permiso.hora_inicio} />
          <Row label="Hora término"  value={permiso.hora_termino} />
          <Row label="Fecha"         value={permiso.fecha} />
          <Row label="Procedimientos" value={permiso.procedimientos} />
        </Section>

        {permiso.tipo_trabajo?.length > 0 && (
          <Section title="Tipo de Trabajo">
            <div className="permisos-chips">
              {permiso.tipo_trabajo.map(t => <Chip key={t} text={t} />)}
            </div>
          </Section>
        )}

        <Section title="Responsable del Trabajo">
          <Row label="Nombre" value={permiso.nombre_responsable} />
          <Row label="RUT"    value={permiso.rut_responsable} />
          <Row label="Cargo"  value={permiso.cargo_responsable} />
        </Section>

        <Section title="Análisis de Seguridad en el Trabajo">
          {permiso.analisis_trabajadores != null && (
            <Row label="Trabajadores informados" value={permiso.analisis_trabajadores ? 'Sí' : 'No'} />
          )}
          {permiso.analisis_tarea != null && (
            <Row label="Tarea analizada" value={permiso.analisis_tarea ? 'Sí' : 'No'} />
          )}
          {permiso.trabajos_cruzados != null && (
            <Row label="Trabajos cruzados" value={permiso.trabajos_cruzados ? 'Sí' : 'No'} />
          )}
          {permiso.ast_riesgos?.length > 0 && (
            <div className="permisos-chips" style={{ paddingTop: 8 }}>
              <div className="permisos-chips-label">Riesgos</div>
              {permiso.ast_riesgos.map(r => <Chip key={r} text={r} warning />)}
            </div>
          )}
          {permiso.ast_epp?.length > 0 && (
            <div className="permisos-chips" style={{ paddingTop: 8 }}>
              <div className="permisos-chips-label">EPP requerido</div>
              {permiso.ast_epp.map(e => <Chip key={e} text={e} />)}
            </div>
          )}
        </Section>

        {permiso.fotos?.length > 0 && (
          <Section title={`Fotos del trabajo (${permiso.fotos.length})`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 16px' }}>
              {permiso.fotos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  />
                </a>
              ))}
            </div>
          </Section>
        )}

        <Section title="Firmas de Conformidad">
          <div className="permisos-firmas-grid">
            <FirmaCard label="Solicitante"         uri={permiso.firma_solicitante} />
            <FirmaCard label="Supervisor"          uri={permiso.firma_supervisor} />
            <FirmaCard label="Inspector Seguridad" uri={permiso.firma_seguridad} />
          </div>
        </Section>

        {canApprove && (
          <div className="permisos-acciones">
            <button
              className="permisos-btn-rechazar"
              disabled={actioning}
              onClick={() => handleAction('rechazado')}
            >
              ✕ Rechazar
            </button>
            <button
              className="permisos-btn-aprobar"
              disabled={actioning}
              onClick={() => handleAction('permiso_ejecucion')}
            >
              ✓ Aprobar
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
