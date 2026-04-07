import React from 'react'
import { NumberTicker } from './magicui/NumberTicker'

const stats = [
  { number: 50, suffix: '+', label: 'Proyectos Realizados' },
  { number: 1, suffix: '+', label: 'Año de Experiencia' },
  { number: 20, suffix: '+', label: 'Clientes Satisfechos' },
  { number: 98, suffix: '%', label: 'Satisfacción' },
]

function Stats() {
  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div className="stat-card" key={index}>
              <span className="stat-number">
                <NumberTicker value={stat.number} />
                {stat.suffix}
              </span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
