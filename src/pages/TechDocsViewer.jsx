import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../admin/AuthContext'
import { supabase } from '../lib/supabase'

function TechDocsViewer() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [documentName, setDocumentName] = useState('HUB_consolidado_camion_barredor.html')
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const frame = useRef(null)
  useEffect(() => {
    const controller = new AbortController()
    setHtml(''); setError('')
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Debes iniciar sesión nuevamente.')
        const response = await fetch(`/.netlify/functions/tech-docs?file=${encodeURIComponent(documentName)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal,
        })
        if (!response.ok) throw new Error('No se pudo cargar el documento o no tienes permiso para verlo.')
        const source = await response.text()
        // Los enlaces internos vuelven al visor para solicitar cada documento con sesión.
        const navigation = `<script>document.addEventListener('click', function(event) {
          const link = event.target.closest('a[href]');
          if (!link) return;
          const href = link.getAttribute('href');
          if (/^[a-zA-Z0-9_.-]+\\.html$/.test(href)) {
            event.preventDefault(); parent.postMessage({type:'daig-document', file:href}, '*');
          }
        });</script>`
        if (!controller.signal.aborted) setHtml(source.replace('</body>', `${navigation}</body>`))
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message)
      }
    }
    load()
    return () => controller.abort()
  }, [documentName, attempt])
  useEffect(() => {
    const receive = (event) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== 'daig-document') return
      if (/^[a-zA-Z0-9_.-]+\.html$/.test(event.data.file)) setDocumentName(event.data.file)
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <button
        onClick={handleLogout}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'rgba(15,20,25,0.92)',
          color: '#ff4e3a',
          border: '1px solid #ff4e3a',
          padding: '8px 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        Cerrar sesión
      </button>
      {error ? <div role="alert"><p>{error}</p><button onClick={() => setAttempt(n => n + 1)}>Reintentar</button></div> : !html ? <p role="status">Cargando documentación…</p> : <iframe
        ref={frame}
        srcDoc={html}
        sandbox="allow-scripts allow-modals allow-downloads allow-popups"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Portal Técnico · Camión Barredor Bucher CityFant 6000 · DAIG SpA"
      />}
    </div>
  )
}

export default TechDocsViewer

