import React, { useState, useRef } from 'react'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const formRef = useRef(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const sendViaWhatsApp = () => {
    const { name, email, phone, message } = formData
    const whatsappMessage = `Hola DAIG! Soy ${name}. Email: ${email}, Tel: ${phone}. ${message}`
    const encoded = encodeURIComponent(whatsappMessage)
    window.open(`https://wa.me/56988689400?text=${encoded}`, '_blank', 'noopener,noreferrer')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setStatus(null)

    // Try EmailJS if configured, otherwise fallback to WhatsApp
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

    if (serviceId && templateId && publicKey) {
      try {
        const { default: emailjs } = await import('@emailjs/browser')
        await emailjs.sendForm(serviceId, templateId, formRef.current, publicKey)
        setStatus('success')
        setFormData({ name: '', email: '', phone: '', message: '' })
      } catch {
        setStatus('error')
      }
    } else {
      sendViaWhatsApp()
      setStatus('whatsapp')
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

          <form className="contact-form" onSubmit={handleSubmit} ref={formRef}>
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
            {status === 'whatsapp' && (
              <div className="form-status form-status--info">
                Redirigido a WhatsApp. Si no se abrió, escríbenos al +569 88689400.
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
                {sending ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
              <button type="button" className="btn-whatsapp-alt" onClick={sendViaWhatsApp}>
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                  <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
            </div>
          </form>
        </div>

        <div className="contact-map">
          <iframe
            title="Ubicación DAIG Chile"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d25000!2d-71.45905303468572!3d-32.738271092446944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9689d62b4dd7af8f%3A0x5044781d611f996!2sPuchuncav%C3%AD%2C%20Valpara%C3%ADso%2C%20Chile!5e0!3m2!1ses!2scl!4v1"
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
