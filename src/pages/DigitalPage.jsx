import React, { useState } from 'react'
import HeaderDigital from '../components/HeaderDigital'
import Footer from '../components/Footer'
import ScrollToTop from '../components/ScrollToTop'

const services = [
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
      </svg>
    ),
    tag: 'Analítica',
    priority: true,
    title: 'Dashboards y Reportería',
    price: 'desde $490.000',
    description: 'Visualiza MTBF, MTTR, órdenes de trabajo activas y KPIs de mantención en tiempo real. Deja de construir reportes manuales en Excel: tu gerencia recibe el informe semanal de forma automática.',
    items: ['Panel de MTBF/MTTR y disponibilidad de activos', 'KPIs de mantención preventiva y correctiva', 'Reportes automáticos para gerencia (PDF/correo)', 'Alertas por desviaciones o anomalías en planta'],
    cta: 'Agenda diagnóstico gratuito de 20 min',
    ctaHref: '#contacto-digital',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z" />
      </svg>
    ),
    tag: 'Automatización',
    priority: true,
    title: 'Automatización de Procesos',
    price: 'desde $590.000',
    description: 'Eliminamos las tareas manuales repetitivas: generación de órdenes de trabajo, cotizaciones técnicas, flujos de aprobación y notificaciones entre sistemas. Tu equipo se enfoca en lo que importa.',
    items: ['Generación automática de órdenes de trabajo', 'Cotizaciones técnicas y presupuestos automáticos', 'Integración ERP / CMMS / contabilidad', 'Alertas automáticas por email y WhatsApp'],
    cta: 'Agenda diagnóstico gratuito de 20 min',
    ctaHref: '#contacto-digital',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z" />
      </svg>
    ),
    tag: 'Sistemas',
    priority: true,
    title: 'Sistemas de Gestión Interna',
    price: 'desde $890.000',
    description: 'Reemplaza planillas Excel por un sistema a medida que gestione órdenes de trabajo, inventario de repuestos, mantención preventiva/correctiva y el historial completo de tus activos críticos.',
    items: ['Órdenes de trabajo digitales con firma y evidencia', 'Control de repuestos e inventario en bodega', 'Mantención preventiva programada por activo', 'Historial técnico de equipos y activos críticos'],
    cta: 'Agenda diagnóstico gratuito de 20 min',
    ctaHref: '#contacto-digital',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
      </svg>
    ),
    tag: 'IA Conversacional',
    priority: false,
    title: 'Chatbots Inteligentes',
    price: 'desde $290.000',
    description: 'Atiende consultas las 24 horas sin costo adicional. Nuestros chatbots responden preguntas frecuentes, califican leads y escalan al equipo humano cuando es necesario.',
    items: ['Atención 24/7 automatizada', 'Calificación de leads entrantes', 'Integración con WhatsApp y web', 'Respuestas entrenadas en tu negocio'],
    cta: 'Cotizar chatbot',
    ctaHref: '#contacto-digital',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79 2.73 2.71 7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58 3.51-3.47 9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z" />
      </svg>
    ),
    tag: 'Inteligencia Artificial',
    priority: false,
    title: 'Agentes IA para tu Negocio',
    price: 'desde $490.000',
    description: 'Agentes autónomos que responden cotizaciones, procesan documentos, clasifican correos y toman decisiones simples sin intervención humana.',
    items: ['Respuesta automática de cotizaciones', 'Procesamiento de documentos PDF', 'Clasificación de emails y solicitudes', 'Integración con tus sistemas actuales'],
    cta: 'Cotizar agente IA',
    ctaHref: '#contacto-digital',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" />
      </svg>
    ),
    tag: 'Desarrollo Web',
    priority: false,
    title: 'Sitios Web Corporativos',
    price: 'desde $390.000',
    description: 'Landing pages, portafolios y sitios institucionales diseñados para captar clientes. Optimizados para SEO, rápidos y adaptados a cualquier dispositivo.',
    items: ['Landing pages y portafolios', 'Catálogos digitales de servicios', 'Blogs y gestión de contenido', 'Optimización SEO'],
    cta: 'Cotizar sitio web',
    ctaHref: '#contacto-digital',
  },
]

