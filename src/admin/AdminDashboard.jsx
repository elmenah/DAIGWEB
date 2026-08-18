import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import GalleryManager from './GalleryManager'
import UserManager from './UserManager'
import RegistrosManager from './RegistrosManager'
import logoImg from '../assets/logo.jpeg'

function AdminDashboard() {
  const { logout, role, user } = useAuth()
  const navigate = useNavigate()
  const [nombreUsuario, setNombreUsuario] = useState('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('nombre, username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setNombreUsuario(data.nombre || data.username || '')
      })
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/admin', { replace: true })
  }

  const isAdmin = role === 'admin'
  const isDirectiva = role === 'directiva'

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-left">
          <img src={logoImg} alt="DAIG" className="admin-logo" />
          <h1>Panel de Administración</h1>
        </div>
        <div className="admin-header-right">
          {nombreUsuario && (
            <span style={{ color: '#9a9ab0', fontSize: '0.875rem' }}>
              {nombreUsuario}
            </span>
          )}
          {isAdmin && (
            <a href="/" className="admin-btn-outline" target="_blank" rel="noopener noreferrer">
              Ver Sitio
            </a>
          )}
          <button onClick={handleLogout} className="admin-btn-danger">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-container">
          <div className="admin-welcome">
            {isAdmin && <h2>Bienvenido{nombreUsuario ? `, ${nombreUsuario}` : ''}</h2>}
            {isDirectiva && <h2>Panel Directiva{nombreUsuario ? ` — ${nombreUsuario}` : ''}</h2>}
            <p>
              {isAdmin && 'Gestión de registros de trabajadores, portafolio de imágenes y usuarios del sistema.'}
              {isDirectiva && 'Visualización de registros fotográficos y de trabajo del equipo en terreno.'}
            </p>
          </div>

          <RegistrosManager />

          {isAdmin && <UserManager />}
          {isAdmin && <GalleryManager />}

        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
