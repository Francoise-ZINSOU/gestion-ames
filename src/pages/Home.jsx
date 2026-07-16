import { useState } from 'react'
import { S, fmtS, dago, today, getStatutColor } from '../lib/ui'
import { AlertTriangle, Clock, BookOpen, CheckSquare, TrendingDown } from 'lucide-react'

export default function HomePage({ actifs, alertes, presences, defis, plans, refs, h, openFiche, setPage, datesAnnulees }) {
  const [showNotifs, setShowNotifs] = useState(true)

  // KPIs par statut — dynamiques basés sur les refs actifs
  const statutCounts = {}
  ;(refs.statuts || []).filter(s => !s.est_archive).forEach(s => {
    statutCounts[s.nom] = { count: actifs.filter(m => m.statut === s.nom).length, couleur: s.couleur, ordre: s.ordre }
  })
  const kpiStatuts = Object.entries(statutCounts).filter(([, v]) => v.count > 0 || v.ordre <= 3).sort((a, b) => a[1].ordre - b[1].ordre)

  // Culte (utilisé pour taux et rappel)
  const culte = h.culteId ? { id: h.culteId } : null
  const cancelledCulteDates = new Set(culte ? (datesAnnulees || []).filter(d => d.activite_id === culte.id).map(d => d.date_annulee) : [])

  // Dimanches de culte manquants dans les 30 derniers jours (activité récurrente)
  const culteActivite = (refs.activites || []).find(a => a.code === 'culte')
  const missingCulteDates = (() => {
    if (!culteActivite || !culteActivite.est_recurrente || culteActivite.jour_semaine === null || culteActivite.jour_semaine === undefined) return []
    const nowD = new Date()
    const saved = new Set(presences.filter(p => p.activite_id === culteActivite.id).map(p => p.date_presence))
    const missing = []
    const cur = new Date(nowD); cur.setDate(cur.getDate() - 30)
    while (cur <= nowD) {
      if (cur.getDay() === culteActivite.jour_semaine) {
        const dStr = cur.toISOString().slice(0, 10)
        if (!saved.has(dStr) && !cancelledCulteDates.has(dStr) && dStr <= nowD.toISOString().slice(0, 10)) {
          missing.push(dStr)
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
    return missing
  })()

  // Rappel présences : dernier dimanche saisi ?
  const lastSunday = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10)
  })()
  const lastSundaySaved = culte ? presences.some(p => p.activite_id === culte.id && p.date_presence === lastSunday) : true

  // Taux culte global (moyenne des taux individuels, chaque âme compte)
  let tG = 0
  if (culte) {
    const membresAvecTaux = actifs.map(m => {
      const ps = presences.filter(p => p.membre_id === m.id && p.activite_id === culte.id && p.eligible && !cancelledCulteDates.has(p.date_presence))
      if (!ps.length) return null
      return Math.round(ps.filter(p => p.present).length / ps.length * 100)
    }).filter(t => t !== null)
    tG = membresAvecTaux.length ? Math.round(membresAvecTaux.reduce((s, t) => s + t, 0) / membresAvecTaux.length) : 0
  }

  const recent = actifs.filter(m => { const d = dago(m.date_inscription); return d !== null && d <= 30 })
    .sort((a, b) => new Date(b.date_inscription || 0) - new Date(a.date_inscription || 0)).slice(0, 8)

  return (
    <div>
      {actifs.length === 0 && (
        <div style={{ ...S.card, marginBottom: 16, border: '1px solid #0ea88833', background: '#0ea88808' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#0ea888' }}>Bienvenue dans Gestion des Âmes</div>
          <div style={{ fontSize: 12, color: '#5a6480', lineHeight: 1.7 }}>
            Pour commencer :<br/>
            <strong>1.</strong> Ajoutez vos membres dans <span onClick={() => setPage('ames')} style={{ color: '#0ea888', cursor: 'pointer', textDecoration: 'underline' }}>Âmes</span><br/>
            <strong>2.</strong> Saisissez les présences dans <span onClick={() => setPage('pres')} style={{ color: '#0ea888', cursor: 'pointer', textDecoration: 'underline' }}>Saisie</span><br/>
            <strong>3.</strong> Planifiez des entretiens dans les fiches membres
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={S.kpi('#0ea888')}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>Total actifs</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#0ea888' }}>{actifs.length}</div></div>
        {kpiStatuts.map(([nom, { count, couleur }]) => (
          <div key={nom} onClick={() => setPage('ames')} style={{ ...S.kpi(couleur), cursor: 'pointer' }}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>{nom}</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: couleur }}>{count}</div></div>
        ))}
        <div style={S.kpi(tG >= 80 ? '#1a9c60' : tG >= 50 ? '#d48f00' : '#e03050')}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>Taux culte</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: tG >= 80 ? '#1a9c60' : tG >= 50 ? '#d48f00' : '#e03050' }}>{tG}%</div></div>
      </div>

      {!lastSundaySaved && (
        <div onClick={() => setPage('pres')} style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #3060d033', background: '#3060d008', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckSquare size={14} color="#3060d0" />
          <span style={{ fontSize: 12, color: '#3060d0' }}>Les présences du <strong>dimanche {fmtS(lastSunday)}</strong> n'ont pas été saisies</span>
          <span style={{ fontSize: 11, color: '#0ea888', marginLeft: 'auto', textDecoration: 'underline' }}>Saisir</span>
        </div>
      )}

      {(() => {
        // Anniversaires cette semaine
        const now = new Date()
        const thisWeekBdays = actifs.filter(m => {
          if (!m.date_naissance) return false
          const bd = new Date(m.date_naissance)
          const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate())
          const diff = (thisYear - now) / 864e5
          return diff >= -1 && diff <= 6
        })

        const staleNouveau = actifs.filter(m => m.statut === h.defaultStatut && dago(m.date_inscription) > 90)
        const defisSansModule = defis.filter(d => !h.isStatutFinal(d.statut) && !plans.some(p => p.defi_id === d.id))
        const declining = culte ? actifs.filter(m => {
          const ps = presences.filter(p => p.membre_id === m.id && p.activite_id === culte.id && p.eligible && !cancelledCulteDates.has(p.date_presence)).sort((a, b) => new Date(b.date_presence) - new Date(a.date_presence))
          if (ps.length < 6) return false
          const recent4 = ps.slice(0, 4).filter(p => p.present).length
          const prev4 = ps.slice(4, 8).filter(p => p.present).length
          return prev4 >= 3 && recent4 <= 1
        }) : []

        const totalNotif = alertes.length + thisWeekBdays.length + staleNouveau.length + declining.length + defisSansModule.length + missingCulteDates.length
        if (totalNotif === 0) return null

        return (
          <div style={{ marginBottom: 14, border: '1px solid #e0e4ec', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
            <div onClick={() => setShowNotifs(!showNotifs)} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: '#f4f6f9' }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              <strong style={{ fontSize: 13 }}>{totalNotif} notification(s)</strong>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>{showNotifs ? '▲' : '▼'}</span>
            </div>
            {showNotifs && (
              <div style={{ padding: '4px 14px 10px' }}>
                {missingCulteDates.length > 0 && (
                  <div onClick={() => setPage('pres')} style={{ padding: '8px 10px', borderRadius: 6, background: '#e0305008', borderLeft: '3px solid #e03050', marginTop: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} color="#e03050" />
                    <span style={{ fontSize: 12, color: '#e03050' }}><strong>{missingCulteDates.length}</strong> culte(s) non saisi(s) sur les 30 derniers jours</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#0ea888' }}>Saisir →</span>
                  </div>
                )}
                {alertes.length > 0 && (
                  <div onClick={() => setPage('alerts')} style={{ padding: '8px 10px', borderRadius: 6, background: '#e0305008', borderLeft: '3px solid #e03050', marginTop: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} color="#e03050" />
                    <span style={{ fontSize: 12, color: '#e03050' }}><strong>{alertes.length}</strong> alerte(s) de suivi</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#0ea888' }}>Voir →</span>
                  </div>
                )}
                {thisWeekBdays.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#FFD70008', borderLeft: '3px solid #FFD700', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13 }}>🎂</span>
                    <span style={{ fontSize: 12, color: '#8B6914' }}><strong>{thisWeekBdays.length}</strong> anniversaire(s) : {thisWeekBdays.map(m => m.prenom).join(', ')}</span>
                  </div>
                )}
                {declining.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#e0305008', borderLeft: '3px solid #e03050', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingDown size={13} color="#e03050" />
                    <span style={{ fontSize: 12, color: '#e03050' }}><strong>{declining.length}</strong> membre(s) avec présence en baisse</span>
                  </div>
                )}
                {staleNouveau.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#d48f0008', borderLeft: '3px solid #d48f00', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color="#d48f00" />
                    <span style={{ fontSize: 12, color: '#d48f00' }}><strong>{staleNouveau.length}</strong> "Nouveau" depuis + de 3 mois</span>
                  </div>
                )}
                {defisSansModule.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#7040d008', borderLeft: '3px solid #7040d0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={13} color="#7040d0" />
                    <span style={{ fontSize: 12, color: '#7040d0' }}><strong>{defisSansModule.length}</strong> défi(s) sans module assigné</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setPage('pres')} style={{ ...S.btn('#1a9c60', true), display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 12 }}>Saisir présences</button>
        <button onClick={() => setPage('ents')} style={{ ...S.btn('#3060d0', true), display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 12 }}>+ Entretien</button>
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Inscriptions récentes</div>
        {recent.length === 0
          ? <div style={{ color: '#6b7280', fontSize: 12 }}>Aucune inscription récente.</div>
          : recent.map(m => (
            <div key={m.id} onClick={() => openFiche(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid #e0e4ec', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}><span style={{ fontSize: 11, fontWeight: 600 }}>{m.prenom} {m.nom}</span></div>
              <span style={{ fontSize: 10, color: '#6b7280' }}>{fmtS(m.date_inscription)}</span>
              <span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}
