import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const AUTH_TIMEOUT_MS = 8000

const withTimeout = async (promise, ms, label) => {
  let timeoutId

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timeout`)), ms)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRole = async (userId) => {
    if (!userId) {
      setRole(null)
      return false
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single(),
        AUTH_TIMEOUT_MS,
        'fetchRole'
      )

      if (error) {
        return false
      }

      setRole(data?.role ?? null)
      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    let isMounted = true
    const failsafeTimer = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, AUTH_TIMEOUT_MS + 2000)

    const initializeSession = async () => {
      if (isMounted) setLoading(true)

      try {
        const sessionResponse = await withTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT_MS,
          'getSession'
        )
        const session = sessionResponse?.data?.session ?? null
        const u = session?.user ?? null

        if (!isMounted) return

        setUser(u)

        if (!u) {
          setRole(null)
          return
        }

        await fetchRole(u.id)
      } catch {
        if (!isMounted) return
        // Mantener estado actual y solo finalizar loading.
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initializeSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        // Token refresh: solo actualizar usuario, sin re-fetch de rol
        if (event === 'TOKEN_REFRESHED') {
          const refreshedUser = session?.user ?? null
          setUser(refreshedUser)

          // Si llega token valido, resolver rol para evitar estado incompleto.
          if (refreshedUser) {
            try {
              await fetchRole(refreshedUser.id)
            } finally {
              if (isMounted) setLoading(false)
            }
          } else {
            if (isMounted) {
              setRole(null)
              setLoading(false)
            }
          }
          return
        }

        const u = session?.user ?? null
        setUser(u)

        if (!u) {
          setRole(null)
          setLoading(false)
          return
        }

        setLoading(true)

        try {
          await fetchRole(u.id)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(failsafeTimer)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const identifier = String(email || '').trim()
    if (!identifier || !password) {
      return { success: false, error: 'Usuario/correo y contraseña son requeridos' }
    }

    let emailToLogin = identifier.toLowerCase()

    // Si no parece email, intentar resolverlo desde profiles.username
    if (!identifier.includes('@')) {
      try {
        const normalizedUsername = identifier.toLowerCase()
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', normalizedUsername)
          .single()

        if (error || !data?.email) {
          return { success: false, error: 'Usuario no encontrado' }
        }

        emailToLogin = String(data.email).toLowerCase()
      } catch {
        return { success: false, error: 'No fue posible validar el usuario' }
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email: emailToLogin, password })
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
