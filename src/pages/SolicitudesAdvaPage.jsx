import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const ENDPOINT = '/.netlify/functions/solicitud-adva'
const LOGO_URL  = '/logo.jpeg'
const LS_KEY    = 'adva_form_draft'

// ── Sonido de notificación ────────────────────────────────────────────────────
function playSuccess() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const t    = ctx.currentTime
    const note = (freq, start, dur, vol = 0.2) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0, t + start)
      g.gain.linearRampToValueAtTime(vol, t + start + 0.012)
      g.gain.exponentialRampToValueAtTime(0.001, t + start + dur)
      o.connect(g); g.connect(ctx.destination)
      o.start(t + start); o.stop(t + start + dur)
    }
    note(523.25, 0,    0.4)
    note(659.25, 0.18, 0.4)
    note(783.99, 0.33, 0.6)
  } catch (_) {}
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; }

/* ─ PAGE ─ */
.adva-page {
  min-height: 100vh;
  background: #0a0a0a;
  font-family: 'Inter', system-ui, sans-serif;
  display: flex; flex-direction: column;
  position: relative; overflow-x: hidden;
}

/* ─ PATTERN BACKGROUND ─ */
.adva-pattern {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    url('/pattern-industrial.webp') center/700px auto repeat;
  opacity: 0.08;
}
/* Overlay uniforme sobre el patrón */
.adva-vignette {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: rgba(0,0,0,0.35);
}
/* Amber accent glow on top-right */
.adva-glow {
  position: fixed; top: -120px; right: -80px; z-index: 0;
  width: 460px; height: 460px; border-radius: 50%;
  background: radial-gradient(circle, rgba(232,150,46,0.22) 0%, transparent 70%);
  pointer-events: none; filter: blur(40px);
  animation: glowFloat 10s ease-in-out infinite;
}
@keyframes glowFloat {
  0%,100% { transform: translate(0,0); }
  50%     { transform: translate(-30px, 40px); }
}

/* ─ NAVBAR ─ */
.adva-nav {
  position: sticky; top: 0; z-index: 200;
  height: 64px;
  background: rgba(0,0,0,0.78);
  backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid rgba(232,150,46,0.14);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 28px; gap: 24px;
  flex-shrink: 0;
}
.adva-nav-left {
  display: flex; align-items: center; gap: 14px;
  text-decoration: none;
}
.adva-nav-logo-img {
  width: 36px; height: 36px; border-radius: 8px;
  object-fit: cover;
  border: 1.5px solid rgba(232,150,46,0.4);
}
.adva-nav-brand {
  font-size: 16px; font-weight: 800; color: #fff;
  letter-spacing: -0.4px; line-height: 1;
}
.adva-nav-brand span { color: #E8962E; }
.adva-nav-divider {
  width: 1px; height: 20px;
  background: rgba(255,255,255,0.1);
}
.adva-nav-tag {
  font-size: 11px; font-weight: 700; color: rgba(232,150,46,0.8);
  letter-spacing: .08em; text-transform: uppercase;
}

.adva-nav-links {
  display: flex; align-items: center; gap: 4px;
}
.adva-nav-link {
  font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,0.55);
  text-decoration: none; padding: 6px 12px; border-radius: 8px;
  transition: color .15s, background .15s;
  letter-spacing: .01em;
}
.adva-nav-link:hover {
  color: #fff;
  background: rgba(255,255,255,0.06);
}
.adva-nav-cta {
  font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,0.55);
  text-decoration: none; padding: 6px 12px; border-radius: 8px;
  transition: color .15s, background .15s;
}
.adva-nav-cta:hover {
  color: #fff;
  background: rgba(255,255,255,0.06);
}

/* ─ CONTENT ─ */
.adva-content {
  position: relative; z-index: 10;
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 48px 16px 32px;
  gap: 0;
}

