import React from 'react'
import { BlurIn } from './magicui/BlurIn'
import { BorderBeam } from './magicui/BorderBeam'

const services = [
  {
    title: 'Piping',
    description: 'Soldadura de alta precisión para sistemas de tuberías industriales. Instalación, mantención y reparación con los más altos estándares de calidad y seguridad.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
      </svg>
    ),
  },
  {
    title: 'Estructuras Metálicas',
    description: 'Fabricación e instalación de estructuras metálicas para proyectos industriales. Diseño, corte, soldadura y montaje con certificación de calidad.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>
    ),
  },
  {
    title: 'Obras Civiles',
    description: 'Proyectos completos de ingeniería civil: gestión, construcción, logística y supervisión. Soluciones integrales desde la planificación hasta la entrega.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 22h22L12 2 1 22zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    ),
  },
  {
    title: 'Modelamiento 3D',
    description: 'Creación de modelos digitales detallados de instalaciones industriales para planificación, análisis y optimización de proyectos de ingeniería.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0112 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 00-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 012.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/>
      </svg>
    ),
  },
  {
    title: 'Protección de Tuberías',
    description: 'Soluciones integrales anticorrosivas, aislamiento térmico y reparaciones especializadas para la protección y conservación de sistemas de tuberías.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
    ),
  },
  {
    title: 'Extracción y Recubrimiento',
    description: 'Retiro de cañerías dañadas y aplicación de recubrimientos anticorrosión de alta durabilidad para prolongar la vida útil de las instalaciones.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 1l-4 4-4-4-4 4 4 4-4 4 4 4-4 4 4 4 4-4 4 4 4-4-4-4 4-4-4-4 4-4z"/>
      </svg>
    ),
  },
]

function Services() {
  return (
    <section className="section services" id="servicios">
      <div className="container">
        <BlurIn>
          <div className="section-header">
            <h2>Nuestros Servicios</h2>
            <div className="accent-line"></div>
            <p>Soluciones integrales de ingeniería industrial, piping, estructuras y obras civiles</p>
          </div>
        </BlurIn>

        <div className="services-grid">
          {services.map((service, index) => (
            <div className="service-card" key={index} style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="service-icon">
                {service.icon}
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <BorderBeam size={150} duration={12} delay={index * 2} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
