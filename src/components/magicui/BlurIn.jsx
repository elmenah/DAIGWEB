import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export function BlurIn({ children, className, duration = 1, delay = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running'
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn('animate-blur-in', className)}
      style={{
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        animationPlayState: 'paused',
        animationFillMode: 'forwards',
      }}
    >
      {children}
    </div>
  )
}
