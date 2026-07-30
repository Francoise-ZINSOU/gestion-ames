import { S } from '../lib/ui'
import { useAuth } from '../lib/auth'
import { LogOut } from 'lucide-react'

export default function NoFamillePage() {
  const { logout, profil } = useAuth()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100dvh', background: '#f4f6f9', fontFamily: 'DM Sans, sans-serif', padding: '60px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.06)', textAlign: 'center', padding: '32px 28px' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⛪</div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Aucune famille assignée</div>
        <div style={{ fontSize: 14, color: '#5a6480', lineHeight: 1.6, marginBottom: 20 }}>
          Votre compte <strong>{profil?.email}</strong> n'est pas encore rattaché à une famille de disciples. Contactez l'administrateur pour qu'il vous assigne à une famille dans les Paramètres.
        </div>
        <button onClick={logout} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #e03050', borderRadius: 7, padding: '8px 16px', color: '#e03050', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <LogOut size={14} /> Se déconnecter
        </button>
      </div>
    </div>
  )
}
