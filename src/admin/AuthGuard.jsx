import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

const isAuthDebugEnabled = () => {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('authDebug') === '1'
}

const authDebugLog = (...args) => {
  if (isAuthDebugEnabled()) {
    console.info('[AUTH_DEBUG][GUARD]', ...args)
  }
}

function AuthGuard({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, role, hasHydratedSession } = useAuth()
  const location = useLocation()

  useEffect(() => {
    authDebugLog('state', {
      path: location.pathname,
      loading,
      hasHydratedSession,
      isAuthenticated,
      role,
      allowedRoles,
    })
  }, [location.pathname, loading, hasHydratedSession, isAuthenticated, role, allowedRoles])

  if (loading || !hasHydratedSession || (isAuthenticated && !role)) {
    authDebugLog('decision', { result: 'loading-screen', path: location.pathname })
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    authDebugLog('decision', { result: 'redirect-login', path: location.pathname })
    return <Navigate to="/admin" state={{ from: location.pathname }} replace />
  }

  if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
    authDebugLog('decision', { result: 'allow', path: location.pathname, role })
    return children
  }

  if (role === 'admin') {
    authDebugLog('decision', { result: 'redirect-admin-dashboard', from: location.pathname })
    return <Navigate to="/admin/dashboard" replace />
  }

  if (role === 'tecnico') {
    authDebugLog('decision', { result: 'redirect-tecnico', from: location.pathname })
    return <Navigate to="/tecnico" replace />
  }

  if (role === 'trabajador') {
    authDebugLog('decision', { result: 'redirect-trabajadores', from: location.pathname })
    return <Navigate to="/trabajadores/panel" replace />
  }

  authDebugLog('decision', { result: 'redirect-login-fallback', path: location.pathname })
  return <Navigate to="/admin" state={{ from: location.pathname }} replace />
}

export default AuthGuard
