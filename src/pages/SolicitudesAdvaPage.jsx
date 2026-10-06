import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const ENDPOINT = '/.netlify/functions/solicitud-adva'

// ── Sonido de notificación via Web Audio API ─────────────────────────────────
function playSuccess() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const t    = ctx.currentTime
    const play = (freq, start, dur, vol = 0.22) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0,   t + start)
      g.gain.linearRampToValueAtTime(vol, t + start + 0.015)
      g.gain.exponentialRampToValueAtTime(0.001, t + start + dur)
      o.connect(g); g.connect(ctx.destination)
      o.start(t + start); o.stop(t + start + dur)
    }
    play(523.25, 0,    0.38)   // C5
    play(659.25, 0.18, 0.38)   // E5
    play(783.99, 0.34, 0.55)   // G5
  } catch (_) {}
}

// ── CSS global ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* { box-sizing: border-box; }

.adva-page {
  min-height: 100vh;
  background: #000;
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* ─── Animated background ─── */
.adva-bg {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.adva-orb {
  position: absolute; border-radius: 50%;
  filter: blur(90px); opacity: 0.18;
}
.adva-orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, #E8962E 0%, transparent 70%);
  top: -180px; right: -120px;
  animation: float1 14s ease-in-out infinite;
}
.adva-orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #b05a00 0%, transparent 70%);
  bottom: -120px; left: -100px;
  animation: float2 18s ease-in-out infinite;
}
.adva-orb-3 {
  width: 320px; height: 320px;
  background: radial-gradient(circle, #ff8c00 0%, transparent 70%);
  top: 45%; left: 50%; transform: translate(-50%,-50%);
  animation: float3 22s ease-in-out infinite;
  opacity: 0.08;
}
.adva-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(232,150,46,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(232,150,46,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
}
@keyframes float1 {
  0%,100% { transform: translate(0,0) scale(1); }
  33%     { transform: translate(-40px, 60px) scale(1.08); }
  66%     { transform: translate(30px, -30px) scale(0.95); }
}
@keyframes float2 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(60px,-40px) scale(1.12); }
}
@keyframes float3 {
  0%,100% { transform: translate(-50%,-50%) scale(1); }
  50%     { transform: translate(-50%,-50%) scale(1.3); }
}

/* ─── Navbar ─── */
.adva-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px;
  height: 60px;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(232,150,46,0.12);
}
.adva-nav-logo {
  display: flex; align-items: center; gap: 10px;
}
.adva-nav-logo-mark {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1.5px solid rgba(232,150,46,0.6);
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 12px; color: #E8962E;
  letter-spacing: -0.5px;
}
.adva-nav-brand {
  font-size: 15px; font-weight: 800; color: #fff;
  letter-spacing: -0.3px;
}
.adva-nav-brand span { color: #E8962E; }
.adva-nav-tag {
  font-size: 11px; font-weight: 600;
  color: rgba(232,150,46,0.7);
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 4px 10px;
  border: 1px solid rgba(232,150,46,0.2);
  border-radius: 20px;
}

/* ─── Content ─── */
.adva-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 100vh;
  padding: 88px 16px 48px;
}

/* ─── Card ─── */
.adva-card {
  width: 100%; max-width: 488px;
  background: rgba(12,12,12,0.85);
  border: 1px solid rgba(232,150,46,0.18);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  padding: 40px 40px 36px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
  animation: cardIn .5s cubic-bezier(.16,1,.3,1) both;
}
@keyframes cardIn {
  from { opacity:0; transform: translateY(24px); }
  to   { opacity:1; transform: translateY(0); }
}

.adva-eyebrow {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 20px;
}
.adva-eyebrow-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #E8962E;
  box-shadow: 0 0 8px #E8962E;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%,100% { opacity: 1; transform: scale(1); }
  50%     { opacity: 0.6; transform: scale(0.8); }
}
.adva-eyebrow-text {
  font-size: 11px; font-weight: 700; color: #E8962E;
  letter-spacing: .1em; text-transform: uppercase;
}

.adva-title {
  font-size: 28px; font-weight: 800;
  color: #fff; margin: 0 0 6px;
  letter-spacing: -0.5px; line-height: 1.1;
}
.adva-subtitle {
  font-size: 13.5px; color: rgba(255,255,255,0.4);
  margin: 0 0 32px; line-height: 1.6;
}

