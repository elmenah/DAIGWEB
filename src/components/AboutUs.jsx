import React from 'react'
import { BlurIn } from './magicui/BlurIn'

function AboutUs() {
  return (
    <section className="section about-us" id="nosotros">
      <div className="container">
        <BlurIn>
          <div className="section-header">
            <span className="section-eyebrow">Quiénes Somos</span>
            <h2>Sobre Nosotros</h2>
            <div className="accent-line"></div>
            <p>Conoce a DAIG Chile SPA y nuestro compromiso con la industria</p>
          </div>
        </BlurIn>

        <div className="about-grid">
          <div className="about-content">
            <h3>Ingeniería y Servicios de Excelencia</h3>
            <p>
              En <strong>DAIG Chile SPA</strong> nos especializamos en ofrecer soluciones
              integrales de limpieza y mantención industrial, mejorando la eficiencia
              y seguridad de los espacios de trabajo. Desde Puchuncaví, Valparaíso,
              brindamos servicios de piping, estructuras metálicas, obras civiles,
              modelamiento 3D y protección de tuberías.
            </p>
            <p>
              Nuestro equipo cuenta con profesionales calificados y experiencia en
              terreno para garantizar resultados excepcionales en cada proyecto
              industrial. Nos mueve la seguridad, la calidad y el compromiso con
              nuestros clientes.
            </p>
            <div className="about-values">
              <div className="about-value">
                <div className="about-value-icon">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                </div>
                <div>
                  <h4>Calidad Certificada</h4>
                  <p>Trabajamos con los más altos estándares de calidad en cada proyecto</p>
                </div>
              </div>
              <div className="about-value">
                <div className="about-value-icon">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <div>
                  <h4>Soluciones a Medida</h4>
                  <p>Diseñamos soluciones personalizadas para cada necesidad específica</p>
                </div>
              </div>
              <div className="about-value">
                <div className="about-value-icon">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </div>
                <div>
                  <h4>Equipo Profesional</h4>
                  <p>Profesionales capacitados con años de experiencia en el rubro</p>
                </div>
              </div>
            </div>
          </div>
          <div className="about-image">
            <div className="about-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=500&fit=crop"
                alt="Equipo DAIG trabajando"
                loading="lazy"
              />
              <div className="about-experience-badge">
                <span className="badge-number">1</span>
                <span className="badge-text">Año de experiencia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutUs
