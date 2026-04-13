import React from 'react'
import { BlurIn } from './magicui/BlurIn'
import { BorderBeam } from './magicui/BorderBeam'

const services = [
  {
    title: 'Piping Industrial',
    description: 'Soldadura de alta precisión para sistemas de tuberías. Instalación, mantención y reparación con los más altos estándares de calidad y seguridad certificada.',
    tag: 'Especialidad',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
      </svg>
    ),
  },
  {
    title: 'Estructuras Metálicas',
    description: 'Fabricación e instalación de estructuras para proyectos industriales. Diseño, corte, soldadura y montaje con certificación de calidad y garantía.',
    tag: 'Fabricación',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>
    ),
  },
  {
    title: 'Obras Civiles',
    description: 'Proyectos completos de ingeniería civil: gestión, construcción, logística y supervisión. Soluciones integrales desde la planificación hasta la entrega.',
    tag: 'Construcción',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 22h22L12 2 1 22zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    ),
  },
  {
    title: 'Modelamiento 3D',
    description: 'Modelos digitales detallados de instalaciones industriales para planificación, análisis y optimización de proyectos con software de última generación.',
    tag: 'Ingeniería',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0112 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 00-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 012.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/>
      </svg>
    ),
  },
  {
    title: 'Protección de Tuberías',
    description: 'Soluciones anticorrosivas integrales, aislamiento térmico y reparaciones especializadas para conservación y vida útil prolongada de sistemas de tuberías.',
    tag: 'Protección',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
    ),
  },
  {
    title: 'Extracción y Recubrimiento',
    description: 'Retiro de cañerías dañadas y aplicación de recubrimientos anticorrosión de alta durabilidad para prolongar la vida útil de las instalaciones industriales.',
    tag: 'Mantención',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0014 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
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
            <span className="section-eyebrow">Lo que hacemos</span>
            <h2>Nuestros Servicios</h2>
            <div className="accent-line"></div>
            <p>Soluciones integrales de ingeniería industrial: piping, estructuras, obras civiles y más</p>
          </div>
        </BlurIn>

        <div className="services-grid">
          {services.map((service, index) => (
            <div className="service-card" key={index}>
              <div className="service-card-top">
                <div className="service-icon">
                  {service.icon}
                </div>
                <span className="service-tag">{service.tag}</span>
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <a href="#contacto" className="service-link">
                Cotizar servicio
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </a>
              <BorderBeam size={180} duration={12} delay={index * 2} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
