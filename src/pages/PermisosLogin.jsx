import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermisosAuth } from '../permisos/PermisosAuthContext'
import logoImg from '../assets/logo.jpeg'

const ROLES_PERMITIDOS = ['supervisor', 'seguridad', 'admin']

export default function PermisosLogin() {
  const { login, user, role, loading } = usePermisosAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user && role) {
      if (ROLES_PERMITIDOS.includes(role)) {
        navigate('/permisos/panel', { replace: true })
      } else {
        setError('Tu cuenta no tiene acceso al módulo de permisos.')
      }
    }
  }, [user, role, loading, navigate])

  if (loading) {
    return <div className="admin-loading"><div className="admin-spinner"></div></div>
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { success, error: err } = await login(email, password)
    if (!success) {
      setError(err || 'Credenciales incorrectas')
      setSubmitting(false)
    }
  }

  return (
    <div className="trab-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <img src={logoImg} alt="DAIG" />
        </div>
        <h2>Permisos de Trabajo</h2>
        <p className="admin-login-subtitle">Acceso para supervisores e inspectores</p>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label htmlFor="p-email">Correo electrónico</label>
            <input
              id="p-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="correo@daig.cl"
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
    </div>
  )
}
