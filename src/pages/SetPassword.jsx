import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { S } from '../lib/ui'

export default function SetPasswordPage({ onDone, profil }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      onDone()
    } catch (e) {
      setError(e.message || 'Erreur lors de la mise à jour')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100dvh', background: '#f4f6f9', fontFamily: 'DM Sans, sans-serif', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #e0e4ec', textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#0ea888', fontWeight: 700, marginBottom: 6 }}>LES ENRACINÉES</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Bienvenue !</div>
          <div style={{ fontSize: 13, color: '#5a6480' }}>
            {profil?.nom_affiche || profil?.email}, définissez votre mot de passe pour accéder à l'application.
          </div>
        </div>

        <div style={{ padding: '20px 28px 24px' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Nouveau mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={S.inp} minLength={6} placeholder="6 caractères minimum" autoComplete="new-password" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Confirmer le mot de passe</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={S.inp} placeholder="Retapez votre mot de passe" autoComplete="new-password"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {error && <div style={{ padding: '8px 12px', borderRadius: 6, background: '#e0305010', color: '#e03050', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading} style={{ ...S.btn('#0ea888', false), width: '100%', padding: '10px 14px', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Enregistrement...' : 'Définir mon mot de passe'}
          </button>
        </div>
      </div>
    </div>
  )
}
