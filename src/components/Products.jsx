import React from 'react'

const products = [
  {
    title: 'Sistemas de Piping',
    description: 'Instalación, reparación y mantención de sistemas de tuberías industriales con soldadura de alta precisión y certificación de calidad.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
      </svg>
    ),
  },
  {
    title: 'Estructuras Metálicas',
    description: 'Fabricación, montaje e instalación de estructuras metálicas para proyectos industriales, galpones, plataformas y soportes.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>
    ),
  },
  {
    title: 'Obras Civiles',
    description: 'Gestión integral de proyectos de construcción: ingeniería, planificación, ejecución, logística y supervisión en terreno.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
      </svg>
    ),
  },
  {
    title: 'Modelamiento 3D',
    description: 'Creación de modelos digitales tridimensionales de instalaciones industriales para planificación, análisis y optimización de proyectos.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0112 22z"/>
      </svg>
    ),
  },
  {
    title: 'Protección de Tuberías',
    description: 'Soluciones anticorrosivas, aislamiento térmico y reparaciones especializadas para la conservación de sistemas de tuberías industriales.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    ),
  },
  {
    title: 'Extracción y Recubrimiento',
    description: 'Retiro profesional de cañerías dañadas y aplicación de recubrimientos anticorrosión de alta durabilidad para instalaciones industriales.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 1l-4 4-4-4-4 4 4 4-4 4 4 4-4 4 4 4 4-4 4 4 4-4-4-4 4-4-4-4 4-4z"/>
      </svg>
    ),
  },
]

function Products() {
  return (
    <section className="section products" id="servicios-detallados">
      <div className="container">
        <div className="section-header">
          <h2>Nuestros Servicios en Detalle</h2>
          <div className="accent-line"></div>
          <p>Soluciones especializadas para la industria en piping, estructuras, obras civiles y más</p>
        </div>

        <div className="products-grid">
          {products.map((product, index) => (
            <div className="product-card" key={index}>
              <div className="product-card-image">
                {product.icon}
              </div>
              <div className="product-card-body">
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <a href="#contacto" className="btn-secondary">Cotizar</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Products
