import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import logoImg from '../assets/logo.jpeg'
import LoginVisual from '../components/LoginVisual'

const ROLES_PERMITIDOS = ['supervisor', 'seguridad', 'admin']

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

export default function PermisosLogin() {
  const { login, isAuthenticated, loading, hasHydratedSession, role } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && hasHydratedSession && isAuthenticated && role) {
      if (ROLES_PERMITIDOS.includes(role)) {
        navigate('/permisos/panel', { replace: true })
      } else {
        setError('Tu cuenta no tiene acceso al módulo de permisos.')
      }
    }
  }, [isAuthenticated, loading, hasHydratedSession, role, navigate])

  if (loading || !hasHydratedSession) {
    return <div className="admin-loading"><div className="admin-spinner"></div></div>
  }

  const handleIdentifierChange = (e) => {
    const raw = e.target.value
    setIdentifier(looksLikeRut(raw) ? formatRut(raw) : raw)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { success, error: err } = await login(identifier, password)
    if (!success) {
      setError(err || 'Credenciales incorrectas')
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <img src={logoImg} alt="DAIG" />
        </div>
        <h2>Permisos de Trabajo</h2>
        <p className="admin-login-subtitle">Acceso para supervisores e inspectores</p>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label htmlFor="p-id">RUT o correo</label>
            <input
              id="p-id"
              type="text"
              value={identifier}
              onChange={handleIdentifierChange}
              required
              autoComplete="username"
              placeholder="12.345.678-9 o correo@daig.cl"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="p-pass">Contraseña</label>
            <input
              id="p-pass"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
            />
          </div>
          <button type="submit" className="admin-btn-primary" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <a href="/" className="admin-back-link">← Volver al sitio</a>
      </div>

      <LoginVisual
        tagline={<>Permisos de Trabajo<br />DAIG</>}
        sub="Acceso para supervisores e inspectores de seguridad"
      />
    </div>
  )
}
