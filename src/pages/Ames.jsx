import { useState } from 'react'
import { S, fmtS, getStatutColor, getRoleColor, validEmail, validTel } from '../lib/ui'
import { supabase } from '../lib/supabase'

export default function AmesPage({ membres, actifs, refs, openFiche, showToast, reloadMembres, presences, entretiens, setPage }) {
  const [q, setQ] = useState('')
  const [fRole, setFRole] = useState('all')
  const [fSt, setFSt] = useState('actifs')
  const [modal, setModal] = useState(null)
  const [fd, setFd] = useState({})
  const [confirmAction, setConfirmAction] = useState(null)
  const uf = (k, v) => setFd(prev => ({ ...prev, [k]: v }))

  const filt = membres.filter(m => {
    if (fSt === 'actifs' && m.archive) return false
    if (fSt === 'Archivé' && !m.archive) return false
    if (fSt !== 'all' && fSt !== 'actifs' && fSt !== 'Archivé' && m.statut !== fSt) return false
    if (fRole !== 'all' && m.role !== fRole) return false
    if (q) return (m.nom + ' ' + m.prenom).toLowerCase().includes(q.toLowerCase())
    return !m.archive
  }).sort((a, b) => a.nom.localeCompare(b.nom))

  const leaders = actifs.filter(m => {
    const role = (refs.roles || []).find(r => r.nom === m.role)
    return role?.peut_suivre
  })

  const taux = (id) => {
    const culte = (refs.activites || []).find(a => a.code === 'culte')
    if (!culte) return null
    const ps = presences.filter(p => p.membre_id === id && p.activite_id === culte.id && p.eligible)
    if (!ps.length) return null
    return Math.round(ps.filter(p => p.present).length / ps.length * 100)
  }

  const mEn = (id) => entretiens.filter(e => e.membre_id === id).length
  const getSuiveur = (id) => { if (!id) return '—'; const m = membres.find(x => x.id === id); return m ? `${m.prenom} ${m.nom}` : '—' }
  const getSuivis = (id) => actifs.filter(m => m.suivi_par === id)

  // Détection doublons
  const hasDuplicate = (nom, prenom, excludeId) => {
    return membres.some(m => m.id !== excludeId && (m.nom || '').toLowerCase() === (nom || '').toLowerCase() && (m.prenom || '').toLowerCase() === (prenom || '').toLowerCase())
  }

  const handleSave = async () => {
    // Validation email/téléphone
    if (fd.email && !validEmail(fd.email)) { showToast('⚠ Email invalide'); return }
    if (fd.telephone && !validTel(fd.telephone)) { showToast('⚠ Téléphone invalide'); return }

    // Détection doublons
    const isEdit = modal === 'edit' && fd.id
    if (hasDuplicate(fd.nom, fd.prenom, isEdit ? fd.id : '')) {
      setConfirmAction({
        msg: `${fd.prenom} ${fd.nom} existe déjà. Créer quand même ?`,
        fn: () => doSave()
      })
      return
    }

    // Vérification rétrogradation rôle
    if (isEdit) {
      const old = membres.find(m => m.id === fd.id)
      const oldRole = (refs.roles || []).find(r => r.nom === old?.role)
      const newRole = (refs.roles || []).find(r => r.nom === fd.role)
      if (oldRole?.peut_suivre && !newRole?.peut_suivre) {
        const suivis = getSuivis(fd.id)
        if (suivis.length > 0) {
          setFd(prev => ({ ...prev, _reassignFrom: fd.id, _reassignSuivis: suivis }))
          setModal('reassign')
          return
        }
      }
    }

    await doSave()
  }

  const doSave = async () => {
    try {
      const isEdit = (modal === 'edit' || modal === 'add') && fd.id && membres.some(m => m.id === fd.id)
      if (isEdit) {
        const { id, created_at, created_by, updated_at, updated_by, _reassignFrom, _reassignSuivis, ...updates } = fd
        await supabase.from('membres').update(updates).eq('id', id)
        showToast('✓ Membre modifié')
      } else {
        const { id, _reassignFrom, _reassignSuivis, ...data } = fd
        await supabase.from('membres').insert({ ...data, statut: data.statut || 'Nouveau', role: data.role || 'Membre' })
        showToast('✓ Membre ajouté')
      }
      await reloadMembres()
      setModal(null); setFd({})
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  // Réassignation après rétrogradation
  const doReassign = async () => {
    try {
      const { _reassignFrom, _reassignSuivis, _newSuivId, ...memberUpdates } = fd
      // Mettre à jour le membre (changement de rôle)
      const { id, created_at, created_by, updated_at, updated_by, ...updates } = memberUpdates
      await supabase.from('membres').update(updates).eq('id', _reassignFrom)
      // Réassigner les suivis
      if (_newSuivId) {
        for (const s of _reassignSuivis) {
          await supabase.from('membres').update({ suivi_par: _newSuivId }).eq('id', s.id)
        }
      }
      showToast('✓ Rôle modifié et suivis réassignés')
      await reloadMembres()
      setModal(null); setFd({})
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Rechercher..." style={{ ...S.inp, flex: '1', minWidth: 120 }} />
        <select value={fRole} onChange={e => setFRole(e.target.value)} style={{ ...S.inp, width: 'auto' }}>
          <option value="all">Tous rôles</option>
          {(refs.roles || []).map(r => <option key={r.nom} value={r.nom}>{r.nom}</option>)}
        </select>
        <select value={fSt} onChange={e => setFSt(e.target.value)} style={{ ...S.inp, width: 'auto' }}>
          <option value="all">Tous statuts</option>
          <option value="actifs">Actifs seulement</option>
          {(refs.statuts || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}
        </select>
        <button onClick={() => { setFd({ statut: 'Nouveau', role: 'Membre' }); setModal('add') }} style={S.btn('#0ea888', false)}>+ Âme</button>
      </div>

      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Nom', 'Rôle', 'Inscription', 'Suivi par', 'Statut', 'Prés.', 'Ent.'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filt.length === 0 ? <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#8892a8' }}>Aucune âme. <span onClick={() => { setFd({}); setModal('add') }} style={{ color: '#0ea888', cursor: 'pointer', textDecoration: 'underline' }}>+ Ajouter</span></td></tr>
              : filt.map(m => {
                const t = taux(m.id)
                return (
                  <tr key={m.id} onClick={() => openFiche(m.id)} style={{ cursor: 'pointer', opacity: m.archive ? 0.5 : 1 }}>
                    <td style={S.td}><span style={{ fontWeight: 600, color: '#0ea888' }}>{m.prenom} {m.nom}</span></td>
                    <td style={S.td}><span style={S.pill(getRoleColor(refs, m.role))}>{m.role}</span></td>
                    <td style={{ ...S.td, color: '#5a6480' }}>{fmtS(m.date_inscription)}</td>
                    <td style={{ ...S.td, color: '#5a6480' }}>{getSuiveur(m.suivi_par)}</td>
                    <td style={S.td}><span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span></td>
                    <td style={{ ...S.td, fontWeight: 600, color: t !== null ? (t >= 80 ? '#1a9c60' : t >= 50 ? '#d48f00' : '#e03050') : '#8892a8' }}>{t !== null ? t + '%' : '—'}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: mEn(m.id) ? '#3060d0' : '#8892a8' }}>{mEn(m.id)}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Modal ajout/édition */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Georgia, serif' }}>{modal === 'edit' ? 'Modifier' : 'Nouveau membre'}</div>
            </div>
            <div style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Nom</label><input value={fd.nom || ''} onChange={e => uf('nom', e.target.value)} style={S.inp} /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Prénom</label><input value={fd.prenom || ''} onChange={e => uf('prenom', e.target.value)} style={S.inp} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Téléphone</label><input value={fd.telephone || ''} onChange={e => uf('telephone', e.target.value)} style={{ ...S.inp, borderColor: fd.telephone && !validTel(fd.telephone) ? '#e03050' : '#c8cfe0' }} placeholder="+225 07..." /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Email</label><input value={fd.email || ''} onChange={e => uf('email', e.target.value)} style={{ ...S.inp, borderColor: fd.email && !validEmail(fd.email) ? '#e03050' : '#c8cfe0' }} type="email" /></div>
              </div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Date d'inscription</label><input value={fd.date_inscription || ''} onChange={e => uf('date_inscription', e.target.value)} style={S.inp} type="date" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut || 'Nouveau'} onChange={e => uf('statut', e.target.value)} style={S.inp}>{(refs.statuts || []).filter(s => !s.est_archive).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Rôle</label><select value={fd.role || 'Membre'} onChange={e => { uf('role', e.target.value); if (e.target.value === 'Berger principal') uf('suivi_par', null) }} style={S.inp}>{(refs.roles || []).map(r => <option key={r.nom} value={r.nom}>{r.nom}</option>)}</select></div>
              </div>
              {(fd.role !== 'Berger principal') && <div style={{ marginBottom: 8 }}><label style={S.label}>Suivi par</label><select value={fd.suivi_par || ''} onChange={e => uf('suivi_par', e.target.value || null)} style={S.inp}><option value="">— Aucun —</option>{leaders.filter(l => l.id !== fd.id).map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom} ({l.role})</option>)}</select></div>}
              <div style={{ marginBottom: 8 }}><label style={S.label}>Notes</label><textarea value={fd.notes || ''} onChange={e => uf('notes', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#8892a8', true)}>Annuler</button>
              <button onClick={handleSave} style={S.btn('#0ea888', false)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal réassignation (rétrogradation rôle) */}
      {modal === 'reassign' && fd._reassignSuivis && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#d48f00' }}>⚠ Réassigner avant changement de rôle</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: '#5a6480', marginBottom: 10 }}>Ce membre suit {fd._reassignSuivis.length} personne(s). Choisissez un nouveau responsable :</div>
              <div style={{ marginBottom: 8, padding: '8px 10px', background: '#f0f2f6', borderRadius: 6, fontSize: 11, color: '#5a6480' }}>
                {fd._reassignSuivis.map(s => s.prenom + ' ' + s.nom).join(', ')}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Nouveau responsable</label>
                <select value={fd._newSuivId || ''} onChange={e => uf('_newSuivId', e.target.value || null)} style={S.inp}>
                  <option value="">— Choisir —</option>
                  {leaders.filter(l => l.id !== fd._reassignFrom).map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom} ({l.role})</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#8892a8', true)}>Annuler</button>
              <button onClick={doReassign} style={S.btn('#d48f00', false)}>Réassigner et modifier</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation (doublons) */}
      {confirmAction && (
        <div className="modal-overlay danger">
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div style={{ padding: '20px 24px' }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Confirmation</div><div style={{ fontSize: 13, color: '#5a6480', lineHeight: 1.6 }}>{confirmAction.msg}</div></div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmAction(null)} style={S.btn('#8892a8', true)}>Annuler</button>
              <button onClick={() => { confirmAction.fn(); setConfirmAction(null) }} style={S.btn('#e03050', false)}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
