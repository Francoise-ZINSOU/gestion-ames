import { useState, useEffect } from 'react'
import { S, fmt, fmtS } from '../lib/ui'

export default function HistoriquePage({ presences, refs }) {
  const activites = refs.activites || []
  const [actId, setActId] = useState(activites[0]?.id || '')
  useEffect(() => { if (!actId && activites.length) setActId(activites[0].id) }, [activites])
  const act = activites.find(a => a.id === actId)

  const dates = {}
  presences.filter(p => p.activite_id === actId).forEach(p => {
    if (!dates[p.date_presence]) dates[p.date_presence] = { date: p.date_presence, el: 0, pr: 0 }
    if (p.eligible) { dates[p.date_presence].el += 1; if (p.present) dates[p.date_presence].pr += 1 }
  })
  const tl = Object.values(dates).sort((a, b) => new Date(a.date) - new Date(b.date))
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
        {tl.length > 0 && <div style={{ fontSize: 11, color: '#8892a8', marginBottom: 8 }}>{tl.length} date(s) saisie(s) · du {fmtS(firstDate)} au {fmtS(lastDate)}</div>}
        {tl.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#8892a8', fontSize: 12 }}>Aucune donnée</div>
          : <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 140, marginBottom: 8, overflowX: 'auto' }}>
              {tl.slice(-40).map(t => {
                const pct = t.el > 0 ? Math.round(t.pr / t.el * 100) : 0
                return (
                  <div key={t.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 16px', maxWidth: 28 }}>
                    <div style={{ fontSize: 8, color: '#5a6480', marginBottom: 2 }}>{pct}</div>
                    <div style={{ width: '80%', background: pct >= 80 ? '#1a9c60' : pct >= 50 ? '#d48f00' : '#e03050', borderRadius: '3px 3px 0 0', height: Math.max(4, pct * 1.3) + 'px' }} />
                  </div>
                )
              })}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead><tr>{['Date', 'Présents', 'Élig.', 'Taux'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{tl.slice().reverse().slice(0, 20).map(t => {
                const pct = t.el > 0 ? Math.round(t.pr / t.el * 100) : 0
                return <tr key={t.date}><td style={S.td}>{fmt(t.date)}</td><td style={{ ...S.td, fontWeight: 600 }}>{t.pr}</td><td style={S.td}>{t.el}</td><td style={S.td}><span style={{ fontWeight: 600, color: pct >= 80 ? '#1a9c60' : pct >= 50 ? '#d48f00' : '#e03050' }}>{pct}%</span></td></tr>
              })}</tbody>
            </table>
          </div>}
      </div>
    </div>
  )
}
