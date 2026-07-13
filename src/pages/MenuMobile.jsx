import { S } from '../lib/ui'
import { Home, CheckSquare, TrendingUp, Users, GitBranch, Bell, MessageCircle, BookOpen, Download, Settings } from 'lucide-react'

export default function MenuMobile({ setPage, isAdmin }) {
  const items = [
    { id: 'home', Icon: Home, label: 'Accueil' },
    { id: 'pres', Icon: CheckSquare, label: 'Saisie' },
    { id: 'timeline', Icon: TrendingUp, label: 'Historique' },
    { id: 'ames', Icon: Users, label: 'Âmes' },
    { id: 'filia', Icon: GitBranch, label: 'Arbre de suivi' },
    { id: 'alerts', Icon: Bell, label: 'Alertes' },
    { id: 'ents', Icon: MessageCircle, label: 'Entretiens' },
    { id: 'protos', Icon: BookOpen, label: 'Plan de croissance' },
    { id: 'export', Icon: Download, label: 'Export' },
  ]
  if (isAdmin) items.push({ id: 'params', Icon: Settings, label: 'Paramètres' })

  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Menu</div>
      {items.map(({ id, Icon, label }) => (
        <div key={id} onClick={() => setPage(id)} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
          borderBottom: '1px solid #e0e4ec', cursor: 'pointer'
        }}>
          <Icon size={18} strokeWidth={1.8} color="#5a6480" />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
