import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(undefined)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api('/api/auth/me').then(({ user }) => {
      setProfile(user)
      setSession({ user })
    }).catch(() => {
      setProfile(null)
      setSession(null)
    }).finally(() => setLoading(false))
  }, [])
  const signIn = async (email, password) => {
    try {
      const { user } = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      setProfile(user)
      setSession({ user })
      return {}
    } catch (error) {
      return { error }
    }
  }
  const signOut = async () => {
    await api('/api/auth/logout', { method: 'POST', body: '{}' })
    setProfile(null)
    setSession(null)
  }
  const isActive = !!profile?.is_active
  const isAdmin = isActive && profile?.role === 'admin'
  return <Ctx.Provider value={{ session, profile, loading, signIn, signOut, isActive, isAdmin }}>{children}</Ctx.Provider>
}
