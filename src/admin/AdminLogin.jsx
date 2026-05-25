import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import logoImg from '../assets/logo.jpeg'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/admin/dashboard'

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, authLoading])

  // Mostrar spinner mientras se verifica sesión existente
  if (authLoading) {
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

    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      navigate(from, { replace: true })
    } else {
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
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@email.com"
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
