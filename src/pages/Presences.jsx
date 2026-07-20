import { useState, useEffect } from 'react'
import { S, fmt, today } from '../lib/ui'
import { Save, Trash2, CheckSquare, Square, Search } from 'lucide-react'

export default function PresencesPage({ actifs, presences, refs, enregistrerPresences, supprimerDate, auth, datesAnnulees, ajouterDateAnnulee, supprimerDateAnnulee, showToast, openFiche }) {
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
    // On ne met dans le state QUE les présences pour les membres actuellement éligibles
    const eligIds = new Set(actifs.filter(m => {
      if (m.date_inscription && new Date(m.date_inscription) > new Date(date)) return false
      if (m.est_retour && m.date_depart) {
        const dep = new Date(m.date_depart)
        const ret = m.date_retour ? new Date(m.date_retour) : new Date('9999-12-31')
        const d = new Date(date)
        if (d >= dep && d < ret) return false
      }
      return true
    }).map(m => m.id))
    presences.filter(p => p.activite_id === actId && p.date_presence === date && p.present && eligIds.has(p.membre_id))
      .forEach(p => { obj[p.membre_id] = true })
    setChk(obj)
  }, [actId, date, presences, actifs])
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

  if (!activites.length) return (
    <div style={{ ...S.card, textAlign: 'center', color: '#6b7280', fontSize: 14, lineHeight: 1.7, padding: 30 }}>
      Aucune activité configurée pour votre famille.<br />
      Demandez à un admin d'en créer dans <strong>Paramètres → Activités</strong>.
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        {/* Desktop: boutons */}
        <div className="desk-only" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {activites.map(a => (
            <button key={a.id} onClick={() => setActId(a.id)} style={{
              padding: '6px 10px', borderRadius: 7, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
              border: '1px solid ' + (actId === a.id ? a.couleur : '#e0e4ec'),
              background: actId === a.id ? a.couleur + '12' : 'transparent',
              color: actId === a.id ? a.couleur : '#5a6480', fontWeight: actId === a.id ? 600 : 500,
              whiteSpace: 'nowrap'
            }}>{a.icone} {a.nom}</button>
          ))}
        </div>
        {/* Mobile: dropdown compact */}
        <select className="mob-only" value={actId} onChange={e => setActId(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 7, border: '1px solid ' + (act?.couleur || '#c8cfe0'), background: (act?.couleur || '#0ea888') + '10', color: act?.couleur || '#5a6480', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
          {activites.map(a => <option key={a.id} value={a.id}>{a.icone} {a.nom}</option>)}
        </select>
        <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 12, fontFamily: 'inherit', marginLeft: 'auto' }} />
      </div>

      {/* Date annulée ? */}
      {(() => {
        const cancelled = (datesAnnulees || []).find(d => d.activite_id === actId && d.date_annulee === date)
        if (cancelled) return (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: '#d48f0010', border: '1px solid #d48f0033', fontSize: 13, color: '#d48f00', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Cette date a été annulée{cancelled.motif ? ' : ' + cancelled.motif : ''}. Les absences ne comptent pas.</span>
            <button onClick={async () => { await supprimerDateAnnulee(cancelled.id) }} style={{ background: 'none', border: '1px solid #d48f00', borderRadius: 5, padding: '3px 10px', fontSize: 12, color: '#d48f00', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', marginLeft: 8 }}>Rétablir</button>
          </div>
        )
        return null
      })()}

      {isFuture ? (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#e0305008', border: '1px solid #e0305033', fontSize: 13, color: '#e03050' }}>
          Impossible de saisir des présences pour une date future.
        </div>
      ) : (
        <div style={S.card}>
          {(() => {
            // Détection présences orphelines (present=true mais membre plus éligible)
            const eligIds = new Set(eligible.map(m => m.id))
            const orphelines = existing.filter(p => p.present && !eligIds.has(p.membre_id))
            if (orphelines.length === 0) return null
            const noms = orphelines.map(p => {
              const m = actifs.find(x => x.id === p.membre_id)
              return m ? m.prenom + ' ' + m.nom : 'Membre inconnu'
            })
            return (
              <div style={{ padding: '10px 12px', background: '#d48f0010', border: '1px solid #d48f0033', borderRadius: 6, marginBottom: 10, fontSize: 12, color: '#633806' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>⚠ Présence(s) enregistrée(s) mais membre non éligible ce jour</div>
                <div style={{ marginBottom: 6 }}>{noms.join(', ')} — probablement une date d'inscription changée après la saisie. Non comptée(s) dans les statistiques.</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => {
                    const first = orphelines[0]
                    const m = actifs.find(x => x.id === first.membre_id)
                    if (m) { openFiche(m.id) }
                  }} style={{ background: '#fff', border: '1px solid #d48f0055', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: '#633806', cursor: 'pointer', fontFamily: 'inherit' }}>Ouvrir la fiche pour ajuster la date d'inscription</button>
                  <button onClick={() => setConfirmAction({ msg: 'Supprimer ' + orphelines.length + ' présence(s) orpheline(s) ? Cette action est définitive.', fn: async () => {
                    try {
                      const { supabase } = await import('../lib/supabase')
                      const ids = orphelines.map(p => p.id)
                      const { error } = await supabase.from('presences').delete().in('id', ids)
                      if (error) throw error
                      showToast('✓ ' + orphelines.length + ' présence(s) supprimée(s)')
                    } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
                  } })} style={{ background: '#fff', border: '1px solid #e0305055', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: '#791F1F', cursor: 'pointer', fontFamily: 'inherit' }}>Supprimer ces présences</button>
                </div>
              </div>
            )
          })()}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{act?.icone} {act?.nom} — {fmt(date)}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {nChecked}/{eligible.length} coché(s){existing.length > 0 ? ' · Déjà enregistré' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <button onClick={() => { const o = {}; eligible.forEach(m => { o[m.id] = true }); setChk(o); setSaved(false) }} style={{ ...S.btn('#0ea888', true), padding: '5px 10px', fontSize: 12 }}>Tous</button>
              <button onClick={() => { setChk({}); setSaved(false) }} style={{ ...S.btn('#6b7280', true), padding: '5px 10px', fontSize: 12 }}>Aucun</button>
              {existing.length > 0 && <button onClick={handleDelete} style={{ ...S.btn('#e03050', true), display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12 }}><Trash2 size={13} /> Suppr.</button>}
              {!(datesAnnulees || []).some(d => d.activite_id === actId && d.date_annulee === date) && (
                <button onClick={() => setConfirmAction({ msg: 'Annuler cette date ? Les absences ne seront pas comptabilisées.', input: true, fn: async (motif) => { try { await ajouterDateAnnulee(actId, date, motif || null) } catch(e) {} } })} style={{ ...S.btn('#d48f00', true), padding: '5px 10px', fontSize: 12 }}>Annuler date</button>
              )}
            </div>
          </div>

          {existing.length > 0 && existing[0]?.created_by && auth?.session?.user?.id && existing[0].created_by !== auth.session.user.id && (
            <div style={{ padding: '6px 10px', background: '#FAEEDA', borderRadius: 6, marginBottom: 10, fontSize: 12, color: '#633806', borderLeft: '3px solid #d48f00' }}>
              Saisies par un autre responsable. Enregistrer écrasera ses données.
            </div>
          )}

          {eligible.length >= 15 && (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#6b7280' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrer..."
                style={{ ...S.inp, paddingLeft: 30 }} />
            </div>
          )}

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filtered.map(m => (
              <div key={m.id} onClick={() => { setChk(prev => ({ ...prev, [m.id]: !prev[m.id] })); setSaved(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderBottom: '1px solid #e0e4ec', cursor: 'pointer', background: chk[m.id] ? '#1a9c6008' : 'transparent', minHeight: 44 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, border: '2px solid ' + (chk[m.id] ? '#1a9c60' : '#e0e4ec'), background: chk[m.id] ? '#1a9c60' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', flexShrink: 0 }}>
                  {chk[m.id] ? '✓' : ''}
                </div>
                <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.prenom} {m.nom}</span>
                <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>{m.role}</span>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Aucun membre éligible</div>}
          </div>

          {/* Barre sticky en bas — Enregistrer */}
          <div className="sticky-save" style={{ position: 'sticky', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e0e4ec', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, boxShadow: '0 -2px 8px rgba(0,0,0,.06)', borderRadius: '0 0 12px 12px' }}>
            <div style={{ fontSize: 13, color: '#5a6480' }}>
              <strong style={{ fontSize: 16, color: '#1a1e2e' }}>{nChecked}</strong> / {eligible.length}
            </div>
            <button onClick={handleSave} style={{ ...S.btn(saved ? '#6b7280' : '#1a9c60', false), display: 'flex', alignItems: 'center', gap: 5, padding: '10px 20px', fontSize: 14 }}>
              {saved ? <><CheckSquare size={15} /> Enregistré</> : <><Save size={15} /> Enregistrer</>}
            </button>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="modal-overlay danger">
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div style={{ padding: '20px 24px' }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Confirmation</div><div style={{ fontSize: 14, color: '#5a6480', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{confirmAction.msg}</div></div>
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
