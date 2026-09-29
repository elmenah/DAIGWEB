import { test } from 'node:test'
import assert from 'node:assert/strict'

// Todas las llamadas externas se sustituyen: no se envían correos ni se toca Supabase.
process.env.RESEND_API_KEY = 're_test_only'
process.env.RESEND_FROM_EMAIL = 'test@example.com'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-only-anon-key'
const { handler: notify } = await import('../netlify/functions/notify-registro.js')
const { handler: contact } = await import('../netlify/functions/send-email.js')
const { handler: docs } = await import('../netlify/functions/tech-docs.js')
const recordId = '11111111-1111-4111-8111-111111111111'
const userId = '22222222-2222-4222-8222-222222222222'
const event = (body = { registro_id: recordId }, authenticated = true) => ({
  httpMethod: 'POST', headers: authenticated ? { authorization: 'Bearer test-token' } : {}, body: JSON.stringify(body),
})
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

test('notificaciones rechazan peticiones anónimas sin llamadas externas', async t => {
  t.mock.method(globalThis, 'fetch', async () => { assert.fail('No debe llamar servicios externos') })
  assert.equal((await notify(event(undefined, false))).statusCode, 401)
})

test('notificaciones rechazan un identificador de registro inválido', async t => {
  t.mock.method(globalThis, 'fetch', async () => { assert.fail('No debe llamar servicios externos') })
  assert.equal((await notify(event({ registro_id: '../secreto' }))).statusCode, 400)
})

test('notificaciones no permiten registros de otro trabajador', async t => {
  t.mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input))
    if (url.pathname === '/auth/v1/user') return json({ id: userId })
    assert.equal(url.searchParams.get('trabajador_id'), `eq.${userId}`)
    return json({ message: 'Not found' }, 406)
  })
  assert.equal((await notify(event())).statusCode, 404)
})

test('notificación usa el registro persistido e idempotencia, no datos falsificados', async t => {
  let emailSent = false
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const url = new URL(String(input))
    if (url.pathname === '/auth/v1/user') return json({ id: userId })
    if (url.pathname.includes('/rest/')) return json({ id: recordId, trabajador_id: userId, trabajador_nombre: 'Nombre real', tarea: 'Tarea real', fotos: [] })
    assert.equal(url.hostname, 'api.resend.com')
    assert.match(options.body, /Nombre real/)
    assert.doesNotMatch(options.body, /Nombre falso/)
    assert.equal(new Headers(options.headers).get('Idempotency-Key'), `registro/${recordId}`)
    emailSent = true
    return json({ id: 'email-id' })
  })
  assert.equal((await notify(event({ registro_id: recordId, trabajador_nombre: 'Nombre falso' }))).statusCode, 200)
  assert.equal(emailSent, true)
})

test('rechazo del proveedor de correo devuelve error, nunca éxito', async t => {
  t.mock.method(console, 'error', () => {})
  t.mock.method(globalThis, 'fetch', async () => json({ name: 'validation_error', message: 'Rejected' }, 422))
  const result = await contact(event({ name: 'Prueba', email: 'test@example.com', message: 'Solicitud de prueba válida', formStartedAt: Date.now() - 10000 }))
  assert.equal(result.statusCode, 500)
})

test('documentación exige autenticación', async t => {
  t.mock.method(globalThis, 'fetch', async () => { assert.fail('No debe llamar servicios externos') })
  assert.equal((await docs({ httpMethod: 'GET', headers: {} })).statusCode, 401)
})

test('documentación bloquea traversal', async () => {
  assert.equal((await docs({ httpMethod: 'GET', headers: { authorization: 'Bearer test' }, queryStringParameters: { file: '../package.json.html' } })).statusCode, 400)
})

test('documentación deniega acceso al rol trabajador', async t => {
  t.mock.method(globalThis, 'fetch', async input => String(input).includes('/auth/') ? json({ id: userId }) : json({ role: 'trabajador' }))
  assert.equal((await docs({ httpMethod: 'GET', headers: { authorization: 'Bearer test' } })).statusCode, 403)
})

test('documentación sirve el HUB al técnico con no-store', async t => {
  t.mock.method(globalThis, 'fetch', async input => String(input).includes('/auth/') ? json({ id: userId }) : json({ role: 'tecnico' }))
  const result = await docs({ httpMethod: 'GET', headers: { authorization: 'Bearer test' } })
  assert.equal(result.statusCode, 200)
  assert.match(result.body, /<!DOCTYPE html>/i)
  assert.equal(result.headers['Cache-Control'], 'private, no-store')
})
