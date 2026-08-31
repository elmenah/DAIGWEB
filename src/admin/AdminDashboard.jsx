import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import RegistrosManager from './RegistrosManager'
import UserManager from './UserManager'
import GalleryManager from './GalleryManager'
import InformeManager from './InformeManager'
import logoImg from '../assets/logo.jpeg'

const ICON = {
  inicio:    'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  registros: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  informes:  'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
  usuarios:  'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  galeria:   'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z',
}

const NAV = [
  { key: 'inicio',    label: 'Inicio',    roles: ['admin', 'directiva'] },
  { key: 'registros', label: 'Registros', roles: ['admin', 'directiva'] },
  { key: 'informes',  label: 'Informes',  roles: ['admin', 'directiva'] },
  { key: 'usuarios',  label: 'Usuarios',  roles: ['admin'] },
  { key: 'galeria',   label: 'Galería',   roles: ['admin'] },
]

const lunesDeEstaSemana = () => {
  const d = new Date(); const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().split('T')[0]
}

function KpiCard({ label, value, color, sub, onClick }) {
  return (
    <div className="admin-kpi" style={{ borderColor: `${color}44`, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="admin-kpi-value" style={{ color }}>{value}</div>
      <div className="admin-kpi-label">{label}</div>
      {sub && <div className="admin-kpi-sub">{sub}</div>}
    </div>
  )
}

function DashboardHome({ nombre, onGo }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const hoy = new Date().toISOString().split('T')[0]
      const lunes = lunesDeEstaSemana()
      const [hoyRes, semanaRes, pendRes, sinRevRes, usersRes] = await Promise.all([
        supabase.from('registros_trabajo').select('id', { count: 'exact', head: true }).eq('fecha', hoy),
        supabase.from('registros_trabajo').select('horas_trabajadas').gte('fecha', lunes),
        supabase.from('registros_trabajo').select('id', { count: 'exact', head: true }).eq('estado', 'Pendiente repuesto'),
        supabase.from('registros_trabajo').select('id', { count: 'exact', head: true }).is('revisado_por', null),
        supabase.from('profiles').select('role'),
      ])
      if (!alive) return
      const semana = semanaRes.data || []
      const horas = semana.reduce((s, r) => s + (r.horas_trabajadas || 0), 0)
      const trabajadores = (usersRes.data || []).filter(u => u.role === 'trabajador').length
      setStats({
        hoy: hoyRes.count || 0,
        semana: semana.length,
        horas: horas % 1 === 0 ? horas : horas.toFixed(1),
        pendientes: pendRes.count || 0,
        sinRevisar: sinRevRes.count || 0,
        trabajadores,
      })
    })()
    return () => { alive = false }
  }, [])

  return (
    <div>
      <div className="admin-page-head">
        <h2>Hola{nombre ? `, ${nombre}` : ''} 👋</h2>
        <p>Resumen de la actividad del equipo en terreno.</p>
      </div>

      {!stats ? (
        <div className="admin-loading" style={{ minHeight: 120 }}><div className="admin-spinner"></div></div>
      ) : (
        <>
          <div className="admin-kpi-grid">
            <KpiCard label="Registros hoy"        value={stats.hoy}          color="#e8962e" onClick={() => onGo('registros')} />
            <KpiCard label="Registros esta semana" value={stats.semana}       color="#3b82f6" sub="lun–hoy" onClick={() => onGo('registros')} />
            <KpiCard label="Horas esta semana"     value={stats.horas}        color="#8b5cf6" sub="lun–hoy" />
            <KpiCard label="Trabajadores"          value={stats.trabajadores} color="#22c55e" onClick={() => onGo('usuarios')} />
            <KpiCard label="Sin revisar"           value={stats.sinRevisar}   color="#f59e0b" sub={stats.sinRevisar > 0 ? 'requieren revisión' : 'al día'} onClick={() => onGo('registros')} />
            <KpiCard label="Pendiente repuesto"    value={stats.pendientes}   color="#ef4444" sub={stats.pendientes > 0 ? 'requieren atención' : ''} onClick={() => onGo('registros')} />
          </div>

          <div className="admin-quick">
            <button className="admin-quick-btn" onClick={() => onGo('registros')}>
              <svg viewBox="0 0 24 24"><path d={ICON.registros} /></svg>
              Ver registros de trabajadores
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function AdminDashboard() {
  const { logout, role, user } = useAuth()
  const navigate = useNavigate()
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [active, setActive] = useState('inicio')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('nombre, username').eq('id', user.id).single()
      .then(({ data }) => { if (data) setNombreUsuario(data.nombre || data.username || '') })
  }, [user])

  const isAdmin = role === 'admin'
  const items = NAV.filter(i => i.roles.includes(role))

  const go = (key) => { setActive(key); setDrawerOpen(false) }

  const handleLogout = () => {
    logout()
    navigate('/admin', { replace: true })
  }

  const currentLabel = NAV.find(i => i.key === active)?.label || 'Panel'

  return (
    <div className="admin-shell">
      {drawerOpen && <div className="admin-sidebar-overlay" onClick={() => setDrawerOpen(false)} />}

      <aside className={`admin-sidebar ${drawerOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-brand">
          <img src={logoImg} alt="DAIG" />
          <span>DAIG Admin</span>
        </div>

        <nav className="admin-nav">
          {items.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item ${active === item.key ? 'admin-nav-item--active' : ''}`}
              onClick={() => go(item.key)}
            >
              <svg viewBox="0 0 24 24"><path d={ICON[item.key]} /></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">{(nombreUsuario || 'A').charAt(0).toUpperCase()}</div>
            <div className="admin-sidebar-user-info">
              <span className="admin-sidebar-user-name">{nombreUsuario || 'Administrador'}</span>
              <span className="admin-sidebar-user-role">{role}</span>
            </div>
          </div>
          {isAdmin && (
            <a href="/" className="admin-sidebar-link" target="_blank" rel="noopener noreferrer">Ver sitio ↗</a>
          )}
          <button onClick={handleLogout} className="admin-sidebar-logout">Cerrar sesión</button>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <button className="admin-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
            <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
          </button>
          <h1>{currentLabel}</h1>
        </header>

        <main className="admin-page">
          {active === 'inicio' && <DashboardHome nombre={nombreUsuario} onGo={go} />}
          {active === 'registros' && <RegistrosManager />}
          {active === 'informes' && <InformeManager />}
          {active === 'usuarios' && isAdmin && <UserManager />}
          {active === 'galeria' && isAdmin && <GalleryManager />}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
