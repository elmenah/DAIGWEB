import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ENDPOINT = '/.netlify/functions/solicitud-adva'

// ── Estilos del formulario ────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #EBF2FA 0%, #F4F7FB 45%, #EAF0F9 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  watermark: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    fontSize: 11,
    color: 'rgba(30,58,95,0.2)',
    fontWeight: 600,
    letterSpacing: '0.05em',
    userSelect: 'none',
  },
  card: {
    background: '#ffffff',
    borderRadius: 24,
    boxShadow: '0 12px 48px rgba(30,58,95,0.10), 0 2px 8px rgba(30,58,95,0.05)',
    padding: '48px 44px 44px',
    width: '100%',
    maxWidth: 500,
    border: '1px solid rgba(30,58,95,0.07)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#38BDF8',
    flexShrink: 0,
  },
  brandText: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.11em',
    textTransform: 'uppercase',
    color: '#38BDF8',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(56,189,248,0.2)',
    marginLeft: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: 800,
    color: '#1E3A5F',
    margin: '0 0 6px',
    lineHeight: 1.1,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    margin: '0 0 36px',
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  labelNum: {
    width: 20,
    height: 20,
    background: '#1E3A5F',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    letterSpacing: '0.01em',
  },
  errorBox: {
    background: '#FFF1F2',
    border: '1px solid #FECDD3',
    borderRadius: 12,
    padding: '11px 16px',
    color: '#BE123C',
    fontSize: 13.5,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  successPage: {
    background: '#ffffff',
    borderRadius: 24,
    boxShadow: '0 12px 48px rgba(30,58,95,0.10)',
    padding: '56px 44px',
    textAlign: 'center',
    maxWidth: 420,
    width: '100%',
    border: '1px solid rgba(30,58,95,0.07)',
  },
  checkCircle: {
    width: 72,
    height: 72,
    background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    border: '2px solid #BFDBFE',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#1E3A5F',
    margin: '0 0 12px',
    letterSpacing: '-0.3px',
  },
  successText: {
    color: '#64748B',
    lineHeight: 1.7,
    fontSize: 14.5,
    margin: '0 0 32px',
  },
  newBtn: {
    background: 'transparent',
    border: '1.5px solid #1E3A5F',
    color: '#1E3A5F',
    borderRadius: 12,
    padding: '12px 28px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background .15s',
  },
}

function FieldInput({ id, value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        height: 50,
        borderRadius: 12,
        border: focused ? '2px solid #1E3A5F' : '1.5px solid #E2E8F0',
        padding: '0 16px',
        fontSize: 15,
        color: '#1E293B',
        background: focused ? '#fff' : '#F8FAFC',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color .15s, background .15s, box-shadow .15s',
        boxShadow: focused ? '0 0 0 3px rgba(30,58,95,0.08)' : 'none',
      }}
    />
  )
}

function FieldSelect({ id, value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        id={id}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 50,
          borderRadius: 12,
          border: focused ? '2px solid #1E3A5F' : '1.5px solid #E2E8F0',
          padding: '0 40px 0 16px',
          fontSize: 15,
          color: value ? '#1E293B' : '#94A3B8',
          background: focused ? '#fff' : '#F8FAFC',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'border-color .15s, background .15s, box-shadow .15s',
          boxShadow: focused ? '0 0 0 3px rgba(30,58,95,0.08)' : 'none',
          appearance: 'none',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          width: 18, height: 18, fill: '#64748B', pointerEvents: 'none',
        }}
      >
        <path d="M7 10l5 5 5-5z" />
      </svg>
    </div>
  )
}

