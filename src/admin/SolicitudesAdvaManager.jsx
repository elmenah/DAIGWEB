import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function SolicitudesAdvaManager() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [busq,    setBusq]    = useState('')
  const [modal,   setModal]   = useState(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('solicitudes_adva')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRows(data || []); setLoading(false) })
  }, [])

  const filtradas = rows.filter(r =>
    !busq ||
    (r.trabajador_nombre || '').toLowerCase().includes(busq.toLowerCase()) ||
    (r.planta            || '').toLowerCase().includes(busq.toLowerCase()) ||
    (r.localidad         || '').toLowerCase().includes(busq.toLowerCase()) ||
    (r.requisito         || '').toLowerCase().includes(busq.toLowerCase())
  )

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h3 style={{ margin: 0 }}>Solicitudes Adva</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            Aguas del Valle
          </p>
        </div>
        <span className="admin-badge">{rows.length} registros</span>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar por trabajador, planta, localidad o requisito…"
          value={busq}
          onChange={e => setBusq(e.target.value)}
          style={{
            width: '100%', maxWidth: 420,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 9, color: '#fff', padding: '8px 14px', fontSize: '0.88rem',
          }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skel-row" style={{ height: 52, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <p className="reg-empty">No hay solicitudes{busq ? ' con ese filtro' : ' registradas'}.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="reg-table" style={{ minWidth: 750 }}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Fecha</th>
                <th>Supervisor</th>
                <th>Planta</th>
                <th>Localidad</th>
                <th>Requisito</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(r => (
                <tr
                  key={r.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setModal(r)}
                >
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 700, color: '#E8962E', fontSize: '0.82rem', letterSpacing: '.03em' }}>
                    {r.codigo || '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                    {fmtDate(r.created_at)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.trabajador_nombre || '—'}</td>
                  <td>{r.planta || '—'}</td>
                  <td>{r.localidad || '—'}</td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.65)' }}>
                    {r.requisito || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle */}
      {modal && (
        <div
          className="reg-detail-overlay"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="reg-detail-panel" style={{ maxWidth: 520 }}>
            <div className="reg-detail-header">
              <div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                  Aguas del Valle
                </div>
                <div className="reg-detail-title">
                  Solicitud ADVA
                  {modal.codigo && (
                    <span style={{ marginLeft: 10, fontSize: '0.78rem', fontWeight: 800, color: '#E8962E', letterSpacing: '.04em' }}>
                      {modal.codigo}
                    </span>
                  )}
                </div>
                <div className="reg-detail-meta">{fmtDate(modal.created_at)}</div>
              </div>
              <button className="reg-detail-close" onClick={() => setModal(null)}>
                <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'currentColor' }}>
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="reg-detail-body" style={{ padding: '20px 24px' }}>
              {[
                { label: 'Trabajador', value: modal.trabajador_nombre },
                { label: 'Planta',     value: modal.planta },
                { label: 'Localidad',  value: modal.localidad },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.95rem' }}>{value || '—'}</div>
                </div>
              ))}

              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Requisito
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: '3px solid rgba(56,189,248,0.6)',
                  borderRadius: '0 10px 10px 0',
                  padding: '14px 16px',
                  color: '#c8d8f0',
                  fontSize: '0.92rem',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                }}>
                  {modal.requisito || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
