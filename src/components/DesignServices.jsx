import React from 'react'

const designServices = [
  {
    title: 'Diseño 3D Industrial',
    description:
      'Modelamiento tridimensional de plantas, equipos e instalaciones industriales. Visualización realista para planificación, presentación de proyectos y detección de interferencias antes de la construcción.',
    features: [
      'Modelado de plantas e instalaciones',
      'Detección de interferencias (clash detection)',
      'Renders fotorrealistas de proyectos',
      'Recorridos virtuales de instalaciones',
    ],
    image: '/Imagenes/Diseno/diseno-3d-industrial.jpg',
    imageAlt: 'Ingeniero trabajando con software CAD y renderizado 3D industrial',
  },
  {
    title: 'Diseño Mecánico',
    description:
      'Ingeniería de detalle para componentes y sistemas mecánicos. Planos de fabricación, cálculos estructurales y diseño de piezas con software especializado para la industria.',
    features: [
      'Planos de fabricación y montaje',
      'Cálculo estructural y de resistencia',
      'Diseño de piezas y ensamblajes',
      'Documentación técnica completa',
    ],
    image: '/Imagenes/Diseno/diseno-mecanico.jpg',
    imageAlt: 'Ingeniero modelando una pieza mecánica en software 3D',
  },
]

function DesignServices() {
  return (
    <section className="section design-services" id="diseno">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Ingeniería Digital</span>
          <h2>Diseño 3D & Mecánico</h2>
          <div className="accent-line"></div>
          <p>
            Ingeniería de detalle y modelamiento tridimensional para proyectos
            industriales
          </p>
        </div>

        <div className="design-grid">
          {designServices.map((service, index) => (
            <div
              className={`design-card ${index % 2 !== 0 ? 'design-card--reverse' : ''}`}
              key={index}
            >
              <div className="design-card-image">
                <img
                  src={service.image}
                  alt={service.imageAlt}
                  loading="lazy"
                />
              </div>
              <div className="design-card-body">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul className="design-features">
                  {service.features.map((feat, i) => (
                    <li key={i}>
                      <svg
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        className="design-check"
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

export default DesignServices
