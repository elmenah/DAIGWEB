import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PermisosAuthContext = createContext(null)

export function PermisosAuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [role, setRole]     = useState(null)
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchAdv = async (userId) => {
    const { data } = await supabase
      .from('adv_profiles')
      .select('role, nombre')
      .eq('id', userId)
      .single()
    if (data) {
      setRole(data.role)
      setNombre(data.nombre || '')
    } else {
      setRole(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchAdv(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchAdv(u.id).finally(() => setLoading(false))
      } else {
        setRole(null)
        setNombre('')
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setNombre('')
  }

  return (
    <PermisosAuthContext.Provider value={{ user, role, nombre, loading, login, logout }}>
      {children}
    </PermisosAuthContext.Provider>
  )
}

export function usePermisosAuth() {
  return useContext(PermisosAuthContext)
}
