import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem' }}>{title}</h4>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a9ab0', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const TIPO = { correctiva: 'Correctiva', preventiva: 'Preventiva', predictiva: 'Predictiva', mejora: 'Mejora' }
const PRIORIDAD = { alta: 'Alta', media: 'Media', baja: 'Baja' }
const ESTADO = { abierta: 'Abierta', en_proceso: 'En proceso', cerrada: 'Cerrada', anulada: 'Anulada' }
const ESTADO_COLOR = { abierta: '#f59e0b', en_proceso: '#3b82f6', cerrada: '#22c55e', anulada: '#9a9ab0' }

const EMPTY_OT = {
  activo_id: '', aviso_sap: '', tipo: 'correctiva', prioridad: 'media', estado: 'abierta',
  descripcion: '', fecha_aviso: '', fecha_llegada: '', fecha_inicio: '', fecha_termino: '',
  fecha_puesta_marcha: '', equipo_detenido: false,
}

// Campos de tiempo que alimentan los indicadores (disponibilidad / MTBF / MTTR)
const TIEMPOS = [
  ['fecha_aviso', 'Aviso de la falla'],
  ['fecha_llegada', 'Llegada a terreno'],
  ['fecha_inicio', 'Inicio de intervención'],
  ['fecha_termino', 'Término de intervención'],
  ['fecha_puesta_marcha', 'Puesta en marcha'],
]

// timestamptz (ISO/UTC) ↔ valor de <input type="datetime-local"> (hora local)
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = (val) => (val ? new Date(val).toISOString() : null)