/* ─ TIMESTAMP ─ */
.adva-timestamp {
  font-size: 11.5px; font-weight: 500;
  color: rgba(255,255,255,0.3);
  letter-spacing: .04em; text-transform: uppercase;
  margin-bottom: 20px;
  display: flex; align-items: center; gap: 6px;
}
.adva-ts-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #E8962E;
  box-shadow: 0 0 6px #E8962E;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ─ CARD ─ */
.adva-card {
  width: 100%; max-width: 492px;
  background: rgba(10,10,10,0.88);
  border: 1px solid rgba(232,150,46,0.18);
  border-radius: 22px;
  backdrop-filter: blur(24px);
  padding: 40px 40px 36px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.04) inset,
    0 32px 80px rgba(0,0,0,0.7),
    0 0 60px rgba(232,150,46,0.06);
  animation: cardIn .5s cubic-bezier(.16,1,.3,1) both;
}
@keyframes cardIn {
  from { opacity:0; transform:translateY(28px) scale(.98); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}

.adva-eyebrow {
  display: flex; align-items: center; gap: 8px; margin-bottom: 18px;
}
.adva-eyebrow-pill {
  display: flex; align-items: center; gap: 7px;
  background: rgba(232,150,46,0.1);
  border: 1px solid rgba(232,150,46,0.22);
  border-radius: 20px; padding: 4px 12px 4px 8px;
}
.adva-eyebrow-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #E8962E; box-shadow: 0 0 7px #E8962E;
  animation: blink 2.5s ease-in-out infinite;
}
.adva-eyebrow-text {
  font-size: 11px; font-weight: 700; color: #E8962E;
  letter-spacing: .1em; text-transform: uppercase;
}

.adva-title {
  font-size: 29px; font-weight: 800; color: #fff;
  margin: 0 0 6px; letter-spacing: -.5px; line-height: 1.1;
}
.adva-subtitle {
  font-size: 13.5px; color: rgba(255,255,255,0.38);
  margin: 0 0 30px; line-height: 1.6;
}

/* ─ FORM FIELDS ─ */
.adva-form { display: flex; flex-direction: column; gap: 17px; }

.adva-field { display: flex; flex-direction: column; gap: 7px; }
.adva-label-row { display: flex; align-items: center; gap: 8px; }
.adva-label-num {
  width: 20px; height: 20px;
  background: rgba(232,150,46,0.12);
  border: 1px solid rgba(232,150,46,0.28);
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #E8962E; flex-shrink: 0;
}
.adva-label {
  font-size: 12.5px; font-weight: 600;
  color: rgba(255,255,255,0.6); letter-spacing: .01em;
}

.adva-input, .adva-select, .adva-textarea {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 11px; color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14.5px; outline: none; width: 100%;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.adva-input    { height: 48px; padding: 0 14px; }
.adva-select   { height: 48px; padding: 0 36px 0 14px; appearance: none; cursor: pointer; }
.adva-textarea { padding: 13px 14px; resize: vertical; min-height: 98px; line-height: 1.6; }
.adva-input::placeholder, .adva-textarea::placeholder { color: rgba(255,255,255,0.2); }
.adva-select option { background: #111; color: #fff; }

.adva-input:focus, .adva-select:focus, .adva-textarea:focus {
  border-color: rgba(232,150,46,0.55);
  box-shadow: 0 0 0 3px rgba(232,150,46,0.09);
  background: rgba(232,150,46,0.03);
}
.adva-select-wrap { position: relative; }
.adva-select-chevron {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%); pointer-events: none;
  color: rgba(255,255,255,0.3);
}

/* ─ DRAFT BADGE ─ */
.adva-draft-badge {
  font-size: 11px; color: rgba(232,150,46,0.6);
  display: flex; align-items: center; gap: 5px; margin-bottom: -4px;
}

/* ─ ERROR ─ */
.adva-error {
  background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.28);
  border-radius: 10px; padding: 10px 14px;
  color: #fca5a5; font-size: 13px;
  display: flex; align-items: center; gap: 8px;
}

