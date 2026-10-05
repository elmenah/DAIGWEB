import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const fmtHora = (iso) => iso ? new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—'
const tareaText = (t) => (typeof t === 'string' ? t : t?.actividad || '')

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem' }}>{title}</h4>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a9ab0', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CamionesManager() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState(null)      // registro en edición
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [deleting, setDeleting] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('mantencion_camiones').select('*')
      .order('mantencion_desde', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)
    setRegistros(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openEdit = (r) => {
    setError('')
    setEdit({
      ...r,
      horometro: r.horometro?.toString() || '',
      tareas: Array.isArray(r.tareas) && r.tareas.length ? r.tareas.map(tareaText) : [''],
    })
  }

  const setField = (k, v) => setEdit(prev => ({ ...prev, [k]: v }))
  const setTarea = (i, v) => setEdit(prev => ({ ...prev, tareas: prev.tareas.map((t, idx) => idx === i ? v : t) }))
  const addTarea = () => setEdit(prev => ({ ...prev, tareas: [...prev.tareas, ''] }))
  const removeTarea = (i) => setEdit(prev => ({ ...prev, tareas: prev.tareas.length > 1 ? prev.tareas.filter((_, idx) => idx !== i) : prev.tareas }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updates = {
        ot_numero: edit.ot_numero?.trim() || null,
        patente: edit.patente?.trim() || null,
        taller: edit.taller?.trim() || null,
        equipo: edit.equipo?.trim() || null,
        mantencion_desde: edit.mantencion_desde || null,
        mantencion_hasta: edit.mantencion_hasta || null,
        horometro: edit.horometro ? parseFloat(edit.horometro) : null,
        tareas: edit.tareas.map(t => t.trim()).filter(Boolean),
      }
      const { data, error: upErr } = await supabase
        .from('mantencion_camiones').update(updates).eq('id', edit.id).select('id').single()
      if (upErr) throw upErr
      if (!data) throw new Error('No se pudo actualizar (permisos).')
      setSuccessMsg(`OT ${updates.ot_numero || ''} actualizada.`)
      setTimeout(() => setSuccessMsg(''), 4000)
      setEdit(null)
      loadData()
    } catch (err) {
      setError(err.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (r) => {
    if (!confirm(`¿Eliminar la OT ${r.ot_numero || ''} (${r.patente})? Esta acción no se puede deshacer.`)) return
    setDeleting(r.id)
    try {
      const { error: delErr } = await supabase.from('mantencion_camiones').delete().eq('id', r.id)
      if (delErr) throw delErr
      setSuccessMsg('Registro eliminado.')
      setTimeout(() => setSuccessMsg(''), 4000)
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="admin-section">
      {edit && (
        <Modal title={`Editar OT — ${edit.ot_numero || edit.patente || ''}`} onClose={() => setEdit(null)}>
          <form onSubmit={handleSave}>
            {error && <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="admin-field"><label>N° OT</label>
              <input type="text" value={edit.ot_numero || ''} onChange={e => setField('ot_numero', e.target.value)} /></div>
            <div className="admin-field"><label>Patente</label>
              <input type="text" value={edit.patente || ''} onChange={e => setField('patente', e.target.value.toUpperCase())} /></div>
            <div className="admin-field"><label>Equipo</label>
              <input type="text" value={edit.equipo || ''} onChange={e => setField('equipo', e.target.value)} /></div>
            <div className="admin-field"><label>Taller / Responsable</label>
              <input type="text" value={edit.taller || ''} onChange={e => setField('taller', e.target.value)} /></div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="admin-field" style={{ flex: 1 }}><label>Desde</label>
                <input type="date" value={edit.mantencion_desde || ''} onChange={e => setField('mantencion_desde', e.target.value)} /></div>
              <div className="admin-field" style={{ flex: 1 }}><label>Hasta</label>
                <input type="date" value={edit.mantencion_hasta || ''} onChange={e => setField('mantencion_hasta', e.target.value)} /></div>
            </div>

            <div className="admin-field"><label>Horómetro (h)</label>
              <input type="number" min="0" step="1" value={edit.horometro} onChange={e => setField('horometro', e.target.value)} /></div>

            <div className="admin-field">
              <label>Tareas realizadas</label>
              {edit.tareas.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <textarea value={t} onChange={e => setTarea(i, e.target.value)} rows={2} style={{ flex: 1 }} placeholder={`Tarea ${i + 1}`} />
                  {edit.tareas.length > 1 && (
                    <button type="button" className="admin-btn-outline" style={{ padding: '4px 10px' }} onClick={() => removeTarea(i)}>×</button>
                  )}
                </div>
              ))}
              <button type="button" className="admin-btn-outline" style={{ fontSize: '0.8rem' }} onClick={addTarea}>+ Agregar tarea</button>
            </div>

            {edit.fotos?.length > 0 && (
              <div className="admin-field">
                <label>Fotos ({edit.fotos.length})</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {edit.fotos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`foto-${i + 1}`} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {edit.firma && (
              <div className="admin-field">
                <label>Firma del trabajo — término {fmtHora(edit.hora_termino)}</label>
                <img src={edit.firma} alt="Firma" style={{ height: 60, background: '#fff', borderRadius: 6, padding: 3 }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="admin-btn-outline" onClick={() => setEdit(null)}>Cancelar</button>
              <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        </Modal>
      )}

      {successMsg && <div className="admin-alert admin-alert-success" style={{ marginBottom: '1rem' }}>✓ {successMsg}</div>}

      <div className="admin-section-header">
        <h3>Mantención de Camiones</h3>
        <span className="admin-badge">{registros.length} registros</span>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ minHeight: '80px' }}><div className="admin-spinner"></div></div>
      ) : registros.length === 0 ? (
        <p style={{ color: '#9a9ab0', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
          Aún no hay registros de mantención de camiones.
        </p>
      ) : (
        <div className="reg-table-wrap">
          <table className="reg-table">
            <thead>
              <tr>
                <th>OT</th>
                <th>Patente</th>
                <th>Equipo</th>
                <th>Mantenedor</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'center' }}>Horómetro</th>
                <th style={{ textAlign: 'center' }}>Fotos</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map(r => (
                <tr key={r.id} className="reg-row">
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{r.ot_numero || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{r.patente || '—'}</td>
                  <td>{r.equipo || <span style={{ color: '#9a9ab0' }}>—</span>}</td>
                  <td>{r.mantenedor_nombre || <span style={{ color: '#9a9ab0' }}>—</span>}</td>
                  <td style={{ color: '#9a9ab0', fontSize: '0.82rem' }}>{r.mantencion_desde || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{r.horometro != null ? `${r.horometro} h` : '—'}</td>
                  <td style={{ textAlign: 'center' }}>{r.fotos?.length || 0}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="admin-btn-outline" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => openEdit(r)}>Ver / Editar</button>
                      <button className="admin-btn-danger" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => handleDelete(r)} disabled={deleting === r.id}>
                        {deleting === r.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CamionesManager
