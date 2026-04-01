import React from 'react'

const clients = [
  { name: 'Puertos Ventanas', logo: '/Imagenes/Empresas/pvsa.png' },
  { name: 'Diseños MK', logo: '/Imagenes/Empresas/disenos-mk.png' },
  { name: 'Industrias del Sur', logo: '/Imagenes/Empresas/industrias-del-sur.png' },
  { name: 'Grupo Técnico', logo: '/Imagenes/Empresas/grupo-tecnico.png' },
  { name: 'Soluciones Pro', logo: '/Imagenes/Empresas/soluciones-pro.png' },
  { name: 'MetalCorp', logo: '/Imagenes/Empresas/metalcorp.png' },
]

function ClientLogos() {
  return (
    <section className="clients-section">
      <div className="container">
        <p className="clients-title">Empresas que confían en nosotros</p>
        <div className="clients-grid">
          {clients.map((client, index) => (
            <div className="client-logo-card" key={index}>
              <img src={client.logo} alt={client.name} className="client-logo-img" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ClientLogos
