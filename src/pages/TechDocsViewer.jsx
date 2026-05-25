import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'

function TechDocsViewer() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" state={{ from: '/tecnico' }} replace />
  }

  return (
    <iframe
      src="/docs/sistema_neumatico_norgren_interactivo.html"
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="Sistema Neumático Norgren · Bucher CityFant 6000"
    />
  )
}

export default TechDocsViewer
