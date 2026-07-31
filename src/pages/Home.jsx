import { useState } from 'react'
import { toLocalDate, S, fmtS, dago, today, getStatutColor } from '../lib/ui'
import { AlertTriangle, Clock, BookOpen, CheckSquare, TrendingDown } from 'lucide-react'

export default function HomePage({ actifs, alertes, presences, entretiens, defis, plans, refs, h, openFiche, setPage, datesAnnulees, auth }) {
  const [showNotifs, setShowNotifs] = useState(true)

  // KPIs figés : Total actifs / Nouveaux / Statut critique / Taux culte
  const statutCount = (nom) => actifs.filter(m => m.statut === nom).length
  const statutColor = (nom) => (refs.statuts || []).find(s => s.nom === nom)?.couleur || '#8B7355'
  // Statut "critique" = celui avec l'ordre le plus élevé parmi les non-archivés (par convention: le pire)
  const statutCritique = (refs.statuts || []).filter(s => !s.est_archive).sort((a, b) => b.ordre - a.ordre)[0]?.nom || 'En difficulté'

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
        const dStr = toLocalDate(cur)
        if (!saved.has(dStr) && !cancelledCulteDates.has(dStr) && dStr <= toLocalDate(nowD)) {
          missing.push(dStr)
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
    return missing
  })()

  // Rappel présences : dernier dimanche saisi ?
  const lastSunday = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); return toLocalDate(d)
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

  // Dashboard personnalisé Pilier : ses suivis
  const myMembre = auth?.profil?.membre_id ? (actifs || []).find(m => m.id === auth.profil.membre_id) : null
  const mySuivis = myMembre ? actifs.filter(m => m.suivi_par === myMembre.id) : []
  const mySuivisEnDifficulte = mySuivis.filter(m => m.statut === statutCritique).length
  const myEntretiensCeMois = (() => {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
    return (entretiens || []).filter(e => mySuivis.some(m => m.id === e.membre_id) && new Date(e.date_entretien) >= monthAgo).length
  })()

  const familleInactive = auth?.profil?.familles_disciples && (auth.profil.familles_disciples.actif === false || auth.profil.familles_disciples.eglises?.actif === false)

  return (
    <div>
      {mySuivis.length > 0 && (
        <div style={{ ...S.card, borderLeft: '3px solid #8B5B9E', background: '#8B5B9E08', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8B5B9E', marginBottom: 6 }}>★ Mes suivis ({mySuivis.length})</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6B5D4A', flexWrap: 'wrap' }}>
            {mySuivisEnDifficulte > 0 && <span><strong style={{ color: '#C0563A' }}>{mySuivisEnDifficulte}</strong> en {statutCritique?.toLowerCase() || 'difficulté'}</span>}
            <span onClick={() => setPage('ames')} style={{ color: '#8B5B9E', cursor: 'pointer', textDecoration: 'underline', marginLeft: 'auto' }}>Voir la liste →</span>
          </div>
        </div>
      )}
      {familleInactive && (
        <div style={{ ...S.card, borderLeft: '3px solid #8B7355', background: '#FBF7F1', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Famille désactivée</div>
          <div style={{ fontSize: 12, color: '#6B5D4A' }}>Les données restent consultables mais aucune alerte ou détection n'est calculée.</div>
        </div>
      )}
      {actifs.length === 0 && (
        <div style={{ ...S.card, padding: '30px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>🌱</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6, textAlign: 'center' }}>Bienvenue ! Votre espace est prêt.</div>
          <div style={{ fontSize: 14, color: '#6B5D4A', lineHeight: 1.7, marginBottom: 20, textAlign: 'center' }}>Voici les premières étapes pour démarrer :</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div onClick={() => setPage('ames')} style={{ padding: '12px 14px', background: '#B8733308', border: '1px solid #B8733333', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>1</span>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: '#B87333' }}>Ajouter vos premiers membres</div><div style={{ fontSize: 12, color: '#6B5D4A' }}>Les personnes que vous suivez dans votre groupe</div></div>
            </div>
            <div onClick={() => setPage('pres')} style={{ padding: '12px 14px', background: '#B8733308', border: '1px solid #B8733333', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>2</span>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: '#B87333' }}>Pointer les présences</div><div style={{ fontSize: 12, color: '#6B5D4A' }}>Chaque dimanche, cochez qui était au culte</div></div>
            </div>
            <div onClick={() => setPage('params')} style={{ padding: '12px 14px', background: '#8B5B9E08', border: '1px solid #8B5B9E33', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>3</span>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: '#8B5B9E' }}>Inviter d'autres responsables</div><div style={{ fontSize: 12, color: '#6B5D4A' }}>Chaque pilier aura son propre accès</div></div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <div onClick={() => setPage('ames')} style={{ ...S.kpi(statutColor(statutCritique)), cursor: 'pointer' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#8B7355', marginBottom: 6 }} title="Nombre de membres dans le statut le plus préoccupant">{statutCritique}</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: statutColor(statutCritique) }}>{statutCount(statutCritique)}</div>
        </div>
        <div onClick={() => setPage('ames')} style={{ ...S.kpi(statutColor(h.defaultStatut) || '#B87333'), cursor: 'pointer' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#8B7355', marginBottom: 6 }} title="Membres récemment inscrits, en phase d'intégration">{h.defaultStatut || 'Nouveaux'}</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: statutColor(h.defaultStatut) || '#B87333' }}>{statutCount(h.defaultStatut)}</div>
        </div>
        <div onClick={() => setPage('ames')} style={{ ...S.kpi('#B87333'), cursor: 'pointer' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#8B7355', marginBottom: 6 }}>Membres actifs</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#B87333' }}>{actifs.length}</div>
        </div>
        <div style={S.kpi(actifs.length === 0 ? '#8B7355' : tG >= 80 ? '#5B8266' : tG >= 50 ? '#B87333' : '#C0563A')}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#8B7355', marginBottom: 6 }} title="Pourcentage moyen de présence aux cultes des 4 dernières semaines">Présence au culte</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: actifs.length === 0 ? '#8B7355' : tG >= 80 ? '#5B8266' : tG >= 50 ? '#B87333' : '#C0563A' }}>{culte && actifs.length > 0 ? tG + '%' : '—'}</div>
        </div>
      </div>

      {actifs.length > 0 && !lastSundaySaved && (
        <div onClick={() => setPage('pres')} style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #B8733333', background: '#B8733308', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckSquare size={14} color="#B87333" />
          <span style={{ fontSize: 13, color: '#B87333' }}>Les présences du <strong>dimanche {fmtS(lastSunday)}</strong> n'ont pas été saisies</span>
          <span style={{ fontSize: 12, color: '#B87333', marginLeft: 'auto', textDecoration: 'underline' }}>Saisir</span>
        </div>
      )}

      {(() => {
        // Église vide : aucun signal d'urgence n'a de sens sans membres
        if (actifs.length === 0) return null
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
          <div style={{ marginBottom: 14, border: '1px solid #EADFCF', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
            <div onClick={() => setShowNotifs(!showNotifs)} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#FBF7F1', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              <strong style={{ fontSize: 14 }}>{totalNotif} notification(s)</strong>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(alertes.length + missingCulteDates.length + declining.length) > 0 && <span style={{ padding: '1px 6px', borderRadius: 8, background: '#C0563A', color: '#fff', fontSize: 11, fontWeight: 600 }}>{alertes.length + missingCulteDates.length + declining.length} urgent</span>}
                {(staleNouveau.length + defisSansModule.length) > 0 && <span style={{ padding: '1px 6px', borderRadius: 8, background: '#B87333', color: '#fff', fontSize: 11, fontWeight: 600 }}>{staleNouveau.length + defisSansModule.length} attention</span>}
                {thisWeekBdays.length > 0 && <span style={{ padding: '1px 6px', borderRadius: 8, background: '#B87333', color: '#fff', fontSize: 11, fontWeight: 600 }}>{thisWeekBdays.length} 🎂</span>}
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8B7355' }}>{showNotifs ? '▲' : '▼'}</span>
            </div>
            {showNotifs && (
              <div style={{ padding: '4px 14px 10px' }}>
                {missingCulteDates.length > 0 && (
                  <div onClick={() => setPage('pres')} style={{ padding: '8px 10px', borderRadius: 6, background: '#C0563A08', borderLeft: '3px solid #C0563A', marginTop: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} color="#C0563A" />
                    <span style={{ fontSize: 13, color: '#C0563A' }}><strong>{missingCulteDates.length}</strong> culte(s) non saisi(s) sur les 30 derniers jours</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#B87333' }}>Saisir →</span>
                  </div>
                )}
                {alertes.length > 0 && (
                  <div onClick={() => setPage('alerts')} style={{ padding: '8px 10px', borderRadius: 6, background: '#C0563A08', borderLeft: '3px solid #C0563A', marginTop: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} color="#C0563A" />
                    <span style={{ fontSize: 13, color: '#C0563A' }}><strong>{alertes.length}</strong> alerte(s) de suivi</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#B87333' }}>Voir →</span>
                  </div>
                )}
                {thisWeekBdays.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#B8733308', borderLeft: '3px solid #B87333', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🎂</span>
                    <span style={{ fontSize: 13, color: '#B87333' }}><strong>{thisWeekBdays.length}</strong> anniversaire(s) : {thisWeekBdays.map(m => m.prenom).join(', ')}</span>
                  </div>
                )}
                {declining.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#C0563A08', borderLeft: '3px solid #C0563A', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingDown size={13} color="#C0563A" />
                    <span style={{ fontSize: 13, color: '#C0563A' }}><strong>{declining.length}</strong> membre(s) avec présence en baisse</span>
                  </div>
                )}
                {staleNouveau.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#B8733308', borderLeft: '3px solid #B87333', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color="#B87333" />
                    <span style={{ fontSize: 13, color: '#B87333' }}><strong>{staleNouveau.length}</strong> "Nouveau" depuis + de 3 mois</span>
                  </div>
                )}
                {defisSansModule.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: '#8B5B9E08', borderLeft: '3px solid #8B5B9E', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={13} color="#8B5B9E" />
                    <span style={{ fontSize: 13, color: '#8B5B9E' }}><strong>{defisSansModule.length}</strong> défi(s) sans module assigné</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setPage('pres')} style={{ ...S.btn('#5B8266', true), display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13 }}>Saisir présences</button>
        <button onClick={() => setPage('ents')} style={{ ...S.btn('#B87333', true), display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13 }}>+ Entretien</button>
      </div>

      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Inscriptions récentes</div>
        {recent.length === 0
          ? <div style={{ color: '#8B7355', fontSize: 13 }}>Aucune inscription récente.</div>
          : recent.map(m => (
            <div key={m.id} onClick={() => openFiche(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid #EADFCF', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}><span style={{ fontSize: 12, fontWeight: 600 }}>{m.prenom} {m.nom}</span></div>
              <span style={{ fontSize: 11, color: '#8B7355' }}>{fmtS(m.date_inscription)}</span>
              <span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}
