import React from 'react'
import bgImg from '../assets/login-bg.jpeg'

export default function LoginVisual({ tagline, sub }) {
  return (
    <div className="admin-login-visual">
      <div
        className="admin-login-visual-canvas"
        style={{
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Overlay oscuro para legibilidad */}
      <div className="admin-login-visual-overlay" />
      <p className="admin-login-visual-tagline">{tagline}</p>
      {sub && <p className="admin-login-visual-sub">{sub}</p>}
    </div>
  )
}
