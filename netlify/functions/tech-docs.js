import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  const headers = { 'Cache-Control': 'private, no-store', 'Content-Type': 'text/plain; charset=utf-8' }
  const respond = (statusCode, body) => ({ statusCode, headers, body })
  if (event.httpMethod !== 'GET') return respond(405, 'Método no permitido')
  const token = event.headers?.authorization?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return respond(401, 'Debes iniciar sesión')
  const file = event.queryStringParameters?.file || 'HUB_consolidado_camion_barredor.html'
  if (!/^[a-zA-Z0-9_.-]+\.html$/.test(file) || file.includes('..')) return respond(400, 'Documento inválido')
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return respond(500, 'Servidor no configurado')
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) return respond(401, 'Sesión inválida')
    const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('id', user.id).single()
    if (profileError || !['admin', 'tecnico'].includes(profile?.role)) return respond(403, 'Sin acceso al portal técnico')
    const html = await readFile(path.join(process.cwd(), 'private', 'docs', file), 'utf8')
    return { statusCode: 200, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' }, body: html }
  } catch (error) {
    return respond(error.code === 'ENOENT' ? 404 : 500, 'No se pudo cargar el documento')
  }
}