/* ─── Fields ─── */
.adva-form { display: flex; flex-direction: column; gap: 18px; }

.adva-field { display: flex; flex-direction: column; gap: 7px; }
.adva-label-row { display: flex; align-items: center; gap: 8px; }
.adva-label-num {
  width: 20px; height: 20px;
  background: rgba(232,150,46,0.15);
  border: 1px solid rgba(232,150,46,0.3);
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #E8962E; flex-shrink: 0;
}
.adva-label {
  font-size: 12.5px; font-weight: 600;
  color: rgba(255,255,255,0.65);
  letter-spacing: .01em;
}

.adva-input, .adva-select, .adva-textarea {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14.5px;
  outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
  width: 100%;
}
.adva-input    { height: 48px; padding: 0 14px; }
.adva-select   { height: 48px; padding: 0 36px 0 14px; appearance: none; cursor: pointer; }
.adva-textarea { padding: 13px 14px; resize: vertical; min-height: 96px; line-height: 1.6; }

.adva-input::placeholder,
.adva-textarea::placeholder { color: rgba(255,255,255,0.22); }
.adva-select option { background: #111; color: #fff; }

.adva-input:focus, .adva-select:focus, .adva-textarea:focus {
  border-color: rgba(232,150,46,0.6);
  box-shadow: 0 0 0 3px rgba(232,150,46,0.1);
  background: rgba(232,150,46,0.04);
}

.adva-select-wrap { position: relative; }
.adva-select-arrow {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%);
  pointer-events: none; color: rgba(255,255,255,0.35);
}

/* ─── Error ─── */
.adva-error {
  background: rgba(220,38,38,0.08);
  border: 1px solid rgba(220,38,38,0.3);
  border-radius: 10px; padding: 10px 14px;
  color: #fca5a5; font-size: 13px;
  display: flex; align-items: center; gap: 8px;
}

/* ─── Submit button ─── */
.adva-btn {
  height: 52px; width: 100%;
  background: #E8962E;
  color: #000;
  border: none; border-radius: 12px;
  font-size: 14.5px; font-weight: 800;
  cursor: pointer; margin-top: 6px;
  transition: background .15s, transform .12s, box-shadow .15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  letter-spacing: .01em;
  font-family: 'Inter', system-ui, sans-serif;
}
.adva-btn:hover:not(:disabled) {
  background: #f5a53a;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(232,150,46,0.35);
}
.adva-btn:active:not(:disabled) { transform: translateY(0); }
.adva-btn:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.25); cursor: not-allowed; }

/* ─── Spinner ─── */
.adva-spin {
  width: 17px; height: 17px; border: 2.5px solid rgba(0,0,0,0.2);
  border-top-color: #000; border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Success state ─── */
.adva-success {
  width: 100%; max-width: 420px;
  background: rgba(12,12,12,0.85);
  border: 1px solid rgba(232,150,46,0.2);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  padding: 52px 40px;
  text-align: center;
  animation: cardIn .5s cubic-bezier(.16,1,.3,1) both;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6);
}

