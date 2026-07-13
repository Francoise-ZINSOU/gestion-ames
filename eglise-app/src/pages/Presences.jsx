import { useState, useEffect } from 'react'
import { S, fmt, today } from '../lib/ui'

export default function PresencesPage({ actifs, presences, refs, sauverPresences, supprimerDate }) {
  const activites = refs.activites || []
  const [actId, setActId] = useState(activites[0]?.id || '')
  const [date, setDate] = useState(today())
  const [chk, setChk] = useState({})
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')

  // Sync actId when activites load
  useEffect(() => { if (!actId && activites.length) setActId(activites[0].id) }, [activites])

  // Load existing presences for selected activity+date
  useEffect(() => {
    const obj = {}
    presences.filter(p => p.activite_id === actId && p.date_presence === date && p.present)
      .forEach(p => { obj[p.membre_id] = true })
    setChk(obj)
  }, [actId, date, presences])

  useEffect(() => { setSaved(false) }, [actId, date])

  const isFuture = new Date(date) > new Date(today())
  const act = activites.find(a => a.id === actId)

  // Eligibility check (simplified - full check is in SQL function)
  const eligible = actifs.filter(m => {
    if (m.date_inscription && new Date(m.date_inscription) > new Date(date)) return false
    if (m.est_retour && m.date_depart) {
      const dep = new Date(m.date_depart)
      const ret = m.date_retour ? new Date(m.date_retour) : new Date('9999-12-31')
      if (new Date(date) >= dep && new Date(date) < ret) return false
    }
    return true
  }).sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))

  const filtered = search
    ? eligible.filter(m => (m.nom + ' ' + m.prenom).toLowerCase().includes(search.toLowerCase()))
    : eligible

  const existing = presences.filter(p => p.activite_id === actId && p.date_presence === date)
  const nChecked = Object.keys(chk).filter(k => chk[k]).length

  const handleSave = async () => {
    const presentIds = Object.keys(chk).filter(k => chk[k])
    await sauverPresences(actId, date, presentIds)
    setSaved(true)
  }

  const handleDelete = async () => {
    if (confirm(`Supprimer TOUTES les présences du ${fmt(date)} pour ${act?.nom} ?\n\nCette action est irréversible.`)) {
      await supprimerDate(actId, date)
      setChk({})
      setSaved(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        {activites.map(a => (
          <button key={a.id} onClick={() => setActId(a.id)} style={{
            padding: '6px 12px', borderRadius: 7, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
            border: '1px solid ' + (actId === a.id ? a.couleur : '#e0e4ec'),
            background: actId === a.id ? a.couleur + '12' : 'transparent',
            color: actId === a.id ? a.couleur : '#5a6480', fontWeight: actId === a.id ? 600 : 500
          }}>{a.icone} {a.nom}</button>
        ))}
        <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 12, fontFamily: 'inherit', marginLeft: 'auto' }} />
      </div>

      {isFuture ? (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#e0305008', border: '1px solid #e0305033', fontSize: 12, color: '#e03050' }}>
          ⚠ Impossible de saisir des présences pour une date future.
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{act?.icone} {act?.nom} — {fmt(date)}</div>
              <div style={{ fontSize: 11, color: '#8892a8', marginTop: 2 }}>
                {nChecked}/{eligible.length} coché(s){existing.length > 0 ? ' · Déjà enregistré — vous complétez' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => { const o = {}; eligible.forEach(m => { o[m.id] = true }); setChk(o); setSaved(false) }} style={S.btn('#0ea888', true)}>Tous</button>
              <button onClick={() => { setChk({}); setSaved(false) }} style={S.btn('#8892a8', true)}>Aucun</button>
              <button onClick={handleSave} style={S.btn('#1a9c60', false)}>{saved ? '✓ Enregistré' : '💾 Sauver'}</button>
              {existing.length > 0 && <button onClick={handleDelete} style={S.btn('#e03050', true)}>🗑 Suppr. date</button>}
            </div>
          </div>

          <div style={{ padding: '8px 10px', background: '#3060d008', borderRadius: 6, marginBottom: 10, fontSize: 11, color: '#3060d0', borderLeft: '3px solid #3060d0' }}>
            {existing.length > 0
              ? `💡 ${existing.length} enregistrement(s) existent. Modifiez et sauvez pour mettre à jour. Si erreur, « Suppr. date ».`
              : '💡 Cochez les présents et sauvez. Les non-cochés = absents. Vous pouvez compléter plus tard.'}
          </div>

          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Filtrer..."
            style={{ ...S.inp, marginBottom: 8 }} />

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filtered.map(m => (
              <div key={m.id} onClick={() => { setChk(prev => ({ ...prev, [m.id]: !prev[m.id] })); setSaved(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', borderBottom: '1px solid #e0e4ec', cursor: 'pointer', background: chk[m.id] ? '#1a9c6008' : 'transparent' }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, border: '2px solid ' + (chk[m.id] ? '#1a9c60' : '#e0e4ec'), background: chk[m.id] ? '#1a9c60' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>
                  {chk[m.id] ? '✓' : ''}
                </div>
                <span style={{ fontSize: 12, flex: 1 }}>{m.prenom} {m.nom}</span>
                <span style={{ fontSize: 10, color: '#8892a8' }}>{m.role}</span>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: '#8892a8', fontSize: 12 }}>Aucun membre éligible</div>}
          </div>
        </div>
      )}
    </div>
  )
}
