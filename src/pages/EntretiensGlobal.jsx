import { useState } from 'react'
import { S, fmtS, today } from '../lib/ui'
import { Plus, AlertTriangle } from 'lucide-react'

export default function EntretiensPage({ entretiens, membres, actifs, refs, h, openFiche, ajouterEnt, showToast }) {
  const [modal, setModal] = useState(null)
  const [fd, setFd] = useState({})
  const [showCount, setShowCount] = useState(30)
  const [fDateDe, setFDateDe] = useState('')
  const [fDateA, setFDateA] = useState('')
  const [fAvec, setFAvec] = useState('')
  const [fStatut, setFStatut] = useState('')
  const uf = (k, v) => setFd(prev => ({ ...prev, [k]: v }))

  // Statut "planifié" = ordre 2 dans ref_statuts_entretien (dynamique)
  const plannedStatus = (refs.statutsEntretien || []).find(s => s.ordre === 2)?.nom

  const all = entretiens.map(e => {
    const m = membres.find(x => x.id === e.membre_id)
    const sujet = e.sujet_libre || (refs.sujetsEntretien || []).find(s => s.id === e.sujet_id)?.nom || ''
    const avecM = membres.find(x => x.id === e.avec_qui)
    return m ? { ...e, mn: m.prenom + ' ' + m.nom, sujet, avecNom: avecM ? avecM.prenom + ' ' + avecM.nom : '—' } : null
  }).filter(Boolean)
    .filter(e => {
      if (fDateDe && e.date_entretien < fDateDe) return false
      if (fDateA && e.date_entretien > fDateA) return false
      if (fAvec && e.avec_qui !== fAvec) return false
      if (fStatut && e.statut !== fStatut) return false
      return true
    })

  // Entretiens planifiés en retard
  const planifiesRetard = plannedStatus ? all.filter(e => e.statut === plannedStatus && e.date_entretien && new Date(e.date_entretien) < new Date(today())) : []

  const stColor = (s) => (refs.statutsEntretien || []).find(x => x.nom === s)?.couleur || '#6b7280'

  const handleSave = async () => {
    if (!fd.membre_id) { showToast('⚠ Sélectionnez un membre'); return }
    try {
      await ajouterEnt({ membre_id: fd.membre_id, date_entretien: fd.date_entretien || today(), avec_qui: fd.avec_qui || null, sujet_id: fd.sujet_id || null, sujet_libre: fd.sujet_libre || null, statut: fd.statut || h.defaultStatutEnt, commentaires: fd.commentaires || '' })
      setModal(null); setFd({})
    } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
  }

  return (
    <div>
      {planifiesRetard.length > 0 && (
        <div style={{ ...S.card, borderLeft: '3px solid #d48f00', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#d48f00', marginBottom: 6 }}><AlertTriangle size={14} /> {planifiesRetard.length} entretien(s) planifié(s) en retard</div>
          {planifiesRetard.map(e => (
            <div key={e.id} onClick={() => openFiche(e.membre_id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 0', borderBottom: '1px solid #e0e4ec', cursor: 'pointer' }}>
              <span style={{ color: '#e03050', width: 65, flexShrink: 0 }}>{fmtS(e.date_entretien)}</span>
              <span style={{ fontWeight: 600, color: '#0ea888' }}>{e.mn}</span>
              <span style={{ color: '#5a6480', flex: 1 }}>{e.sujet}</span>
            </div>
          ))}
        </div>
      )}

      <div style={S.card}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
          <input type="date" value={fDateDe} onChange={e => setFDateDe(e.target.value)} title="Du" style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 12, boxSizing: 'border-box' }} />
          <input type="date" value={fDateA} onChange={e => setFDateA(e.target.value)} title="Au" style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 12, boxSizing: 'border-box' }} />
          <select value={fAvec} onChange={e => setFAvec(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 12 }}>
            <option value="">Tous les accompagnants</option>
            {actifs.filter(m => h.canSuivre(m.role)).map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
          </select>
          <select value={fStatut} onChange={e => setFStatut(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 12 }}>
            <option value="">Tous statuts</option>
            {(refs.statutsEntretien || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}
          </select>
          {(fDateDe || fDateA || fAvec || fStatut) && <button onClick={() => { setFDateDe(''); setFDateA(''); setFAvec(''); setFStatut('') }} style={{ background: 'none', border: 'none', fontSize: 11, color: '#e03050', cursor: 'pointer' }}>✕ Effacer</button>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Entretiens ({all.length})</div>
          <button onClick={() => { setFd({ statut: h.defaultStatutEnt, date_entretien: today() }); setModal('new') }} style={{ ...S.btn('#3060d0', false), display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={13} /> Entretien</button>
        </div>
        {all.length === 0 ? <div style={{ padding: 12, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Aucun entretien enregistré. <span onClick={() => { setFd({ statut: h.defaultStatutEnt, date_entretien: today() }); setModal('new') }} style={{ color: '#3060d0', cursor: 'pointer', textDecoration: 'underline' }}>Créer le premier</span></div>
          : <div>
            {/* Desktop */}
            <div className="desk-only">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Date', 'Âme', 'Avec', 'Sujet', 'Statut'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>{all.slice(0, showCount).map(e => (
                  <tr key={e.id} onClick={() => openFiche(e.membre_id)} style={{ cursor: 'pointer' }}>
                    <td style={{ ...S.td, color: '#5a6480' }}>{fmtS(e.date_entretien)}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#0ea888' }}>{e.mn}</td>
                    <td style={{ ...S.td, color: '#5a6480' }}>{e.avecNom}</td>
                    <td style={S.td}>{e.sujet}</td>
                    <td style={S.td}><span style={S.pill(stColor(e.statut))}>{e.statut}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="mob-only">
              {all.slice(0, showCount).map(e => (
                <div key={e.id} onClick={() => openFiche(e.membre_id)} style={{ padding: '10px 6px', borderBottom: '1px solid #e0e4ec', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0ea888' }}>{e.mn}</span>
                    <span style={S.pill(stColor(e.statut))}>{e.statut}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{fmtS(e.date_entretien)} · {e.avecNom}{e.sujet ? ' · ' + e.sujet : ''}</div>
                </div>
              ))}
            </div>
            {all.length > showCount && (
              <div onClick={() => setShowCount(prev => prev + 30)} style={{ padding: '10px 0', textAlign: 'center', fontSize: 13, color: '#0ea888', fontWeight: 600, cursor: 'pointer' }}>
                Voir plus ({all.length - showCount} restants)
              </div>
            )}
          </div>}
      </div>

      {modal === 'new' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Nouvel entretien</div></div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Membre</label><select value={fd.membre_id || ''} onChange={e => uf('membre_id', e.target.value || null)} style={S.inp}><option value="">— Choisir —</option>{actifs.sort((a, b) => a.nom.localeCompare(b.nom)).map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}</select></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Date</label><input value={fd.date_entretien || today()} onChange={e => uf('date_entretien', e.target.value)} style={S.inp} type="date" /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut || h.defaultStatutEnt} onChange={e => uf('statut', e.target.value)} style={S.inp}>{(refs.statutsEntretien || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Avec qui</label><select value={fd.avec_qui || ''} onChange={e => uf('avec_qui', e.target.value || null)} style={S.inp}><option value="">— Choisir —</option>{actifs.filter(x => h.canFollow(x.role)).sort((a, b) => { const niv = (r) => (refs.roles || []).find(ro => ro.nom === r)?.niveau ?? 99; return niv(a.role) - niv(b.role) || a.nom.localeCompare(b.nom) }).map(x => <option key={x.id} value={x.id}>{x.prenom} {x.nom} ({x.role})</option>)}</select></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Sujet</label><select value={fd.sujet_id || ''} onChange={e => { uf('sujet_id', e.target.value || null); if (e.target.value) uf('sujet_libre', null) }} style={S.inp}><option value="">— Libre —</option>{(refs.sujetsEntretien || []).map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></div>
              {!fd.sujet_id && <div style={{ marginBottom: 8 }}><label style={S.label}>Sujet libre</label><input value={fd.sujet_libre || ''} onChange={e => uf('sujet_libre', e.target.value)} style={S.inp} /></div>}
              <div style={{ marginBottom: 8 }}><label style={S.label}>Commentaires</label><textarea value={fd.commentaires || ''} onChange={e => uf('commentaires', e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#6b7280', true)}>Annuler</button>
              <button onClick={handleSave} style={S.btn('#3060d0', false)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
