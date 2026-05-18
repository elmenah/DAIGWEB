const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const DEST_EMAIL = process.env.RESEND_TO_EMAIL || 'cotizaciones@daigchile.cl'
const MIN_FORM_FILL_TIME_MS = 3000
const MAX_MESSAGE_LENGTH = 3000
const MAX_NAME_LENGTH = 120
const MAX_PHONE_LENGTH = 40
const MAX_COMPANY_LENGTH = 140
const MAX_SERVICE_LENGTH = 120

const ALLOWED_ORIGINS = [
  'https://serviciosdaig.com',
  'https://www.serviciosdaig.com',
  'http://localhost:5173',
  'http://localhost:4173',
]

exports.handler = async (event) => {
  let fromEmail

  try {
    fromEmail = getFromEmail()
  } catch (configError) {
    console.error('Resend config error:', configError)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falta configurar el remitente verificado de Resend' }),
    }
  }

  const origin = event.headers.origin || ''
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Método no permitido' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'JSON inválido' }) }
  }

  const {
    name,
    email,
    phone,
    company,
    service,
    message,
    source,
    website,
    formStartedAt,
  } = body

  // Honeypot: bots suelen completar campos ocultos
  if (website && String(website).trim() !== '') {
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) }
  }

  // Validaciones básicas
  if (!name || !email || !message || !formStartedAt) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Faltan campos obligatorios' }) }
  }

  const startedAtMs = Number(formStartedAt)
  const elapsed = Date.now() - startedAtMs
  if (!Number.isFinite(startedAtMs) || elapsed < MIN_FORM_FILL_TIME_MS) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Envío demasiado rápido' }) }
  }

  // Validar formato email simple
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Email inválido' }) }
  }

  const cleanName = String(name).trim()
  const cleanEmail = String(email).trim().toLowerCase()
  const cleanPhone = String(phone || '').trim()
  const cleanCompany = String(company || '').trim()
  const cleanService = String(service || '').trim()
  const cleanMessage = String(message).trim()

  if (
    cleanName.length > MAX_NAME_LENGTH ||
    cleanPhone.length > MAX_PHONE_LENGTH ||
    cleanCompany.length > MAX_COMPANY_LENGTH ||
    cleanService.length > MAX_SERVICE_LENGTH ||
    cleanMessage.length > MAX_MESSAGE_LENGTH
  ) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Campos exceden largo permitido' }) }
  }

  if (looksLikeSpam(cleanName, cleanEmail, cleanMessage)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Mensaje rechazado por validación anti-spam' }) }
  }

  const isDigital = source === 'digital'
  const internalSubject = isDigital
    ? `[DAIG Digital] Nueva consulta de ${cleanName}`
    : `[DAIG Web] Nueva cotización de ${cleanName}`

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#08080F;color:#fff;padding:32px;border-radius:12px;border:1px solid rgba(232,150,46,0.2)">
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(232,150,46,0.2)">
        <img src="https://serviciosdaig.com/Imagenes/logo.jpeg" alt="DAIG" style="height:48px" />
        <h2 style="color:#E8962E;margin:12px 0 4px;font-size:1.1rem">
          ${isDigital ? 'Nueva consulta — DAIG Digital' : 'Nueva cotización — DAIG Web'}
        </h2>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#9a9ab0;width:140px">Nombre</td><td style="padding:8px 0">${escapeHtml(cleanName)}</td></tr>
        <tr><td style="padding:8px 0;color:#9a9ab0">Email</td><td style="padding:8px 0"><a href="mailto:${escapeHtml(cleanEmail)}" style="color:#E8962E">${escapeHtml(cleanEmail)}</a></td></tr>
        ${cleanPhone ? `<tr><td style="padding:8px 0;color:#9a9ab0">Teléfono</td><td style="padding:8px 0">${escapeHtml(cleanPhone)}</td></tr>` : ''}
        ${cleanCompany ? `<tr><td style="padding:8px 0;color:#9a9ab0">Empresa</td><td style="padding:8px 0">${escapeHtml(cleanCompany)}</td></tr>` : ''}
        ${cleanService ? `<tr><td style="padding:8px 0;color:#9a9ab0">Servicio</td><td style="padding:8px 0">${escapeHtml(cleanService)}</td></tr>` : ''}
      </table>
      <div style="margin-top:20px;padding:16px;background:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid #E8962E">
        <p style="color:#9a9ab0;margin:0 0 8px;font-size:0.85rem">Mensaje</p>
        <p style="margin:0;line-height:1.7;white-space:pre-wrap">${escapeHtml(cleanMessage)}</p>
      </div>
      <p style="margin-top:24px;font-size:0.75rem;color:#9a9ab0;text-align:center">
        Enviado desde ${isDigital ? 'serviciosdaig.com/digital' : 'serviciosdaig.com'}
      </p>
    </div>
  `

  const autoReplyHtml = `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;background:#08080F;color:#fff;padding:28px;border-radius:12px;border:1px solid rgba(232,150,46,0.2)">
      <h2 style="color:#E8962E;margin:0 0 12px;font-size:1.25rem">Recibimos tu solicitud</h2>
      <p style="margin:0 0 14px;line-height:1.7">Hola ${escapeHtml(cleanName)}, gracias por contactarnos.</p>
      <p style="margin:0 0 14px;line-height:1.7;color:#cfd2dc">Tu solicitud fue registrada correctamente y el equipo de DAIG te responderá dentro de las próximas 24 horas hábiles.</p>
      <div style="background:rgba(255,255,255,0.04);padding:14px;border-radius:8px;border-left:3px solid #E8962E">
        <p style="margin:0 0 6px;font-size:0.82rem;color:#9a9ab0">Resumen enviado</p>
        <p style="margin:0;white-space:pre-wrap;line-height:1.6">${escapeHtml(cleanMessage)}</p>
      </div>
      <p style="margin:16px 0 0;color:#9a9ab0;font-size:0.82rem">Si necesitas respuesta inmediata, escríbenos por WhatsApp: +56 9 8868 9400.</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: fromEmail,
      to: DEST_EMAIL,
      reply_to: cleanEmail,
      subject: internalSubject,
      html,
    })

    // No bloquea la entrega principal si falla la autorespuesta.
    try {
      await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: 'Hemos recibido tu solicitud - DAIG',
        html: autoReplyHtml,
      })
    } catch (autoReplyError) {
      console.error('Auto-reply error:', autoReplyError)
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    }
  } catch (err) {
    console.error('Resend error:', err)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Error al enviar el correo' }),
    }
  }
}

function getFromEmail() {
  const configuredAddress = process.env.RESEND_FROM_EMAIL
  const fallbackAddress = process.env.NODE_ENV !== 'production' ? 'onboarding@resend.dev' : ''
  const address = configuredAddress || fallbackAddress

  if (!address) {
    throw new Error('RESEND_FROM_EMAIL no configurado')
  }

  if (address.includes('<') || address.includes('>')) {
    return address
  }

  const name = process.env.RESEND_FROM_NAME || 'DAIG Web'
  return `${name} <${address}>`
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function looksLikeSpam(name, email, message) {
  const text = `${name} ${email} ${message}`.toLowerCase()
  const urlCount = (text.match(/https?:\/\//g) || []).length
  const domainCount = (text.match(/\.(com|net|org|ru|xyz|info|click)/g) || []).length

  if (urlCount > 1 || domainCount > 2) return true
  if (/\b(viagra|casino|crypto\s?profit|seo\s?service|backlinks?)\b/.test(text)) return true
  if (/(.)\1{7,}/.test(text)) return true
  if (message.trim().length < 8) return true

  return false
}
