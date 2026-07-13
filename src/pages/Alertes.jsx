import { S } from '../lib/ui'

export default function AlertesPage({ alertes, membres, openFiche }) {
  const getSuiveur = (id) => { if (!id) return 'Non assigné'; const m = membres.find(x => x.id === id); return m ? m.prenom + ' ' + m.nom : 'Non assigné' }

  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Âmes nécessitant attention ({alertes.length})</div>
      {alertes.length === 0 ? <div style={{ padding: 12, textAlign: 'center', color: '#1a9c60', fontSize: 12 }}>✓ Tout est à jour !</div>
        : alertes.map(a => (
          <div key={a.membre_id} onClick={() => openFiche(a.membre_id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid #e0e4ec', cursor: 'pointer' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: a.score_severite >= 4 ? '#e030501a' : '#d868201a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: a.score_severite >= 4 ? '#e03050' : '#d86820', fontWeight: 700 }}>{a.score_severite}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{a.nom_complet}</div>
              <div style={{ fontSize: 10, color: '#8892a8' }}>{getSuiveur(a.suivi_par)}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {a.absences >= 3 && <span style={S.pill('#e03050')}>{a.absences} abs.</span>}
              {a.jours_sans_entretien > 21 && <span style={S.pill('#e03050')}>{a.jours_sans_entretien}j sans ent.</span>}
              {a.defis_ouverts > 0 && <span style={S.pill('#e03050')}>{a.defis_ouverts} défi(s)</span>}
            </div>
          </div>
        ))}
    </div>
  )
}
