import React, { useState } from 'react'

const faqs = [
  {
    question: '¿Qué servicios de piping ofrecen?',
    answer: 'Realizamos soldadura de alta precisión para sistemas de tuberías industriales, incluyendo instalación de líneas nuevas, reparaciones, mantención y pruebas de presión, todo bajo estrictos estándares de calidad y seguridad.',
  },
  {
    question: '¿En qué zonas operan?',
    answer: 'Operamos desde Puchuncaví, Valparaíso, y brindamos servicios en toda la Región de Valparaíso y zonas industriales a lo largo de Chile. Contáctanos para consultar disponibilidad en tu zona.',
  },
  {
    question: '¿Cómo puedo solicitar una cotización?',
    answer: 'Puedes contactarnos por WhatsApp al +569 88689400, por email a cotizaciones.daig@serviciosdaig.com o a través del formulario de contacto en esta página. Te entregamos una cotización sin compromiso.',
  },
  {
    question: '¿Qué tipo de estructuras metálicas fabrican?',
    answer: 'Fabricamos e instalamos galpones, plataformas, soportes, escaleras, barandas y estructuras a medida para plantas industriales. Trabajamos con diseño, corte, soldadura y montaje certificado.',
  },
  {
    question: '¿Realizan obras civiles completas?',
    answer: 'Sí, gestionamos proyectos integrales de obras civiles: desde la ingeniería y planificación, hasta la construcción, logística y supervisión en terreno.',
  },
  {
    question: '¿Qué incluye el servicio de protección de tuberías?',
    answer: 'Ofrecemos soluciones anticorrosivas, aislamiento térmico, reparaciones especializadas y recubrimientos de alta durabilidad para prolongar la vida útil de tuberías e instalaciones industriales.',
  },
]

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="section faq" id="faq">
      <div className="container">
        <div className="section-header">
          <h2>Preguntas Frecuentes</h2>
          <div className="accent-line"></div>
          <p>Resolvemos tus dudas más comunes</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
              key={index}
            >
              <button className="faq-question" onClick={() => toggle(index)}>
                <span>{faq.question}</span>
                <svg
                  className="faq-chevron"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
