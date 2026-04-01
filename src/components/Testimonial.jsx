import React, { useState, useEffect } from 'react'

const testimonials = [
  {
    text: 'El trabajo de piping que realizó DAIG en nuestra planta fue impecable. Soldaduras certificadas, cumplimiento de plazos y un equipo altamente profesional.',
    author: 'Carlos Méndez',
    company: 'Planta Industrial Quintero',
    photo: '/Imagenes/Panoramicas/pvsapanoramica.jpg',
  },
  {
    text: 'Contratamos a DAIG para la fabricación y montaje de estructuras metálicas. El resultado superó nuestras expectativas en calidad y tiempo de entrega.',
    author: 'María González',
    company: 'Constructora Litoral',
    photo: '/Imagenes/Panoramicas/maria-gonzalez.jpg',
  },
  {
    text: 'Su servicio de protección de tuberías nos permitió extender la vida útil de nuestras instalaciones. Excelente equipo técnico y soluciones efectivas.',
    author: 'Roberto Fuentes',
    company: 'Minera del Pacífico',
    photo: '/Imagenes/Panoramicas/roberto-fuentes.jpg',
  },
  {
    text: 'La gestión integral de la obra civil fue profesional de principio a fin. Planificación, ejecución y supervisión de primer nivel. Totalmente recomendados.',
    author: 'Andrea Silva',
    company: 'Ingeniería Valparaíso',
    photo: '/Imagenes/Panoramicas/andrea-silva.jpg',
  },
]

function Testimonial() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="testimonial-banner">
      <div className="container">
        <div className="testimonial-carousel">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className={`testimonial-slide ${i === current ? 'active' : ''}`}
            >
              <img src={t.photo} alt={t.author} className="testimonial-photo" />
              {t.text}
              <cite className="author">
                — {t.author}, <span className="company">{t.company}</span>
              </cite>
            </blockquote>
          ))}
        </div>
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
    </section>
  )
}

export default Testimonial
