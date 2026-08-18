import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ALLOWED_ORIGINS = [
  'https://daigchile.cl',
  'https://www.daigchile.cl',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
]

const ALLOWED_ROLES = ['directiva', 'tecnico', 'trabajador']

export const handler = async (event) => {
  const origin = event.headers.origin || ''
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Método no permitido' }) }
  }

  if (!SERVICE_ROLE_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Servidor no configurado' }) }
  }

  const authHeader = event.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) }
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token inválido' }) }
  }

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Sin permisos de administrador' }) }
  }

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'JSON inválido' }) }
  }

  const { action } = body

  // ── CREAR USUARIO ─────────────────────────────────────────────────────────
  if (action === 'create') {
    const { username, nombre, email, password, role } = body
    const normalizedUsername = String(username || '').trim().toLowerCase()
    const normalizedNombre = String(nombre || '').trim()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedRole = String(role || '').trim()

    if (!normalizedUsername || !password || !normalizedRole) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Usuario, contraseña y rol son requeridos' }) }
    }
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Rol no válido' }) }
    }
    if (String(password).length < 6) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Contraseña debe tener al menos 6 caracteres' }) }
    }

    // Para trabajadores el username es el RUT; para otros es un login
    const emailToUse = normalizedEmail || `${normalizedUsername}@daig.local`

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Email inválido' }) }
    }

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (existing) {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'El usuario/RUT ya existe' }) }
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: emailToUse,
      password,
      email_confirm: true,
    })

    if (createError) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: createError.message }) }
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        username: normalizedUsername,
        nombre: normalizedNombre || null,
        email: emailToUse,
        role: normalizedRole,
      })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error al crear perfil' }) }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, email: emailToUse }),
    }
  }

  // ── ACTUALIZAR USUARIO ────────────────────────────────────────────────────
  if (action === 'update') {
    const { userId, role, nombre, password } = body

    if (!userId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'userId requerido' }) }
    }

    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (targetProfile?.role === 'admin' && userId !== caller.id) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No se puede modificar a otro administrador' }) }
    }

    const profileUpdates = {}
    if (role && ALLOWED_ROLES.includes(role)) profileUpdates.role = role
    if (nombre !== undefined) profileUpdates.nombre = String(nombre).trim() || null

    if (Object.keys(profileUpdates).length > 0) {
      await supabaseAdmin.from('profiles').update(profileUpdates).eq('id', userId)
    }

    if (password) {
      if (String(password).length < 6) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Contraseña debe tener al menos 6 caracteres' }) }
      }
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
      if (pwError) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: pwError.message }) }
      }
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) }
  }

  // ── ELIMINAR USUARIO ──────────────────────────────────────────────────────
  if (action === 'delete') {
    const { userId } = body

    if (!userId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'userId requerido' }) }
    }
    if (userId === caller.id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'No puedes eliminar tu propio usuario' }) }
    }

    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (targetProfile?.role === 'admin') {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No se puede eliminar a otro administrador' }) }
    }

    await supabaseAdmin.from('profiles').delete().eq('id', userId)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: deleteError.message }) }
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) }
  }

  return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Acción no reconocida' }) }
}
