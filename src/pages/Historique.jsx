import { useState, useEffect } from 'react'
import { S, fmt, fmtS } from '../lib/ui'

export default function HistoriquePage({ presences, refs, datesAnnulees }) {
  const activites = refs.activites || []
  const [actId, setActId] = useState(activites[0]?.id || '')
  useEffect(() => { if (!actId && activites.length) setActId(activites[0].id) }, [activites])
  const act = activites.find(a => a.id === actId)

  const cancelled = new Set((datesAnnulees || []).filter(d => d.activite_id === actId).map(d => d.date_annulee))
  const cancelledMotifs = Object.fromEntries((datesAnnulees || []).filter(d => d.activite_id === actId).map(d => [d.date_annulee, d.motif || 'Annulée']))

  const savedDates = {}
  presences.filter(p => p.activite_id === actId).forEach(p => {
    if (!savedDates[p.date_presence]) savedDates[p.date_presence] = { date: p.date_presence, el: 0, pr: 0 }
    if (p.eligible) { savedDates[p.date_presence].el += 1; if (p.present) savedDates[p.date_presence].pr += 1 }
  })

  // Génère toutes les dates attendues entre première saisie et aujourd'hui
  const generateExpected = () => {
    if (!act || !act.est_recurrente || act.jour_semaine === null || act.jour_semaine === undefined) return []
    const allSaved = Object.keys(savedDates).sort()
    if (allSaved.length === 0) return []
    const start = new Date(allSaved[0])
    const end = new Date()
    const expected = []
    const cur = new Date(start)
    while (cur <= end) {
      if (cur.getDay() === act.jour_semaine) {
        expected.push(cur.toISOString().slice(0, 10))
      }
      cur.setDate(cur.getDate() + 1)
    }
    return expected
  }
  const expectedDates = generateExpected()

  // Timeline complète avec statuts : saved / cancelled / missing
  const buildTimeline = () => {
    const map = {}
    // Toutes les dates attendues d'abord
    expectedDates.forEach(d => {
      if (cancelled.has(d)) {
        map[d] = { date: d, status: 'cancelled', motif: cancelledMotifs[d] }
      } else if (savedDates[d]) {
        map[d] = { ...savedDates[d], status: 'saved' }
      } else {
        map[d] = { date: d, status: 'missing' }
      }
    })
    // Puis les dates saisies hors des attendues (activité ponctuelle ou mauvais jour)
    Object.keys(savedDates).forEach(d => {
      if (!map[d]) map[d] = { ...savedDates[d], status: cancelled.has(d) ? 'cancelled' : 'saved' }
    })
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date))
  }
  const tl = buildTimeline()
  const savedTl = tl.filter(t => t.status === 'saved')
  const missingTl = tl.filter(t => t.status === 'missing')
  const firstDate = tl.length > 0 ? tl[0].date : null
  const lastDate = tl.length > 0 ? tl[tl.length - 1].date : null

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        {activites.map(a => (
          <button key={a.id} onClick={() => setActId(a.id)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid ' + (actId === a.id ? a.couleur : '#e0e4ec'), background: actId === a.id ? a.couleur + '12' : 'transparent', color: actId === a.id ? a.couleur : '#5a6480', fontSize: 12, fontWeight: actId === a.id ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>{a.icone} {a.nom}</button>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Taux par date — {act?.icone} {act?.nom}</div>
        {tl.length > 0 && (
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
            {savedTl.length} saisie(s){missingTl.length > 0 && <span style={{ color: '#e03050', fontWeight: 600 }}> · {missingTl.length} manquante(s)</span>} · du {fmtS(firstDate)} au {fmtS(lastDate)}
          </div>
        )}
        {missingTl.length > 0 && (
          <div style={{ padding: '6px 10px', background: '#e0305008', border: '1px solid #e0305033', borderRadius: 6, marginBottom: 10, fontSize: 11, color: '#e03050' }}>
            ⚠ {missingTl.length} {act?.nom?.toLowerCase()} non saisie(s) : {missingTl.slice(-3).map(t => fmtS(t.date)).join(', ')}{missingTl.length > 3 ? '...' : ''}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#6b7280', marginBottom: 8, flexWrap: 'wrap' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#1a9c60', borderRadius: 2, marginRight: 3, verticalAlign: 'middle' }} /> Saisie</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'repeating-linear-gradient(45deg, #d48f00, #d48f00 3px, transparent 3px, transparent 6px)', border: '1px solid #d48f00', borderRadius: 2, marginRight: 3, verticalAlign: 'middle' }} /> Annulée</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'transparent', border: '2px dashed #e03050', borderRadius: 2, marginRight: 3, verticalAlign: 'middle' }} /> Non saisie</span>
        </div>
        {tl.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 12 }}>Aucune donnée</div>
          : <div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 150, minWidth: Math.max(300, tl.length * 32) }}>
                {tl.map(t => {
                  const d = new Date(t.date)
                  const label = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2)
                  if (t.status === 'missing') {
                    return (
                      <div key={t.date} title={"Non saisie — " + t.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 28px', maxWidth: 36 }}>
                        <div style={{ fontSize: 9, color: '#e03050', marginBottom: 2, fontWeight: 700 }}>?</div>
                        <div style={{ width: '70%', background: 'transparent', border: '2px dashed #e03050', borderRadius: '3px 3px 0 0', height: '100px', boxSizing: 'border-box' }} />
                        <div style={{ fontSize: 7, color: '#e03050', marginTop: 2, transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap', fontWeight: 600 }}>{label}</div>
                      </div>
                    )
                  }
                  if (t.status === 'cancelled') {
                    return (
                      <div key={t.date} title={"Annulée — " + (t.motif || '')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 28px', maxWidth: 36 }}>
                        <div style={{ fontSize: 9, color: '#d48f00', marginBottom: 2, fontWeight: 700 }}>—</div>
                        <div style={{ width: '70%', background: 'repeating-linear-gradient(45deg, #d48f0033, #d48f0033 3px, transparent 3px, transparent 6px)', border: '1px solid #d48f00', borderRadius: '3px 3px 0 0', height: '80px', boxSizing: 'border-box' }} />
                        <div style={{ fontSize: 7, color: '#d48f00', marginTop: 2, transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>{label}</div>
                      </div>
                    )
                  }
                  const pct = t.el > 0 ? Math.round(t.pr / t.el * 100) : 0
                  return (
                    <div key={t.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 28px', maxWidth: 36 }}>
                      <div style={{ fontSize: 9, color: '#5a6480', marginBottom: 2, fontWeight: 600 }}>{pct}%</div>
                      <div style={{ width: '70%', background: pct >= 80 ? '#1a9c60' : pct >= 50 ? '#d48f00' : '#e03050', borderRadius: '3px 3px 0 0', height: Math.max(6, pct * 1.2) + 'px' }} />
                      <div style={{ fontSize: 7, color: '#6b7280', marginTop: 2, transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>{label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead><tr>{['Date', 'État', 'Présents', 'Élig.', 'Taux'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{tl.slice().reverse().slice(0, 20).map(t => {
                if (t.status === 'missing') return <tr key={t.date}><td style={S.td}>{fmt(t.date)}</td><td style={{ ...S.td, color: '#e03050', fontWeight: 600 }}>Non saisie</td><td style={S.td}>—</td><td style={S.td}>—</td><td style={S.td}>—</td></tr>
                if (t.status === 'cancelled') return <tr key={t.date}><td style={S.td}>{fmt(t.date)}</td><td style={{ ...S.td, color: '#d48f00', fontWeight: 600 }}>Annulée{t.motif ? ' — ' + t.motif : ''}</td><td style={S.td}>—</td><td style={S.td}>—</td><td style={S.td}>—</td></tr>
                const pct = t.el > 0 ? Math.round(t.pr / t.el * 100) : 0
                return <tr key={t.date}><td style={S.td}>{fmt(t.date)}</td><td style={{ ...S.td, color: '#1a9c60' }}>Saisie</td><td style={{ ...S.td, fontWeight: 600 }}>{t.pr}</td><td style={S.td}>{t.el}</td><td style={S.td}><span style={{ fontWeight: 600, color: pct >= 80 ? '#1a9c60' : pct >= 50 ? '#d48f00' : '#e03050' }}>{pct}%</span></td></tr>
              })}</tbody>
            </table>
          </div>}
      </div>
    </div>
  )
}
