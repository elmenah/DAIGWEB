import React from 'react'
import { BlurIn } from './magicui/BlurIn'

const ventajas = [
  {
    number: '01',
    title: 'Experiencia Comprobada',
    description: 'Proyectos ejecutados en industrias de alto estándar en la región de Valparaíso, con resultados medibles y clientes que avalan nuestro trabajo.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Ingeniería de Detalle',
    description: 'Cada proyecto incluye modelamiento 3D, planos isométricos y documentación técnica completa antes de iniciar la ejecución en terreno.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Equipo Propio Certificado',
    description: 'Contamos con soldadores certificados, operadores CNC calificados y técnicos con experiencia real en planta industrial, sin tercerizar la ejecución.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Respuesta Rápida',
    description: 'Entendemos los tiempos de la industria. Coordinamos visita técnica en 24 horas y entregamos cotización formal dentro del mismo día.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L11 13V7h1.5v5.25l4.5 2.67-1.26 2.08z"/>
      </svg>
    ),
  },
  {
    number: '05',
    title: 'Soluciones 360°',
    description: 'Desde la ingeniería hasta la entrega final: diseño, fabricación CNC, corte láser, montaje, protección anticorrosiva y obras civiles en un solo proveedor.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
    ),
  },
  {
    number: '06',
    title: 'Seguridad y Normativa',
    description: 'Todos nuestros trabajos cumplen con las normativas de seguridad industrial vigentes. Personal con EPP certificado y protocolos de trabajo en altura y espacios confinados.',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/>
      </svg>
    ),
  },
]

function Ventajas() {
  return (
    <section className="section ventajas-section" id="ventajas">
      <div className="container">
        <BlurIn>
          <div className="section-header">
            <span className="section-eyebrow">Nuestras Fortalezas</span>
            <h2>¿Por qué elegir DAIG?</h2>
            <div className="accent-line"></div>
            <p>Nos diferenciamos por la calidad técnica, el compromiso y la capacidad de entregar soluciones completas</p>
          </div>
        </BlurIn>

        <div className="ventajas-grid">
          {ventajas.map((item, index) => (
            <div className="ventaja-card" key={index}>
              <div className="ventaja-number">{item.number}</div>
              <div className="ventaja-icon">
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Ventajas
