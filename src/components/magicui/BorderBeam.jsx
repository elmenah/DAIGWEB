import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = '#E8962E',
  colorTo = '#FFB438',
  delay = 0,
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        className
      )}
      style={{
        '--size': `${size}px`,
        '--duration': `${duration}s`,
        '--anchor': `${anchor}%`,
        '--border-width': `${borderWidth}px`,
        '--color-from': colorFrom,
        '--color-to': colorTo,
        '--delay': `${delay}s`,
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: `var(--border-width) solid transparent`,
          mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      >
        <div
          className="animate-border-beam"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `conic-gradient(from calc(var(--anchor) - 60deg), transparent 0%, var(--color-from) 20%, var(--color-to) 40%, transparent 50%)`,
            animationDuration: 'var(--duration)',
            animationDelay: 'var(--delay)',
          }}
        />
      </div>
    </div>
  )
}
