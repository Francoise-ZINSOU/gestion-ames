import { S, fmtS, dago, today, getStatutColor } from '../lib/ui'
import { AlertTriangle, Clock, BookOpen, CheckSquare } from 'lucide-react'

export default function HomePage({ actifs, alertes, presences, defis, plans, refs, h, openFiche, setPage }) {
  // KPIs par statut — dynamiques basés sur les refs actifs
  const statutCounts = {}
  ;(refs.statuts || []).filter(s => !s.est_archive).forEach(s => {
    statutCounts[s.nom] = { count: actifs.filter(m => m.statut === s.nom).length, couleur: s.couleur, ordre: s.ordre }
  })
  const kpiStatuts = Object.entries(statutCounts).filter(([, v]) => v.count > 0 || v.ordre <= 3).sort((a, b) => a[1].ordre - b[1].ordre)

  // Culte (utilisé pour taux et rappel)
  const culte = h.culteId ? { id: h.culteId } : null

  // Rappel présences : dernier dimanche saisi ?
  const lastSunday = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10)
  })()
  const lastSundaySaved = culte ? presences.some(p => p.activite_id === culte.id && p.date_presence === lastSunday) : true

  // Taux culte global (moyenne des taux individuels, chaque âme compte)
  let tG = 0
  if (culte) {
    const membresAvecTaux = actifs.map(m => {
      const ps = presences.filter(p => p.membre_id === m.id && p.activite_id === culte.id && p.eligible)
      if (!ps.length) return null
      return Math.round(ps.filter(p => p.present).length / ps.length * 100)
    }).filter(t => t !== null)
    tG = membresAvecTaux.length ? Math.round(membresAvecTaux.reduce((s, t) => s + t, 0) / membresAvecTaux.length) : 0
  }

  const recent = actifs.filter(m => { const d = dago(m.date_inscription); return d !== null && d <= 30 })
    .sort((a, b) => new Date(b.date_inscription || 0) - new Date(a.date_inscription || 0)).slice(0, 8)

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={S.kpi('#0ea888')}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8892a8', marginBottom: 6 }}>Total actifs</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#0ea888' }}>{actifs.length}</div></div>
        {kpiStatuts.map(([nom, { count, couleur }]) => (
          <div key={nom} style={S.kpi(couleur)}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8892a8', marginBottom: 6 }}>{nom}</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia, serif', color: couleur }}>{count}</div></div>
        ))}
        <div style={S.kpi(tG >= 80 ? '#1a9c60' : tG >= 50 ? '#d48f00' : '#e03050')}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8892a8', marginBottom: 6 }}>Taux culte</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia, serif', color: tG >= 80 ? '#1a9c60' : tG >= 50 ? '#d48f00' : '#e03050' }}>{tG}%</div></div>
      </div>

      {!lastSundaySaved && (
        <div onClick={() => setPage('pres')} style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #3060d033', background: '#3060d008', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckSquare size={14} color="#3060d0" />
          <span style={{ fontSize: 12, color: '#3060d0' }}>Les présences du <strong>dimanche {fmtS(lastSunday)}</strong> n'ont pas été saisies</span>
          <span style={{ fontSize: 11, color: '#0ea888', marginLeft: 'auto', textDecoration: 'underline' }}>Saisir</span>
        </div>
      )}

      {alertes.length > 0 && (
        <div onClick={() => setPage('alerts')} style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #e0305033', background: '#e0305008', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} color="#e03050" />
          <strong style={{ color: '#e03050', fontSize: 12 }}>{alertes.length} alerte(s)</strong>
          <span style={{ fontSize: 11, color: '#0ea888', marginLeft: 'auto', textDecoration: 'underline' }}>Voir</span>
        </div>
      )}

      {(() => {
        const staleNouveau = actifs.filter(m => m.statut === h.defaultStatut && dago(m.date_inscription) > 90)
        const defisSansModule = defis.filter(d => !h.isStatutFinal(d.statut) && !plans.some(p => p.defi_id === d.id))
        if (!staleNouveau.length && !defisSansModule.length) return null
        return (
          <div style={{ marginBottom: 14 }}>
            {staleNouveau.length > 0 && (
              <div style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #d48f0033', background: '#d48f0008', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="#d48f00" />
                <span style={{ fontSize: 12, color: '#d48f00' }}><strong>{staleNouveau.length}</strong> membre(s) "Nouveau" depuis + de 3 mois — penser à mettre à jour leur statut</span>
              </div>
            )}
            {defisSansModule.length > 0 && (
              <div style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #7040d033', background: '#7040d008', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} color="#7040d0" />
                <span style={{ fontSize: 12, color: '#7040d0' }}><strong>{defisSansModule.length}</strong> défi(s) sans module de croissance assigné</span>
              </div>
            )}
          </div>
        )
      })()}

      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Inscriptions récentes</div>
        {recent.length === 0
          ? <div style={{ color: '#8892a8', fontSize: 12 }}>Aucune inscription récente.</div>
          : recent.map(m => (
            <div key={m.id} onClick={() => openFiche(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid #e0e4ec', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}><span style={{ fontSize: 11, fontWeight: 600 }}>{m.prenom} {m.nom}</span></div>
              <span style={{ fontSize: 10, color: '#8892a8' }}>{fmtS(m.date_inscription)}</span>
              <span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}
