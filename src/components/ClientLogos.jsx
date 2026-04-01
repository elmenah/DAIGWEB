import React from 'react'

const clients = [
  'Constructora Alfa',
  'Diseños MK',
  'Industrias del Sur',
  'Grupo Técnico',
  'Soluciones Pro',
  'MetalCorp',
]

function ClientLogos() {
  return (
    <section className="clients-section">
      <div className="container">
        <p className="clients-title">Empresas que confían en nosotros</p>
        <div className="clients-grid">
          {clients.map((client, index) => (
            <div className="client-logo-card" key={index}>
              <span>{client}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ClientLogos
