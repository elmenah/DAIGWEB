import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { supabase } from '../lib/supabase'
import { isHeicFile, isHeicByHeader, heicBlobToJpeg } from '../lib/heic'
import logoImg from '../assets/logo.jpeg'
import SignaturePad from '../components/SignaturePad'

const today = () => new Date().toISOString().split('T')[0]

function CamionesPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState('form')
  const [workerName, setWorkerName] = useState('')

  // Form state
  const [otNumero, setOtNumero] = useState('')
  const [patente, setPatente] = useState('')
  const [taller, setTaller] = useState('DAIG SpA')
  const [equipo, setEquipo] = useState('')
  const [mantencionDesde, setMantencionDesde] = useState(today())
  const [mantencionHasta, setMantencionHasta] = useState(today())
  const [horometro, setHorometro] = useState('')
  const [insumos, setInsumos] = useState('')
  const [tareas, setTareas] = useState([''])
  const [fotos, setFotos] = useState([])
  const [fotosPreviews, setFotosPreviews] = useState([])
  const [fotosExistentes, setFotosExistentes] = useState([])
  const [firma, setFirma] = useState(null)
  const [horaTermino, setHoraTermino] = useState(null)
  const [showFirma, setShowFirma] = useState(false)

  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null)
  const [sendError, setSendError] = useState('')
  const [submittedData, setSubmittedData] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const draftIdRef = useRef(crypto.randomUUID())
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Camiones
  const [camiones, setCamiones] = useState([])

  // Historial
  const [registros, setRegistros] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('username, nombre').eq('id', user.id).single()
      .then(({ data }) => { if (data) setWorkerName(data.nombre || data.username) })
  }, [user])

  useEffect(() => {
    supabase.from('camiones').select('patente, descripcion').order('patente')
      .then(({ data }) => setCamiones(data || []))
  }, [])

  useEffect(() => {
    if (view === 'historial') loadHistorial()
  }, [view])

  const loadHistorial = async () => {
    setHistLoading(true)
    const { data } = await supabase
      .from('mantencion_camiones').select('*')
      .eq('mantenedor_id', user.id)
      .order('mantencion_desde', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    setRegistros(data || [])
    setHistLoading(false)
  }

  const resetForm = () => {
    setOtNumero(''); setPatente(''); setTaller('DAIG SpA'); setEquipo('')
    setMantencionDesde(today()); setMantencionHasta(today()); setHorometro('')
    setInsumos('')
    setTareas(['']); setFotos([]); setFotosPreviews([]); setFotosExistentes([])
    setFirma(null); setHoraTermino(null)
    draftIdRef.current = crypto.randomUUID()
    setEditingId(null)
  }

  const loadForEdit = (r) => {
    setOtNumero(r.ot_numero || '')
    setPatente(r.patente || '')
    setTaller(r.taller || 'DAIG SpA')
    setEquipo(r.equipo || '')
    setMantencionDesde(r.mantencion_desde || today())
    setMantencionHasta(r.mantencion_hasta || today())
    setHorometro(r.horometro?.toString() || '')
    setInsumos(r.insumos || '')
    setTareas(Array.isArray(r.tareas) && r.tareas.length ? r.tareas.map(t => (typeof t === 'string' ? t : t?.actividad || '')) : [''])
    setFotos([]); setFotosPreviews([])
    setFotosExistentes(r.fotos || [])
    setFirma(r.firma || null)
    setHoraTermino(r.hora_termino || null)
    setEditingId(r.id)
    setSendStatus(null)
    setView('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Tareas (lista repetible) ────────────────────────────────────────────────
  const setTarea = (idx, value) => setTareas(prev => prev.map((t, i) => (i === idx ? value : t)))
  const addTarea = () => setTareas(prev => [...prev, ''])
  const removeTarea = (idx) => setTareas(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)

  // ── Fotos ───────────────────────────────────────────────────────────────────
  const handleFotos = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setFotos(prev => [...prev, ...files])
    setFotosPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }
  const removeFotoNueva = (idx) => {
    setFotos(prev => prev.filter((_, i) => i !== idx))
    setFotosPreviews(prev => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx) })
  }
  const removeFotoExistente = (idx) => setFotosExistentes(prev => prev.filter((_, i) => i !== idx))

  const convertToJpegViaCanvas = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('canvas toBlob failed')), 'image/jpeg', 0.88)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen. Elige una foto válida.')) }
    img.src = url
  })

  const uploadFotos = async (fotosList = fotos) => {
    const urls = []
    for (const original of fotosList) {
      let blob = original
      const heicPorMimeOExt = isHeicFile(original)
      const heicPorHeader = heicPorMimeOExt ? false : await isHeicByHeader(original)
      if (heicPorMimeOExt || heicPorHeader) {
        try { blob = await heicBlobToJpeg(original) } catch { blob = await convertToJpegViaCanvas(original) }
      } else if (!/^image\/jpeg$/i.test(original.type)) {
        blob = await convertToJpegViaCanvas(original)
      }
      const path = `${user.id}/camiones/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error } = await supabase.storage
        .from('registros-fotos')
        .upload(path, blob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('registros-fotos').getPublicUrl(path)
      urls.push(urlData.publicUrl)
    }
    return urls
  }

  // ── Firma (captura la hora de término del trabajo) ──────────────────────────
  const onFirmaSave = (dataUrl) => {
    setFirma(dataUrl)
    setHoraTermino(dataUrl ? new Date().toISOString() : null)
    setShowFirma(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const tareasLimpias = tareas.map(t => t.trim()).filter(Boolean)
    if (!otNumero.trim()) { setSendError('El N° de OT es obligatorio.'); setSendStatus('error'); return }
    if (!patente.trim()) { setSendError('La patente es obligatoria.'); setSendStatus('error'); return }
    if (!firma) { setSendError('Debes firmar el trabajo antes de enviar.'); setSendStatus('error'); return }

    setSending(true)
    setSendStatus(null)
    setSendError('')

    try {
      const nuevasUrls = fotos.length > 0 ? await uploadFotos() : []
      const fotosFinales = [...fotosExistentes, ...nuevasUrls]
      const base = {
        ot_numero: otNumero.trim(),
        patente: patente.trim(),
        taller: taller.trim() || null,
        equipo: equipo.trim() || null,
        mantencion_desde: mantencionDesde || null,
        mantencion_hasta: mantencionHasta || null,
        horometro: horometro ? parseFloat(horometro) : null,
        insumos: insumos.trim() || null,
        tareas: tareasLimpias,
        fotos: fotosFinales,
        firma,
        hora_termino: horaTermino || new Date().toISOString(),
      }
      const resumen = {
        ot: otNumero.trim(), patente: patente.trim(), equipo: equipo.trim(),
        fecha: mantencionDesde, fotos: fotosFinales.length, editingId,
      }

      if (editingId) {
        const { data: updated, error } = await supabase
          .from('mantencion_camiones')
          .update({ ...base, mantenedor_nombre: workerName })
          .eq('id', editingId)
          .select('id').single()
        if (error) throw error
        if (!updated) throw new Error('No tienes permiso para actualizar este registro.')
        setSubmittedData(resumen)
        setSendStatus('edited')
        resetForm()
      } else {
        const { error } = await supabase
          .from('mantencion_camiones')
          .insert({ id: draftIdRef.current, mantenedor_id: user.id, mantenedor_nombre: workerName, ...base })
        if (error) throw error
        setSubmittedData(resumen)
        setSendStatus('ok')
        resetForm()
      }
    } catch (err) {
      setSendStatus('error')
      const missingTable = /mantencion_camiones/i.test(err?.message || '') && /relation|does not exist|schema cache|column/i.test(err?.message || '')
      setSendError(missingTable
        ? 'Falta activar el módulo de camiones en el sistema. Avisa al administrador. Tus datos siguen en este formulario.'
        : err?.message || 'No se pudo guardar el registro. Tus datos siguen en el formulario.')
    }
    setSending(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/camiones', { replace: true })
  }

  const fmtHora = (iso) => iso ? new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : ''

  return (
    <div className="trab-panel">
      <header className="trab-header">
        <div className="trab-header-inner">
          <div className="trab-header-brand">
            <img src={logoImg} alt="DAIG" className="trab-logo" />
            <span>Mantención Camiones</span>
          </div>
          <div className="trab-header-right">
            {workerName && <span className="trab-worker-name">{workerName}</span>}
            <button className="trab-logout-btn" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <div className="trab-tabs">
        <button
          className={`trab-tab ${view === 'form' ? 'trab-tab--active' : ''}`}
          onClick={() => { setView('form'); setSendStatus(null); if (!editingId) resetForm() }}
        >
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
          {editingId ? 'Editando OT' : 'Nueva OT'}
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
        {view === 'form' && (sendStatus === 'ok' || sendStatus === 'edited') && submittedData && (
          <div className="trab-success-screen">
            <div className="trab-success-icon">
              <svg viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="25" fill="none" stroke="#22c55e" strokeWidth="2" />
                <path fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  d="M14 26l8 8 16-16" className="trab-check-path" />
              </svg>
            </div>
            <h2 className="trab-success-title">
              {submittedData.editingId ? '¡OT actualizada!' : '¡OT registrada!'}
            </h2>
            <p className="trab-success-sub">
              {submittedData.editingId ? 'Los cambios quedaron guardados.' : 'El registro de mantención llegó correctamente al sistema.'}
            </p>

            <div className="trab-success-card">
              <div className="trab-success-row"><span className="trab-success-label">OT</span><span>{submittedData.ot}</span></div>
              <div className="trab-success-row"><span className="trab-success-label">Patente</span><span>{submittedData.patente}</span></div>
              {submittedData.equipo && <div className="trab-success-row"><span className="trab-success-label">Equipo</span><span>{submittedData.equipo}</span></div>}
              <div className="trab-success-row"><span className="trab-success-label">Fecha</span><span>{submittedData.fecha}</span></div>
              {submittedData.fotos > 0 && <div className="trab-success-row"><span className="trab-success-label">Fotos</span><span>{submittedData.fotos} adjuntadas</span></div>}
            </div>

            <div className="trab-success-actions">
              <button className="trab-success-btn trab-success-btn--primary"
                onClick={() => { setSendStatus(null); setSubmittedData(null) }}>
                <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Nueva OT
              </button>
              <button className="trab-success-btn trab-success-btn--secondary"
                onClick={() => { setSendStatus(null); setSubmittedData(null); setView('historial') }}>
                <svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                Ver mi historial
              </button>
            </div>
          </div>
        )}

        {view === 'form' && sendStatus !== 'ok' && sendStatus !== 'edited' && (
          <div className="trab-form-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 className="trab-section-title">
                {editingId ? 'Editando OT de mantención' : 'Mantención de camión'}
              </h2>
              {editingId && (
                <button className="admin-btn-outline reg-icon-btn" style={{ fontSize: '0.8rem' }} onClick={resetForm}>
                  <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  Cancelar edición
                </button>
              )}
            </div>

            {sendStatus === 'error' && <div role="alert" className="trab-alert trab-alert--error">{sendError}</div>}

            <form onSubmit={handleSubmit} className="trab-form">
              <div className="trab-row">
                <div className="trab-field">
                  <label htmlFor="c-ot">N° OT *</label>
                  <input id="c-ot" type="text" value={otNumero} onChange={e => setOtNumero(e.target.value)}
                    placeholder="Ej: OT-0266" autoComplete="off" required />
                </div>
                <div className="trab-field">
                  <label htmlFor="c-patente">Patente del camión *</label>
                  <select id="c-patente" value={patente} onChange={e => setPatente(e.target.value)} required>
                    <option value="">Selecciona una patente</option>
                    {camiones.map(c => (
                      <option key={c.patente} value={c.patente}>
                        {c.patente}{c.descripcion ? ` — ${c.descripcion}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="trab-row">
                <div className="trab-field">
                  <label htmlFor="c-equipo">Equipo</label>
                  <input id="c-equipo" type="text" value={equipo} onChange={e => setEquipo(e.target.value)}
                    placeholder="Ej: C.37 — Camión Barredor Bucher" />
                </div>
                <div className="trab-field">
                  <label htmlFor="c-taller">Taller / Responsable</label>
                  <input id="c-taller" type="text" value={taller} onChange={e => setTaller(e.target.value)}
                    placeholder="Ej: DAIG SpA" />
                </div>
              </div>

              <div className="trab-row">
                <div className="trab-field">
                  <label htmlFor="c-desde">Mantención realizada — desde</label>
                  <input id="c-desde" type="date" value={mantencionDesde} onChange={e => setMantencionDesde(e.target.value)} />
                </div>
                <div className="trab-field">
                  <label htmlFor="c-hasta">hasta</label>
                  <input id="c-hasta" type="date" value={mantencionHasta} onChange={e => setMantencionHasta(e.target.value)} />
                </div>
              </div>

              <div className="trab-field">
                <label htmlFor="c-horometro">Horómetro (h)</label>
                <input id="c-horometro" type="number" min="0" step="1" inputMode="numeric"
                  value={horometro} onChange={e => setHorometro(e.target.value)} placeholder="Ej: 2800" />
              </div>

              <div className="trab-field">
                <label htmlFor="c-insumos">Insumos</label>
                <textarea id="c-insumos" rows={3}
                  value={insumos} onChange={e => setInsumos(e.target.value)}
                  placeholder="Ej: Aceite motor 15W-40 (4L), filtro de aceite, correa distribución…" />
              </div>

              <div className="trab-field">
                <label>Tareas realizadas</label>
                {tareas.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <textarea
                      value={t}
                      onChange={e => setTarea(i, e.target.value)}
                      placeholder={`Tarea ${i + 1}: actividad y alcance`}
                      rows={2}
                      style={{ flex: 1 }}
                    />
                    {tareas.length > 1 && (
                      <button type="button" className="trab-foto-remove" style={{ position: 'static', flexShrink: 0 }}
                        onClick={() => removeTarea(i)} aria-label={`Quitar tarea ${i + 1}`}>×</button>
                    )}
                  </div>
                ))}
                <button type="button" className="trab-foto-btn trab-foto-btn--gallery" onClick={addTarea}>
                  <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                  Agregar tarea
                </button>
              </div>

              <div className="trab-field">
                <label>Registro fotográfico</label>
                {fotosExistentes.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <small style={{ color: '#9a9ab0', display: 'block', marginBottom: '0.4rem' }}>Fotos actuales:</small>
                    <div className="trab-foto-grid">
                      {fotosExistentes.map((url, i) => (
                        <div className="trab-foto-thumb" key={i}>
                          <img src={url} alt={`foto-${i + 1}`} />
                          <button type="button" className="trab-foto-remove" onClick={() => removeFotoExistente(i)} aria-label="Quitar foto">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="trab-foto-btns">
                  <button type="button" className="trab-foto-btn trab-foto-btn--camera" onClick={() => cameraInputRef.current?.click()}>
                    <svg viewBox="0 0 24 24"><path d="M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/></svg>
                    Tomar foto
                  </button>
                  <button type="button" className="trab-foto-btn trab-foto-btn--gallery" onClick={() => fileInputRef.current?.click()}>
                    <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                    Elegir de galería
                  </button>
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFotos} style={{ display: 'none' }} />
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFotos} style={{ display: 'none' }} />
                </div>
                {fotosPreviews.length > 0 && (
                  <div className="trab-foto-grid" style={{ marginTop: '0.5rem' }}>
                    {fotosPreviews.map((src, i) => (
                      <div className="trab-foto-thumb" key={i}>
                        <img src={src} alt={`nueva-foto-${i + 1}`} />
                        <button type="button" className="trab-foto-remove" onClick={() => removeFotoNueva(i)} aria-label="Quitar foto">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="trab-field">
                <label>Firma del trabajo *</label>
                {firma ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <img src={firma} alt="Firma" style={{ height: 70, background: '#fff', borderRadius: 8, padding: 4 }} />
                    <div style={{ fontSize: '0.8rem', color: '#22c55e' }}>
                      ✓ Firmado{horaTermino ? ` — término ${fmtHora(horaTermino)}` : ''}
                    </div>
                    <button type="button" className="trab-foto-btn trab-foto-btn--gallery" onClick={() => setShowFirma(true)}>Volver a firmar</button>
                  </div>
                ) : (
                  <button type="button" className="trab-foto-btn trab-foto-btn--camera" onClick={() => setShowFirma(true)}>
                    <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    Firmar trabajo terminado
                  </button>
                )}
                <small style={{ color: '#9a9ab0', display: 'block', marginTop: 6 }}>
                  Al firmar se registra automáticamente la hora de término del trabajo.
                </small>
              </div>

              <button type="submit" className="trab-submit-btn" disabled={sending}>
                {sending ? (
                  <><span className="trab-spinner"></span>Enviando...</>
                ) : editingId ? (
                  <><svg viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>Guardar cambios</>
                ) : (
                  <><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>Enviar OT</>
                )}
              </button>
            </form>
          </div>
        )}

        {view === 'historial' && (
          <div className="trab-historial-section">
            <h2 className="trab-section-title">Mi historial de mantenciones</h2>
            {histLoading && <div className="trab-hist-loading"><div className="admin-spinner"></div></div>}
            {!histLoading && registros.length === 0 && <p className="trab-empty">Aún no tienes OT registradas.</p>}
            <div className="trab-hist-list">
              {registros.map(r => (
                <div className={`trab-hist-card ${expandedId === r.id ? 'trab-hist-card--open' : ''}`} key={r.id}>
                  <button className="trab-hist-header" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    <div className="trab-hist-header-left">
                      <span className="trab-hist-fecha">{r.mantencion_desde}</span>
                      <span className="trab-hist-hora">{r.ot_numero}</span>
                      <span className="trab-hist-tarea">{r.patente} · {r.equipo || 'Camión'}</span>
                    </div>
                    <svg className="trab-hist-chevron" viewBox="0 0 24 24"
                      style={{ transform: expandedId === r.id ? 'rotate(180deg)' : 'none' }}>
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                  </button>
                  {expandedId === r.id && (
                    <div className="trab-hist-body">
                      {r.equipo && <div className="trab-hist-field"><span className="trab-hist-label">Equipo</span><p>{r.equipo}</p></div>}
                      {r.taller && <div className="trab-hist-field"><span className="trab-hist-label">Taller</span><p>{r.taller}</p></div>}
                      {(r.mantencion_desde || r.mantencion_hasta) && (
                        <div className="trab-hist-field"><span className="trab-hist-label">Mantención realizada</span>
                          <p>{r.mantencion_desde} {r.mantencion_hasta && r.mantencion_hasta !== r.mantencion_desde ? `al ${r.mantencion_hasta}` : ''}</p></div>
                      )}
                      {r.horometro != null && <div className="trab-hist-field"><span className="trab-hist-label">Horómetro</span><p>{r.horometro} h</p></div>}
                      {r.insumos && <div className="trab-hist-field"><span className="trab-hist-label">Insumos</span><p style={{ whiteSpace: 'pre-wrap' }}>{r.insumos}</p></div>}
                      {Array.isArray(r.tareas) && r.tareas.length > 0 && (
                        <div className="trab-hist-field"><span className="trab-hist-label">Tareas realizadas</span>
                          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                            {r.tareas.map((t, i) => <li key={i}>{typeof t === 'string' ? t : t?.actividad}</li>)}
                          </ul>
                        </div>
                      )}
                      {r.fotos?.length > 0 && (
                        <div className="trab-hist-field"><span className="trab-hist-label">Fotos ({r.fotos.length})</span>
                          <div className="trab-hist-foto-grid">
                            {r.fotos.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`foto-${i + 1}`} className="trab-hist-foto" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {r.firma && (
                        <div className="trab-hist-field"><span className="trab-hist-label">Firma</span>
                          <img src={r.firma} alt="Firma" style={{ height: 56, background: '#fff', borderRadius: 6, padding: 3, display: 'block', marginTop: 4 }} />
                          {r.hora_termino && <small style={{ color: '#9a9ab0' }}>Término: {fmtHora(r.hora_termino)}</small>}
                        </div>
                      )}
                      <button className="trab-edit-btn" onClick={() => loadForEdit(r)} style={{ marginTop: '0.75rem' }}>
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        Editar esta OT
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showFirma && (
        <SignaturePad
          title="Firma del trabajo terminado"
          initial={firma}
          onSave={onFirmaSave}
          onClose={() => setShowFirma(false)}
        />
      )}
    </div>
  )
}

export default CamionesPanel
