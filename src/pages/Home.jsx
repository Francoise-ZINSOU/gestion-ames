import { useState } from 'react'
import { toLocalDate, S, C, fmtS, dago, today, getStatutColor } from '../lib/ui'
import { AlertTriangle, Clock, BookOpen, CheckSquare, TrendingDown, Cake } from 'lucide-react'

export default function HomePage({ actifs, alertes, presences, entretiens, defis, plans, refs, h, openFiche, setPage, datesAnnulees, auth }) {
  const statutCount = (nom) => actifs.filter(m => m.statut === nom).length
  const statutColor = (nom) => (refs.statuts || []).find(s => s.nom === nom)?.couleur || C.meta
  const statutCritique = (refs.statuts || []).filter(s => !s.est_archive).sort((a, b) => b.ordre - a.ordre)[0]?.nom || 'À accompagner'

  const culte = h.culteId ? { id: h.culteId } : null
  const cancelledCulteDates = new Set(culte ? (datesAnnulees || []).filter(d => d.activite_id === culte.id).map(d => d.date_annulee) : [])
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
        if (!saved.has(dStr) && !cancelledCulteDates.has(dStr) && dStr <= toLocalDate(nowD)) missing.push(dStr)
      }
      cur.setDate(cur.getDate() + 1)
    }
    return missing
  })()

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

  const myMembre = auth?.profil?.membre_id ? (actifs || []).find(m => m.id === auth.profil.membre_id) : null
  const mySuivis = myMembre ? actifs.filter(m => m.suivi_par === myMembre.id) : []
  const prenom = (auth?.profil?.nom_affiche || '').split(' ')[0]

  const familleInactive = auth?.profil?.familles_disciples && (auth.profil.familles_disciples.actif === false || auth.profil.familles_disciples.eglises?.actif === false)

  // ─── Église vide : accueil épuré, checklist guidée ───
  if (actifs.length === 0) {
    const chefNom = h.bergerRoleName || 'Chef de famille'
    const steps = [
      { n: 1, t: `Commencer par le ${chefNom.toLowerCase()}`, d: 'La personne qui porte la famille — vous-même ou celui que vous désignez', go: 'ames', c: C.primary },
      { n: 2, t: 'Ajouter les piliers', d: 'Ceux qui accompagnent à vos côtés — rattachez-les au chef de famille', go: 'ames', c: C.primary },
      { n: 3, t: 'Ajouter les autres membres', d: 'Rattachez chacun au pilier ou au chef qui le suit', go: 'ames', c: C.primary },
      { n: 4, t: 'Pointer les présences', d: 'Une fois la famille en place, cochez qui est au culte', go: 'pres', c: C.accent },
    ]
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🌱</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: C.text, marginBottom: 6 }}>
            Bienvenue{prenom ? ', ' + prenom : ''}
          </div>
          <div style={{ fontSize: 14, color: C.sub }}>Votre espace est prêt. Construisez votre famille de haut en bas.</div>
        </div>
        <div style={{ background: C.primarySoft, borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: C.primaryDark, lineHeight: 1.6 }}>
          L'ordre compte : ajoutez d'abord le <strong>{chefNom.toLowerCase()}</strong>, puis les <strong>piliers</strong> rattachés à lui, enfin les <strong>membres</strong> rattachés à leur pilier. C'est ce qui construit l'arbre de suivi de votre famille.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map(s => (
            <div key={s.n} onClick={() => setPage(s.go)} style={{ padding: '16px 18px', background: C.surface, borderRadius: 14, boxShadow: C.shadow, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.c + '18', color: s.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 15, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: s.c }}>{s.t}</div>
                <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.meta, textAlign: 'center', marginTop: 16 }}>
          Vous pourrez inviter d'autres responsables plus tard, depuis les Paramètres.
        </div>
      </div>
    )
  }

  // ─── Bloc « aujourd'hui » : tout ce qui demande attention, fusionné ───
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
    return ps.slice(4, 8).filter(p => p.present).length >= 3 && ps.slice(0, 4).filter(p => p.present).length <= 1
  }) : []

  const items = []
  if (alertes.length) items.push({ icon: AlertTriangle, c: C.danger, txt: `${alertes.length} membre(s) à accompagner en priorité`, go: 'alerts' })
  if (missingCulteDates.length) items.push({ icon: CheckSquare, c: C.primary, txt: `${missingCulteDates.length} culte(s) non saisi(s) ce mois-ci`, go: 'pres' })
  if (declining.length) items.push({ icon: TrendingDown, c: C.danger, txt: `${declining.length} membre(s) dont la présence baisse`, go: 'ames' })
  if (thisWeekBdays.length) items.push({ icon: Cake, c: C.accent, txt: `${thisWeekBdays.length} anniversaire(s) cette semaine : ${thisWeekBdays.map(m => m.prenom).join(', ')}` })
  if (staleNouveau.length) items.push({ icon: Clock, c: C.accent, txt: `${staleNouveau.length} nouveau(x) depuis plus de 3 mois`, go: 'ames' })
  if (defisSansModule.length) items.push({ icon: BookOpen, c: '#8B5B9E', txt: `${defisSansModule.length} défi(s) sans parcours assigné`, go: 'ames' })

  const kpis = [
    { label: statutCritique, val: statutCount(statutCritique), col: statutColor(statutCritique), go: 'ames' },
    { label: h.defaultStatut || 'Nouveau', val: statutCount(h.defaultStatut), col: statutColor(h.defaultStatut) || C.primary, go: 'ames' },
    { label: 'Membres actifs', val: actifs.length, col: C.primary, go: 'ames' },
    { label: 'Présence au culte', val: culte ? tG + '%' : '—', col: !culte ? C.meta : tG >= 80 ? C.success : tG >= 50 ? C.accent : C.danger },
  ]

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: C.text, marginBottom: 16 }}>
        Bonjour{prenom ? ', ' + prenom : ''}
      </div>

      {familleInactive && (
        <div style={{ ...S.card, borderLeft: '3px solid ' + C.meta, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Famille désactivée</div>
          <div style={{ fontSize: 13, color: C.sub }}>Les données restent consultables mais aucune alerte n'est calculée.</div>
        </div>
      )}

      {mySuivis.length > 0 && (
        <div onClick={() => setPage('ames')} style={{ ...S.card, borderLeft: '3px solid #8B5B9E', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: C.text }}>Vous accompagnez <strong>{mySuivis.length}</strong> personne(s)</div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8B5B9E' }}>Voir →</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 18 }}>
        {kpis.map((k, i) => (
          <div key={i} onClick={k.go ? () => setPage(k.go) : undefined} style={{ ...S.kpi(k.col), cursor: k.go ? 'pointer' : 'default' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.sub, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: k.col }}>{k.val}</div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div style={{ ...S.card, marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: C.text, marginBottom: 12 }}>Aujourd'hui</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, i) => {
              const Icon = it.icon
              return (
                <div key={i} onClick={it.go ? () => setPage(it.go) : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: it.c + '10', cursor: it.go ? 'pointer' : 'default' }}>
                  <Icon size={16} color={it.c} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.text }}>{it.txt}</span>
                  {it.go && <span style={{ marginLeft: 'auto', fontSize: 15, color: it.c }}>›</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <button onClick={() => setPage('pres')} style={{ ...S.btn(C.primary, false), padding: '9px 18px', fontSize: 13 }}>Saisir les présences</button>
        <button onClick={() => setPage('ents')} style={{ ...S.btn(C.primary, true), padding: '9px 18px', fontSize: 13 }}>Nouvel entretien</button>
      </div>

      {recent.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: C.text, marginBottom: 10 }}>Arrivées récentes</div>
          {recent.map(m => (
            <div key={m.id} onClick={() => openFiche(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid ' + C.border, cursor: 'pointer' }}>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: C.text }}>{m.prenom} {m.nom}</span>
              <span style={{ fontSize: 12, color: C.sub }}>{fmtS(m.date_inscription)}</span>
              <span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
