import React, { useState, useEffect } from 'react'
import { fetchGalleryItems } from '../admin/GalleryManager'

const defaultGalleryItems = [
  {
    src: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=400&fit=crop',
    alt: 'Soldadura de piping industrial',
    category: 'piping',
    title: 'Soldadura de Piping',
  },
  {
    src: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=400&fit=crop',
    alt: 'Fabricación de estructuras metálicas',
    category: 'estructuras',
    title: 'Estructuras Metálicas',
  },
  {
    src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop',
    alt: 'Obra civil en planta industrial',
    category: 'obras',
    title: 'Obras Civiles',
  },
  {
    src: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop',
    alt: 'Instalación de tuberías industriales',
    category: 'piping',
    title: 'Instalación de Tuberías',
  },
  {
    src: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop',
    alt: 'Montaje de estructura metálica',
    category: 'estructuras',
    title: 'Montaje Estructural',
  },
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
    alt: 'Protección y recubrimiento de tuberías',
    category: 'proteccion',
    title: 'Protección de Tuberías',
  },
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
                <video src={item.src} muted loop playsInline
                  onMouseEnter={(e) => e.target.play()}
                  onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0 }}
                />
              ) : (
                <img src={item.src} alt={item.alt} loading="lazy" />
              )}
              <div className="gallery-overlay">
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
