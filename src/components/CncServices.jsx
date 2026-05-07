import React from 'react'

const cncMachines = [
  {
    title: 'E-CUT CNC Router',
    description:
      'Máquina E-CUT CNC Router para cortes de alta precisión en madera, acrílico, MDF, PVC, aluminio y más. Ideal para señalética, piezas decorativas, prototipos y componentes industriales.',
    features: [
      'Corte y grabado en múltiples materiales',
      'Alta precisión y repetibilidad',
      'Piezas decorativas e industriales',
      'Señalética y letras corporativas',
    ],
    image: '/Imagenes/CNC/ecut-router.jpg',
    imageAlt: 'Máquina E-CUT CNC Router',
  },
  {
    title: 'CNC Láser',
    description:
      'Tecnología de corte y grabado láser para trabajos de detalle fino. Grabados personalizados, corte de materiales delgados y marcado industrial con acabados impecables.',
    features: [
      'Grabado detallado y personalización',
      'Corte fino en materiales delgados',
      'Marcado industrial y trazabilidad',
      'Logos, textos y diseños artísticos',
    ],
    image: '/Imagenes/CNC/cnc-laser.jpg',
    imageAlt: 'Máquina CNC Láser',
  },
]

function CncServices() {
  return (
    <section className="section cnc-services" id="cnc">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Tecnología CNC</span>
          <h2>E-CUT Router & CNC Láser</h2>
          <div className="accent-line"></div>
          <p>
            Cortes y grabados de alta precisión con tecnología CNC de última
            generación
          </p>
        </div>

        <div className="cnc-grid">
          {cncMachines.map((machine, index) => (
            <div className="cnc-card" key={index}>
              <div className="cnc-card-image">
                <img
                  src={machine.image}
                  alt={machine.imageAlt}
                  loading="lazy"
                />
              </div>
              <div className="cnc-card-body">
                <h3>{machine.title}</h3>
                <p>{machine.description}</p>
                <ul className="cnc-features">
                  {machine.features.map((feat, i) => (
                    <li key={i}>
                      <svg
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        className="cnc-check"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <a href="#contacto" className="btn-primary">
                  Cotizar
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CncServices
