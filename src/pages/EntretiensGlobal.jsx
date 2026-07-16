import { useState } from 'react'
import { S, fmtS, today } from '../lib/ui'
import { Plus, AlertTriangle } from 'lucide-react'

export default function EntretiensPage({ entretiens, membres, actifs, refs, h, openFiche, ajouterEnt, showToast }) {
  const [modal, setModal] = useState(null)
  const [fd, setFd] = useState({})
  const [showCount, setShowCount] = useState(30)
  const uf = (k, v) => setFd(prev => ({ ...prev, [k]: v }))

  // Statut "planifié" = ordre 2 dans ref_statuts_entretien (dynamique)
  const plannedStatus = (refs.statutsEntretien || []).find(s => s.ordre === 2)?.nom

  const all = entretiens.map(e => {
    const m = membres.find(x => x.id === e.membre_id)
    const sujet = e.sujet_libre || (refs.sujetsEntretien || []).find(s => s.id === e.sujet_id)?.nom || ''
    const avecM = membres.find(x => x.id === e.avec_qui)
    return m ? { ...e, mn: m.prenom + ' ' + m.nom, sujet, avecNom: avecM ? avecM.prenom + ' ' + avecM.nom : '—' } : null
  }).filter(Boolean)

  // Entretiens planifiés en retard
  const planifiesRetard = plannedStatus ? all.filter(e => e.statut === plannedStatus && e.date_entretien && new Date(e.date_entretien) < new Date(today())) : []

  const stColor = (s) => (refs.statutsEntretien || []).find(x => x.nom === s)?.couleur || '#8892a8'

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#d48f00', marginBottom: 6 }}><AlertTriangle size={14} /> {planifiesRetard.length} entretien(s) planifié(s) en retard</div>
          {planifiesRetard.map(e => (
            <div key={e.id} onClick={() => openFiche(e.membre_id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '3px 0', borderBottom: '1px solid #e0e4ec', cursor: 'pointer' }}>
              <span style={{ color: '#e03050', width: 65, flexShrink: 0 }}>{fmtS(e.date_entretien)}</span>
              <span style={{ fontWeight: 600, color: '#0ea888' }}>{e.mn}</span>
              <span style={{ color: '#5a6480', flex: 1 }}>{e.sujet}</span>
            </div>
          ))}
        </div>
      )}

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Tous les entretiens ({all.length})</div>
          <button onClick={() => { setFd({ statut: h.defaultStatutEnt, date_entretien: today() }); setModal('new') }} style={{ ...S.btn('#3060d0', false), display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={13} /> Entretien</button>
        </div>
        {all.length === 0 ? <div style={{ padding: 12, textAlign: 'center', color: '#8892a8', fontSize: 12 }}>Aucun entretien enregistré.</div>
          : <div>
            {/* Desktop */}
            <div className="desk-only">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Date', 'Âme', 'Avec qui', 'Sujet', 'Statut'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
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
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0ea888' }}>{e.mn}</span>
                    <span style={S.pill(stColor(e.statut))}>{e.statut}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#8892a8' }}>{fmtS(e.date_entretien)} · {e.avecNom}{e.sujet ? ' · ' + e.sujet : ''}</div>
                </div>
              ))}
            </div>
            {all.length > showCount && (
              <div onClick={() => setShowCount(prev => prev + 30)} style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, color: '#0ea888', fontWeight: 600, cursor: 'pointer' }}>
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
              <div style={{ marginBottom: 8 }}><label style={S.label}>Avec qui</label><select value={fd.avec_qui || ''} onChange={e => uf('avec_qui', e.target.value || null)} style={S.inp}><option value="">— Choisir —</option>{actifs.sort((a, b) => { const o = (() => { const m = {}; (refs.roles || []).forEach(r => m[r.nom] = r.niveau ?? 99); return m })(); return (o[a.role] ?? 2) - (o[b.role] ?? 2) }).map(x => <option key={x.id} value={x.id}>{x.prenom} {x.nom}{x.role !== h.defaultRole ? ' (' + x.role + ')' : ''}</option>)}</select></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Sujet</label><select value={fd.sujet_id || ''} onChange={e => { uf('sujet_id', e.target.value || null); if (e.target.value) uf('sujet_libre', null) }} style={S.inp}><option value="">— Libre —</option>{(refs.sujetsEntretien || []).map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></div>
              {!fd.sujet_id && <div style={{ marginBottom: 8 }}><label style={S.label}>Sujet libre</label><input value={fd.sujet_libre || ''} onChange={e => uf('sujet_libre', e.target.value)} style={S.inp} /></div>}
              <div style={{ marginBottom: 8 }}><label style={S.label}>Commentaires</label><textarea value={fd.commentaires || ''} onChange={e => uf('commentaires', e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#8892a8', true)}>Annuler</button>
              <button onClick={handleSave} style={S.btn('#3060d0', false)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
