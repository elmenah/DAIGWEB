import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
}) {
  const ref = useRef(null)
  const [displayValue, setDisplayValue] = useState(direction === 'down' ? value : 0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const start = direction === 'down' ? value : 0
          const end = direction === 'down' ? 0 : value
          const duration = 2000
          const startTime = performance.now() + delay

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime
            if (elapsed < 0) {
              requestAnimationFrame(animate)
              return
            }
            const progress = Math.min(elapsed / duration, 1)
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            const current = start + (end - start) * eased
            setDisplayValue(Number(current.toFixed(decimalPlaces)))
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, direction, delay, decimalPlaces, hasAnimated])

  return (
    <span ref={ref} className={cn('inline-block tabular-nums', className)}>
      {displayValue.toFixed(decimalPlaces)}
    </span>
  )
}
