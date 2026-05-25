import React, { useState, useEffect } from 'react'
import logoImg from '../assets/logo.jpeg'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Nosotros', href: '#nosotros' },
    { label: 'Portafolio', href: '#portafolio' },
    { label: 'CNC', href: '#cnc' },
    { label: 'Diseño', href: '#diseno' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Digital', href: '#digital' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contacto', href: '#contacto' },
  ]

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-left">
            <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>Puchuncaví, Valparaíso, Chile</span>
          </div>
          <div className="top-bar-right">
            <svg viewBox="0 0 24 24" fill="white" style={{ width: '14px', height: '14px' }}>
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span>cotizaciones@daigchile.cl</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <a href="#inicio" className="navbar-logo">
            <img src={logoImg} alt="DAIG - Ingeniería y Servicios" className="logo-img" />
          </a>

          <div className="navbar-contact" style={{ gap: '8px' }}>
            <span className="digital-nav-badge">
              <span className="digital-nav-badge-dot"></span>
              Ingeniería Industrial
            </span>
          </div>

          <button
            className={`menu-toggle ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú de navegación"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Nav Menu */}
      <div className={`nav-menu ${menuOpen ? 'mobile-open' : ''}`} role="navigation" aria-label="Navegación principal">
        <div className="container">
          <ul id="main-nav">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  )
}

export default Header
