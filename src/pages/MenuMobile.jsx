import { S } from '../lib/ui'

export default function MenuMobile({ setPage, isAdmin }) {
  const items = [
    { id: 'home', icon: '🏠', label: 'Accueil' },
    { id: 'pres', icon: '✅', label: 'Saisie' },
    { id: 'timeline', icon: '📈', label: 'Historique' },
    { id: 'ames', icon: '👥', label: 'Âmes' },
    { id: 'filia', icon: '🌳', label: 'Arbre de suivi' },
    { id: 'alerts', icon: '🔔', label: 'Alertes' },
    { id: 'ents', icon: '💬', label: 'Entretiens' },
    { id: 'protos', icon: '📖', label: 'Plan de croissance' },
    { id: 'export', icon: '💾', label: 'Export' },
  ]
  if (isAdmin) items.push({ id: 'params', icon: '⚙️', label: 'Paramètres' })

  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Menu</div>
      {items.map(item => (
        <div key={item.id} onClick={() => setPage(item.id)} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
          borderBottom: '1px solid #e0e4ec', cursor: 'pointer'
        }}>
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
