// Utilidades para manejar fotos en formato HEIC/HEIF (iPhone), que los
// navegadores (Chrome/Edge) no pueden mostrar de forma nativa.
// La librería heic2any se importa de forma diferida para no cargarla
// hasta que realmente aparece una imagen HEIC.

const urlCache = new Map()

export const isHeic = (value = '') =>
  /\.(heic|heif)(\?|#|$)/i.test(value)

export const isHeicFile = (file) =>
  !!file && (
    /image\/(heic|heif)/i.test(file.type || '') ||
    /\.(heic|heif)$/i.test(file.name || '')
  )

// Detecta HEIC leyendo los primeros bytes del archivo (más fiable que MIME/extensión,
// porque algunos iPhones envían el archivo con tipo "image/jpeg" aunque sea HEIC).
export async function isHeicByHeader(file) {
  try {
    const buf = await file.slice(4, 12).arrayBuffer()
    const b = new Uint8Array(buf)
    const ftyp = String.fromCharCode(b[0], b[1], b[2], b[3])
    if (ftyp !== 'ftyp') return false
    const brand = String.fromCharCode(b[4], b[5], b[6], b[7]).toLowerCase()
    return /^(heic|heix|hevc|hevx|mif1|msf1|avci|avcs)/.test(brand)
  } catch { return false }
}

// Convierte un Blob/File HEIC a un Blob JPEG.
export async function heicBlobToJpeg(blob, quality = 0.85) {
  const heic2any = (await import('heic2any')).default
  const out = await heic2any({ blob, toType: 'image/jpeg', quality })
  return Array.isArray(out) ? out[0] : out
}

// Cola de concurrencia: heic2any decodifica en el hilo principal, así que
// convertir muchas fotos a la vez congela la pestaña. Limitamos cuántas
// conversiones corren en paralelo para que aparezcan de a poco sin trabar la UI.
const MAX_CONCURRENT = 2
let active = 0
const waiters = []

function acquireSlot() {
  if (active < MAX_CONCURRENT) {
    active++
    return Promise.resolve()
  }
  return new Promise((resolve) => waiters.push(resolve))
}

function releaseSlot() {
  active--
  const next = waiters.shift()
  if (next) {
    active++
    next()
  }
}

// Convierte una URL de imagen HEIC a un object URL JPEG que el <img> sí puede
// mostrar. Cachea por URL para no reconvertir el mismo archivo dos veces y
// pasa por la cola para no saturar el hilo principal.
export function heicUrlToJpegUrl(url) {
  if (urlCache.has(url)) return urlCache.get(url)
  const promise = (async () => {
    await acquireSlot()
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const jpeg = await heicBlobToJpeg(blob)
      return URL.createObjectURL(jpeg)
    } finally {
      releaseSlot()
    }
  })()
  urlCache.set(url, promise)
  return promise
}
