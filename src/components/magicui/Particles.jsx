import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null
}

export function Particles({
  className,
  quantity = 50,
  staticity = 50,
  ease = 50,
  color = '#E8962E',
  size = 0.4,
  vx = 0,
  vy = 0,
}) {
  const canvasRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const context = useRef(null)
  const circles = useRef([])
  const mouse = useRef({ x: 0, y: 0 })
  const canvasSize = useRef({ w: 0, h: 0 })
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

  const rgb = hexToRgb(color)

  const resizeCanvas = useCallback(() => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      canvasSize.current.w = canvasContainerRef.current.offsetWidth
      canvasSize.current.h = canvasContainerRef.current.offsetHeight
      canvasRef.current.width = canvasSize.current.w * dpr
      canvasRef.current.height = canvasSize.current.h * dpr
      canvasRef.current.style.width = `${canvasSize.current.w}px`
      canvasRef.current.style.height = `${canvasSize.current.h}px`
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }, [dpr])

  const circleParams = useCallback(() => {
    const x = Math.floor(Math.random() * canvasSize.current.w)
    const y = Math.floor(Math.random() * canvasSize.current.h)
    const pSize = Math.floor(Math.random() * 2) + size
    const alpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1))
    const targetAlpha = alpha
    const dx = (Math.random() - 0.5) * 0.2
    const dy = (Math.random() - 0.5) * 0.2
    const magnetism = 0.1 + Math.random() * 4
    return { x, y, translateX: 0, translateY: 0, size: pSize, alpha, targetAlpha, dx, dy, magnetism }
  }, [size])

  const drawCircle = useCallback((circle, update = false) => {
    if (context.current && rgb) {
      const { x, y, translateX, translateY, size: s, alpha } = circle
      context.current.translate(translateX, translateY)
      context.current.beginPath()
      context.current.arc(x, y, s, 0, 2 * Math.PI)
      context.current.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
      context.current.fill()
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }, [dpr, rgb])

  const initCanvas = useCallback(() => {
    resizeCanvas()
    circles.current = []
    for (let i = 0; i < quantity; i++) {
      const circle = circleParams()
      drawCircle(circle)
      circles.current.push(circle)
    }
  }, [quantity, circleParams, drawCircle, resizeCanvas])

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext('2d')
    }
    initCanvas()

    const handleResize = () => initCanvas()
    window.addEventListener('resize', handleResize)

    let animationId
    const animate = () => {
      if (!context.current) return
      context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h)
      circles.current.forEach((circle, i) => {
        const edge = [
          circle.x + circle.translateX - circle.size,
          canvasSize.current.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSize.current.h - circle.y - circle.translateY - circle.size,
        ]
        const closestEdge = edge.reduce((a, b) => Math.min(a, b))
        const remapClosestEdge = parseFloat(Math.max(0, Math.min(closestEdge / 20, 1)).toFixed(2))
        circle.alpha += 0.02 * (circle.targetAlpha * remapClosestEdge - circle.alpha)
        circle.x += circle.dx + vx
        circle.y += circle.dy + vy
        circle.translateX += (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) / ease
        circle.translateY += (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) / ease
        drawCircle(circle, true)

        if (
          circle.x < -circle.size ||
          circle.x > canvasSize.current.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSize.current.h + circle.size
        ) {
          circles.current[i] = circleParams()
        }
      })
      animationId = requestAnimationFrame(animate)
    }
    animate()

    const handleMouseMove = (e) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        mouse.current = {
          x: e.clientX - rect.left - canvasSize.current.w / 2,
          y: e.clientY - rect.top - canvasSize.current.h / 2,
        }
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [initCanvas, drawCircle, circleParams, ease, staticity, vx, vy])

  return (
    <div className={cn('pointer-events-none', className)} ref={canvasContainerRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
