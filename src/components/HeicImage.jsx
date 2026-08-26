import React, { useState, useEffect } from 'react'
import { isHeic, heicUrlToJpegUrl } from '../lib/heic'

// <img> que soporta URLs HEIC/HEIF: si detecta ese formato lo convierte a JPEG
// en el navegador (bajo demanda) para poder mostrarlo. Para cualquier otra
// imagen se comporta como un <img> normal.
export default function HeicImage({ src, alt = '', className, style, onClick }) {
  const heic = isHeic(src)
  const [resolved, setResolved] = useState(heic ? null : src)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    if (!isHeic(src)) {
      setResolved(src)
      setError(false)
      return
    }
    setResolved(null)
    setError(false)
    heicUrlToJpegUrl(src)
      .then((u) => { if (alive) setResolved(u) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [src])

  if (error) {
    return (
      <div
        className={className}
        style={{ ...style, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.05)', color: '#9a9ab0', fontSize: '0.62rem', letterSpacing: '0.04em' }}
        title="No se pudo convertir la imagen HEIC"
      >
        HEIC
      </div>
    )
  }

  if (!resolved) {
    return (
      <div
        className={className}
        style={{ ...style, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.05)' }}
        title="Convirtiendo HEIC..."
      >
        <div className="admin-spinner" style={{ width: 16, height: 16 }} />
      </div>
    )
  }

  return (
    <img src={resolved} alt={alt} className={className} style={style} onClick={onClick} loading="lazy" />
  )
}
