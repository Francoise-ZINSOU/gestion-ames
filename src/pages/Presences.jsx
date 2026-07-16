import { useState, useEffect } from 'react'
import { S, fmt, today } from '../lib/ui'
import { Save, Trash2, CheckSquare, Square, Search } from 'lucide-react'

export default function PresencesPage({ actifs, presences, refs, enregistrerPresences, supprimerDate, auth, datesAnnulees, ajouterDateAnnulee, supprimerDateAnnulee, showToast }) {
  const activites = refs.activites || []
  const [actId, setActId] = useState(activites[0]?.id || '')
  const [date, setDate] = useState(today())
  const [chk, setChk] = useState({})
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => { if (!actId && activites.length) setActId(activites[0].id) }, [activites])
  useEffect(() => {
    const obj = {}
    presences.filter(p => p.activite_id === actId && p.date_presence === date && p.present)
      .forEach(p => { obj[p.membre_id] = true })
    setChk(obj)
  }, [actId, date, presences])
  useEffect(() => { setSaved(false) }, [actId, date])

  const isFuture = new Date(date) > new Date(today())
  const act = activites.find(a => a.id === actId)

  const eligible = actifs.filter(m => {
    if (m.date_inscription && new Date(m.date_inscription) > new Date(date)) return false
    if (m.est_retour && m.date_depart) {
      const dep = new Date(m.date_depart)
      const ret = m.date_retour ? new Date(m.date_retour) : new Date('9999-12-31')
      if (new Date(date) >= dep && new Date(date) < ret) return false
    }
    return true
  }).sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom))

  const filtered = search ? eligible.filter(m => (m.nom + ' ' + m.prenom).toLowerCase().includes(search.toLowerCase())) : eligible
  const existing = presences.filter(p => p.activite_id === actId && p.date_presence === date)
  const nChecked = Object.keys(chk).filter(k => chk[k]).length

  const handleSave = async () => {
    const presentIds = Object.keys(chk).filter(k => chk[k])
    try {
      await enregistrerPresences(actId, date, presentIds)
      setSaved(true)
    } catch (e) { /* w() gère le toast */ }
  }

  const handleDelete = () => {
    setConfirmAction({
      msg: `Supprimer TOUTES les présences du ${fmt(date)} pour ${act?.nom} ?\n\nCette action est irréversible.`,
      fn: async () => { await supprimerDate(actId, date); setChk({}); setSaved(false) }
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        {activites.map(a => (
          <button key={a.id} onClick={() => setActId(a.id)} style={{
            padding: '6px 10px', borderRadius: 7, fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
            border: '1px solid ' + (actId === a.id ? a.couleur : '#e0e4ec'),
            background: actId === a.id ? a.couleur + '12' : 'transparent',
            color: actId === a.id ? a.couleur : '#5a6480', fontWeight: actId === a.id ? 600 : 500,
            whiteSpace: 'nowrap'
          }}>{a.icone} {a.nom}</button>
        ))}
        <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 11, fontFamily: 'inherit', marginLeft: 'auto' }} />
      </div>

      {/* Date annulée ? */}
      {(() => {
        const cancelled = (datesAnnulees || []).find(d => d.activite_id === actId && d.date_annulee === date)
        if (cancelled) return (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: '#d48f0010', border: '1px solid #d48f0033', fontSize: 12, color: '#d48f00', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Cette date a été annulée{cancelled.motif ? ' : ' + cancelled.motif : ''}. Les absences ne comptent pas.</span>
            <button onClick={async () => { try { await supprimerDateAnnulee(cancelled.id) } catch(e) {} }} style={{ background: 'none', border: '1px solid #d48f00', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: '#d48f00', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', marginLeft: 8 }}>Rétablir</button>
          </div>
        )
        return null
      })()}

      {isFuture ? (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#e0305008', border: '1px solid #e0305033', fontSize: 12, color: '#e03050' }}>
          Impossible de saisir des présences pour une date future.
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{act?.icone} {act?.nom} — {fmt(date)}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                {nChecked}/{eligible.length} coché(s){existing.length > 0 ? ' · Déjà enregistré' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <button onClick={() => { const o = {}; eligible.forEach(m => { o[m.id] = true }); setChk(o); setSaved(false) }} style={S.btn('#0ea888', true)}>Tous</button>
              <button onClick={() => { setChk({}); setSaved(false) }} style={S.btn('#6b7280', true)}>Aucun</button>
              {existing.length > 0 && <button onClick={handleDelete} style={{ ...S.btn('#e03050', true), display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={13} /> Suppr.</button>}
              {!(datesAnnulees || []).some(d => d.activite_id === actId && d.date_annulee === date) && (
                <button onClick={() => setConfirmAction({ msg: 'Annuler cette date ? Les absences ne seront pas comptabilisées.', input: true, fn: async (motif) => { try { await ajouterDateAnnulee(actId, date, motif || null) } catch(e) {} } })} style={{ ...S.btn('#d48f00', true), fontSize: 10, padding: '4px 8px' }}>Annuler date</button>
              )}
            </div>
          </div>

          <div style={{ padding: '8px 10px', background: '#3060d008', borderRadius: 6, marginBottom: 10, fontSize: 11, color: '#3060d0', borderLeft: '3px solid #3060d0' }}>
            {existing.length > 0
              ? 'Modifiez et enregistrez. Si erreur, « Suppr. »'
              : 'Cochez les présents. Non-cochés = absents.'}
          </div>
          {existing.length > 0 && existing[0]?.created_by && auth?.session?.user?.id && existing[0].created_by !== auth.session.user.id && (
            <div style={{ padding: '6px 10px', background: '#FAEEDA', borderRadius: 6, marginBottom: 10, fontSize: 11, color: '#633806', borderLeft: '3px solid #d48f00' }}>
              Saisies par un autre responsable. Enregistrer écrasera ses données.
            </div>
          )}

          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#6b7280' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrer..."
              style={{ ...S.inp, paddingLeft: 30 }} />
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filtered.map(m => (
              <div key={m.id} onClick={() => { setChk(prev => ({ ...prev, [m.id]: !prev[m.id] })); setSaved(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: '1px solid #e0e4ec', cursor: 'pointer', background: chk[m.id] ? '#1a9c6008' : 'transparent', minHeight: 44 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, border: '2px solid ' + (chk[m.id] ? '#1a9c60' : '#e0e4ec'), background: chk[m.id] ? '#1a9c60' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>
                  {chk[m.id] ? '✓' : ''}
                </div>
                <span style={{ fontSize: 12, flex: 1 }}>{m.prenom} {m.nom}</span>
                <span style={{ fontSize: 10, color: '#6b7280' }}>{m.role}</span>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: '#6b7280', fontSize: 12 }}>Aucun membre éligible</div>}
          </div>

          {/* Barre sticky en bas — Enregistrer */}
          <div className="sticky-save" style={{ position: 'sticky', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e0e4ec', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, boxShadow: '0 -2px 8px rgba(0,0,0,.06)', borderRadius: '0 0 12px 12px' }}>
            <div style={{ fontSize: 12, color: '#5a6480' }}>
              <strong style={{ fontSize: 16, color: '#1a1e2e' }}>{nChecked}</strong> / {eligible.length}
            </div>
            <button onClick={handleSave} style={{ ...S.btn(saved ? '#6b7280' : '#1a9c60', false), display: 'flex', alignItems: 'center', gap: 5, padding: '10px 20px', fontSize: 13 }}>
              {saved ? <><CheckSquare size={15} /> Enregistré</> : <><Save size={15} /> Enregistrer</>}
            </button>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="modal-overlay danger">
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div style={{ padding: '20px 24px' }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Confirmation</div><div style={{ fontSize: 13, color: '#5a6480', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{confirmAction.msg}</div></div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmAction(null)} style={S.btn('#6b7280', true)}>Annuler</button>
              <button onClick={() => { confirmAction.fn(); setConfirmAction(null) }} style={S.btn('#e03050', false)}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
