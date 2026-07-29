import { S } from '../lib/ui'

const APP_VERSION = 'v1.0.0'
import { useAuth } from '../lib/auth'
import { Home, CheckSquare, TrendingUp, Users, GitBranch, Bell, MessageCircle, BookOpen, Download, Settings, LogOut, Search, Building2, FileText } from 'lucide-react'

export default function MenuMobile({ setPage, isAdmin, selectedMembre, auth }) {
  const { logout, profil } = useAuth()

  const items = [
    { id: 'home', Icon: Home, label: 'Accueil' },
    { id: 'pres', Icon: CheckSquare, label: 'Présences' },
    { id: 'timeline', Icon: TrendingUp, label: 'Historique' },
    { id: 'ames', Icon: Users, label: 'Membres' },
    { id: 'filia', Icon: GitBranch, label: 'Organisation' },
    { id: 'alerts', Icon: Bell, label: 'Alertes' },
    { id: 'ents', Icon: MessageCircle, label: 'Entretiens' },
    { id: 'protos', Icon: BookOpen, label: 'Parcours de formation' },
    { id: 'rapport', Icon: FileText, label: 'Rapport mensuel' },
    { id: 'export', Icon: Download, label: 'Export & sauvegarde' },
  ]
  if (auth?.isBergerEglise || isAdmin) items.push({ id: 'vueEglise', Icon: Building2, label: 'Synthèse église' })
  if (isAdmin) items.push({ id: 'params', Icon: Settings, label: 'Paramètres' })

  return (
    <div>
      {selectedMembre && (
        <div style={{ ...S.card, marginBottom: 10 }}>
          <div onClick={() => setPage('fiche')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', cursor: 'pointer' }}>
            <Search size={18} strokeWidth={1.8} color="#185FA5" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#185FA5' }}>Fiche — {selectedMembre.prenom} {selectedMembre.nom}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>Dernière fiche consultée</div>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Menu</div>
        {items.map(({ id, Icon, label }) => (
          <div key={id} onClick={() => setPage(id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
            borderBottom: '1px solid #E2E8F0', cursor: 'pointer'
          }}>
            <Icon size={18} strokeWidth={1.8} color="#475569" />
            <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginTop: 10 }}>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>{profil?.nom_affiche || profil?.email}</div>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #E11D48', borderRadius: 7, padding: '8px 14px', color: '#E11D48', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
          <LogOut size={14} /> Se déconnecter
        </button>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#CBD5E1', marginTop: 8 }}>{APP_VERSION}</div>
      </div>
    </div>
  )
}
