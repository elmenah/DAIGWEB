import React from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import ClientLogos from './components/ClientLogos'
import Testimonial from './components/Testimonial'
import AboutUs from './components/AboutUs'
import Stats from './components/Stats'
import Services from './components/Services'
import Ventajas from './components/Ventajas'
import Gallery from './components/Gallery'
import CncServices from './components/CncServices'
import DesignServices from './components/DesignServices'
import WorkProcess from './components/WorkProcess'
import FAQ from './components/FAQ'
import CtaSection from './components/CtaSection'
import Contact from './components/Contact'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import ScrollToTop from './components/ScrollToTop'
import useScrollAnimation from './hooks/useScrollAnimation'

function App() {
  useScrollAnimation()

  return (
    <>
      <Header />
      <Hero />
      <ClientLogos />

      <div className="fade-in">
        <AboutUs />
      </div>
      <Stats />

      <div className="fade-in">
        <Services />
      </div>
      <div className="fade-in">
        <Ventajas />
      </div>
      <div className="fade-in">
        <Gallery />
      </div>
      <div className="fade-in">
        <CncServices />
      </div>
      <div className="fade-in">
        <DesignServices />
      </div>
      <div className="fade-in">
        <WorkProcess />
      </div>

      <div className="fade-in">
        <FAQ />
      </div>
     
      <div className="fade-in">
        <Contact />
      </div>
      <Footer />
      <WhatsAppButton />
      <ScrollToTop />
    </>
  )
}

export default App