const steps = [
  {
    number: '01',
    title: 'Diagnóstico',
    description: 'Analizamos tu operación actual, identificamos los puntos de dolor y definimos qué solución genera más impacto inmediato.',
  },
  {
    number: '02',
    title: 'Diseño y Desarrollo',
    description: 'Construimos la solución a medida, con iteraciones rápidas y tu feedback en cada etapa. Sin sorpresas al final.',
  },
  {
    number: '03',
    title: 'Entrega y Soporte',
    description: 'Desplegamos, capacitamos a tu equipo y nos quedamos para asegurar que todo funcione. Sin desaparecer después de la entrega.',
  },
]

function DigitalPage() {
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '', service: '', message: '' })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const [website, setWebsite] = useState('')
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now())

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

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
          source: 'digital',
          website,
          formStartedAt,
        }),
      })
      if (res.ok) {
        setStatus('success')
        setFormData({ name: '', company: '', email: '', phone: '', service: '', message: '' })
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
    <>
      <HeaderDigital />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="digital-hero">
        <div className="digital-hero-bg"></div>
        <div className="container digital-hero-container">
          <div className="digital-hero-content">
            <div className="hero-badge" style={{ marginBottom: '24px' }}>
              <span className="hero-badge-dot"></span>
              DAIG Digital · Soluciones para industrias
            </div>
            <h1 className="digital-hero-title">
              Tecnología que<br />
              <span>entiende</span><br />
              la industria
            </h1>
            <p className="digital-hero-desc">
              Sitios web, automatizaciones, chatbots, agentes IA y dashboards
              diseñados para empresas industriales, mineras y de construcción.
              Soluciones probadas internamente en DAIG antes de ofrecerlas.
            </p>
            <div className="hero-cta-group">
              <a href="#contacto-digital" className="btn-primary">Cotizar proyecto digital</a>
              <a href="#servicios-digitales" className="btn-outline">Ver servicios</a>
            </div>
          </div>
          <div className="digital-hero-visual">
            <div className="digital-hero-card">
              <div className="digital-hero-card-header">
                <span className="digital-dot red"></span>
                <span className="digital-dot yellow"></span>
                <span className="digital-dot green"></span>
                <span className="digital-card-label">panel.daig.cl</span>
              </div>
              <div className="digital-hero-card-body">
                <div className="digital-stat-row">
                  <div className="digital-stat-item">
                    <span className="digital-stat-label">Proyectos activos</span>
                    <span className="digital-stat-value">12</span>
                  </div>
                  <div className="digital-stat-item">
                    <span className="digital-stat-label">Cotizaciones hoy</span>
                    <span className="digital-stat-value accent">8</span>
                  </div>
                </div>
                <div className="digital-chart-bars">
                  {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
                    <div key={i} className="digital-bar" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="digital-hero-badge-row">
                  <span className="digital-pill">
                    <span className="digital-pill-dot"></span>
                    IA Activa
                  </span>
                  <span className="digital-pill">
                    <span className="digital-pill-dot green"></span>
                    Automatización ON
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Servicios ────────────────────────────────── */}
      <section className="section digital-services-section" id="servicios-digitales">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Qué hacemos</span>
            <h2>Servicios digitales</h2>
            <div className="accent-line"></div>
            <p>Desde una página web hasta un agente IA que cotiza por ti, construimos exactamente lo que tu empresa necesita.</p>
          </div>

          <div className="digital-services-label">
            <span className="digital-services-group-label">Soluciones para planta e industria</span>
          </div>
          <div className="digital-services-grid">
            {services.filter(s => s.priority).map((s, i) => (
              <div className="digital-service-card digital-service-card--priority" key={i}>
                <div className="digital-service-tag">{s.tag}</div>
                <div className="digital-service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <ul className="digital-service-items">
                  {s.items.map((item, j) => (
                    <li key={j}>
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="digital-service-footer">
                  <span className="digital-service-price">{s.price}</span>
                  <a href={s.ctaHref} className="digital-service-cta">{s.cta}</a>
                </div>
              </div>
            ))}
          </div>

          <div className="digital-services-label" style={{ marginTop: '48px' }}>
            <span className="digital-services-group-label">Soluciones complementarias</span>
          </div>
          <div className="digital-services-grid digital-services-grid--secondary">
            {services.filter(s => !s.priority).map((s, i) => (
              <div className="digital-service-card" key={i}>
                <div className="digital-service-tag">{s.tag}</div>
                <div className="digital-service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <ul className="digital-service-items">
                  {s.items.map((item, j) => (
                    <li key={j}>
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="digital-service-footer">
                  <span className="digital-service-price">{s.price}</span>
                  <a href={s.ctaHref} className="digital-service-cta digital-service-cta--secondary">{s.cta}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prueba social ────────────────────────────── */}
      <section className="digital-proof-section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Resultados reales</span>
            <h2>Lo que logramos<br /><span style={{ color: 'var(--accent)' }}>en terreno</span></h2>
            <div className="accent-line"></div>
          </div>
          <div className="digital-proof-grid">
            <div className="digital-proof-card">
              <div className="digital-proof-metric">
                <span className="digital-proof-before">6 horas</span>
                <span className="digital-proof-arrow">→</span>
                <span className="digital-proof-after">20 min</span>
              </div>
              <p className="digital-proof-desc">
                Reducimos el tiempo de generación del reporte semanal de mantención para una empresa del rubro industrial.
                El jefe de mantención ahora recibe el PDF automáticamente todos los lunes a las 7:00 AM.
              </p>
              <span className="digital-proof-tag">Dashboard + Automatización</span>
            </div>
            <div className="digital-proof-card">
              <div className="digital-proof-metric">
                <span className="digital-proof-before">Planillas Excel</span>
                <span className="digital-proof-arrow">→</span>
                <span className="digital-proof-after">Sistema digital</span>
              </div>
              <p className="digital-proof-desc">
                Digitalizamos las órdenes de trabajo y el historial de activos críticos de una empresa de servicios mineros.
                Cero planillas, trazabilidad completa y firma digital desde terreno.
              </p>
              <span className="digital-proof-tag">Sistema de Gestión</span>
            </div>
            <div className="digital-proof-card">
              <div className="digital-proof-metric">
                <span className="digital-proof-before">3 días</span>
                <span className="digital-proof-arrow">→</span>
                <span className="digital-proof-after">2 horas</span>
              </div>
              <p className="digital-proof-desc">
                Automatizamos el proceso de cotización técnica para un proveedor industrial.
                Lo que antes requería ida y vuelta de correos, hoy se genera y envía automáticamente.
              </p>
              <span className="digital-proof-tag">Automatización de Procesos</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Diferenciador ────────────────────────────── */}
      <section className="digital-diff-section">
        <div className="container digital-diff-container">
          <div className="digital-diff-text">
            <span className="section-eyebrow">Por qué elegirnos</span>
            <h2>Somos industria,<br /><span>no solo tecnología</span></h2>
            <p>
              La mayoría de las agencias digitales no entienden cómo funciona una planta industrial,
              un área de mantenimiento o un proceso de cotización técnico. Nosotros sí, porque
              lo vivimos a diario en DAIG.
            </p>
            <p>
              Cada solución que ofrecemos fue evaluada o implementada primero en nuestra propia operación.
              Eso significa cero curvas de aprendizaje sobre tu industria.
            </p>
            <a href="#contacto-digital" className="btn-primary" style={{ marginTop: '12px', display: 'inline-block' }}>
              Conversemos
            </a>
          </div>
          <div className="digital-diff-features">
            {[
              { n: '01', t: 'Contexto industrial real', d: 'Sabemos cómo opera una planta, qué datos importan y qué dolores tiene el área de mantenimiento.' },
              { n: '02', t: 'Soluciones a medida', d: 'No vendemos plantillas. Cada proyecto parte de tu operación específica.' },
              { n: '03', t: 'Soporte continuo', d: 'No desaparecemos tras la entrega. Ajustamos, mejoramos y crecemos contigo.' },
            ].map((f, i) => (
              <div className="digital-diff-item" key={i}>
                <span className="digital-diff-number">{f.n}</span>
                <div>
                  <h4>{f.t}</h4>
                  <p>{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proceso ──────────────────────────────────── */}
      <section className="section" id="proceso-digital">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Cómo trabajamos</span>
            <h2>Proceso simple,<br />resultados concretos</h2>
            <div className="accent-line"></div>
          </div>
          <div className="digital-steps-grid">
            {steps.map((s, i) => (
              <div className="digital-step-card" key={i}>
                <span className="digital-step-number">{s.number}</span>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                {i < steps.length - 1 && <div className="digital-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contacto ─────────────────────────────────── */}
      <section className="digital-contact-section" id="contacto-digital">
        <div className="digital-contact-container">
          <div className="digital-contact-info">
            <span className="section-eyebrow">Contáctanos</span>
            <h2>¿Listo para digitalizar<br /><span>tu empresa?</span></h2>
            <p>Cuéntanos tu proyecto. En 24 horas te respondemos con una propuesta inicial sin costo.</p>

            <div className="digital-contact-items">
              <div className="digital-contact-item">
                <div className="digital-contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                </div>
                <div>
                  <strong>Email</strong>
                  <a href="mailto:cotizaciones@daigchile.cl">cotizaciones@daigchile.cl</a>
                </div>
              </div>
              <div className="digital-contact-item">
                <div className="digital-contact-icon">
                  <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                </div>
                <div>
                  <strong>Horario</strong>
                  <span>Lun – Vie: 9:00 – 18:00</span>
                </div>
              </div>
            </div>
          </div>

          <form className="digital-contact-form" onSubmit={handleSubmit}>
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
            {status === 'success' && (
              <div className="form-status form-status--success">✓ Mensaje enviado. Te respondemos en menos de 24 hrs.</div>
            )}
            {status === 'error' && (
              <div className="form-status form-status--error">Error al enviar. Escríbenos por WhatsApp directamente.</div>
            )}

            <div className="digital-form-row">
              <div className="form-group">
                <label htmlFor="d-name">Nombre *</label>
                <input id="d-name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Tu nombre completo" required />
              </div>
              <div className="form-group">
                <label htmlFor="d-company">Empresa</label>
                <input id="d-company" name="company" type="text" value={formData.company} onChange={handleChange} placeholder="Nombre de tu empresa" />
              </div>
            </div>

            <div className="digital-form-row">
              <div className="form-group">
                <label htmlFor="d-email">Email *</label>
                <input id="d-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="tu@empresa.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="d-phone">Teléfono</label>
                <input id="d-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+56 9 XXXX XXXX" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="d-service">¿Qué necesitas?</label>
              <select id="d-service" name="service" value={formData.service} onChange={handleChange}>
                <option value="">Selecciona un servicio...</option>
                <option value="Sitio Web Corporativo">Sitio Web Corporativo</option>
                <option value="Automatización de Procesos">Automatización de Procesos</option>
                <option value="Chatbot Inteligente">Chatbot Inteligente</option>
                <option value="Agente IA">Agente IA</option>
                <option value="Dashboard / Reportería">Dashboard / Reportería</option>
                <option value="Sistema de Gestión Interna">Sistema de Gestión Interna</option>
                <option value="No sé / necesito orientación">No sé / necesito orientación</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="d-message">Descripción del proyecto *</label>
              <textarea id="d-message" name="message" value={formData.message} onChange={handleChange} placeholder="Cuéntanos brevemente qué necesitas automatizar, mejorar o construir..." required rows={5}></textarea>
            </div>

            <div className="digital-form-actions">
              <button type="submit" className="btn-primary" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar consulta'}
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-text)', marginTop: '12px' }}>
              * Campos obligatorios. Tu información es confidencial y nunca se comparte con terceros.
            </p>
          </form>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </>
  )
}

export default DigitalPage