/* ─ SUBMIT BUTTON ─ */
.adva-btn {
  height: 52px; width: 100%;
  background: #E8962E; color: #000; border: none;
  border-radius: 13px; font-size: 14.5px; font-weight: 800;
  cursor: pointer; margin-top: 6px;
  font-family: 'Inter', system-ui, sans-serif;
  transition: background .15s, transform .12s, box-shadow .15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  letter-spacing: .01em;
}
.adva-btn:hover:not(:disabled) {
  background: #f5a53a;
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(232,150,46,0.32);
}
.adva-btn:active:not(:disabled) { transform: translateY(0); }
.adva-btn:disabled { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.2); cursor: not-allowed; }

.adva-spin {
  width: 17px; height: 17px;
  border: 2.5px solid rgba(0,0,0,0.2); border-top-color: #000;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─ SUCCESS ─ */
.adva-success {
  width: 100%; max-width: 420px;
  background: rgba(10,10,10,0.88);
  border: 1px solid rgba(232,150,46,0.22);
  border-radius: 22px; backdrop-filter: blur(24px);
  padding: 52px 40px; text-align: center;
  box-shadow: 0 32px 80px rgba(0,0,0,0.7);
  animation: cardIn .5s cubic-bezier(.16,1,.3,1) both;
}
.adva-check-ring {
  width: 84px; height: 84px; border-radius: 50%;
  border: 1.5px solid rgba(232,150,46,0.35);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 26px; position: relative;
  animation: ringPop .4s cubic-bezier(.16,1,.3,1) .1s both;
}
.adva-check-ring::before {
  content: ''; position: absolute; inset: -7px; border-radius: 50%;
  border: 1px solid rgba(232,150,46,0.12);
}
.adva-check-ring::after {
  content: ''; position: absolute; inset: -14px; border-radius: 50%;
  border: 1px solid rgba(232,150,46,0.06);
}
@keyframes ringPop {
  from { transform: scale(0.4); opacity:0; }
  to   { transform: scale(1);   opacity:1; }
}
.adva-check-icon { animation: checkBounce .35s cubic-bezier(.16,1,.3,1) .35s both; }
@keyframes checkBounce {
  from { transform: scale(0) rotate(-20deg); opacity:0; }
  to   { transform: scale(1) rotate(0deg);   opacity:1; }
}
.adva-success-title {
  font-size: 24px; font-weight: 800; color: #fff;
  margin: 0 0 10px; letter-spacing: -.3px;
  animation: fadeUp .4s ease .4s both;
}
.adva-success-text {
  font-size: 14px; color: rgba(255,255,255,0.4);
  line-height: 1.7; margin: 0 0 30px;
  animation: fadeUp .4s ease .5s both;
}
.adva-new-btn {
  background: transparent; border: 1px solid rgba(232,150,46,0.35);
  color: #E8962E; border-radius: 10px;
  padding: 11px 28px; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: background .15s, border-color .15s;
  font-family: 'Inter', system-ui, sans-serif;
  animation: fadeUp .4s ease .55s both;
}
.adva-new-btn:hover { background: rgba(232,150,46,0.08); border-color: rgba(232,150,46,0.6); }
@keyframes fadeUp {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}

/* ─ FOOTER ─ */
.adva-footer {
  position: relative; z-index: 10;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 18px 28px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
}
.adva-footer-brand {
  font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,0.22);
  letter-spacing: .06em;
}
.adva-footer-links {
  display: flex; align-items: center; gap: 18px;
}
.adva-footer-link {
  font-size: 11.5px; color: rgba(255,255,255,0.2);
  text-decoration: none; transition: color .15s;
}
.adva-footer-link:hover { color: rgba(232,150,46,0.7); }

