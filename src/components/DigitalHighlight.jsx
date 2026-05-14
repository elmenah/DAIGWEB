import React from 'react'

function DigitalHighlight() {
  return (
    <section className="section digital-home-section" id="digital">
      <div className="container digital-home-container">
        <div className="digital-home-content">
          <span className="section-eyebrow">Nuevo en DAIG</span>
          <h2>Soluciones Digitales para Industria</h2>
          <p>
            Creamos sitios web, automatizaciones, chatbots, agentes IA y dashboards
            pensados para operaciones industriales reales. No es marketing genérico,
            es tecnología aplicada a terreno.
          </p>
          <div className="digital-home-actions">
            <a href="/digital" className="btn-primary">Ver DAIG Digital</a>
            <a href="/digital#contacto-digital" className="btn-outline">Solicitar diagnóstico</a>
          </div>
        </div>

        <div className="digital-home-panel" aria-hidden="true">
          <div className="digital-home-panel-header">
            <span></span>
            <span></span>
            <span></span>
            <p>panel.operaciones.daig</p>
          </div>
          <div className="digital-home-kpis">
            <div>
              <small>Órdenes esta semana</small>
              <strong>146</strong>
            </div>
            <div>
              <small>Cotizaciones automáticas</small>
              <strong>32</strong>
            </div>
          </div>
          <div className="digital-home-bars">
            {[45, 62, 51, 76, 68, 82, 60].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }}></span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DigitalHighlight
