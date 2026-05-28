import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function UserManager() {
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email, created_at')
      .eq('role', 'tecnico')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoadingUsers(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    const normalizedUsername = username.trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
      setError('El nombre de usuario debe tener 3-30 caracteres (a-z, 0-9, punto, guion o guion bajo)')
      return
    }

    setCreating(true)
    const token = await getToken()

    const res = await fetch('/.netlify/functions/manage-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'create', username: normalizedUsername, email, password }),
    })

    const result = await res.json()
    setCreating(false)

    if (!res.ok) {
      setError(result.error || 'Error al crear usuario')
    } else {
      setSuccess(`Usuario ${normalizedUsername} (${email}) creado correctamente`)
      setUsername('')
      setEmail('')
      setPassword('')
      loadUsers()
    }
  }

  const handleDelete = async (userId, userEmail) => {
    if (!confirm(`¿Eliminar al usuario ${userEmail}? Esta acción no se puede deshacer.`)) return

    setDeleting(userId)
    const token = await getToken()

    const res = await fetch('/.netlify/functions/manage-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'delete', userId }),
    })

    const result = await res.json()
    setDeleting(null)

    if (!res.ok) {
      alert(result.error || 'Error al eliminar usuario')
    } else {
      loadUsers()
    }
  }

  return (
    <div className="admin-section">
      <h3>Usuarios Técnicos</h3>
      <p style={{ color: '#9a9ab0', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Los usuarios técnicos pueden iniciar sesión y acceder al Portal Técnico (<code>/tecnico</code>).
        No tienen acceso al panel de administración.
      </p>

      {/* Formulario crear usuario */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Crear nuevo usuario técnico</h4>

        {error && <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="admin-alert admin-alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label htmlFor="tech-username">Nombre de usuario</label>
            <input
              id="tech-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="tecnico01"
              autoComplete="off"
            />
          </div>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label htmlFor="tech-email">Email</label>
            <input
              id="tech-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tecnico@empresa.cl"
              autoComplete="off"
            />
          </div>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label htmlFor="tech-password">Contraseña (mín. 8 caracteres)</label>
            <input
              id="tech-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="admin-btn-primary" disabled={creating} style={{ whiteSpace: 'nowrap' }}>
            {creating ? 'Creando...' : '+ Crear usuario'}
          </button>
        </form>
      </div>

      {/* Lista de usuarios técnicos */}
      {loadingUsers ? (
        <div className="admin-loading" style={{ minHeight: '80px' }}><div className="admin-spinner"></div></div>
      ) : users.length === 0 ? (
        <p style={{ color: '#9a9ab0', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
          No hay usuarios técnicos creados aún.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#9a9ab0', fontWeight: 500 }}>Usuario</th>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#9a9ab0', fontWeight: 500 }}>Email</th>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#9a9ab0', fontWeight: 500 }}>Creado</th>
              <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', color: '#9a9ab0', fontWeight: 500 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.65rem 0.75rem' }}>{u.username || '-'}</td>
                <td style={{ padding: '0.65rem 0.75rem' }}>{u.email}</td>
                <td style={{ padding: '0.65rem 0.75rem', color: '#9a9ab0' }}>
                  {new Date(u.created_at).toLocaleDateString('es-CL')}
                </td>
                <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(u.id, u.email)}
                    disabled={deleting === u.id}
                    className="admin-btn-danger"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  >
                    {deleting === u.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default UserManager
