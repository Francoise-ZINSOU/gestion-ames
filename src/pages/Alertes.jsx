import { S } from '../lib/ui'
import { AlertTriangle } from 'lucide-react'

export default function AlertesPage({ alertes, membres, openFiche }) {
  const getSuiveur = (id) => { if (!id) return 'Non assigné'; const m = membres.find(x => x.id === id); return m ? m.prenom + ' ' + m.nom : 'Non assigné' }

  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Âmes nécessitant attention ({alertes.length})</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>Score = absences (3pts) + sans entretien (2pts) + défis ouverts (1pt)</div>
      {alertes.length === 0 ? <div style={{ padding: 12, textAlign: 'center', color: '#1a9c60', fontSize: 12 }}>✓ Tout est à jour !</div>
        : alertes.map(a => {
          const details = []
          if (a.absences >= 3) details.push({ label: a.absences + ' abs. consécutives', pts: 3, color: '#e03050' })
          if (a.jours_sans_entretien > 21) details.push({ label: (a.jours_sans_entretien < 30 ? a.jours_sans_entretien + 'j' : a.jours_sans_entretien < 365 ? Math.floor(a.jours_sans_entretien / 30) + ' mois' : Math.floor(a.jours_sans_entretien / 365) + ' an(s)') + ' sans entretien', pts: 2, color: '#d86820' })
          if (a.defis_ouverts > 0) details.push({ label: a.defis_ouverts + ' défi(s) ouvert(s)', pts: 1, color: '#7040d0' })
          return (
            <div key={a.membre_id} onClick={() => openFiche(a.membre_id)} style={{ padding: '10px 8px', borderBottom: '1px solid #e0e4ec', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.score_severite >= 4 ? '#e030501a' : '#d868201a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: a.score_severite >= 4 ? '#e03050' : '#d86820', fontWeight: 700, flexShrink: 0 }}>{a.score_severite}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0ea888' }}>{a.nom_complet}</div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>suivi par {getSuiveur(a.suivi_par)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginLeft: 36 }}>
                {details.map((d, i) => (
                  <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: d.color + '14', color: d.color, fontWeight: 500 }}>
                    {d.label} (+{d.pts})
                  </span>
                ))}
              </div>
            </div>
          )
        })}
    </div>
  )
}
