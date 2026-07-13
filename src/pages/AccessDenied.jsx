import { useAuth } from '../lib/auth'
import { S } from '../lib/ui'

export default function AccessDenied() {
  const { logout, profil } = useAuth()

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh', background: '#f4f6f9', fontFamily: 'Trebuchet MS, sans-serif', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, overflow: 'hidden', textAlign: 'center', padding: '40px 28px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 8 }}>Accès restreint</div>
        <div style={{ fontSize: 13, color: '#5a6480', lineHeight: 1.6, marginBottom: 20 }}>
          Bienvenue <strong>{profil?.nom_affiche || profil?.email}</strong>.<br />
          Votre compte n'a pas encore été activé par un administrateur pour accéder aux données pastorales.<br /><br />
          Contactez le Berger principal pour obtenir l'accès.
        </div>
        <button onClick={logout} style={S.btn('#8892a8', true)}>Se déconnecter</button>
      </div>
    </div>
  )
}
