import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Destinatarios: se pueden configurar varios en NOTIFY_REGISTRO_EMAIL separados
// por coma o punto y coma (p.ej. "daniel.mena@serviciosdaig.com, otro@correo.com").
// Si la variable no está definida, se usa esta lista por defecto.
const DEST_EMAILS = (process.env.NOTIFY_REGISTRO_EMAIL || 'daniel.mena@serviciosdaig.com, lasercncdaig@gmail.com')
  .split(/[,;]/)
  .map((e) => e.trim())
  .filter(Boolean)
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'daigchile.cl'
const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || `https://${SITE_DOMAIN}/logo.jpeg`

const ALLOWED_ORIGINS = [
  'https://daigchile.cl',
  'https://www.daigchile.cl',
  'http://localhost:5173',
  'http://localhost:4173',
]

export const handler = async (event) => {
  let fromEmail
  try {
    fromEmail = getFromEmail()
  } catch (configError) {
    console.error('Resend config error:', configError)
    return json(500, { error: 'Falta configurar el remitente de Resend' }, corsFor(event))
  }

  const corsHeaders = corsFor(event)

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método no permitido' }, corsHeaders)

  let body
  try { body = JSON.parse(event.body) } catch {
    return json(400, { error: 'JSON inválido' }, corsHeaders)
  }

  const r = body || {}
  const nombre = String(r.trabajador_nombre || 'Trabajador').trim()
  const fecha = String(r.fecha || '').trim()
  const hora = String(r.hora || '').trim()

  const filas = [
    ['OT', r.ot],
    ['Fecha / hora', [fecha, hora].filter(Boolean).join(' · ')],
    ['Tipo de trabajo', r.tipo_trabajo],
    ['Planta / lugar', r.planta],
    ['Aviso SAP', r.aviso_sap],
    ['Equipo / activo', r.equipo_intervenido],
    ['Tarea', r.tarea],
    ['Estado', r.estado],
    ['Horas', r.horas_trabajadas != null && r.horas_trabajadas !== '' ? `${r.horas_trabajadas} h` : ''],
    ['Fotos', r.fotos_count != null ? String(r.fotos_count) : ''],
  ].filter(([, v]) => v != null && String(v).trim() !== '')

  const mapsLink = (r.ubicacion_lat && r.ubicacion_lng)
    ? `https://maps.google.com/?q=${r.ubicacion_lat},${r.ubicacion_lng}`
    : null

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#08080F;color:#fff;padding:32px;border-radius:12px;border:1px solid rgba(232,150,46,0.2)">
      <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(232,150,46,0.2)">
        <img src="${EMAIL_LOGO_URL}" alt="DAIG" style="height:44px" />
        <h2 style="color:#E8962E;margin:12px 0 2px;font-size:1.1rem">Nuevo registro de trabajo</h2>
        <p style="margin:0;color:#9a9ab0;font-size:0.9rem">${escapeHtml(nombre)} cargó un registro en terreno.</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${filas.map(([k, v]) => `
          <tr>
            <td style="padding:7px 0;color:#9a9ab0;width:150px;vertical-align:top">${escapeHtml(k)}</td>
            <td style="padding:7px 0;line-height:1.5">${escapeHtml(String(v))}</td>
          </tr>`).join('')}
      </table>
      ${mapsLink ? `<p style="margin:16px 0 0"><a href="${mapsLink}" style="color:#E8962E">📍 Ver ubicación en Google Maps</a></p>` : ''}
      <div style="margin-top:24px;text-align:center">
        <a href="https://${SITE_DOMAIN}/admin/dashboard" style="display:inline-block;background:#E8962E;color:#000;font-weight:700;font-size:0.9rem;padding:12px 28px;border-radius:8px;text-decoration:none">
          Ver en el panel
        </a>
      </div>
      <p style="margin-top:24px;font-size:0.75rem;color:#9a9ab0;text-align:center">Notificación automática desde ${SITE_DOMAIN}</p>
    </div>`

  const text = [
    'Nuevo registro de trabajo',
    `${nombre} cargo un registro en terreno.`,
    '',
    ...filas.map(([k, v]) => `${k}: ${v}`),
    mapsLink ? `Ubicacion: ${mapsLink}` : '',
    '',
    `Ver en el panel: https://${SITE_DOMAIN}/admin/dashboard`,
  ].filter(Boolean).join('\n')

  try {
    await resend.emails.send({
      from: fromEmail,
      to: DEST_EMAILS,
      subject: `[DAIG] Nuevo registro de ${nombre}${r.ot ? ` · OT ${r.ot}` : ''}`,
      html,
      text,
    })
    return json(200, { ok: true }, corsHeaders)
  } catch (err) {
    console.error('Resend error (notify-registro):', err)
    return json(500, { error: 'Error al enviar la notificación' }, corsHeaders)
  }
}

function corsFor(event) {
  const origin = event.headers?.origin || ''
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(statusCode, obj, headers) {
  return { statusCode, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(obj) }
}

function getFromEmail() {
  const configuredAddress = process.env.RESEND_FROM_EMAIL
  const fallbackAddress = process.env.NODE_ENV !== 'production' ? 'onboarding@resend.dev' : ''
  const address = configuredAddress || fallbackAddress
  if (!address) throw new Error('RESEND_FROM_EMAIL no configurado')
  if (address.includes('<') || address.includes('>')) return address
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