.adva-check-ring {
  width: 80px; height: 80px;
  border-radius: 50%;
  border: 2px solid rgba(232,150,46,0.3);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 28px;
  position: relative;
  animation: ringPop .4s cubic-bezier(.16,1,.3,1) .1s both;
}
@keyframes ringPop {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
.adva-check-ring::before {
  content: '';
  position: absolute; inset: -6px; border-radius: 50%;
  border: 1px solid rgba(232,150,46,0.1);
}
.adva-check-ring::after {
  content: '';
  position: absolute; inset: -12px; border-radius: 50%;
  border: 1px solid rgba(232,150,46,0.05);
}

.adva-check-icon {
  animation: checkIn .3s cubic-bezier(.16,1,.3,1) .35s both;
}
@keyframes checkIn {
  from { transform: scale(0) rotate(-30deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg);   opacity: 1; }
}

.adva-success-title {
  font-size: 24px; font-weight: 800; color: #fff;
  margin: 0 0 10px; letter-spacing: -0.3px;
  animation: fadeUp .4s ease .4s both;
}
.adva-success-text {
  font-size: 14px; color: rgba(255,255,255,0.45);
  line-height: 1.7; margin: 0 0 32px;
  animation: fadeUp .4s ease .5s both;
}
@keyframes fadeUp {
  from { opacity:0; transform: translateY(10px); }
  to   { opacity:1; transform: translateY(0); }
}
.adva-new-btn {
  background: transparent;
  border: 1px solid rgba(232,150,46,0.35);
  color: #E8962E; border-radius: 10px;
  padding: 11px 28px; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: background .15s, border-color .15s;
  font-family: 'Inter', system-ui, sans-serif;
  animation: fadeUp .4s ease .55s both;
}
.adva-new-btn:hover {
  background: rgba(232,150,46,0.08);
  border-color: rgba(232,150,46,0.6);
}

.adva-watermark {
  position: fixed; bottom: 18px; right: 22px;
  font-size: 10.5px; color: rgba(255,255,255,0.12);
  font-weight: 600; letter-spacing: .06em;
  user-select: none; z-index: 1;
}

@media (max-width: 520px) {
  .adva-card, .adva-success { padding: 32px 24px 28px; }
  .adva-nav { padding: 0 18px; }
  .adva-nav-tag { display: none; }
  .adva-title { font-size: 24px; }
}
`

// ── Componente principal ──────────────────────────────────────────────────────
export default function SolicitudesAdvaPage() {
  const [workers, setWorkers] = useState([])
  const [form,    setForm]    = useState({ trabajador: '', planta: '', localidad: '', requisito: '' })
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('full_name')
      .order('full_name')
      .then(({ data }) => setWorkers((data || []).map(p => p.full_name).filter(Boolean)))
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { trabajador, planta, localidad, requisito } = form
    if (!trabajador || !planta || !localidad || !requisito) {
      setError('Completa todos los campos antes de enviar.')
      return
    }
    setSending(true); setError('')

    try {
      const { error: dbErr } = await supabase
        .from('solicitudes_adva')
        .insert({ trabajador_nombre: trabajador, planta, localidad, requisito })
      if (dbErr) throw dbErr

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trabajador, planta, localidad, requisito }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error al enviar')
      }

      playSuccess()
      setSent(true)
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setSent(false)
    setForm({ trabajador: '', planta: '', localidad: '', requisito: '' })
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="adva-page">

        {/* Background animado */}
        <div className="adva-bg">
          <div className="adva-grid" />
          <div className="adva-orb adva-orb-1" />
          <div className="adva-orb adva-orb-2" />
          <div className="adva-orb adva-orb-3" />
        </div>

        {/* Navbar */}
        <nav className="adva-nav">
          <div className="adva-nav-logo">
            <div className="adva-nav-logo-mark">DA</div>
            <div className="adva-nav-brand">DA<span>IG</span></div>
          </div>
          <div className="adva-nav-tag">Solicitudes OT</div>
        </nav>

        {/* Contenido */}
        <div className="adva-content">
          {sent ? (
            <div className="adva-success">
              <div className="adva-check-ring">
                <div className="adva-check-icon">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#E8962E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <h2 className="adva-success-title">Solicitud enviada</h2>
              <p className="adva-success-text">
                Tu solicitud fue registrada y se notificó al encargado correctamente.
              </p>
              <button className="adva-new-btn" onClick={reset}>
                Nueva solicitud
              </button>
            </div>
          ) : (
            <div className="adva-card">
              <div className="adva-eyebrow">
                <div className="adva-eyebrow-dot" />
                <span className="adva-eyebrow-text">Aguas del Valle</span>
              </div>

              <h1 className="adva-title">Solicitudes Adva</h1>
              <p className="adva-subtitle">Completa el formulario para registrar tu solicitud.</p>

              <form onSubmit={handleSubmit} className="adva-form">

                {/* 1. Trabajador */}
                <div className="adva-field">
                  <div className="adva-label-row">
                    <span className="adva-label-num">1</span>
                    <label htmlFor="trabajador" className="adva-label">Trabajador</label>
                  </div>
                  <div className="adva-select-wrap">
                    <select
                      id="trabajador"
                      className="adva-select"
                      value={form.trabajador}
                      onChange={set('trabajador')}
                      required
                    >
                      <option value="">Selecciona tu nombre</option>
                      {workers.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <svg className="adva-select-arrow" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
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
                  {sending ? (
                    <><div className="adva-spin" />Enviando…</>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                      Enviar solicitud
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="adva-watermark">DAIG · daigchile.cl</div>
      </div>
    </>
  )
}
