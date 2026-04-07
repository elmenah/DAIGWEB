import React from 'react'
import { BlurIn } from './magicui/BlurIn'

function CtaSection() {
  return (
    <section className="cta-section">
      <div className="container">
        <BlurIn>
          <h2>¿Necesitas servicios industriales de calidad?</h2>
          <p>
            Contáctanos hoy para una cotización sin compromiso. Piping, estructuras, obras civiles y más.
          </p>
        </BlurIn>
        <a href="#contacto" className="btn-white">
          Contáctanos
        </a>
      </div>
    </section>
  )
}

export default CtaSection