function FieldTextarea({ id, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      rows={4}
      style={{
        borderRadius: 12,
        border: focused ? '2px solid #1E3A5F' : '1.5px solid #E2E8F0',
        padding: '14px 16px',
        fontSize: 15,
        color: '#1E293B',
        background: focused ? '#fff' : '#F8FAFC',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color .15s, background .15s, box-shadow .15s',
        boxShadow: focused ? '0 0 0 3px rgba(30,58,95,0.08)' : 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
        lineHeight: 1.6,
        minHeight: 100,
      }}
    />
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function SolicitudesAdvaPage() {
  const [workers,  setWorkers]  = useState([])
  const [form,     setForm]     = useState({ trabajador: '', planta: '', localidad: '', requisito: '' })
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState('')

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
    setSending(true)
    setError('')

    try {
      // Guardar en BD
      const { error: dbErr } = await supabase
        .from('solicitudes_adva')
        .insert({ trabajador_nombre: trabajador, planta, localidad, requisito })
      if (dbErr) throw dbErr

      // Enviar notificación por email
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trabajador, planta, localidad, requisito }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error al enviar')
      }

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

  // ── Vista de éxito ──────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div style={S.page}>
        <div style={S.successPage}>
          <div style={S.checkCircle}>
            <svg viewBox="0 0 24 24" style={{ width: 32, height: 32, fill: '#1E3A5F' }}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <h2 style={S.successTitle}>Solicitud enviada</h2>
          <p style={S.successText}>
            Tu solicitud fue registrada correctamente y se envió una notificación al encargado.
          </p>
          <button
            style={S.newBtn}
            onClick={reset}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,58,95,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Nueva solicitud
          </button>
        </div>
        <div style={S.watermark}>DAIG · Portal Aguas del Valle</div>
      </div>
    )
  }

  // ── Formulario ──────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Fuente Inter */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={S.card}>
        {/* Branding */}
        <div style={S.brand}>
          <div style={S.brandDot} />
          <span style={S.brandText}>Aguas del Valle</span>
          <div style={S.dividerLine} />
        </div>

        <h1 style={S.title}>Solicitudes Adva</h1>
        <p style={S.subtitle}>Completa el formulario para registrar tu solicitud.</p>

        <form onSubmit={handleSubmit} style={S.form}>

          {/* 1. Trabajador */}
          <div style={S.field}>
            <div style={S.labelRow}>
              <span style={S.labelNum}>1</span>
              <label htmlFor="trabajador" style={S.label}>Trabajador</label>
            </div>
            <FieldSelect id="trabajador" value={form.trabajador} onChange={set('trabajador')}>
              <option value="">Selecciona tu nombre</option>
              {workers.map(w => <option key={w} value={w}>{w}</option>)}
            </FieldSelect>
          </div>

          {/* 2. Planta */}
          <div style={S.field}>
            <div style={S.labelRow}>
              <span style={S.labelNum}>2</span>
              <label htmlFor="planta" style={S.label}>Planta</label>
            </div>
            <FieldInput
              id="planta"
              value={form.planta}
              onChange={set('planta')}
              placeholder="Nombre de la planta"
            />
          </div>

          {/* 3. Localidad */}
          <div style={S.field}>
            <div style={S.labelRow}>
              <span style={S.labelNum}>3</span>
              <label htmlFor="localidad" style={S.label}>Localidad</label>
            </div>
            <FieldInput
              id="localidad"
              value={form.localidad}
              onChange={set('localidad')}
              placeholder="Localidad"
            />
          </div>

          {/* 4. Requisito */}
          <div style={S.field}>
            <div style={S.labelRow}>
              <span style={S.labelNum}>4</span>
              <label htmlFor="requisito" style={S.label}>Requisito</label>
            </div>
            <FieldTextarea
              id="requisito"
              value={form.requisito}
              onChange={set('requisito')}
              placeholder="Describe el requisito o necesidad..."
            />
          </div>

          {error && (
            <div style={S.errorBox}>
              <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: '#BE123C', flexShrink: 0 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </div>
          )}

          <SubmitButton sending={sending} />
        </form>
      </div>

      <div style={S.watermark}>DAIG · Portal Aguas del Valle</div>
    </div>
  )
}

function SubmitButton({ sending }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="submit"
      disabled={sending}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 54,
        background: sending ? '#94A3B8' : hovered ? '#16315A' : '#1E3A5F',
        color: '#fff',
        border: 'none',
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 700,
        cursor: sending ? 'not-allowed' : 'pointer',
        marginTop: 6,
        transition: 'background .15s, transform .1s',
        transform: hovered && !sending ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && !sending ? '0 6px 20px rgba(30,58,95,0.25)' : 'none',
        letterSpacing: '0.01em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
      }}
    >
      {sending ? (
        <>
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: '#fff', animation: 'spin 1s linear infinite' }}>
            <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z" />
          </svg>
          Enviando…
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, fill: '#fff' }}>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
          Enviar solicitud
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )
}
