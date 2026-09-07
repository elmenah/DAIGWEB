import React, { useRef, useEffect, useState } from 'react'

// Modal simple para dibujar una firma con mouse o dedo. Devuelve un data URL PNG.
export default function SignaturePad({ initial, onSave, onClose }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(!initial)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (initial) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = initial
    }
  }, [initial])

  const pos = (e) => {
    const c = canvasRef.current
    const rect = c.getBoundingClientRect()
    const p = e.touches ? e.touches[0] : e
    return {
      x: (p.clientX - rect.left) * (c.width / rect.width),
      y: (p.clientY - rect.top) * (c.height / rect.height),
    }
  }
  const start = (e) => {
    e.preventDefault(); drawing.current = true
    const { x, y } = pos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath(); ctx.moveTo(x, y); setEmpty(false)
  }
  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const { x, y } = pos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(x, y); ctx.stroke()
  }
  const end = () => { drawing.current = false }

  const limpiar = () => {
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height)
    setEmpty(true)
  }
  const guardar = () => onSave(empty ? null : canvasRef.current.toDataURL('image/png'))

  return (
    <div className="reg-modal-overlay" onClick={onClose}>
      <div
        style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, width: 'min(460px, 92vw)' }}
        onClick={e => e.stopPropagation()}
      >
        <h4 style={{ color: '#fff', margin: '0 0 12px', fontSize: '1rem' }}>Firma del supervisor</h4>
        <canvas
          ref={canvasRef}
          width={440}
          height={180}
          style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: '#fff', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
        <p style={{ color: '#9a9ab0', fontSize: '0.78rem', margin: '8px 0 0' }}>
          Dibuja tu firma con el mouse o el dedo. Se guarda en este dispositivo y se incrusta en los informes PDF.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
          <button type="button" className="admin-btn-outline" onClick={limpiar}>Limpiar</button>
          <button type="button" className="admin-btn-outline" onClick={onClose}>Cancelar</button>
          <button type="button" className="admin-btn-primary" onClick={guardar}>Guardar firma</button>
        </div>
      </div>
    </div>
  )
}
