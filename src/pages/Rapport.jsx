import { useState } from 'react'
import { S, fmt, today, toLocalDate } from '../lib/ui'
import { Printer } from 'lucide-react'

export default function RapportPage({ actifs, presences, entretiens, defis, refs, h, auth }) {
  const now = new Date()
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30)
  const monthAgoStr = toLocalDate(monthAgo)
  const todayStr = today()

  // Stats
  const nouveaux = actifs.filter(m => m.date_inscription && m.date_inscription >= monthAgoStr).length
  const enDifficulte = actifs.filter(m => {
    const crit = (refs.statuts || []).filter(s => !s.est_archive).sort((a, b) => b.ordre - a.ordre)[0]
    return crit && m.statut === crit.nom
  }).length
  const entMois = entretiens.filter(e => e.date_entretien >= monthAgoStr).length
  const defisClos = defis.filter(d => {
    const final = (refs.statutsDefi || []).find(s => s.est_final)
    return final && d.statut === final.nom && d.updated_at >= monthAgoStr
  }).length

  // Culte stats
  const culte = (refs.activites || []).find(a => a.code === 'culte')
  const cultePres = culte ? presences.filter(p => p.activite_id === culte.id && p.eligible && p.date_presence >= monthAgoStr) : []
  const culteDates = [...new Set(cultePres.map(p => p.date_presence))].sort()
  const tauxParDim = culteDates.map(d => {
    const ps = cultePres.filter(p => p.date_presence === d)
    return { date: d, presents: ps.filter(p => p.present).length, total: ps.length, taux: ps.length > 0 ? Math.round(ps.filter(p => p.present).length / ps.length * 100) : 0 }
  })
  const tauxMoyen = tauxParDim.length > 0 ? Math.round(tauxParDim.reduce((s, t) => s + t.taux, 0) / tauxParDim.length) : null

  // Absences critiques (3+)
  const absCritiques = actifs.filter(m => {
    if (!culte) return false
    const ps = presences.filter(p => p.membre_id === m.id && p.activite_id === culte.id && p.eligible).sort((a, b) => b.date_presence.localeCompare(a.date_presence))
    let c = 0; for (const p of ps) { if (p.present) break; c++ }
    return c >= 3
  })

  const familleName = auth?.profil?.familles_disciples?.nom || ''
  const egliseName = auth?.profil?.familles_disciples?.eglises?.nom || ''

  const handlePrint = () => window.print()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }} className="no-print">
        <div style={{ fontSize: 14, color: '#5a6480' }}>Rapport des 30 derniers jours. Cliquez Imprimer pour obtenir un PDF.</div>
        <button onClick={handlePrint} style={{ ...S.btn('#0ea888', false), display: 'flex', alignItems: 'center', gap: 6 }}><Printer size={14} /> Imprimer</button>
      </div>

      <div id="rapport" style={{ ...S.card, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#0ea888', fontWeight: 700 }}>{egliseName}</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Rapport pastoral mensuel</div>
          <div style={{ fontSize: 13, color: '#5a6480' }}>{familleName} — {fmt(monthAgoStr)} au {fmt(todayStr)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Membres actifs', value: actifs.length, color: '#0ea888' },
            { label: 'Nouveaux', value: nouveaux, color: '#3060d0' },
            { label: 'En difficulté', value: enDifficulte, color: '#e03050' },
            { label: 'Taux culte moyen', value: tauxMoyen !== null ? tauxMoyen + '%' : '—', color: tauxMoyen >= 80 ? '#1a9c60' : '#d48f00' },
            { label: 'Entretiens réalisés', value: entMois, color: '#7040d0' },
            { label: 'Défis résolus', value: defisClos, color: '#1a9c60' },
          ].map((k, i) => (
            <div key={i} style={{ padding: 14, background: '#f4f6f9', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {tauxParDim.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Présences au culte</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Date', 'Présents', 'Éligibles', 'Taux'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{tauxParDim.map(t => (
                <tr key={t.date}>
                  <td style={S.td}>{fmt(t.date)}</td>
                  <td style={S.td}>{t.presents}</td>
                  <td style={S.td}>{t.total}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: t.taux >= 80 ? '#1a9c60' : t.taux >= 50 ? '#d48f00' : '#e03050' }}>{t.taux}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {absCritiques.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#e03050' }}>Membres avec 3+ absences consécutives</div>
            {absCritiques.map(m => (
              <div key={m.id} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f0f2f6' }}>{m.prenom} {m.nom} — {m.statut}</div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #e0e4ec', fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
          Généré le {fmt(todayStr)} — Suivi pastoral v1.0.0
        </div>
      </div>
    </div>
  )
}
