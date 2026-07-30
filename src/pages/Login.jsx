import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { S } from '../lib/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'sent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await login(email, password)
    if (error) setError('Email ou mot de passe incorrect')
    setLoading(false)
  }

  async function handleForgot(e) {
    e.preventDefault()
    if (!email) { setError('Entrez votre email'); return }
    setError(''); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    setLoading(false)
    if (error) setError('Erreur : ' + error.message)
    else setMode('sent')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100dvh', background: '#f4f6f9', fontFamily: 'DM Sans, sans-serif', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #e0e4ec', textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#0ea888', fontWeight: 700, marginBottom: 6 }}>LES ENRACINÉES</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Gestion des Âmes</div>
          <div style={{ fontSize: 13, color: '#5a6480' }}>
            {mode === 'login' && 'Connectez-vous pour continuer'}
            {mode === 'forgot' && 'Réinitialisation du mot de passe'}
            {mode === 'sent' && '✓ Email envoyé'}
          </div>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleSubmit} style={{ padding: '20px 28px 24px' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.inp} required autoComplete="email" />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={S.label}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={S.inp} minLength={6} required autoComplete="current-password" />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 12 }}>
              <button type="button" onClick={() => { setMode('forgot'); setError('') }} style={{ background: 'none', border: 'none', fontSize: 12, color: '#3060d0', cursor: 'pointer', padding: 0 }}>Mot de passe oublié ?</button>
            </div>

            {error && <div style={{ padding: '8px 12px', borderRadius: 6, background: '#e0305010', color: '#e03050', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ ...S.btn('#0ea888', false), width: '100%', padding: '10px 14px', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6b7280' }}>
              Accès réservé aux responsables.<br />Contactez l'administrateur pour obtenir un compte.<br /><a href="#cgu" style={{ color: '#6b7280', fontSize: 11 }}>Conditions d'utilisation</a>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} style={{ padding: '20px 28px 24px' }}>
            <div style={{ fontSize: 13, color: '#5a6480', marginBottom: 14, lineHeight: 1.6 }}>
              Entrez l'email associé à votre compte. Vous recevrez un lien pour réinitialiser votre mot de passe.
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.inp} required autoComplete="email" />
            </div>

            {error && <div style={{ padding: '8px 12px', borderRadius: 6, background: '#e0305010', color: '#e03050', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ ...S.btn('#0ea888', false), width: '100%', padding: '10px 14px', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button type="button" onClick={() => { setMode('login'); setError('') }} style={{ background: 'none', border: 'none', fontSize: 12, color: '#5a6480', cursor: 'pointer', padding: 0 }}>← Retour à la connexion</button>
            </div>
          </form>
        )}

        {mode === 'sent' && (
          <div style={{ padding: '20px 28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <div style={{ fontSize: 14, color: '#5a6480', marginBottom: 16, lineHeight: 1.6 }}>
              Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
              Vérifiez votre boîte de réception (et vos spams).
            </div>
            <button onClick={() => { setMode('login'); setEmail(''); setPassword('') }} style={{ ...S.btn('#0ea888', true), width: '100%' }}>Retour à la connexion</button>
          </div>
        )}
      </div>
    </div>
  )
}
