import React from 'react'
import Header from '../components/Header'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import ScrollToTop from '../components/ScrollToTop'

function CotizarPage() {
  return (
    <>
      <Header />
      <main>
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="container" style={{ paddingTop: '2rem' }}>
            <span className="section-eyebrow">Cotizacion Industrial</span>
            <h1>Solicita tu cotizacion industrial con DAIG Chile</h1>
            <p style={{ marginTop: '1rem', maxWidth: '72ch' }}>
              Cuéntanos tu requerimiento de piping, estructuras metalicas, obras civiles, modelamiento 3D, CNC o
              diseno mecanico. Te respondemos con una propuesta tecnica y comercial ajustada a tu operacion.
            </p>
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  )
}

export default CotizarPage