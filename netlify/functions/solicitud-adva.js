import { Resend } from 'resend'

const resend   = new Resend(process.env.RESEND_API_KEY)
const DEST     = ['daniel.mena@serviciosdaig.com', 'victor.orellana@serviciosdaig.com']

const ALLOWED_ORIGINS = [
  'https://daigchile.cl',
  'https://www.daigchile.cl',
  'http://localhost:5173',
  'http://localhost:4173',
]

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const handler = async (event) => {
  const origin     = event.headers.origin || ''
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  const cors       = {
    'Access-Control-Allow-Origin':  corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' }
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Método no permitido' }) }

  let body
  try { body = JSON.parse(event.body) }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'JSON inválido' }) } }

  const { trabajador, planta, localidad, requisito } = body

  if (!trabajador || !planta || !localidad || !requisito) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Todos los campos son obligatorios' }) }
  }

  const w = String(trabajador).trim().slice(0, 120)
  const p = String(planta).trim().slice(0, 200)
  const l = String(localidad).trim().slice(0, 200)
  const r = String(requisito).trim().slice(0, 1500)

  const fromEmail = process.env.RESEND_FROM_EMAIL
    ? `${process.env.RESEND_FROM_NAME || 'DAIG'} <${process.env.RESEND_FROM_EMAIL}>`
    : 'onboarding@resend.dev'

  const fecha = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const html = `
<div style="font-family:'Segoe UI',system-ui,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1E3A5F 0%,#164170 100%);padding:28px 32px 24px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;">
        <span style="color:#fff;font-weight:900;font-size:11px;letter-spacing:-0.5px;">DAIG</span>
      </div>
      <div>
        <div style="color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">Aguas del Valle</div>
      </div>
    </div>
    <h1 style="color:#fff;margin:0 0 4px;font-size:20px;font-weight:800;letter-spacing:-0.3px;">Nueva Solicitud Adva</h1>
    <p style="color:rgba(255,255,255,0.5);margin:0;font-size:12px;">${fecha}</p>
  </div>

  <!-- Body -->
  <div style="padding:28px 32px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;width:130px;vertical-align:top;">
          <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Trabajador</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <span style="font-size:15px;font-weight:700;color:#1e293b;">${escapeHtml(w)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Planta</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <span style="font-size:14px;color:#334155;">${escapeHtml(p)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Localidad</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <span style="font-size:14px;color:#334155;">${escapeHtml(l)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 0 0;vertical-align:top;">
          <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Requisito</span>
        </td>
        <td style="padding:14px 0 0;vertical-align:top;">
          <div style="background:#f8fafc;border-left:3px solid #1E3A5F;border-radius:0 8px 8px 0;padding:12px 16px;">
            <span style="font-size:14px;color:#1e293b;line-height:1.65;white-space:pre-wrap;">${escapeHtml(r)}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="padding:0 32px 24px;">
    <p style="font-size:11px;color:#cbd5e1;margin:0;border-top:1px solid #f1f5f9;padding-top:16px;">
      Enviado desde el portal DAIG · Solicitudes Adva · daigchile.cl
    </p>
  </div>
</div>`

  try {
    const { error } = await resend.emails.send({
      from:    fromEmail,
      to:      DEST,
      subject: `[Adva] ${w} — ${p} · ${l}`,
      html,
    })
    if (error) throw new Error(error.message)
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    console.error('Resend error:', err)
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Error al enviar notificación' }) }
  }
}
