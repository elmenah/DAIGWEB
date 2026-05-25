import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'

function TechDocsViewer() {
  const { isAuthenticated, loading, role, logout } = useAuth()
  const navigate = useNavigate()

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

  // Role todavía no cargó — esperar sin redirigir
  if (role === null) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    )
  }

  if (!['admin', 'tecnico'].includes(role)) {
    return <Navigate to="/" replace />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <button
        onClick={handleLogout}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'rgba(15,20,25,0.92)',
          color: '#ff4e3a',
          border: '1px solid #ff4e3a',
          padding: '8px 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        Cerrar sesión
      </button>
      <iframe
        src="/docs/HUB_consolidado_camion_barredor.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Portal Técnico · Camión Barredor Bucher CityFant 6000 · DAIG SpA"
      />
    </div>
  )
}

export default TechDocsViewer

