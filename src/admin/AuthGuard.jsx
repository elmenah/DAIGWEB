import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function AuthGuard({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" state={{ from: location.pathname }} replace />
  }

  if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
    return children
  }

  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (role === 'tecnico') {
    return <Navigate to="/tecnico" replace />
  }

  return <Navigate to="/admin" state={{ from: location.pathname }} replace />
}

export default AuthGuard
