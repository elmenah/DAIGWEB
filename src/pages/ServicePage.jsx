import React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { serviceBySlug } from '../data/servicePages'

function ServicePage() {
  const { slug } = useParams()
  const service = slug ? serviceBySlug[slug] : null

  if (!service) {
    return <Navigate to="/servicios" replace />
  }

  return (
    <main>
      <section className="section">
        <div className="container" style={{ paddingTop: '2rem', maxWidth: '860px' }}>
          <p style={{ marginBottom: '1rem' }}>
            <Link to="/servicios">← Volver a todos los servicios</Link>
          </p>

          <span className="section-eyebrow">Servicio Especializado</span>
          <h1>{service.name}</h1>
          <p style={{ marginTop: '1rem' }}>{service.intro}</p>

          <h2 style={{ marginTop: '2rem' }}>Que incluye este servicio</h2>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.2rem' }}>
            {service.bullets.map((item) => (
              <li key={item} style={{ marginBottom: '0.75rem' }}>{item}</li>
            ))}
          </ul>

          <h2 style={{ marginTop: '2rem' }}>Cobertura y enfoque operacional</h2>
          <p style={{ marginTop: '1rem' }}>
            Atendemos requerimientos en la zona industrial de Puchuncavi, Quintero y Ventanas, con capacidad de apoyo
            para proyectos en otras regiones segun alcance tecnico. Coordinamos visita tecnica, levantamiento y
            propuesta formal para ejecutar con seguridad y trazabilidad.
          </p>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="/#contacto" className="btn-primary">Solicitar cotizacion</a>
            <a href="mailto:cotizaciones@daigchile.cl" className="btn-secondary">Escribir por email</a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ServicePage