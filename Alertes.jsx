import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsPassword, setNeedsPassword] = useState(false)
  const profilLoading = useRef(false)

  useEffect(() => {
    // Détecter si l'URL contient un token d'invitation (avant que Supabase le consomme)
    const hash = window.location.hash
    if (hash.includes('type=invite') || hash.includes('type=recovery') || hash.includes('type=magiclink')) {
      setNeedsPassword(true)
    }

    // Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadProfil(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      // Détecter l'arrivée via invitation ou reset password
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (hash.includes('type=invite') || hash.includes('type=recovery')) {
          setNeedsPassword(true)
        }
      }
      if (newSession) {
        if (!profilLoading.current) {
          setLoading(true)
          loadProfil(newSession.user.id)
        }
      } else {
        setProfil(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfil(userId) {
    profilLoading.current = true
    try {
      const { data } = await supabase
        .from('profils')
        .select('*, familles_disciples(nom, actif, eglises(nom, actif))')
        .eq('id', userId)
        .single()
      if (data) {
        // Flatten famille/église names for easy access
        data.famille_nom = data.familles_disciples?.nom || null
        data.eglise_nom = data.familles_disciples?.eglises?.nom || null
        setProfil(data)
      }
    } catch (e) {
      // Fallback: load without join if tables don't exist yet
      try {
        const { data } = await supabase.from('profils').select('*').eq('id', userId).single()
        if (data) setProfil(data)
      } catch (e2) { console.error('Erreur chargement profil:', e2) }
    }
    profilLoading.current = false
    setLoading(false)
  }

  async function login(email, password) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoading(false)
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
    needsPassword,
    clearNeedsPassword: () => { setNeedsPassword(false); window.location.hash = '' },
    isAdmin: profil?.est_admin === true,
    isResponsable: profil?.est_responsable === true || profil?.est_admin === true,
    isSuperAdmin: profil?.est_super_admin === true,
    isBergerEglise: profil?.est_berger_eglise === true,
    isFamilleActive: profil?.familles_disciples ? profil.familles_disciples.actif !== false && profil.familles_disciples.eglises?.actif !== false : true,
    reloadProfil: () => session && loadProfil(session.user.id)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
