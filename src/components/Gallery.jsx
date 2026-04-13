import React, { useState, useEffect, useCallback } from 'react'
import { fetchGalleryItems } from '../admin/GalleryManager'

const defaultGalleryItems = [
  
]

const defaultCategories = [
  { key: 'piping', label: 'Piping' },
  { key: 'mantencion-de-correas', label: 'Mantención de Correas' },
  { key: 'estructuras', label: 'Estructuras' },
  { key: 'obras', label: 'Obras Civiles' },
  { key: 'proteccion', label: 'Protección' },
  { key: 'cnc', label: 'CNC' },
  { key: 'diseno', label: 'Diseño' },
]

function Gallery() {
  const [activeCategory, setActiveCategory] = useState('piping')
  const [galleryItems, setGalleryItems] = useState(defaultGalleryItems)
  const [categories] = useState(defaultCategories)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    fetchGalleryItems().then((supabaseItems) => {
      if (supabaseItems.length > 0) {
        setGalleryItems([...defaultGalleryItems, ...supabaseItems])
      }
    })
  }, [])

  const filtered = galleryItems.filter(item => item.category === activeCategory)

  const closeLightbox = useCallback((e) => {
    if (e.key === 'Escape') setLightbox(null)
  }, [])

  useEffect(() => {
    if (lightbox) {
      document.addEventListener('keydown', closeLightbox)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', closeLightbox)
      document.body.style.overflow = ''
    }
  }, [lightbox, closeLightbox])

  return (
    <section className="section gallery" id="portafolio">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Trabajo Realizado</span>
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
              aria-pressed={activeCategory === cat.key}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {filtered.length === 0 && (
            <p className="gallery-empty">No hay elementos en esta categoría aún.</p>
          )}
          {filtered.map((item, index) => (
            <div
              className="gallery-item"
              key={index}
              onClick={() => item.type !== 'video' && setLightbox(item)}
              role={item.type !== 'video' ? 'button' : undefined}
              tabIndex={item.type !== 'video' ? 0 : undefined}
              onKeyDown={(e) => e.key === 'Enter' && item.type !== 'video' && setLightbox(item)}
            >
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

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Cerrar">&times;</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.alt} />
            {lightbox.title && <p className="lightbox-caption">{lightbox.title}</p>}
          </div>
        </div>
      )}
    </section>
  )
}

export default Gallery
