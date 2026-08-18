import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const ROLE_LABELS = {
  admin: { label: 'Admin', color: '#f59e0b' },
  directiva: { label: 'Directiva', color: '#8b5cf6' },
  tecnico: { label: 'Técnico', color: '#3b82f6' },
  trabajador: { label: 'Trabajador', color: '#22c55e' },
}

const CREATABLE_ROLES = ['directiva', 'tecnico', 'trabajador']

function RoleBadge({ role }) {
  const cfg = ROLE_LABELS[role] || { label: role, color: '#9a9ab0' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: cfg.color + '22',
      color: cfg.color,
      border: `1px solid ${cfg.color}44`,
    }}>
      {cfg.label}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '420px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem' }}>{title}</h4>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a9ab0', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function UserManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  // Create form
  const [cNombre, setCNombre] = useState('')
  const [cUsername, setCUsername] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cPassword, setCPassword] = useState('')
  const [cRole, setCRole] = useState('trabajador')
  const [cError, setCError] = useState('')
  const [cLoading, setCLoading] = useState(false)

  // Edit form
  const [eNombre, setENombre] = useState('')
  const [eRole, setERole] = useState('')
  const [ePassword, setEPassword] = useState('')
  const [eError, setEError] = useState('')
  const [eLoading, setELoading] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, nombre, email, role, created_at')
      .neq('role', 'admin')
      .order('role')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const callAPI = async (payload) => {
    const token = await getToken()
    if (!token) throw new Error('Sesión expirada')
    const res = await fetch('/.netlify/functions/manage-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
    return data
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCError('')
    if (!cUsername.trim()) return setCError('El campo Usuario/RUT es requerido')
    if (cPassword.length < 6) return setCError('La contraseña debe tener al menos 6 caracteres')
    setCLoading(true)
    try {
      await callAPI({
        action: 'create',
        nombre: cNombre,
        username: cUsername.replace(/\./g, '').replace(/-/g, '').toLowerCase(),
        email: cEmail || null,
        password: cPassword,
        role: cRole,
      })
      setShowCreate(false)
      setCNombre(''); setCUsername(''); setCEmail(''); setCPassword(''); setCRole('trabajador')
      setSuccessMsg(`Usuario "${cNombre || cUsername}" creado correctamente.`)
      setTimeout(() => setSuccessMsg(''), 5000)
      loadUsers()
    } catch (err) {
      setCError(err.message)
    } finally {
      setCLoading(false)
    }
  }

  const openEdit = (u) => {
    setEditUser(u)
    setENombre(u.nombre || '')
    setERole(u.role)
    setEPassword('')
    setEError('')
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setEError('')
    if (ePassword && ePassword.length < 6) return setEError('La contraseña debe tener al menos 6 caracteres')
    setELoading(true)
    try {
      await callAPI({
        action: 'update',
        userId: editUser.id,
        nombre: eNombre,
        role: eRole,
        password: ePassword || undefined,
      })
      setEditUser(null)
      setSuccessMsg(`Usuario "${eNombre || editUser.username}" actualizado correctamente.`)
      setTimeout(() => setSuccessMsg(''), 5000)
      loadUsers()
    } catch (err) {
      setEError(err.message)
    } finally {
      setELoading(false)
    }
  }

  const handleDelete = async (u) => {
    if (!confirm(`¿Eliminar al usuario "${u.nombre || u.username}"? Esta acción no se puede deshacer.`)) return
    setDeleting(u.id)
    try {
      await callAPI({ action: 'delete', userId: u.id })
      setSuccessMsg(`Usuario "${u.nombre || u.username}" eliminado.`)
      setTimeout(() => setSuccessMsg(''), 5000)
      loadUsers()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const displayName = (u) => u.nombre || u.username || u.email || u.id.slice(0, 8)

  return (
    <div className="admin-section">
      {showCreate && (
        <Modal title="Crear nuevo usuario" onClose={() => { setShowCreate(false); setCError('') }}>
          <form onSubmit={handleCreate}>
            {cError && <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>{cError}</div>}

            <div className="admin-field">
              <label>Nombre completo</label>
              <input type="text" value={cNombre} onChange={e => setCNombre(e.target.value)}
                placeholder="Ej: Juan Pérez" autoComplete="off" />
            </div>

            <div className="admin-field">
              <label>Rol</label>
              <select value={cRole} onChange={e => setCRole(e.target.value)}>
                {CREATABLE_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]?.label || r}</option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label>{cRole === 'trabajador' ? 'RUT (sin puntos ni guión)' : 'Usuario (login)'}</label>
              <input type="text" value={cUsername} onChange={e => setCUsername(e.target.value)}
                placeholder={cRole === 'trabajador' ? 'Ej: 202705545 o 20.270.554-5' : 'Ej: jperez'}
                required autoComplete="off" />
              <small style={{ color: '#9a9ab0', fontSize: '0.75rem' }}>
                {cRole === 'trabajador' ? 'El RUT se usa para iniciar sesión en el portal' : 'Nombre de usuario para iniciar sesión'}
              </small>
            </div>

            <div className="admin-field">
              <label>Email {cRole === 'trabajador' ? '(opcional)' : '(recomendado)'}</label>
              <input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)}
                placeholder="usuario@empresa.cl" autoComplete="off" />
            </div>

            <div className="admin-field">
              <label>Contraseña</label>
              <input type="password" value={cPassword} onChange={e => setCPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" required autoComplete="new-password" />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="admin-btn-outline" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button type="submit" className="admin-btn-primary" disabled={cLoading}>
                {cLoading ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editUser && (
        <Modal title={`Editar — ${displayName(editUser)}`} onClose={() => setEditUser(null)}>
          <form onSubmit={handleEdit}>
            {eError && <div className="admin-alert admin-alert-error" style={{ marginBottom: '1rem' }}>{eError}</div>}

            <div className="admin-field">
              <label>Nombre completo</label>
              <input type="text" value={eNombre} onChange={e => setENombre(e.target.value)}
                placeholder="Nombre del usuario" autoComplete="off" />
            </div>

            <div className="admin-field">
              <label>Rol</label>
              <select value={eRole} onChange={e => setERole(e.target.value)}>
                {CREATABLE_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]?.label || r}</option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label>Nueva contraseña <span style={{ color: '#9a9ab0', fontWeight: 400 }}>(dejar vacío para no cambiar)</span></label>
              <input type="password" value={ePassword} onChange={e => setEPassword(e.target.value)}
                placeholder="Nueva contraseña" autoComplete="new-password" />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="admin-btn-outline" onClick={() => setEditUser(null)}>Cancelar</button>
              <button type="submit" className="admin-btn-primary" disabled={eLoading}>
                {eLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {successMsg && (
        <div className="admin-alert admin-alert-success" style={{ marginBottom: '1rem' }}>
          ✓ {successMsg}
        </div>
      )}

      <div className="admin-section-header">
        <h3>Gestión de Usuarios</h3>
        <button className="admin-btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => setShowCreate(true)}>
          + Nuevo usuario
        </button>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ minHeight: '80px' }}><div className="admin-spinner"></div></div>
      ) : users.length === 0 ? (
        <p style={{ color: '#9a9ab0', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
          No hay usuarios creados aún.
        </p>
      ) : (
        <div className="reg-table-wrap">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario / RUT</th>
                <th>Rol</th>
                <th>Creado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="reg-row">
                  <td>{u.nombre || <span style={{ color: '#9a9ab0' }}>—</span>}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{u.username || u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td style={{ color: '#9a9ab0', fontSize: '0.82rem' }}>
                    {new Date(u.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        className="admin-btn-outline"
                        style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                        onClick={() => openEdit(u)}
                      >
                        Editar
                      </button>
                      <button
                        className="admin-btn-danger"
                        style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                        onClick={() => handleDelete(u)}
                        disabled={deleting === u.id}
                      >
                        {deleting === u.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UserManager
