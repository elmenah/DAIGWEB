const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ALLOWED_ORIGINS = [
  'https://daigchile.cl',
  'https://www.daigchile.cl',
  'https://serviciosdaig.com',
  'https://www.serviciosdaig.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
]

exports.handler = async (event) => {
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
    console.error('SUPABASE_SERVICE_ROLE_KEY no configurado')
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Servidor no configurado' }) }
  }

  // Verificar token del caller
  const authHeader = event.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado' }) }
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verificar que el caller es un usuario válido
  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Token inválido' }) }
  }

  // Verificar que el caller tiene rol 'admin'
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Sin permisos de administrador' }) }
  }

  // Parsear body
  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'JSON inválido' }) }
  }

  const { action } = body

  // ── CREAR USUARIO TÉCNICO ──────────────────────────────────────────────────
  if (action === 'create') {
    const { username, email, password } = body
    const normalizedUsername = String(username || '').trim().toLowerCase()

    if (!normalizedUsername || !email || !password) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Usuario, email y contraseña son requeridos' }) }
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Nombre de usuario inválido' }) }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Email inválido' }) }
    }
    if (String(password).length < 8) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Contraseña debe tener al menos 8 caracteres' }) }
    }

    const { data: existingUsername } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (existingUsername) {
      return { statusCode: 409, headers: corsHeaders, body: JSON.stringify({ error: 'El nombre de usuario ya existe' }) }
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
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
        email: String(email).trim().toLowerCase(),
        role: 'tecnico',
      })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Error al crear perfil del usuario' }) }
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) }
  }

  // ── ELIMINAR USUARIO TÉCNICO ───────────────────────────────────────────────
  if (action === 'delete') {
    const { userId } = body

    if (!userId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'userId requerido' }) }
    }

    // No permitir que un admin se elimine a sí mismo
    if (userId === caller.id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'No puedes eliminar tu propio usuario' }) }
    }

    // Verificar que el usuario a eliminar es técnico (no admin)
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
