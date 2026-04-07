import React from 'react'
import { Particles } from './magicui/Particles'
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
      <Particles
        quantity={60}
        color="#E8962E"
        staticity={30}
        ease={80}
        size={0.5}
        style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%' }}
      />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="hero-content">
          <BlurIn duration={1.2}>
            <h1>
              Soluciones integrales en{' '}
              <span>ingeniería industrial</span>
            </h1>
          </BlurIn>
          <BlurIn duration={1} delay={0.3}>
            <p>
              En DAIG nos especializamos en limpieza y mantención industrial,
              piping, estructuras metálicas, obras civiles y modelamiento 3D.
              Mejoramos la eficiencia y seguridad de tus espacios de trabajo
              con servicios de alta calidad adaptados a tus necesidades.
            </p>
          </BlurIn>
          <BlurIn duration={0.8} delay={0.6}>
            <a href="#contacto" className="btn-primary">
              Solicitar Cotización
            </a>
          </BlurIn>
        </div>

        <div className="hero-images">
          <div className="hero-image-card">
            <img
              src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=400&fit=crop"
              alt="Soldadura industrial DAIG"
              loading="lazy"
            />
          </div>
          <div className="hero-image-card">
            <img
              src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=400&fit=crop"
              alt="Estructuras metálicas DAIG"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
