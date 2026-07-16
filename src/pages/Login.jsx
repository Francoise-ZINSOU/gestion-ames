import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { S } from '../lib/ui'

export default function LoginPage() {
  const { login } = useAuth()
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

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100dvh', background: '#f4f6f9', fontFamily: 'DM Sans, sans-serif', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #e0e4ec', textAlign: 'center' }}>
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#0ea888', fontWeight: 700, marginBottom: 6 }}>LES ENRACINÉES</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Gestion des Âmes</div>
          <div style={{ fontSize: 12, color: '#5a6480' }}>Connectez-vous pour continuer</div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 28px 24px' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.inp} required autoComplete="email" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={S.inp} minLength={6} required autoComplete="current-password" />
          </div>

          {error && <div style={{ padding: '8px 12px', borderRadius: 6, background: '#e0305010', color: '#e03050', fontSize: 12, marginBottom: 12 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ ...S.btn('#0ea888', false), width: '100%', padding: '10px 14px', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#6b7280' }}>
            Accès réservé aux responsables.<br />Contactez l'administrateur pour obtenir un compte.
          </div>
        </form>
      </div>
    </div>
  )
}
