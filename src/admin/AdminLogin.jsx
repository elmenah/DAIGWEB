import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import logoImg from '../assets/logo.jpeg'

const isAuthDebugEnabled = () => {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('authDebug') === '1'
}

const authDebugLog = (...args) => {
  if (isAuthDebugEnabled()) {
    console.info('[AUTH_DEBUG][LOGIN]', ...args)
  }
}

function AdminLogin() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, loading: authLoading, hasHydratedSession, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const requestedPath = location.state?.from

  useEffect(() => {
    authDebugLog('effect', {
      authLoading,
      hasHydratedSession,
      isAuthenticated,
      role,
      requestedPath: requestedPath || null,
    })

    if (!authLoading && hasHydratedSession && isAuthenticated) {
      if (!role) return

      if (role === 'admin') {
        const nextPath = requestedPath === '/tecnico' ? '/tecnico' : '/admin/dashboard'
        authDebugLog('navigate', { reason: 'admin-role', to: nextPath })
        navigate(nextPath, { replace: true })
      } else if (role === 'tecnico') {
        authDebugLog('navigate', { reason: 'tecnico-role', to: '/tecnico' })
        navigate('/tecnico', { replace: true })
      } else {
        authDebugLog('navigate', { reason: 'unknown-role', to: '/' })
        navigate('/', { replace: true })
      }
    }
  }, [isAuthenticated, authLoading, hasHydratedSession, role, navigate, requestedPath])

  // Mostrar spinner mientras se verifica sesión existente
  if (authLoading || !hasHydratedSession) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(identifier, password)
    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Credenciales incorrectas')
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <img src={logoImg} alt="DAIG" />
        </div>
        <h2>Panel de Administración</h2>
        <p className="admin-login-subtitle">Ingresa tus credenciales</p>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label htmlFor="identifier">Correo o nombre de usuario</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              placeholder="tu@email.com o usuario"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
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

export default AdminLogin