const fmtFecha = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function OtManager() {
  const [ots, setOts] = useState([])
  const [activos, setActivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [edit, setEdit] = useState(null)   // objeto OT en edición (o EMPTY_OT para nueva)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('abiertas')  // 'abiertas' | 'todas'

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: ot }, { data: act }] = await Promise.all([
      supabase.from('ot').select('*, activo:activos(codigo, equipo)').order('created_at', { ascending: false }),
      supabase.from('activos').select('id, codigo, equipo, estado').eq('estado', 'activo').order('codigo'),
    ])
    setOts(ot || [])
    setActivos(act || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000) }
  const setF = (k, v) => setEdit(prev => ({ ...prev, [k]: v }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = {
        activo_id: edit.activo_id || null,
        aviso_sap: (edit.aviso_sap || '').trim() || null,
        tipo: edit.tipo,
        prioridad: edit.prioridad,
        estado: edit.estado,
        descripcion: (edit.descripcion || '').trim() || null,
        fecha_aviso: fromLocalInput(edit.fecha_aviso),
        fecha_llegada: fromLocalInput(edit.fecha_llegada),
        fecha_inicio: fromLocalInput(edit.fecha_inicio),
        fecha_termino: fromLocalInput(edit.fecha_termino),
        fecha_puesta_marcha: fromLocalInput(edit.fecha_puesta_marcha),
        equipo_detenido: !!edit.equipo_detenido,
      }
      const q = edit.id
        ? supabase.from('ot').update(payload).eq('id', edit.id)
        : supabase.from('ot').insert(payload)
      const { error: e2 } = await q
      if (e2) throw e2
      flash(edit.id ? `OT ${edit.numero} actualizada.` : 'OT creada.')
      setEdit(null); loadData()
    } catch (err) {
      setError(/aviso_sap/i.test(err.message) && /duplicate|unique/i.test(err.message)
        ? 'Ya existe una OT con ese aviso SAP.'
        : (err.message || 'Error al guardar.'))
    } finally { setSaving(false) }
  }

  const delRow = async (row) => {
    if (!confirm(`¿Eliminar la OT ${row.numero || ''}? Esta acción no se puede deshacer.`)) return
    setDeleting(row.id)
    try {
      const { error: e2 } = await supabase.from('ot').delete().eq('id', row.id)
      if (e2) throw e2
      flash('OT eliminada.'); loadData()
    } catch (err) {
      alert(err.message)
    } finally { setDeleting(null) }
  }

  const openEdit = (row) => {
    setError('')
    setEdit({
      ...EMPTY_OT, ...row,
      activo_id: row.activo_id || '',
      aviso_sap: row.aviso_sap || '',
      descripcion: row.descripcion || '',
      fecha_aviso: toLocalInput(row.fecha_aviso),
      fecha_llegada: toLocalInput(row.fecha_llegada),
      fecha_inicio: toLocalInput(row.fecha_inicio),
      fecha_termino: toLocalInput(row.fecha_termino),
      fecha_puesta_marcha: toLocalInput(row.fecha_puesta_marcha),
    })
  }

  const visibles = filtro === 'abiertas'
    ? ots.filter(o => o.estado === 'abierta' || o.estado === 'en_proceso')
    : ots

  const actLabel = (a) => a ? (a.equipo ? `${a.codigo} — ${a.equipo}` : a.codigo) : '—'

  return (
    <div className="admin-section">
      {edit && (
        <Modal title={edit.id ? `Editar OT — ${edit.numero || ''}` : 'Nueva orden de trabajo'} onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            {error && <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {!edit.id && <p style={{ margin: '0 0 1rem', color: '#9a9ab0', fontSize: '0.8rem' }}>El número de OT se genera automáticamente al guardar (formato OT-{new Date().getFullYear()}-0001).</p>}

            <div className="admin-field"><label>Activo</label>
              <select value={edit.activo_id} onChange={e => setF('activo_id', e.target.value)}>
                <option value="">Sin asignar</option>
                {activos.map(a => <option key={a.id} value={a.id}>{actLabel(a)}</option>)}
              </select></div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="admin-field" style={{ flex: 1 }}><label>Tipo</label>
                <select value={edit.tipo} onChange={e => setF('tipo', e.target.value)}>
                  {Object.entries(TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
              <div className="admin-field" style={{ flex: 1 }}><label>Prioridad</label>
                <select value={edit.prioridad} onChange={e => setF('prioridad', e.target.value)}>
                  {Object.entries(PRIORIDAD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
              <div className="admin-field" style={{ flex: 1 }}><label>Estado</label>
                <select value={edit.estado} onChange={e => setF('estado', e.target.value)}>
                  {Object.entries(ESTADO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
            </div>

            <div className="admin-field"><label>Aviso SAP</label>
              <input type="text" value={edit.aviso_sap} onChange={e => setF('aviso_sap', e.target.value)} placeholder="N° de aviso SAP (único)" /></div>

            <div className="admin-field"><label>Descripción</label>
              <textarea rows={2} value={edit.descripcion} onChange={e => setF('descripcion', e.target.value)} placeholder="Síntoma / trabajo a realizar" /></div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0.5rem 0 1rem', paddingTop: '1rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#cfd2dc', fontWeight: 600 }}>Tiempos (para indicadores)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {TIEMPOS.map(([k, label]) => (
                  <div className="admin-field" key={k} style={{ marginBottom: 0 }}><label>{label}</label>
                    <input type="datetime-local" value={edit[k]} onChange={e => setF(k, e.target.value)} /></div>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.9rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!edit.equipo_detenido} onChange={e => setF('equipo_detenido', e.target.checked)} style={{ width: 'auto' }} />
                El equipo quedó / estuvo detenido
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="admin-btn-outline" onClick={() => setEdit(null)}>Cancelar</button>
              <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {successMsg && <div className="admin-alert admin-alert-success" style={{ marginBottom: '1rem' }}>✓ {successMsg}</div>}

      <div className="admin-section-header">
        <h3>Órdenes de Trabajo</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={filtro === 'abiertas' ? 'admin-btn-primary' : 'admin-btn-outline'} style={{ fontSize: '0.8rem', width: 'auto', marginTop: 0 }} onClick={() => setFiltro('abiertas')}>Abiertas</button>
          <button className={filtro === 'todas' ? 'admin-btn-primary' : 'admin-btn-outline'} style={{ fontSize: '0.8rem', width: 'auto', marginTop: 0 }} onClick={() => setFiltro('todas')}>Todas</button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ minHeight: '80px' }}><div className="admin-spinner"></div></div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <span className="admin-badge">{visibles.length} {filtro === 'abiertas' ? 'abiertas / en proceso' : 'en total'}</span>
            <button className="admin-btn-primary" style={{ fontSize: '0.82rem', width: 'auto', marginTop: 0 }} onClick={() => { setError(''); setEdit({ ...EMPTY_OT }) }}>+ Nueva OT</button>
          </div>
          {visibles.length === 0 ? (
            <p style={{ color: '#9a9ab0', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
              {filtro === 'abiertas' ? 'No hay OT abiertas. Crea una con "Nueva OT".' : 'Aún no hay órdenes de trabajo.'}
            </p>
          ) : (
            <div className="reg-table-wrap">
              <table className="reg-table">
                <thead><tr>
                  <th>N° OT</th><th>Activo</th><th>Tipo</th><th style={{ textAlign: 'center' }}>Prioridad</th>
                  <th style={{ textAlign: 'center' }}>Estado</th><th>Aviso</th><th style={{ textAlign: 'right' }}>Acciones</th>
                </tr></thead>
                <tbody>
                  {visibles.map(o => (
                    <tr key={o.id} className="reg-row">
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.numero || '—'}</td>
                      <td>{o.activo ? actLabel(o.activo) : <span style={{ color: '#9a9ab0' }}>—</span>}</td>
                      <td>{TIPO[o.tipo] || o.tipo}</td>
                      <td style={{ textAlign: 'center' }}>{PRIORIDAD[o.prioridad] || o.prioridad}</td>
                      <td style={{ textAlign: 'center', color: ESTADO_COLOR[o.estado] || '#9a9ab0', fontWeight: 600 }}>{ESTADO[o.estado] || o.estado}</td>
                      <td style={{ fontSize: '0.8rem', color: '#9a9ab0' }}>{fmtFecha(o.fecha_aviso)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="admin-btn-outline" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => openEdit(o)}>Editar</button>
                          <button className="admin-btn-danger" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => delRow(o)} disabled={deleting === o.id}>{deleting === o.id ? '...' : 'Eliminar'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default OtManager
