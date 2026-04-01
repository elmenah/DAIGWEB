import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return children
}

export default AuthGuard
