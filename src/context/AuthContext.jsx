import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(undefined) // undefined = not loaded, null = no row
  const [loading, setLoading] = useState(true)
  const loadProfile = async uid => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(data ?? null)
  }
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) setProfile(undefined)
      else setTimeout(() => loadProfile(s.user.id), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()
  const isActive = !!profile?.is_active
  const isAdmin = isActive && profile?.role === 'admin'
  return <Ctx.Provider value={{ session, profile, loading, signIn, signOut, isActive, isAdmin }}>{children}</Ctx.Provider>
}
