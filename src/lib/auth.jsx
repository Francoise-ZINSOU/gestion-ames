import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfil(session.user.id)
      else setLoading(false)
    })
    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfil(session.user.id)
      else { setProfil(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfil(userId) {
    const { data, error } = await supabase
      .from('profils')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfil(data)
    setLoading(false)
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signup(email, password, nomAffiche) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom_affiche: nomAffiche } }
    })
    return { error }
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setProfil(null)
  }

  const value = {
    session,
    profil,
    loading,
    login,
    signup,
    logout,
    isAdmin: profil?.est_admin === true,
    isResponsable: profil?.est_responsable === true || profil?.est_admin === true,
    reloadProfil: () => session && loadProfil(session.user.id)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
