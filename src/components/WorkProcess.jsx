import React from 'react'
import { BlurIn } from './magicui/BlurIn'

const steps = [
  {
    number: '01',
    title: 'Consulta Inicial',
    description: 'Analizamos tus necesidades y requerimientos específicos para tu proyecto industrial.',
    details: ['Visita técnica en terreno', 'Levantamiento de información', 'Evaluación de alcance'],
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Ingeniería y Diseño',
    description: 'Elaboramos la ingeniería de detalle, modelamiento 3D y planos de fabricación.',
    details: ['Modelado 3D completo', 'Planos isométricos', 'Memoria de cálculo'],
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Fabricación y Montaje',
    description: 'Ejecutamos con precisión: soldadura certificada, montaje y supervisión en terreno.',
    details: ['Soldadura certificada', 'Corte CNC y láser', 'Supervisión técnica'],
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0014 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Entrega y Garantía',
    description: 'Verificación de calidad, documentación técnica y entrega con garantía total.',
    details: ['Control de calidad', 'Dossier técnico', 'Garantía incluida'],
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    ),
  },
]

function WorkProcess() {
  return (
    <section className="section work-process" id="proceso">
      <div className="container">
        <BlurIn>
          <div className="section-header">
            <span className="section-eyebrow">Metodología</span>
            <h2>Nuestro Proceso</h2>
            <div className="accent-line"></div>
            <p>Un método probado que garantiza resultados excepcionales en cada proyecto</p>
          </div>
        </BlurIn>

        <div className="process-timeline">
          {steps.map((step, index) => (
            <div className="process-step" key={index}>
              <div className="process-step-header">
                <div className="process-step-icon">
                  {step.icon}
                </div>
                <div className="process-step-number">{step.number}</div>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <ul className="process-details">
                {step.details.map((detail, i) => (
                  <li key={i}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WorkProcess
