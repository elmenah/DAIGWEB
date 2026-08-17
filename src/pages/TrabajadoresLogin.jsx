import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { supabase } from '../lib/supabase'
import logoImg from '../assets/logo.jpeg'

function TrabajadoresLogin() {
  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, loading: authLoading, hasHydratedSession, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && hasHydratedSession && isAuthenticated) {
      if (role === 'trabajador') navigate('/trabajadores/panel', { replace: true })
      else if (role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (role === 'tecnico') navigate('/tecnico', { replace: true })
    }
  }, [isAuthenticated, authLoading, hasHydratedSession, role, navigate])

  if (authLoading || !hasHydratedSession) {
    return <div className="admin-loading"><div className="admin-spinner"></div></div>
  }

  const formatRut = (value) => {
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
    if (clean.length <= 1) return clean
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1)
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${formatted}-${dv}`
  }

  const handleRutChange = (e) => {
    const raw = e.target.value.replace(/[^0-9kK.-]/g, '')
    setRut(formatRut(raw.replace(/[.-]/g, '')))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const rutClean = rut.replace(/\./g, '').replace(/-/g, '')
    // Buscar el email real del trabajador por username (RUT sin formato)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', rutClean)
      .single()
    if (profileError || !profile?.email) {
      setError('RUT no registrado. Consulta a tu supervisor.')
      setLoading(false)
      return
    }
    console.log('[TRAB LOGIN] email usado:', profile.email)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    })
    setLoading(false)
    if (authError) {
      console.log('[TRAB LOGIN] auth error:', authError.message)
      setError(`Error: ${authError.message}`)
    }
  }

  return (
    <div className="trab-login-page">
      <div className="trab-login-card">
        <div className="admin-login-logo">
          <img src={logoImg} alt="DAIG" />
        </div>
        <h2>Portal Trabajadores</h2>
        <p className="admin-login-subtitle">Ingresa con tu RUT y clave</p>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label htmlFor="t-rut">RUT</label>
            <input
              id="t-rut"
              type="text"
              value={rut}
              onChange={handleRutChange}
              required
              autoComplete="username"
              placeholder="12.345.678-9"
              inputMode="numeric"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="t-pass">Clave</label>
            <input
              id="t-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Ingresa tu clave"
            />
          </div>
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <a href="/" className="admin-back-link">← Volver al sitio</a>
      </div>
    </div>
  )
}

export default TrabajadoresLogin
