import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'

function TechDocsViewer() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const docsUrl = useMemo(
    () => `/docs/HUB_consolidado_camion_barredor.html?t=${Date.now()}`,
    []
  )

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
        src={docsUrl}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Portal Técnico · Camión Barredor Bucher CityFant 6000 · DAIG SpA"
      />
    </div>
  )
}

export default TechDocsViewer

