import { useAuth } from '../lib/auth'
import { S } from '../lib/ui'

export default function AccessDenied() {
  const { logout, profil } = useAuth()

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100dvh', background: '#F5F3EE', fontFamily: 'DM Sans, sans-serif', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, overflow: 'hidden', textAlign: 'center', padding: '40px 28px', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Accès en attente</div>
        <div style={{ fontSize: 14, color: '#5E7175', lineHeight: 1.7, marginBottom: 20 }}>
          Bienvenue <strong>{profil?.nom_affiche || profil?.email}</strong> !<br />
          Votre compte existe mais n'a pas encore été activé.
        </div>

        <div style={{ textAlign: 'left', padding: '14px 16px', background: '#2E7D8A08', border: '1px solid #2E7D8A33', borderRadius: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2E7D8A', marginBottom: 8 }}>Comment obtenir l'accès ?</div>
          <div style={{ fontSize: 13, color: '#5E7175', lineHeight: 1.7 }}>
            Demandez à votre administrateur d'aller dans :<br />
            <strong>Paramètres → Utilisateurs</strong><br />
            puis de cocher <strong>"Responsable"</strong> à côté de votre nom.
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#5E7175', marginBottom: 16 }}>
          Une fois activé, rafraîchissez cette page.
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => window.location.reload()} style={S.btn('#2E7D8A', false)}>Rafraîchir</button>
          <button onClick={logout} style={S.btn('#5E7175', true)}>Se déconnecter</button>
        </div>
      </div>
    </div>
  )
}
