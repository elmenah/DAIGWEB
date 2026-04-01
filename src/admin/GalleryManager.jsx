import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'gallery'

const defaultCategories = [
  { key: 'piping', label: 'Piping' },
  { key: 'mantencion-de-correas', label: 'Mantención de Correas' },
  { key: 'estructuras', label: 'Estructuras' },
  { key: 'obras', label: 'Obras Civiles' },
  { key: 'proteccion', label: 'Protección' },
  { key: 'cnc', label: 'CNC' },
  { key: 'diseno', label: 'Diseño' },
]

export async function fetchGalleryItems() {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data.map((row) => ({
    id: row.id,
    src: row.image_url,
    alt: row.alt_text || row.title,
    category: row.category,
    title: row.title,
    type: row.media_type || 'image',
  }))
}

function GalleryManager() {
  const [items, setItems] = useState([])
  const [categories] = useState(defaultCategories)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ title: '', alt: '', category: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    const data = await fetchGalleryItems()
    setItems(data)
  }

  const isVideo = (f) => f && f.type.startsWith('video/')
  const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov)$/i.test(url)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    const maxSize = selected.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024
    if (selected.size > maxSize) {
      setMessage(selected.type.startsWith('video/') ? 'El video no debe superar 50MB' : 'La imagen no debe superar 5MB')
      return
    }
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  const uploadImage = async (file) => {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return { url: data.publicUrl, path: fileName }
  }

  const deleteImage = async (url) => {
    const parts = url.split(`${BUCKET}/`)
    if (parts.length < 2) return
    const path = parts[parts.length - 1]
    await supabase.storage.from(BUCKET).remove([path])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category) {
      setMessage('Selecciona una categoría')
      return
    }
    if (!editItem && !file) {
      setMessage('Selecciona una imagen o video')
      return
    }

    setUploading(true)
    try {
      let imageUrl = editItem?.src || ''

      if (file) {
        if (editItem?.src) await deleteImage(editItem.src)
        const uploaded = await uploadImage(file)
        imageUrl = uploaded.url
      }

      if (editItem) {
        const { error } = await supabase
          .from('gallery_items')
          .update({
            title: form.title,
            alt_text: form.alt || form.title,
            category: form.category,
            image_url: imageUrl,
            media_type: file ? (isVideo(file) ? 'video' : 'image') : undefined,
          })
          .eq('id', editItem.id)
        if (error) throw error
        setMessage('Actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('gallery_items')
          .insert({
            title: form.title,
            alt_text: form.alt || form.title,
            category: form.category,
            image_url: imageUrl,
            media_type: isVideo(file) ? 'video' : 'image',
          })
        if (error) throw error
        setMessage('Agregado correctamente')
      }

      await loadItems()
      resetForm()
    } catch (err) {
      setMessage('Error: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setForm({ title: '', alt: '', category: '' })
    setFile(null)
    setPreview('')
    setShowForm(false)
    setEditItem(null)
  }

  const handleEdit = (item) => {
    setForm({ title: item.title, alt: item.alt, category: item.category })
    setPreview(item.src)
    setEditItem(item)
    setShowForm(true)
  }

  const handleDelete = async (item) => {
    if (!window.confirm('¿Eliminar esta imagen del portafolio?')) return
    try {
      await deleteImage(item.src)
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', item.id)
      if (error) throw error
      setMessage('Eliminado')
      await loadItems()
    } catch (err) {
      setMessage('Error al eliminar: ' + err.message)
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h3>Gestión de Portafolio</h3>
        <button
          className="admin-btn-primary"
          onClick={() => { resetForm(); setShowForm(!showForm) }}
        >
          {showForm ? 'Cancelar' : '+ Agregar Imagen/Video'}
        </button>
      </div>

      {message && (
        <div className="admin-alert admin-alert-success">
          {message}
          <button onClick={() => setMessage('')} className="admin-alert-close">×</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Soldadura de piping"
              />
            </div>
            <div className="admin-field">
              <label>Categoría *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              >
                <option value="">Seleccionar...</option>
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Texto alternativo</label>
              <input
                type="text"
                value={form.alt}
                onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
                placeholder="Descripción de la imagen"
              />
            </div>
            <div className="admin-field">
              <label>Archivo {editItem ? '(opcional)' : '*'} (imágenes máx 5MB, videos máx 50MB)</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
          {preview && (
            <div className="admin-preview">
              {(file && isVideo(file)) || (!file && editItem && isVideoUrl(preview)) ? (
                <video src={preview} controls style={{ maxWidth: '100%', maxHeight: '200px' }} />
              ) : (
                <img src={preview} alt="Vista previa" />
              )}
            </div>
          )}
          <button type="submit" className="admin-btn-primary" disabled={uploading}>
            {uploading ? 'Subiendo...' : editItem ? 'Actualizar' : 'Agregar al Portafolio'}
          </button>
        </form>
      )}

      <div className="admin-gallery-grid">
        {items.length === 0 && (
          <p className="admin-empty">No hay imágenes en el portafolio administrado. Las imágenes por defecto del sitio seguirán mostrándose.</p>
        )}
        {items.map((item) => (
          <div className="admin-gallery-card" key={item.id}>
            <div className="admin-gallery-img">
              {item.type === 'video' ? (
                <video src={item.src} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={item.src} alt={item.alt} />
              )}
            </div>
            <div className="admin-gallery-info">
              <strong>{item.title}</strong>
              <span className="admin-gallery-cat">{item.category}</span>
            </div>
            <div className="admin-gallery-actions">
              <button onClick={() => handleEdit(item)} className="admin-btn-sm admin-btn-edit">Editar</button>
              <button onClick={() => handleDelete(item)} className="admin-btn-sm admin-btn-delete">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GalleryManager
