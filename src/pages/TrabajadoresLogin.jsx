import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import logoImg from '../assets/logo.jpeg'
import LoginVisual from '../components/LoginVisual'

// Identificador libre: RUT (con o sin formato) o correo. Solo aplicamos la
// mascara de RUT cuando el texto parece un RUT (sin @ ni letras salvo la K del dv).
const looksLikeRut = (value) => !/@/.test(value) && !/[a-jl-z]/i.test(value)

const formatRut = (value) => {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length <= 1) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted}-${dv}`
}

function TrabajadoresLogin() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, loading: authLoading, hasHydratedSession, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && hasHydratedSession && isAuthenticated) {
      if (role === 'trabajador') navigate('/trabajadores/panel', { replace: true })
      else if (role === 'admin' || role === 'directiva') navigate('/admin/dashboard', { replace: true })
      else if (role === 'tecnico') navigate('/tecnico', { replace: true })
      else if (role === 'supervisor' || role === 'seguridad') navigate('/permisos/panel', { replace: true })
    }
  }, [isAuthenticated, authLoading, hasHydratedSession, role, navigate])

  if (authLoading || !hasHydratedSession) {
    return <div className="admin-loading"><div className="admin-spinner"></div></div>
  }

  const handleIdentifierChange = (e) => {
    const raw = e.target.value
    setIdentifier(looksLikeRut(raw) ? formatRut(raw) : raw)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(identifier, password)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Credenciales incorrectas. Consulta a tu supervisor.')
    }
  }

  return (
    <div className="admin-login-page">
      {/* Panel izquierdo: formulario */}
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <img src={logoImg} alt="DAIG" />
        </div>
        <h2>Portal Trabajadores</h2>
        <p className="admin-login-subtitle">Ingresa con tu RUT o correo y clave</p>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label htmlFor="t-id">RUT o correo</label>
            <input
              id="t-id"
              type="text"
              value={identifier}
              onChange={handleIdentifierChange}
              required
              autoComplete="username"
              placeholder="12.345.678-9 o tu@correo.cl"
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
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <a href="/" className="admin-back-link">← Volver al sitio</a>
      </div>

      <LoginVisual
        tagline={<>Portal de Trabajadores<br />DAIG</>}
        sub="Ingeniería Industrial y CNC · Chile"
      />
    </div>
  )
}

export default TrabajadoresLogin
