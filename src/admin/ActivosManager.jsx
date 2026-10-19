import React, { useState, useEffect, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import LocationPicker from './LocationPicker'
import { escapeHtml } from '../lib/escapeHtml'

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

// Modal con el código QR del activo: muestra, descarga (PNG) e imprime.
// El QR codifica el código del activo (ej. ADVA-EMILS-RJF-01), que es lo que
// el técnico escaneará para seleccionarlo en el registro.
function QrModal({ activo, instalacionNombre, onClose }) {
  const canvasRef = useRef(null)
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!activo?.codigo) return
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, activo.codigo, {
        width: 240, margin: 1, color: { dark: '#12123A', light: '#FFFFFF' },
      }).catch(() => {})
    }
    QRCode.toDataURL(activo.codigo, { width: 600, margin: 2 }).then(setDataUrl).catch(() => {})
  }, [activo])

  const descargar = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `QR_${activo.codigo}.png`
    a.click()
  }

  const imprimir = () => {
    if (!dataUrl) return
    const w = window.open('', '_blank')
    if (!w) { alert('Permite las ventanas emergentes para imprimir.'); return }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR ${escapeHtml(activo.codigo)}</title></head>
      <body style="font-family:system-ui,sans-serif;text-align:center;padding:40px;margin:0">
        <img src="${dataUrl}" style="width:320px;height:320px" alt="QR" />
        <h2 style="margin:18px 0 4px;font-family:monospace;font-size:20px">${escapeHtml(activo.codigo)}</h2>
        <p style="margin:0;color:#444;font-size:15px">${escapeHtml(activo.equipo || '')}</p>
        <p style="margin:2px 0 0;color:#888;font-size:13px">${escapeHtml(instalacionNombre || '')}</p>
      </body></html>`)
    w.document.close(); w.focus()
    setTimeout(() => { w.print() }, 200)
  }

  return (
    <Modal title={`QR — ${activo.codigo}`} onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ background: '#fff', display: 'inline-block', padding: 16, borderRadius: 12 }}>
          <canvas ref={canvasRef} />
        </div>
        <p style={{ fontFamily: 'monospace', fontWeight: 700, margin: '14px 0 2px', fontSize: '1rem' }}>{activo.codigo}</p>
        {activo.equipo && <p style={{ margin: 0, color: '#cfd2dc', fontSize: '0.85rem' }}>{activo.equipo}</p>}
        {instalacionNombre && <p style={{ margin: '2px 0 0', color: '#9a9ab0', fontSize: '0.8rem' }}>{instalacionNombre}</p>}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
          <button type="button" className="admin-btn-outline" style={{ width: 'auto', marginTop: 0 }} onClick={descargar} disabled={!dataUrl}>Descargar PNG</button>
          <button type="button" className="admin-btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={imprimir} disabled={!dataUrl}>Imprimir</button>
        </div>
      </div>
    </Modal>
  )
}

const EMPTY_INST = { nombre: '', localidad: '', estado: 'activa' }
const EMPTY_ACT = {
  codigo: '', instalacion_id: '', sistema: '', equipo: '', criticidad: '',
  marca: '', modelo: '', potencia_kw: '', direccion: '', latitud: '', longitud: '', horas_operacion_dia: '', estado: 'activo',
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
  const [qrAct, setQrAct] = useState(null)       // activo para mostrar su QR
  const [editInst, setEditInst] = useState(null) // objeto instalación en edición (o EMPTY_INST)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)

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
        direccion: editAct.direccion.trim() || null,
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

  // El mapa marca el punto → guarda coordenadas y la dirección detectada
  const onPickUbicacion = (lat, lng, dir) =>
    setEditAct(prev => ({ ...prev, latitud: lat, longitud: lng, direccion: dir || prev.direccion }))

  // Escribe la dirección y "Buscar en mapa" → geocodifica y mueve el pin
  const buscarDireccion = async () => {
    const q = (editAct.direccion || '').trim()
    if (!q) return
    setBuscando(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&accept-language=es&countrycodes=cl`)
      const d = await res.json()
      if (d && d[0]) {
        setEditAct(prev => ({ ...prev, latitud: +(+d[0].lat).toFixed(7), longitud: +(+d[0].lon).toFixed(7) }))
      } else {
        alert('No se encontró la dirección. Haz clic en el mapa para marcar el punto manualmente.')
      }
    } catch {
      alert('No se pudo buscar la dirección. Marca el punto en el mapa.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="admin-section">
      {/* ── Modal QR del activo ── */}
      {qrAct && (
        <QrModal activo={qrAct} instalacionNombre={instNombre(qrAct.instalacion_id)} onClose={() => setQrAct(null)} />
      )}

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
            <div className="admin-field">
              <label>Dirección / ubicación</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={editAct.direccion} onChange={e => setA('direccion', e.target.value)}
                  placeholder="Ej: Emisario La Serena, Av. del Mar" style={{ flex: 1 }} />
                <button type="button" className="admin-btn-outline" style={{ whiteSpace: 'nowrap', width: 'auto', marginTop: 0 }} onClick={buscarDireccion} disabled={buscando}>
                  {buscando ? 'Buscando...' : 'Buscar en mapa'}
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <LocationPicker
                  lat={editAct.latitud === '' || editAct.latitud == null ? null : parseFloat(editAct.latitud)}
                  lng={editAct.longitud === '' || editAct.longitud == null ? null : parseFloat(editAct.longitud)}
                  onPick={onPickUbicacion}
                />
              </div>
              <small style={{ color: '#9a9ab0', display: 'block', marginTop: 6 }}>
                {editAct.latitud && editAct.longitud
                  ? `Pin: ${(+editAct.latitud).toFixed(5)}, ${(+editAct.longitud).toFixed(5)}`
                  : 'Escribe la dirección y pulsa "Buscar en mapa", o haz clic en el mapa para marcar el punto.'}
              </small>
            </div>
            <div className="admin-field"><label>Estado</label>
              <select value={editAct.estado} onChange={e => setA('estado', e.target.value)}>
                <option value="activo">Activo</option>
                <option value="de baja">De baja</option>
              </select></div>
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
                          <button className="admin-btn-outline" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => setQrAct(a)}>QR</button>
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
