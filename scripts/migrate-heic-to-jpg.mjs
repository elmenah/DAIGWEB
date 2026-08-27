// ════════════════════════════════════════════════════════════════
// Migración única: convierte a JPG las fotos HEIC ya subidas al bucket
// 'registros-fotos' y actualiza las URLs en la tabla registros_trabajo.
//
// Uso (desde la raíz del proyecto):
//   node scripts/migrate-heic-to-jpg.mjs           → DRY-RUN (no cambia nada)
//   node scripts/migrate-heic-to-jpg.mjs --apply   → aplica los cambios
//
// Requiere en .env: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
// ════════════════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import heicConvert from 'heic-convert'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BUCKET = 'registros-fotos'
const APPLY = process.argv.includes('--apply')

// --- Cargar .env manualmente (sin depender de la versión de Node) ---
function loadEnv() {
  const out = {}
  const envPath = path.join(ROOT, '.env')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return out
}
const env = { ...loadEnv(), ...process.env }
const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✗ Falta SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_URL).')
  console.error('  El service role key NO está en .env (correcto: está en Netlify).')
  console.error('  Consíguelo en: Supabase → Settings → API → service_role, y córrelo así:')
  console.error('')
  console.error('  PowerShell:')
  console.error('    $env:SUPABASE_SERVICE_ROLE_KEY="TU_KEY"; node scripts/migrate-heic-to-jpg.mjs')
  console.error('')
  console.error('  Git Bash:')
  console.error('    SUPABASE_SERVICE_ROLE_KEY="TU_KEY" node scripts/migrate-heic-to-jpg.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const isHeic = (u) => typeof u === 'string' && /\.(heic|heif)(\?|#|$)/i.test(u)

// Deriva el path dentro del bucket a partir de la URL pública
function pathFromPublicUrl(url) {
  const marker = `/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return decodeURIComponent(url.slice(i + marker.length).split('?')[0])
}

async function main() {
  console.log(APPLY
    ? '⚠️  MODO APPLY — se convertirán archivos y se actualizará la base.\n'
    : '🔍 DRY-RUN — solo muestra qué haría. Usa --apply para aplicar.\n')

  const { data: registros, error } = await supabase
    .from('registros_trabajo')
    .select('id, fotos')
    .not('fotos', 'is', null)

  if (error) { console.error('✗ Error leyendo registros:', error.message); process.exit(1) }

  let totalHeic = 0, convertidas = 0, fallidas = 0, registrosTocados = 0

  for (const reg of registros) {
    const fotos = Array.isArray(reg.fotos) ? reg.fotos : []
    if (!fotos.some(isHeic)) continue

    const nuevas = [...fotos]
    const borrar = []
    let cambiado = false

    for (let i = 0; i < fotos.length; i++) {
      const url = fotos[i]
      if (!isHeic(url)) continue
      totalHeic++

      const srcPath = pathFromPublicUrl(url)
      if (!srcPath) { console.warn(`  ! No pude derivar el path de: ${url}`); fallidas++; continue }
      const destPath = srcPath.replace(/\.(heic|heif)$/i, '.jpg')

      console.log(`  • Registro ${reg.id}: ${srcPath} → ${destPath.split('/').pop()}`)

      if (!APPLY) {
        convertidas++
        nuevas[i] = url.replace(/\.(heic|heif)(\?|#|$)/i, '.jpg$2')
        cambiado = true
        continue
      }

      try {
        const { data: blob, error: dErr } = await supabase.storage.from(BUCKET).download(srcPath)
        if (dErr) throw dErr
        const inputBuffer = Buffer.from(await blob.arrayBuffer())

        const outputBuffer = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: 0.85 })

        const { error: uErr } = await supabase.storage
          .from(BUCKET)
          .upload(destPath, Buffer.from(outputBuffer), { contentType: 'image/jpeg', upsert: true })
        if (uErr) throw uErr

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(destPath)
        nuevas[i] = pub.publicUrl
        if (destPath !== srcPath) borrar.push(srcPath)
        cambiado = true
        convertidas++
      } catch (e) {
        console.warn(`    ✗ Falló: ${e.message}`)
        fallidas++
      }
    }

    if (cambiado && APPLY) {
      const { error: upErr } = await supabase.from('registros_trabajo').update({ fotos: nuevas }).eq('id', reg.id)
      if (upErr) { console.warn(`    ✗ No pude actualizar el registro ${reg.id}: ${upErr.message}`); continue }
      if (borrar.length) await supabase.storage.from(BUCKET).remove(borrar) // limpia los HEIC viejos
      registrosTocados++
    } else if (cambiado) {
      registrosTocados++
    }
  }

  console.log('\n─────────── Resumen ───────────')
  console.log(`  Fotos HEIC encontradas:      ${totalHeic}`)
  console.log(`  ${APPLY ? 'Convertidas' : 'Se convertirían'}:${APPLY ? '            ' : '        '}${convertidas}`)
  console.log(`  Fallidas:                    ${fallidas}`)
  console.log(`  Registros ${APPLY ? 'actualizados' : 'a tocar'}:${APPLY ? '       ' : '          '}${registrosTocados}`)
  if (!APPLY) console.log('\n➡️  Para aplicar:  node scripts/migrate-heic-to-jpg.mjs --apply')
}

main().catch((e) => { console.error(e); process.exit(1) })
