import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRole = async (userId) => {
    if (!userId) { setRole(null); return }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setRole(data?.role ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      await fetchRole(u?.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        await fetchRole(u?.id)
      }
    )

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
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
