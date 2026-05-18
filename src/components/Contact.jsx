import React, { useState } from 'react'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const [website, setWebsite] = useState('')
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now())

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const sendViaWhatsApp = () => {
    const { name, email, phone, service, message } = formData
    const selectedService = service || 'No especificado'
    const whatsappMessage = `Hola DAIG! Soy ${name}. Email: ${email}, Tel: ${phone}. Servicio: ${selectedService}. ${message}`
    const encoded = encodeURIComponent(whatsappMessage)
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setStatus(null)

    try {
      const res = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'main',
          website,
          formStartedAt,
        }),
      })
      if (res.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', phone: '', service: '', message: '' })
        setWebsite('')
        setFormStartedAt(Date.now())
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
    setSending(false)
  }

  return (
    <section className="section contact" id="contacto">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Hablemos</span>
          <h2>Contacto</h2>
          <div className="accent-line"></div>
          <p>¿Tienes un proyecto en mente? Escríbenos y te ayudamos a hacerlo realidad</p>
        </div>

        <div className="contact-grid">
          <div className="contact-info">
            <h3>Información de Contacto</h3>
            <p>
              Estamos disponibles para responder tus consultas y realizar cotizaciones
              personalizadas. No dudes en comunicarte con nosotros.
            </p>

            

            

            <div className="contact-info-item">
              <div className="icon-circle">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <span>cotizaciones@daigchile.cl</span>
            </div>

            <div className="contact-info-item">
              <div className="icon-circle">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
              <span>Lun - Vie: 9:00 - 18:00</span>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="form-honeypot"
              tabIndex="-1"
              autoComplete="off"
              aria-hidden="true"
            />
            <div className="contact-form-header">
              <div>
                <h3>Solicita tu cotización</h3>
                <p>Completa tus datos y te respondemos en menos de 24 horas.</p>
              </div>
            </div>
            {status === 'success' && (
              <div className="form-status form-status--success">
                ✓ Mensaje enviado correctamente. Te responderemos pronto.
              </div>
            )}
            {status === 'error' && (
              <div className="form-status form-status--error">
                Error al enviar. Intenta por WhatsApp o llámanos directamente.
              </div>
            )}
            <div className="form-group">
              <label htmlFor="name">Nombre</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre completo"
                required
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Teléfono</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+56 9 XXXX XXXX"
              />
            </div>
            <div className="form-group">
              <label htmlFor="service">Servicio a cotizar</label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
              >
                <option value="">Selecciona un servicio...</option>
                <option value="Piping Industrial">Piping Industrial</option>
                <option value="Estructuras Metálicas">Estructuras Metálicas</option>
                <option value="Obras Civiles">Obras Civiles</option>
                <option value="Modelamiento 3D">Modelamiento 3D</option>
                <option value="Protección de Tuberías">Protección de Tuberías</option>
                <option value="Extracción y Recubrimiento">Extracción y Recubrimiento</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">Mensaje</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe tu proyecto o consulta..."
                required
                aria-required="true"
              ></textarea>
            </div>
            <div className="contact-form-actions">
              <button type="submit" className="btn-primary" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar cotización'}
              </button>
              
            </div>

          </form>
        </div>

        <div className="contact-map">
          <iframe
            title="Ubicación DAIG Chile"
            src="https://maps.google.com/maps?q=-32.7382639,-71.4590578&hl=es&z=16&output=embed"
            width="100%"
            height="350"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>
  )
}

export default Contact
