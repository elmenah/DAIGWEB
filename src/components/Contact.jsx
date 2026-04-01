import React, { useState } from 'react'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { name, email, phone, message } = formData
    const whatsappMessage = `Hola DAIG! Soy ${name}. Email: ${email}, Tel: ${phone}. ${message}`
    const encoded = encodeURIComponent(whatsappMessage)
    window.open(`https://wa.me/56988689400?text=${encoded}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="section contact" id="contacto">
      <div className="container">
        <div className="section-header">
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
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <span>Puchuncaví, Valparaíso, Chile</span>
            </div>

            <div className="contact-info-item">
              <div className="icon-circle">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
              </div>
              <span>+569 88689400</span>
            </div>

            <div className="contact-info-item">
              <div className="icon-circle">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <span>cotizaciones.daig@serviciosdaig.com</span>
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
              <label htmlFor="message">Mensaje</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe tu proyecto o consulta..."
                required
              ></textarea>
            </div>
            <button type="submit" className="btn-primary">
              Enviar por WhatsApp
            </button>
          </form>
        </div>

        <div className="contact-map">
          <iframe
            title="Ubicación DAIG Chile"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d25000!2d-71.45905303468572!3d-32.738271092446944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9689d62b4dd7af8f%3A0x5044781d611f996!2sPuchuncav%C3%AD%2C%20Valpara%C3%ADso%2C%20Chile!5e0!3m2!1ses!2scl!4v1"
            width="100%"
            height="350"
            style={{ border: 0, borderRadius: '4px' }}
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
