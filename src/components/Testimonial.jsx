import React, { useState, useEffect, useRef } from 'react'

const testimonials = [
  {
    text: 'El trabajo de piping que realizó DAIG en nuestra planta fue impecable. Soldaduras certificadas, cumplimiento de plazos y un equipo altamente profesional.',
    author: 'Carlos Méndez',
    company: 'Gerenente de Mantenimiento, Puertos Ventanas',
    photo: '/Imagenes/Panoramicas/pvsapanoramica.jpg',
  },
 
]

function Testimonial() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (paused || testimonials.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timerRef.current)
  }, [paused])

  return (
    <section className="testimonial-banner" aria-roledescription="carrusel" aria-label="Testimonios de clientes">
      <div className="container">
        <div className="testimonial-carousel" aria-live={paused ? 'polite' : 'off'}>
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className={`testimonial-slide ${i === current ? 'active' : ''}`}
              aria-hidden={i !== current}
            >
              {t.text}
              <cite className="author">
                — {t.author}, <span className="company">{t.company}</span>
              </cite>
            </blockquote>
          ))}
        </div>
        <div className="testimonial-controls">
          {testimonials.length > 1 && (
            <button
              className="testimonial-pause"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? 'Reproducir testimonios' : 'Pausar testimonios'}
            >
              {paused ? '▶' : '❚❚'}
            </button>
          )}
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`testimonial-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonial
