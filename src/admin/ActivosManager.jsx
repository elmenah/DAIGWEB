import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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

const EMPTY_INST = { nombre: '', localidad: '', estado: 'activa' }
const EMPTY_ACT = {
  codigo: '', instalacion_id: '', sistema: '', equipo: '', criticidad: '',
  marca: '', modelo: '', potencia_kw: '', latitud: '', longitud: '', horas_operacion_dia: '', estado: 'activo',
}

function ActivosManager() {
  const [tab, setTab] = useState('activos')      // 'activos' | 'instalaciones'
  const [activos, setActivos] = useState([])
  const [instalaciones, setInstalaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [deleting, setDeleting] = useState(null)

  // Modales
  const [editAct, setEditAct] = useState(null)   // objeto activo en edición (o EMPTY_ACT para nuevo)
  const [editInst, setEditInst] = useState(null) // objeto instalación en edición (o EMPTY_INST)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: inst }, { data: act }] = await Promise.all([
      supabase.from('instalaciones').select('*').order('nombre'),
      supabase.from('activos').select('*').order('codigo'),
    ])
    setInstalaciones(inst || [])
    setActivos(act || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000) }
  const instNombre = (id) => instalaciones.find(i => i.id === id)?.nombre || '—'

  // ── Guardar instalación ─────────────────────────────────────────────────────
  const saveInst = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = {
        nombre: editInst.nombre.trim(),
        localidad: editInst.localidad.trim() || null,
        estado: editInst.estado,
      }
      if (!payload.nombre) throw new Error('El nombre es obligatorio.')
      const q = editInst.id
        ? supabase.from('instalaciones').update(payload).eq('id', editInst.id)
        : supabase.from('instalaciones').insert(payload)
      const { error: e2 } = await q
      if (e2) throw e2
      flash(`Instalación "${payload.nombre}" guardada.`)
      setEditInst(null); loadData()
    } catch (err) {
      setError(err.message || 'Error al guardar.')
    } finally { setSaving(false) }
  }

  // ── Guardar activo ──────────────────────────────────────────────────────────
  const saveAct = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const num = (v) => v === '' || v == null ? null : parseFloat(v)
      const payload = {
        codigo: editAct.codigo.trim(),
        instalacion_id: editAct.instalacion_id || null,
        sistema: editAct.sistema.trim() || null,
        equipo: editAct.equipo.trim() || null,
        criticidad: editAct.criticidad || null,
        marca: editAct.marca.trim() || null,
        modelo: editAct.modelo.trim() || null,
        potencia_kw: num(editAct.potencia_kw),
        latitud: num(editAct.latitud),
        longitud: num(editAct.longitud),
        horas_operacion_dia: num(editAct.horas_operacion_dia),
        estado: editAct.estado,
      }
      if (!payload.codigo) throw new Error('El código del activo es obligatorio.')
      const q = editAct.id
        ? supabase.from('activos').update(payload).eq('id', editAct.id)
        : supabase.from('activos').insert(payload)
      const { error: e2 } = await q
      if (e2) throw e2
      flash(`Activo "${payload.codigo}" guardado.`)
      setEditAct(null); loadData()
    } catch (err) {
      setError(/duplicate key|unique/i.test(err.message) ? 'Ya existe un activo con ese código.' : (err.message || 'Error al guardar.'))
    } finally { setSaving(false) }
  }

  const delRow = async (tabla, row, label) => {
    if (!confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`)) return
    setDeleting(row.id)
    try {
      const { error: e2 } = await supabase.from(tabla).delete().eq('id', row.id)
      if (e2) throw e2
      flash('Eliminado.'); loadData()
    } catch (err) {
      alert(err.message)
    } finally { setDeleting(null) }
  }

  const setA = (k, v) => setEditAct(prev => ({ ...prev, [k]: v }))
  const setI = (k, v) => setEditInst(prev => ({ ...prev, [k]: v }))

  return (
    <div className="admin-section">
      {/* ── Modal instalación ── */}
      {editInst && (
        <Modal title={editInst.id ? 'Editar instalación' : 'Nueva instalación'} onClose={() => setEditInst(null)}>
          <form onSubmit={saveInst}>
            {error && <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <div className="admin-field"><label>Nombre *</label>
              <input type="text" value={editInst.nombre} onChange={e => setI('nombre', e.target.value)} placeholder="Ej: Emisario La Serena" autoFocus /></div>
            <div className="admin-field"><label>Localidad</label>
              <input type="text" value={editInst.localidad} onChange={e => setI('localidad', e.target.value)} placeholder="Ej: La Serena" /></div>
            <div className="admin-field"><label>Estado</label>
              <select value={editInst.estado} onChange={e => setI('estado', e.target.value)}>
                <option value="activa">Activa</option>
                <option value="inactiva">Inactiva</option>
              </select></div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="admin-btn-outline" onClick={() => setEditInst(null)}>Cancelar</button>
              <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal activo ── */}
      {editAct && (
        <Modal title={editAct.id ? `Editar activo — ${editAct.codigo}` : 'Nuevo activo'} onClose={() => setEditAct(null)}>
          <form onSubmit={saveAct}>
            {error && <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <div className="admin-field"><label>Código del activo *</label>
              <input type="text" value={editAct.codigo} onChange={e => setA('codigo', e.target.value.toUpperCase())} placeholder="Ej: ADVA-EMILS-RJF-01" autoFocus /></div>
            <div className="admin-field"><label>Instalación</label>
              <select value={editAct.instalacion_id} onChange={e => setA('instalacion_id', e.target.value)}>
                <option value="">Sin asignar</option>
                {instalaciones.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
              </select></div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="admin-field" style={{ flex: 1 }}><label>Sistema</label>
                <input type="text" value={editAct.sistema} onChange={e => setA('sistema', e.target.value)} placeholder="Ej: Bombeo" /></div>
              <div className="admin-field" style={{ flex: 1 }}><label>Equipo</label>
                <input type="text" value={editAct.equipo} onChange={e => setA('equipo', e.target.value)} placeholder="Ej: Bomba centrífuga" /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="admin-field" style={{ flex: 1 }}><label>Criticidad</label>
                <select value={editAct.criticidad} onChange={e => setA('criticidad', e.target.value)}>
                  <option value="">—</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select></div>
              <div className="admin-field" style={{ flex: 1 }}><label>Potencia (kW)</label>
                <input type="number" step="0.1" value={editAct.potencia_kw} onChange={e => setA('potencia_kw', e.target.value)} /></div>
              <div className="admin-field" style={{ flex: 1 }}><label>Horas op./día</label>
                <input type="number" step="0.5" value={editAct.horas_operacion_dia} onChange={e => setA('horas_operacion_dia', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="admin-field" style={{ flex: 1 }}><label>Marca</label>
                <input type="text" value={editAct.marca} onChange={e => setA('marca', e.target.value)} /></div>
              <div className="admin-field" style={{ flex: 1 }}><label>Modelo</label>
                <input type="text" value={editAct.modelo} onChange={e => setA('modelo', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="admin-field" style={{ flex: 1 }}><label>Latitud</label>
                <input type="number" step="0.0000001" value={editAct.latitud} onChange={e => setA('latitud', e.target.value)} placeholder="-29.90" /></div>
              <div className="admin-field" style={{ flex: 1 }}><label>Longitud</label>
                <input type="number" step="0.0000001" value={editAct.longitud} onChange={e => setA('longitud', e.target.value)} placeholder="-71.25" /></div>
              <div className="admin-field" style={{ flex: 1 }}><label>Estado</label>
                <select value={editAct.estado} onChange={e => setA('estado', e.target.value)}>
                  <option value="activo">Activo</option>
                  <option value="de baja">De baja</option>
                </select></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="admin-btn-outline" onClick={() => setEditAct(null)}>Cancelar</button>
              <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {successMsg && <div className="admin-alert admin-alert-success" style={{ marginBottom: '1rem' }}>✓ {successMsg}</div>}

      <div className="admin-section-header">
        <h3>Activos e Instalaciones</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={tab === 'activos' ? 'admin-btn-primary' : 'admin-btn-outline'} style={{ fontSize: '0.8rem', width: 'auto', marginTop: 0 }} onClick={() => setTab('activos')}>Activos</button>
          <button className={tab === 'instalaciones' ? 'admin-btn-primary' : 'admin-btn-outline'} style={{ fontSize: '0.8rem', width: 'auto', marginTop: 0 }} onClick={() => setTab('instalaciones')}>Instalaciones</button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ minHeight: '80px' }}><div className="admin-spinner"></div></div>
      ) : tab === 'activos' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <span className="admin-badge">{activos.length} activos</span>
            <button className="admin-btn-primary" style={{ fontSize: '0.82rem', width: 'auto', marginTop: 0 }} onClick={() => { setError(''); setEditAct({ ...EMPTY_ACT }) }}>+ Nuevo activo</button>
          </div>
          {activos.length === 0 ? (
            <p style={{ color: '#9a9ab0', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>Aún no hay activos. Crea el primero con "Nuevo activo".</p>
          ) : (
            <div className="reg-table-wrap">
              <table className="reg-table">
                <thead><tr><th>Código</th><th>Instalación</th><th>Equipo</th><th style={{ textAlign: 'center' }}>Criticidad</th><th style={{ textAlign: 'center' }}>Estado</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
                <tbody>
                  {activos.map(a => (
                    <tr key={a.id} className="reg-row">
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{a.codigo}</td>
                      <td>{instNombre(a.instalacion_id)}</td>
                      <td>{a.equipo || <span style={{ color: '#9a9ab0' }}>—</span>}</td>
                      <td style={{ textAlign: 'center' }}>{a.criticidad || '—'}</td>
                      <td style={{ textAlign: 'center', color: a.estado === 'activo' ? '#22c55e' : '#9a9ab0' }}>{a.estado}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="admin-btn-outline" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => { setError(''); setEditAct({ ...EMPTY_ACT, ...a, potencia_kw: a.potencia_kw ?? '', latitud: a.latitud ?? '', longitud: a.longitud ?? '', horas_operacion_dia: a.horas_operacion_dia ?? '', instalacion_id: a.instalacion_id || '' }) }}>Editar</button>
                          <button className="admin-btn-danger" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => delRow('activos', a, a.codigo)} disabled={deleting === a.id}>{deleting === a.id ? '...' : 'Eliminar'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <span className="admin-badge">{instalaciones.length} instalaciones</span>
            <button className="admin-btn-primary" style={{ fontSize: '0.82rem', width: 'auto', marginTop: 0 }} onClick={() => { setError(''); setEditInst({ ...EMPTY_INST }) }}>+ Nueva instalación</button>
          </div>
          {instalaciones.length === 0 ? (
            <p style={{ color: '#9a9ab0', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>Aún no hay instalaciones. Crea la primera con "Nueva instalación".</p>
          ) : (
            <div className="reg-table-wrap">
              <table className="reg-table">
                <thead><tr><th>Nombre</th><th>Localidad</th><th style={{ textAlign: 'center' }}>Estado</th><th style={{ textAlign: 'center' }}>Activos</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
                <tbody>
                  {instalaciones.map(i => (
                    <tr key={i.id} className="reg-row">
                      <td style={{ fontWeight: 600 }}>{i.nombre}</td>
                      <td>{i.localidad || <span style={{ color: '#9a9ab0' }}>—</span>}</td>
                      <td style={{ textAlign: 'center', color: i.estado === 'activa' ? '#22c55e' : '#9a9ab0' }}>{i.estado}</td>
                      <td style={{ textAlign: 'center' }}>{activos.filter(a => a.instalacion_id === i.id).length}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="admin-btn-outline" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => { setError(''); setEditInst({ ...EMPTY_INST, ...i, localidad: i.localidad || '' }) }}>Editar</button>
                          <button className="admin-btn-danger" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => delRow('instalaciones', i, i.nombre)} disabled={deleting === i.id}>{deleting === i.id ? '...' : 'Eliminar'}</button>
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

export default ActivosManager
