import { S, fmtS } from '../lib/ui'

export default function EntretiensPage({ entretiens, membres, refs, openFiche }) {
  const all = entretiens.map(e => {
    const m = membres.find(x => x.id === e.membre_id)
    const sujet = e.sujet_libre || (refs.sujetsEntretien || []).find(s => s.id === e.sujet_id)?.nom || ''
    const avecM = membres.find(x => x.id === e.avec_qui)
    return m ? { ...e, mn: m.prenom + ' ' + m.nom, sujet, avecNom: avecM ? avecM.prenom + ' ' + avecM.nom : '—' } : null
  }).filter(Boolean)

  const stColor = (s) => (refs.statutsEntretien || []).find(x => x.nom === s)?.couleur || '#8892a8'

  return (
    <div style={S.card}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tous les entretiens ({all.length})</div>
      {all.length === 0 ? <div style={{ padding: 12, textAlign: 'center', color: '#8892a8', fontSize: 12 }}>Aucun entretien enregistré.</div>
        : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Date', 'Âme', 'Avec qui', 'Sujet', 'Statut'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{all.slice(0, 50).map(e => (
            <tr key={e.id} onClick={() => openFiche(e.membre_id)} style={{ cursor: 'pointer' }}>
              <td style={{ ...S.td, color: '#5a6480' }}>{fmtS(e.date_entretien)}</td>
              <td style={{ ...S.td, fontWeight: 600, color: '#0ea888' }}>{e.mn}</td>
              <td style={{ ...S.td, color: '#5a6480' }}>{e.avecNom}</td>
              <td style={S.td}>{e.sujet}</td>
              <td style={S.td}><span style={S.pill(stColor(e.statut))}>{e.statut}</span></td>
            </tr>
          ))}</tbody>
        </table>}
    </div>
  )
}
