import React, { useState, useEffect } from 'react'
import { fetchGalleryItems } from '../admin/GalleryManager'

const defaultGalleryItems = [
  
]

const defaultCategories = [
  { key: 'all', label: 'Todos' },
  { key: 'piping', label: 'Piping' },
  { key: 'mantencion-de-correas', label: 'Mantención de Correas' },
  { key: 'estructuras', label: 'Estructuras' },
  { key: 'obras', label: 'Obras Civiles' },
  { key: 'proteccion', label: 'Protección' },
  { key: 'cnc', label: 'CNC' },
  { key: 'diseno', label: 'Diseño' },
]

function Gallery() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [galleryItems, setGalleryItems] = useState(defaultGalleryItems)
  const [categories] = useState(defaultCategories)

  useEffect(() => {
    fetchGalleryItems().then((supabaseItems) => {
      if (supabaseItems.length > 0) {
        setGalleryItems([...defaultGalleryItems, ...supabaseItems])
      }
    })
  }, [])

  const filtered = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory)

  return (
    <section className="section gallery" id="portafolio">
      <div className="container">
        <div className="section-header">
          <h2>Nuestro Portafolio</h2>
          <div className="accent-line"></div>
          <p>Una muestra de los proyectos que hemos realizado</p>
        </div>

        <div className="gallery-filters">
          {categories.map(cat => (
            <button
              key={cat.key}
              className={`gallery-filter-btn ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {filtered.map((item, index) => (
            <div className="gallery-item" key={index}>
              {item.type === 'video' ? (
                <div className="gallery-video-wrapper">
                  <video
                    src={item.src}
                    controls
                    preload="metadata"
                    playsInline
                  />
                </div>
              ) : (
                <img src={item.src} alt={item.alt} loading="lazy" />
              )}
              <div className={`gallery-overlay ${item.type === 'video' ? 'gallery-overlay--video' : ''}`}>
                <h4>{item.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Gallery
