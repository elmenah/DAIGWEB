import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const AUTH_TIMEOUT_MS = 8000

const isAuthDebugEnabled = () => {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('authDebug') === '1'
}

const authDebugLog = (...args) => {
  if (isAuthDebugEnabled()) {
    console.info('[AUTH_DEBUG]', ...args)
  }
}

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
  const [hasHydratedSession, setHasHydratedSession] = useState(false)
  const userRef = useRef(user)
  const roleRef = useRef(role)

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    roleRef.current = role
  }, [role])

  const fetchRole = async (userId) => {
    if (!userId) {
      setRole(null)
      return false
    }

    try {
      authDebugLog('fetchRole:start', { userId })
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
        authDebugLog('fetchRole:error', { userId, message: error.message })
        return false
      }

      setRole(data?.role ?? null)
      authDebugLog('fetchRole:ok', { userId, role: data?.role ?? null })
      return true
    } catch {
      authDebugLog('fetchRole:exception', { userId })
      return false
    }
  }

  useEffect(() => {
    let isMounted = true
    const clearAuthState = () => {
      setUser(null)
      setRole(null)
      setLoading(false)
    }

    const failsafeTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false)
        authDebugLog('failsafeTimer:loading-false-without-hydration')
      }
    }, AUTH_TIMEOUT_MS + 2000)

    const initializeSession = async () => {
      if (isMounted) setLoading(true)

      try {
        authDebugLog('initializeSession:start')
        const sessionResponse = await withTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT_MS,
          'getSession'
        )
        const session = sessionResponse?.data?.session ?? null
        const u = session?.user ?? null

        if (!isMounted) return

        setUser(u)
        authDebugLog('initializeSession:user', { hasUser: !!u, userId: u?.id ?? null })

        if (!u) {
          setRole(null)
          return
        }

        await fetchRole(u.id)
      } catch {
        if (!isMounted) return
        authDebugLog('initializeSession:exception')
        // Mantener estado actual y solo finalizar loading.
      } finally {
        authDebugLog('initializeSession:done')
        if (isMounted) {
          setLoading(false)
          setHasHydratedSession(true)
        }
      }
    }

    initializeSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        setHasHydratedSession(true)

        authDebugLog('onAuthStateChange', {
          event,
          hasUser: !!session?.user,
          userId: session?.user?.id ?? null,
        })

        // Token refresh: solo actualizar usuario, sin re-fetch de rol
        if (event === 'TOKEN_REFRESHED') {
          const refreshedUser = session?.user ?? null
          setUser(refreshedUser)

          // Si llega token valido y ya tenemos rol, no bloquear UI con spinner.
          if (refreshedUser) {
            const sameUser = userRef.current?.id === refreshedUser.id

            if (!roleRef.current || !sameUser) {
              setLoading(true)
              try {
                await fetchRole(refreshedUser.id)
              } finally {
                if (isMounted) setLoading(false)
              }
            } else {
              authDebugLog('tokenRefresh:skip-role-fetch', { userId: refreshedUser.id })
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
          // Al volver al foco, algunos navegadores pueden emitir eventos
          // transitorios sin sesion. Confirmamos antes de limpiar auth.
          if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            clearAuthState()
            return
          }

          setLoading(true)

          try {
            const sessionResponse = await withTimeout(
              supabase.auth.getSession(),
              AUTH_TIMEOUT_MS,
              'confirmSessionAfterNullEvent'
            )

            const confirmedUser = sessionResponse?.data?.session?.user ?? null

            authDebugLog('confirmSessionAfterNullEvent', {
              event,
              hasUser: !!confirmedUser,
              userId: confirmedUser?.id ?? null,
            })

            if (!confirmedUser) {
              clearAuthState()
              return
            }

            setUser(confirmedUser)
            await fetchRole(confirmedUser.id)
          } catch {
            authDebugLog('confirmSessionAfterNullEvent:exception', { event })
            // Mantener estado actual para no expulsar al usuario por falsos nulos.
          } finally {
            if (isMounted) setLoading(false)
          }

          return
        }

        const sameUser = userRef.current?.id === u.id
        if (sameUser && roleRef.current) {
          authDebugLog('authEvent:skip-role-fetch', { event, userId: u.id })
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
    authDebugLog('login:result', { success: !error, message: error?.message ?? null })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const logout = async () => {
    authDebugLog('logout:start')
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    authDebugLog('logout:done')
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, loading, hasHydratedSession, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
