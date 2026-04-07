import React from 'react'
import { Marquee } from './magicui/Marquee'

const clients = [
  { name: 'Puertos Ventanas', logo: '/Imagenes/Empresas/pvsa.png' },
  { name: 'Municipalidad de Puchuncaví', logo: '/Imagenes/Empresas/munipuchuncavi.png' },
  { name: 'Sopraval', logo: '/Imagenes/Empresas/Sopraval.png' },
  
]

function ClientLogos() {
  return (
    <section className="clients-section">
      <div className="container">
        <p className="clients-title">Empresas que confían en nosotros</p>
        <Marquee pauseOnHover className="clients-marquee">
          {clients.map((client, index) => (
            <div className="client-logo-card" key={index}>
              <img src={client.logo} alt={client.name} className="client-logo-img" />
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

export default ClientLogos
