// Función PROGRAMADA (ver schedule en netlify.toml): envía cada lunes un
// resumen de la actividad de la semana anterior al supervisor.
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const resend = new Resend(process.env.RESEND_API_KEY)

const DEST_EMAILS = (process.env.WEEKLY_DIGEST_EMAIL || process.env.NOTIFY_REGISTRO_EMAIL || 'daniel.mena@serviciosdaig.com')
  .split(/[,;]/)
  .map((e) => e.trim())
  .filter(Boolean)
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'daigchile.cl'
const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || `https://${SITE_DOMAIN}/logo.jpeg`

const iso = (d) => d.toISOString().split('T')[0]
const fmt = (isoStr) => { const [y, m, d] = isoStr.split('-'); return `${d}/${m}/${y}` }

export const handler = async () => {
  if (!SERVICE_ROLE_KEY) {
    console.error('weekly-digest: falta SUPABASE_SERVICE_ROLE_KEY')
    return { statusCode: 500, body: 'config' }
  }

  let fromEmail
  try { fromEmail = getFromEmail() } catch (e) {
    console.error('weekly-digest: remitente Resend no configurado', e)
    return { statusCode: 500, body: 'from' }
  }

  // Rango: los 7 días anteriores a hoy (semana recién terminada).
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const desde = new Date(hoy); desde.setDate(hoy.getDate() - 7)
  const hasta = new Date(hoy); hasta.setDate(hoy.getDate() - 1)
  const desdeISO = iso(desde), hastaISO = iso(hasta)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('registros_trabajo')
    .select('trabajador_nombre, estado, horas_trabajadas, fecha')
    .gte('fecha', desdeISO)
    .lte('fecha', hastaISO)

  if (error) {
    console.error('weekly-digest: error consultando registros', error.message)
    return { statusCode: 500, body: 'query' }
  }

  const regs = data || []
  const totalHoras = regs.reduce((s, r) => s + (r.horas_trabajadas || 0), 0)

  const porTrab = {}
  const porEstado = {}
  for (const r of regs) {
    const n = r.trabajador_nombre || 'Sin nombre'
    porTrab[n] = porTrab[n] || { count: 0, horas: 0 }
    porTrab[n].count++; porTrab[n].horas += r.horas_trabajadas || 0
    const e = r.estado || 'Sin estado'
    porEstado[e] = (porEstado[e] || 0) + 1
  }
  const trabajadores = Object.keys(porTrab).length
  const filasTrab = Object.entries(porTrab).sort((a, b) => b[1].count - a[1].count)
  const filasEstado = Object.entries(porEstado).sort((a, b) => b[1] - a[1])
  const nH = (h) => (h % 1 === 0 ? h : h.toFixed(1))

  const html = `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;background:#08080F;color:#fff;padding:32px;border-radius:12px;border:1px solid rgba(232,150,46,0.2)">
      <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(232,150,46,0.2)">
        <img src="${EMAIL_LOGO_URL}" alt="DAIG" style="height:44px" />
        <h2 style="color:#E8962E;margin:12px 0 2px;font-size:1.15rem">Resumen semanal</h2>
        <p style="margin:0;color:#9a9ab0;font-size:0.9rem">${fmt(desdeISO)} al ${fmt(hastaISO)}</p>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:20px">
        ${tile('Registros', regs.length, '#E8962E')}
        ${tile('Horas', nH(totalHoras), '#8b5cf6')}
        ${tile('Trabajadores', trabajadores, '#22c55e')}
      </div>
      ${regs.length === 0 ? `<p style="color:#9a9ab0">No hubo registros esta semana.</p>` : `
      <p style="color:#9a9ab0;font-size:0.8rem;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em">Por trabajador</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px">
        ${filasTrab.map(([n, v]) => `
          <tr>
            <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06)">${escapeHtml(n)}</td>
            <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;color:#cfd2dc">${v.count} reg · ${nH(v.horas)} h</td>
          </tr>`).join('')}
      </table>
      <p style="color:#9a9ab0;font-size:0.8rem;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em">Por estado</p>
      <div>${filasEstado.map(([e, n]) => `<span style="display:inline-block;background:rgba(255,255,255,0.06);border-radius:20px;padding:4px 12px;margin:0 6px 6px 0;font-size:0.85rem">${escapeHtml(e)} · <b>${n}</b></span>`).join('')}</div>
      `}
      <div style="margin-top:24px;text-align:center">
        <a href="https://${SITE_DOMAIN}/admin/dashboard" style="display:inline-block;background:#E8962E;color:#000;font-weight:700;font-size:0.9rem;padding:12px 28px;border-radius:8px;text-decoration:none">Ver panel completo</a>
      </div>
      <p style="margin-top:24px;font-size:0.75rem;color:#9a9ab0;text-align:center">Resumen automático semanal · ${SITE_DOMAIN}</p>
    </div>`

  try {
    await resend.emails.send({
      from: fromEmail,
      to: DEST_EMAILS,
      subject: `[DAIG] Resumen semanal · ${fmt(desdeISO)} al ${fmt(hastaISO)} · ${regs.length} registros`,
      html,
    })
    return { statusCode: 200, body: 'ok' }
  } catch (err) {
    console.error('weekly-digest: error enviando correo', err)
    return { statusCode: 500, body: 'send' }
  }
}

function tile(label, value, color) {
  return `<div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid ${color}44;border-radius:10px;padding:12px 14px">
    <div style="font-size:1.6rem;font-weight:800;color:${color};line-height:1">${value}</div>
    <div style="font-size:0.75rem;color:#9a9ab0;margin-top:4px">${label}</div>
  </div>`
}

function getFromEmail() {
  const address = process.env.RESEND_FROM_EMAIL || (process.env.NODE_ENV !== 'production' ? 'onboarding@resend.dev' : '')
  if (!address) throw new Error('RESEND_FROM_EMAIL no configurado')
  if (address.includes('<') || address.includes('>')) return address
  const name = process.env.RESEND_FROM_NAME || 'DAIG Web'
  return `${name} <${address}>`
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
