import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import GalleryManager from './GalleryManager'
import logoImg from '../assets/logo.jpeg'

function AdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin', { replace: true })
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-left">
          <img src={logoImg} alt="DAIG" className="admin-logo" />
          <h1>Panel de Administración</h1>
        </div>
        <div className="admin-header-right">
          <a href="/" className="admin-btn-outline" target="_blank" rel="noopener noreferrer">
            Ver Sitio
          </a>
          <button onClick={handleLogout} className="admin-btn-danger">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-container">
          <div className="admin-welcome">
            <h2>Bienvenido, Administrador</h2>
            <p>Desde aquí puedes gestionar las imágenes del portafolio de tu sitio web.</p>
          </div>

          <GalleryManager />

          <div className="admin-section admin-info">
            <h3>Información</h3>
            <ul>
              <li>Las imágenes se almacenan en <strong>Supabase Storage</strong> (bucket: gallery).</li>
              <li>Tamaño máximo por imagen: 5MB.</li>
              <li>Las imágenes agregadas aquí se mostrarán junto a las del portafolio por defecto.</li>
              <li>La autenticación se gestiona a través de <strong>Supabase Auth</strong>.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
