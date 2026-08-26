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

// Convierte un Blob/File HEIC a un Blob JPEG.
export async function heicBlobToJpeg(blob, quality = 0.85) {
  const heic2any = (await import('heic2any')).default
  const out = await heic2any({ blob, toType: 'image/jpeg', quality })
  return Array.isArray(out) ? out[0] : out
}

// Convierte una URL de imagen HEIC a un object URL JPEG que el <img> sí puede
// mostrar. Cachea por URL para no reconvertir el mismo archivo dos veces.
export function heicUrlToJpegUrl(url) {
  if (urlCache.has(url)) return urlCache.get(url)
  const promise = (async () => {
    const res = await fetch(url)
    const blob = await res.blob()
    const jpeg = await heicBlobToJpeg(blob)
    return URL.createObjectURL(jpeg)
  })()
  urlCache.set(url, promise)
  return promise
}
