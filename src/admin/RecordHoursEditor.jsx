import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RecordHoursEditor({ record, onSaved }) {
  const [hours, setHours] = useState(record.horas_trabajadas?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const save = async event => {
    event.preventDefault()
    const value = Number(hours)
    if (!hours.trim() || !Number.isFinite(value) || value < 0.5 || value > 24 || !Number.isInteger(value * 2)) {
      setError('Ingresa entre 0,5 y 24 horas, en intervalos de media hora.')
      return
    }
    setSaving(true); setError(''); setSaved(false)
    try {
      // single() también detecta cuando RLS impide actualizar la fila.
      const { data, error: updateError } = await supabase.from('registros_trabajo')
        .update({ horas_trabajadas: value }).eq('id', record.id)
        .select('id, horas_trabajadas').single()
      if (updateError) throw updateError
      if (!data) throw new Error('No se pudo actualizar el registro.')
      onSaved(data)
      setSaved(true)
    } catch {
      setError('No se guardaron las horas. Revisa tu conexión y los permisos de administrador e intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return <form onSubmit={save} className="reg-field">
    <label className="reg-label" htmlFor="record-hours">Horas trabajadas</label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
      <input id="record-hours" type="number" min="0.5" max="24" step="0.5" required
        value={hours} disabled={saving} aria-describedby="record-hours-help"
        onChange={event => { setHours(event.target.value); setSaved(false); setError('') }}
        style={{ width: 110, padding: '8px 10px', background: '#181828', color: '#fff', border: '1px solid #555', borderRadius: 6 }} />
      <button type="submit" className="admin-btn-outline" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar horas'}
      </button>
    </div>
    <small id="record-hours-help">Puedes corregir las horas registradas por el trabajador. De 0,5 a 24 horas.</small>
    {error && <p role="alert" style={{ color: '#f87171' }}>{error}</p>}
    {saved && <p role="status" style={{ color: '#22c55e' }}>Horas actualizadas correctamente.</p>}
  </form>
}
