import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function AuthGuard({ children }) {
  const { isAuthenticated, loading, role } = useAuth()

  if (loading || (isAuthenticated && role === null)) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  if (role === 'tecnico') {
    return <Navigate to="/tecnico" replace />
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default AuthGuard
