import React from 'react'
import { Link } from 'react-router-dom'
import { servicePages } from '../data/servicePages'

function ServicesHubPage() {
  return (
    <main>
      <section className="section">
        <div className="container" style={{ paddingTop: '2rem' }}>
          <span className="section-eyebrow">Servicios DAIG</span>
          <h1>Servicios industriales en Puchuncavi, Quintero y Ventanas</h1>
          <p style={{ marginTop: '1rem', maxWidth: '72ch' }}>
            Conoce nuestras soluciones por especialidad. Cada servicio cuenta con su propia pagina para que puedas
            evaluar alcance, enfoque tecnico y solicitar cotizacion segun tu necesidad operativa.
          </p>

          <div className="services-grid" style={{ marginTop: '2rem' }}>
            {servicePages.map((service) => (
              <article className="service-card" key={service.slug}>
                <h2 style={{ marginBottom: '0.75rem' }}>{service.name}</h2>
                <p>{service.description}</p>
                <Link className="service-link" to={`/servicios/${service.slug}`}>
                  Ver detalle del servicio
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                  </svg>
                </Link>
              </article>
            ))}
          </div>

          <p style={{ marginTop: '2rem' }}>
            <a href="/#contacto" className="btn-primary">Solicitar cotizacion</a>
          </p>
        </div>
      </section>
    </main>
  )
}

export default ServicesHubPage