/* ─ RESPONSIVE ─ */
@media (max-width: 520px) {
  .adva-card, .adva-success { padding: 32px 22px 28px; }
  .adva-nav { padding: 0 16px; }
  .adva-nav-links .adva-nav-link { display: none; }
  .adva-title { font-size: 25px; }
  .adva-content { padding: 36px 14px 24px; }
}
`

// ── Clock component ───────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const fmt = now.toLocaleString('es-CL', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  return (
    <div className="adva-timestamp">
      <div className="adva-ts-dot" />
      {fmt}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SolicitudesAdvaPage() {
  const EMPTY = { trabajador: '', planta: '', localidad: '', requisito: '' }
  const [workers, setWorkers] = useState([])
  const [form,    setForm]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || EMPTY }
    catch { return EMPTY }
  })
  const [hasDraft, setHasDraft] = useState(false)
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [codigo,   setCodigo]   = useState('')
  const [error,    setError]    = useState('')

  // Cargar trabajadores ADVA
  useEffect(() => {
    supabase.from('trabajadores_adva').select('nombre').order('nombre')
      .then(({ data }) => setWorkers((data || []).map(p => p.nombre).filter(Boolean)))
  }, [])

  // Detectar borrador guardado
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      try {
        const d = JSON.parse(saved)
        if (Object.values(d).some(Boolean)) setHasDraft(true)
      } catch (_) {}
    }
  }, [])

  // Autosave mientras edita
  useEffect(() => {
    if (Object.values(form).some(Boolean)) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(form)) }
      catch (_) {}
    }
  }, [form])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { trabajador, planta, localidad, requisito } = form
    if (!trabajador || !planta || !localidad || !requisito) {
      setError('Completa todos los campos antes de enviar.'); return
    }
    setSending(true); setError('')

    try {
      const { data: inserted, error: dbErr } = await supabase
        .from('solicitudes_adva')
        .insert({ trabajador_nombre: trabajador, planta, localidad, requisito })
        .select('codigo').single()
      if (dbErr) throw dbErr
      setCodigo(inserted?.codigo || '')

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trabajador, planta, localidad, requisito }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error al enviar')
      }

      try { localStorage.removeItem(LS_KEY) } catch (_) {}
      playSuccess()
      setSent(true)
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setSent(false); setHasDraft(false); setCodigo('')
    setForm(EMPTY)
    try { localStorage.removeItem(LS_KEY) } catch (_) {}
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="adva-page">

        {/* Fondo */}
        <div className="adva-pattern" aria-hidden="true" />
        <div className="adva-vignette" aria-hidden="true" />
        <div className="adva-glow"    aria-hidden="true" />

        {/* ── Navbar ── */}
        <nav className="adva-nav">
          <a className="adva-nav-left" href="https://daigchile.cl" target="_blank" rel="noreferrer">
            <img src={LOGO_URL} alt="DAIG" className="adva-nav-logo-img" />
            <span className="adva-nav-brand">DA<span>IG</span></span>
            <div className="adva-nav-divider" />
            <span className="adva-nav-tag">Solicitudes ADVA</span>
          </a>

          <div className="adva-nav-links">
            <a className="adva-nav-link" href="https://daigchile.cl"          target="_blank" rel="noreferrer">Inicio</a>
            <a className="adva-nav-link" href="https://daigchile.cl/servicios" target="_blank" rel="noreferrer">Servicios</a>
            <a className="adva-nav-link" href="https://daigchile.cl/digital"   target="_blank" rel="noreferrer">Digital</a>
            <a className="adva-nav-cta"  href="https://daigchile.cl/cotizar"   target="_blank" rel="noreferrer">Cotizar</a>
          </div>
        </nav>

        {/* ── Contenido ── */}
        <div className="adva-content">
          <LiveClock />

          {sent ? (
            /* ── Éxito ── */
            <div className="adva-success">
              <div className="adva-check-ring">
                <div className="adva-check-icon">
                  <svg viewBox="0 0 24 24" width="38" height="38" fill="none"
                    stroke="#E8962E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <h2 className="adva-success-title">Solicitud enviada</h2>
              {codigo && (
                <div style={{
                  background: 'rgba(232,150,46,0.08)', border: '1px solid rgba(232,150,46,0.25)',
                  borderRadius: 12, padding: '10px 20px', marginBottom: 16,
                  animation: 'fadeUp .4s ease .45s both',
                }}>
                  <div style={{ fontSize: 11, color: 'rgba(232,150,46,0.7)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                    Código de solicitud
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#E8962E', letterSpacing: '.04em' }}>
                    {codigo}
                  </div>
                </div>
              )}
              <p className="adva-success-text">
                Registro guardado correctamente. Se envió una notificación al encargado.
              </p>
              <button className="adva-new-btn" onClick={reset}>
                Nueva solicitud
              </button>
            </div>
          ) : (
            /* ── Formulario ── */
            <div className="adva-card">
              <div className="adva-eyebrow">
                <div className="adva-eyebrow-pill">
                  <div className="adva-eyebrow-dot" />
                  <span className="adva-eyebrow-text">ADVA · Aguas del Valle</span>
                </div>
              </div>

              <h1 className="adva-title">Solicitudes ADVA</h1>
              <p className="adva-subtitle">Completa el formulario para registrar tu solicitud.</p>

              {hasDraft && (
                <div className="adva-draft-badge" style={{ marginBottom: 12 }}>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Borrador recuperado automáticamente
                </div>
              )}

              <form onSubmit={handleSubmit} className="adva-form">

                {/* 1. Trabajador */}
                <div className="adva-field">
                  <div className="adva-label-row">
                    <span className="adva-label-num">1</span>
                    <label htmlFor="trabajador" className="adva-label">Supervisor</label>
                  </div>
                  <div className="adva-select-wrap">
                    <select id="trabajador" className="adva-select"
                      value={form.trabajador} onChange={set('trabajador')} required>
                      <option value="">Selecciona un supervisor</option>
                      {workers.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <svg className="adva-select-chevron" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </div>
                </div>

                {/* 2. Planta */}
                <div className="adva-field">
                  <div className="adva-label-row">
                    <span className="adva-label-num">2</span>
                    <label htmlFor="planta" className="adva-label">Planta</label>
                  </div>
                  <input id="planta" className="adva-input" type="text"
                    value={form.planta} onChange={set('planta')}
                    placeholder="Nombre de la planta" required />
                </div>

                {/* 3. Localidad */}
                <div className="adva-field">
                  <div className="adva-label-row">
                    <span className="adva-label-num">3</span>
                    <label htmlFor="localidad" className="adva-label">Localidad</label>
                  </div>
                  <input id="localidad" className="adva-input" type="text"
                    value={form.localidad} onChange={set('localidad')}
                    placeholder="Localidad" required />
                </div>

                {/* 4. Requisito */}
                <div className="adva-field">
                  <div className="adva-label-row">
                    <span className="adva-label-num">4</span>
                    <label htmlFor="requisito" className="adva-label">Requisito</label>
                  </div>
                  <textarea id="requisito" className="adva-textarea"
                    value={form.requisito} onChange={set('requisito')}
                    placeholder="Describe el requisito o necesidad…" required />
                </div>

                {error && (
                  <div className="adva-error">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" className="adva-btn" disabled={sending}>
                  {sending
                    ? <><div className="adva-spin" />Enviando…</>
                    : <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                        Enviar solicitud
                      </>
                  }
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="adva-footer">
          <span className="adva-footer-brand">DAIG SpA · Ingeniería y Servicios Industriales</span>
          <div className="adva-footer-links">
            <a className="adva-footer-link" href="tel:+56988689400">+56 9 8868 9400</a>
            <a className="adva-footer-link" href="mailto:cotizaciones@daigchile.cl">cotizaciones@daigchile.cl</a>
            <a className="adva-footer-link" href="https://daigchile.cl" target="_blank" rel="noreferrer">daigchile.cl</a>
          </div>
        </footer>

      </div>
    </>
  )
}
