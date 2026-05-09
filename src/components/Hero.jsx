import React from 'react'
import { BlurIn } from './magicui/BlurIn'

function Hero() {
  return (
    <section className="hero" id="inicio">
      <video
        className="hero-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/Videos/a3bb27b1-4cc4-451b-be3a-7dbf762c4b48.mp4" type="video/mp4" />
      </video>
      <div className="hero-background"></div>
      <div className="container">
        <div className="hero-content">
          <BlurIn duration={1.0} delay={0}>
            <div className="hero-badge">
              <span className="hero-badge-dot"></span>
              Ingeniería Industrial
            </div>
          </BlurIn>
          <BlurIn duration={1.2} delay={0.15}>
            <h1>
              Soluciones integrales en{' '}
              <span>ingeniería<br />industrial</span>
            </h1>
          </BlurIn>
          <BlurIn duration={1.0} delay={0.3}>
            <p>
              Piping, estructuras metálicas, obras civiles, modelamiento 3D,
              CNC y protección de tuberías. Mejoramos la eficiencia y seguridad
              de tus instalaciones industriales con calidad garantizada.
            </p>
          </BlurIn>
          <BlurIn duration={0.8} delay={0.45}>
            <div className="hero-cta-group">
              <a href="#contacto" className="btn-primary">
                Solicitar Cotización
              </a>
              <a href="#portafolio" className="btn-outline">
                Ver Portafolio
              </a>
            </div>
          </BlurIn>

          <BlurIn duration={0.8} delay={0.6}>
            <div className="hero-stats-bar">
              <div className="hero-stat">
                <strong>50+</strong>
                <span>Proyectos</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <strong>20+</strong>
                <span>Clientes</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <strong>98%</strong>
                <span>Satisfacción</span>
              </div>
            </div>
          </BlurIn>
        </div>

        <div className="hero-images">
          <div className="hero-image-card hero-image-main">
            <img
              src="Imagenes\piping.jpeg"
              alt="Soldadura industrial DAIG"
              loading="lazy"
            />
            <div className="hero-image-overlay">
              <span>Piping Industrial</span>
            </div>
          </div>
          <div className="hero-image-card hero-image-main">
            <img
              src="Imagenes\estructuras-metalicas.webp"
              alt="Estructuras metálicas DAIG"
              loading="lazy"
            />
            <div className="hero-image-overlay">
              <span>Estructuras Metálicas</span>
            </div>
          </div>
        </div>
      </div>

      <a href="#nosotros" className="hero-scroll-indicator" aria-label="Scroll hacia abajo">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
        <span>Descubrir más</span>
      </a>
    </section>
  )
}

export default Hero
