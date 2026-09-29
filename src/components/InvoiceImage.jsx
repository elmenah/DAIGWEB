import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { INVOICE_BUCKET } from '../lib/invoice'

export default function InvoiceImage({ path }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setUrl(null)
    setError(false)
    const refresh = async () => {
      try {
        const { data, error: signedError } = await supabase.storage.from(INVOICE_BUCKET).createSignedUrl(path, 600)
        if (active) {
          setUrl(signedError ? null : data?.signedUrl)
          setError(!!signedError)
        }
      } catch {
        if (active) setError(true)
      }
    }
    refresh()
    const timer = setInterval(refresh, 480000)
    return () => { active = false; clearInterval(timer) }
  }, [path, attempt])
  if (error) return <p role="alert">No se pudo cargar la factura. <button type="button" onClick={() => setAttempt(n => n + 1)}>Reintentar</button></p>
  if (!url) return <p role="status">Cargando factura…</p>
  return <a href={url} target="_blank" rel="noopener noreferrer">
    <img src={url} alt="Foto de la factura adjunta" style={{ maxWidth: '100%', width: 260, maxHeight: 320, objectFit: 'contain', borderRadius: 8 }} />
    <span style={{ display: 'block' }}>Abrir factura ↗</span>
  </a>
}
