import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  useEffect(() => {
    let active = true
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session check timed out')), 8000))
    Promise.race([api('/api/auth/me'), timeout]).then(({ user }) => {
      if (!active) return
      setProfile(user)
      setSession({ user })
      setAuthError('')
    }).catch(() => {
      if (!active) return
      setProfile(null)
      setSession(null)
      setAuthError('')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])
  const signIn = async (email, password) => {
    try {
      const { user } = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      setProfile(user)
      setSession({ user })
      setAuthError('')
      setLoading(false)
      return {}
    } catch (error) {
      setAuthError(error.message)
      return { error }
    }
  }
  const signOut = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST', body: '{}' })
    } finally {
      setProfile(null)
      setSession(null)
      setAuthError('')
      setLoading(false)
    }
  }
  const isActive = !!profile?.is_active
  const isAdmin = isActive && profile?.role === 'admin'
  return <Ctx.Provider value={{ session, profile, loading, authError, signIn, signOut, isActive, isAdmin }}>{children}</Ctx.Provider>
}
