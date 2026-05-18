import React, { useState, useEffect } from 'react'
import logoImg from '../assets/logo.jpeg'

function HeaderDigital() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Servicios', href: '#servicios-digitales' },
    { label: 'Proceso', href: '#proceso-digital' },
    { label: 'Contacto', href: '#contacto-digital' },
  ]

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-right">
            <a href="/" style={{ color: 'white', fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg viewBox="0 0 24 24" fill="white" style={{ width: '14px', height: '14px' }}>
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              Volver al sitio principal
            </a>
          </div>
          <div className="top-bar-left">
            <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>Puchuncaví, Valparaíso, Chile</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <a href="/" className="navbar-logo">
            <img src={logoImg} alt="DAIG - Ingeniería y Servicios" className="logo-img" />
          </a>

          <div className="navbar-contact" style={{ gap: '8px' }}>
            <span className="digital-nav-badge">
              <span className="digital-nav-badge-dot"></span>
              Soluciones Digitales
            </span>
          </div>

          <button
            className={`menu-toggle ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú de navegación"
            aria-expanded={menuOpen}
            aria-controls="main-nav-digital"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Nav Menu */}
      <div className={`nav-menu ${menuOpen ? 'mobile-open' : ''}`} role="navigation" aria-label="Navegación Soluciones Digitales">
        <div className="container">
          <ul id="main-nav-digital">
            {navItems.map((item) => (
              <li key={item.label}>
                <a href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href="/" onClick={() => setMenuOpen(false)} style={{ color: 'var(--primary-light)' }}>
                ← Sitio Principal
              </a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  )
}

export default HeaderDigital
