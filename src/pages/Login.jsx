import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { S } from '../lib/ui'

export default function LoginPage() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await login(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signup(email, password, nom)
      if (error) setError(error.message)
      else setInfo('Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh', background: '#f4f6f9', fontFamily: 'Trebuchet MS, Gill Sans, Calibri, sans-serif', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #e0e4ec', textAlign: 'center' }}>
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#0ea888', fontWeight: 700, marginBottom: 6 }}>Gestion Pastorale</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 4 }}>Suivi des Âmes</div>
          <div style={{ fontSize: 12, color: '#5a6480' }}>{mode === 'login' ? 'Connectez-vous pour continuer' : 'Créer un compte'}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 28px 24px' }}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Nom affiché</label>
              <input value={nom} onChange={e => setNom(e.target.value)} style={S.inp} placeholder="Ex: Pasteur Kouadio" required />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.inp} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={S.inp} minLength={6} required />
          </div>

          {error && <div style={{ padding: '8px 12px', borderRadius: 6, background: '#e0305010', color: '#e03050', fontSize: 12, marginBottom: 12 }}>{error}</div>}
          {info && <div style={{ padding: '8px 12px', borderRadius: 6, background: '#1a9c6010', color: '#1a9c60', fontSize: 12, marginBottom: 12 }}>{info}</div>}

          <button type="submit" disabled={loading} style={{ ...S.btn('#0ea888', false), width: '100%', padding: '10px 14px', opacity: loading ? 0.6 : 1 }}>
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}
              style={{ background: 'none', border: 'none', color: '#0ea888', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
