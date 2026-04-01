import React from 'react'

function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-background"></div>
      <div className="container">
        <div className="hero-content">
          <h1>
            Soluciones integrales en{' '}
            <span>ingeniería industrial</span>
          </h1>
          <p>
            En DAIG nos especializamos en limpieza y mantención industrial,
            piping, estructuras metálicas, obras civiles y modelamiento 3D.
            Mejoramos la eficiencia y seguridad de tus espacios de trabajo
            con servicios de alta calidad adaptados a tus necesidades.
          </p>
          <a href="#contacto" className="btn-primary">
            Solicitar Cotización
          </a>
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
