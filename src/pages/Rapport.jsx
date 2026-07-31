import { useState } from 'react'
import { S, fmt, today, toLocalDate } from '../lib/ui'
import { Printer } from 'lucide-react'

export default function RapportPage({ actifs, presences, entretiens, defis, plans, refs, h, auth }) {
  const now = new Date()
  const [periode, setPeriode] = useState('30j')
  const moisOptions = (() => {
    const opts = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      opts.push({ val: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) })
    }
    return opts
  })()

  let deStr, aStr, prevDeStr, prevAStr, libellePeriode
  if (periode === '30j') {
    const de = new Date(now); de.setDate(de.getDate() - 30)
    const prevDe = new Date(now); prevDe.setDate(prevDe.getDate() - 60)
    deStr = toLocalDate(de); aStr = today()
    prevDeStr = toLocalDate(prevDe); prevAStr = deStr
    libellePeriode = '30 derniers jours'
  } else {
    const [y, m] = periode.split('-').map(Number)
    deStr = y + '-' + String(m).padStart(2, '0') + '-01'
    aStr = toLocalDate(new Date(y, m, 0))
    prevDeStr = (m === 1 ? (y - 1) : y) + '-' + String(m === 1 ? 12 : m - 1).padStart(2, '0') + '-01'
    prevAStr = toLocalDate(new Date(y, m - 1, 0))
    libellePeriode = moisOptions.find(o => o.val === periode)?.label || periode
  }
  const inPeriode = (dateStr, de = deStr, a = aStr) => dateStr && dateStr >= de && dateStr <= a

  const culte = (refs.activites || []).find(a => a.code === 'culte')
  const bergerIds = new Set((actifs || []).filter(m => h.isBergerRole(m.role)).map(m => m.id))
  const suivis = actifs.filter(m => !h.isBergerRole(m.role))

  const calcStats = (de, a) => {
    const nouveaux = actifs.filter(m => inPeriode(m.date_inscription, de, a)).length
    const ent = entretiens.filter(e => inPeriode(e.date_entretien, de, a)).length
    const pres = culte ? presences.filter(p => p.activite_id === culte.id && p.eligible && !bergerIds.has(p.membre_id) && inPeriode(p.date_presence, de, a)) : []
    const dates = [...new Set(pres.map(p => p.date_presence))]
    const taux = dates.length ? Math.round(dates.map(d => {
      const ps = pres.filter(p => p.date_presence === d)
      return ps.length ? Math.round(ps.filter(p => p.present).length / ps.length * 100) : 0
    }).reduce((s, t) => s + t, 0) / dates.length) : null
    return { nouveaux, ent, taux }
  }
  const cur = calcStats(deStr, aStr)
  const prev = calcStats(prevDeStr, prevAStr)
  const delta = (a, b) => (a === null || b === null) ? null : a - b

  const cultePres = culte ? presences.filter(p => p.activite_id === culte.id && p.eligible && !bergerIds.has(p.membre_id) && inPeriode(p.date_presence)) : []
  const tauxParDim = [...new Set(cultePres.map(p => p.date_presence))].sort().map(d => {
    const ps = cultePres.filter(p => p.date_presence === d)
    return { date: d, presents: ps.filter(p => p.present).length, total: ps.length, taux: ps.length ? Math.round(ps.filter(p => p.present).length / ps.length * 100) : 0 }
  })

  const statutAccompagner = (refs.statuts || []).filter(s => !s.est_archive).sort((a, b) => b.ordre - a.ordre)[0]
  const enAccompagnement = statutAccompagner ? suivis.filter(m => m.statut === statutAccompagner.nom) : []

  const dernierEntretien = (mid) => {
    const es = entretiens.filter(e => e.membre_id === mid).map(e => e.date_entretien).sort()
    return es.length ? es[es.length - 1] : null
  }
  const seuilEntretien = toLocalDate(new Date(now.getTime() - 30 * 864e5))
  const entretiensNegliges = suivis.map(m => ({ m, dernier: dernierEntretien(m.id) }))
    .filter(x => !x.dernier || x.dernier < seuilEntretien)
    .sort((a, b) => (a.dernier || '').localeCompare(b.dernier || ''))

  const absCritiques = suivis.filter(m => {
    if (!culte) return false
    const ps = presences.filter(p => p.membre_id === m.id && p.activite_id === culte.id && p.eligible).sort((a, b) => b.date_presence.localeCompare(a.date_presence))
    let c = 0; for (const p of ps) { if (p.present) break; c++ }
    return c >= 3
  })

  const plansActifs = (plans || []).filter(p => !p.valide)
  const plansValidesPeriode = (plans || []).filter(p => p.valide && inPeriode(p.date_validation))

  const actions = []
  if (entretiensNegliges.length) actions.push('Reprendre contact avec ' + entretiensNegliges.length + ' personne(s) sans entretien recent')
  if (absCritiques.length) actions.push('Rappeler ' + absCritiques.length + ' membre(s) absent(s) 3 fois de suite')
  if (enAccompagnement.length) actions.push('Accompagner en priorite ' + enAccompagnement.length + ' membre(s) au statut « ' + (statutAccompagner ? statutAccompagner.nom : '') + ' »')

  const familleName = auth?.profil?.familles_disciples?.nom || ''
  const egliseName = auth?.profil?.familles_disciples?.eglises?.nom || ''
  const handlePrint = () => window.print()

  const Delta = ({ d, suffix = '' }) => {
    if (d === null || d === 0) return null
    const pos = d > 0
    return <span style={{ fontSize: 12, fontWeight: 600, color: pos ? '#4E8D6E' : '#C25A4A', marginLeft: 6 }}>{pos ? '▲' : '▼'} {Math.abs(d)}{suffix}</span>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#5E7175' }}>Période :</span>
          <select value={periode} onChange={e => setPeriode(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #C3D4D3', background: '#F5F8F7', fontSize: 13, fontFamily: 'inherit', color: '#2B3A3D' }}>
            <option value="30j">30 derniers jours</option>
            {moisOptions.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
        </div>
        <button onClick={handlePrint} style={{ ...S.btn('#2E7D8A', false), display: 'flex', alignItems: 'center', gap: 6 }}><Printer size={14} /> Imprimer</button>
      </div>

      <div id="rapport" style={{ ...S.card, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#2E7D8A', fontWeight: 700 }}>{egliseName}</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Rapport pastoral</div>
          <div style={{ fontSize: 13, color: '#5E7175' }}>{familleName} — {libellePeriode} ({fmt(deStr)} au {fmt(aStr)})</div>
        </div>

        {actions.length > 0 && (
          <div style={{ background: '#2E7D8A0D', border: '1px solid #2E7D8A33', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2E7D8A', marginBottom: 8 }}>À faire ce mois-ci</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#2B3A3D', lineHeight: 1.9 }}>
              {actions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Membres suivis', value: suivis.length, delta: null },
            { label: 'Nouveaux', value: cur.nouveaux, delta: delta(cur.nouveaux, prev.nouveaux) },
            { label: 'À accompagner', value: enAccompagnement.length, delta: null, color: '#C68A3E' },
            { label: 'Taux culte moyen', value: cur.taux !== null ? cur.taux + '%' : '—', delta: delta(cur.taux, prev.taux), suffix: '%', color: (cur.taux || 0) >= 80 ? '#4E8D6E' : '#2E7D8A' },
            { label: 'Entretiens réalisés', value: cur.ent, delta: delta(cur.ent, prev.ent), color: '#8B5B9E' },
            { label: 'Parcours validés', value: plansValidesPeriode.length, delta: null, color: '#4E8D6E' },
          ].map((k, i) => (
            <div key={i} style={{ padding: 14, background: '#F5F3EE', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#5E7175', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: k.color || '#2E7D8A' }}>
                {k.value}<Delta d={k.delta} suffix={k.suffix} />
              </div>
            </div>
          ))}
        </div>
        <div className="no-print" style={{ fontSize: 11, color: '#8A9B9E', textAlign: 'center', marginTop: -12, marginBottom: 20 }}>▲▼ = évolution vs période précédente</div>

        {entretiensNegliges.length > 0 && (
          <div className="print-flow" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#C25A4A' }}>Personnes sans entretien récent (30 j+)</div>
            {entretiensNegliges.slice(0, 12).map(({ m, dernier }) => (
              <div key={m.id} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid #F5F3EE', display: 'flex', justifyContent: 'space-between' }}>
                <span>{m.prenom} {m.nom}</span>
                <span style={{ color: '#8A9B9E' }}>{dernier ? 'Dernier : ' + fmt(dernier) : 'Jamais rencontré'}</span>
              </div>
            ))}
            {entretiensNegliges.length > 12 && <div style={{ fontSize: 12, color: '#8A9B9E', marginTop: 6 }}>… et {entretiensNegliges.length - 12} autre(s).</div>}
          </div>
        )}

        {tauxParDim.length > 0 && (
          <div className="print-flow" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Présences au culte</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Date', 'Présents', 'Éligibles', 'Taux'].map(x => <th key={x} style={S.th}>{x}</th>)}</tr></thead>
              <tbody>{tauxParDim.map(t => (
                <tr key={t.date}>
                  <td style={S.td}>{fmt(t.date)}</td>
                  <td style={S.td}>{t.presents}</td>
                  <td style={S.td}>{t.total}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: t.taux >= 80 ? '#4E8D6E' : t.taux >= 50 ? '#2E7D8A' : '#C25A4A' }}>{t.taux}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {absCritiques.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#C25A4A' }}>Membres avec 3+ absences consécutives</div>
            {absCritiques.map(m => (
              <div key={m.id} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid #F5F3EE' }}>{m.prenom} {m.nom} — {m.statut}</div>
            ))}
          </div>
        )}

        {plansActifs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Parcours de formation</div>
            <div style={{ fontSize: 13, color: '#2B3A3D', lineHeight: 1.8 }}>
              {plansActifs.length} parcours en cours · {plansValidesPeriode.length} validé(s) sur la période.
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #DCE6E5', fontSize: 11, color: '#5E7175', textAlign: 'center' }}>
          Généré le {fmt(today())} — Suivi pastoral v1.0.0
        </div>
      </div>
    </div>
  )
}
