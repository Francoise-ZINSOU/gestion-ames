import { useState } from 'react'
import { S, fmtS, today, getStatutColor, getRoleColor, validEmail, validTel } from '../lib/ui'
import { Upload, Search } from 'lucide-react'

export default function AmesPage({ membres, actifs, refs, h, openFiche, showToast, reloadMembres, presences, entretiens, setPage, ajouterMembre, modifierMembre, importerCSV, auth }) {
  const [q, setQ] = useState('')
  const [fRole, setFRole] = useState('all')
  const [fSt, setFSt] = useState('actifs')
  const [modal, setModal] = useState(null)
  const [fd, setFd] = useState({})
  const [confirmAction, setConfirmAction] = useState(null)
  const [saving, setSaving] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkSel, setBulkSel] = useState({})
  const uf = (k, v) => setFd(prev => ({ ...prev, [k]: v }))

  // Trouver le membre lié au profil connecté (membre_id direct, sinon fallback email)
  const myMembreId = auth?.profil?.membre_id
  const myEmail = auth?.profil?.email?.toLowerCase()
  const myMembre = myMembreId ? actifs.find(m => m.id === myMembreId) : (myEmail ? actifs.find(m => m.email?.toLowerCase() === myEmail) : null)

  const filt = membres.filter(m => {
    if (fSt === 'actifs' && m.archive) return false
    if (fSt === '__archived' && !m.archive) return false
    if (fSt === '__mysuivis') return myMembre ? m.suivi_par === myMembre.id : false
    if (fSt !== 'all' && fSt !== 'actifs' && fSt !== '__archived' && fSt !== '__mysuivis' && m.statut !== fSt) return false
    if (fRole !== 'all' && m.role !== fRole) return false
    if (q) return (m.nom + ' ' + m.prenom).toLowerCase().includes(q.toLowerCase())
    return !m.archive
  }).sort((a, b) => a.nom.localeCompare(b.nom))

  const leaders = actifs.filter(m => {
    const role = (refs.roles || []).find(r => r.nom === m.role)
    return role?.peut_suivre
  })

  const taux = (id) => {
    const culte = h.culteId ? { id: h.culteId } : null
    if (!culte) return null
    const ps = presences.filter(p => p.membre_id === id && p.activite_id === culte.id && p.eligible)
    if (!ps.length) return null
    return Math.round(ps.filter(p => p.present).length / ps.length * 100)
  }

  const mEn = (id) => entretiens.filter(e => e.membre_id === id).length
  const getSuiveur = (id) => { if (!id) return '—'; const m = membres.find(x => x.id === id); return m ? `${m.prenom} ${m.nom}${m.archive ? ' (archivé)' : ''}` : '—' }
  const getSuivis = (id) => actifs.filter(m => m.suivi_par === id)

  const hasDuplicate = (nom, prenom, excludeId) => {
    return membres.some(m => m.id !== excludeId && (m.nom || '').toLowerCase() === (nom || '').toLowerCase() && (m.prenom || '').toLowerCase() === (prenom || '').toLowerCase())
  }

  const handleSave = async () => {
    if (!fd.nom?.trim() || !fd.prenom?.trim()) { showToast('⚠ Nom et prénom obligatoires'); return }
    if (fd.email && !validEmail(fd.email)) { showToast('⚠ Email invalide'); return }
    if (fd.telephone && !validTel(fd.telephone)) { showToast('⚠ Téléphone invalide'); return }

    const isEdit = modal === 'edit' && fd.id
    if (hasDuplicate(fd.nom, fd.prenom, isEdit ? fd.id : '')) {
      setConfirmAction({ msg: `${fd.prenom} ${fd.nom} existe déjà. Créer quand même ?`, fn: () => doSave() })
      return
    }

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
    setSaving(true)
    try {
      const isEdit = (modal === 'edit' || modal === 'add') && fd.id && membres.some(m => m.id === fd.id)
      if (isEdit) {
        // Vérifier Berger principal à l'édition aussi
        if (h.isBergerRole(fd.role)) {
          const existingBerger = membres.find(m => h.isBergerRole(m.role) && !m.archive && m.id !== fd.id)
          if (existingBerger) { showToast('⚠ Un Berger principal existe déjà : ' + existingBerger.prenom + ' ' + existingBerger.nom); setSaving(false); return }
        }
        const { id, created_at, created_by, updated_at, updated_by, _reassignFrom, _reassignSuivis, ...updates } = fd
        await modifierMembre(id, updates)
        setModal(null); setFd({})
      } else {
        if (h.isBergerRole(fd.role)) {
          const existingBerger = membres.find(m => h.isBergerRole(m.role) && !m.archive)
          if (existingBerger) { showToast('⚠ Un Berger principal existe déjà : ' + existingBerger.prenom + ' ' + existingBerger.nom); setSaving(false); return }
        }
        const { id, _reassignFrom, _reassignSuivis, ...data } = fd
        const inserted = await ajouterMembre({ ...data, statut: data.statut || h.defaultStatut, role: data.role || h.defaultRole })
        setModal(null); setFd({})
        if (inserted?.id) openFiche(inserted.id)
      }
    } catch (e) { showToast('⚠ ' + e.message) }
    setSaving(false)
  }

  const doReassign = async () => {
    try {
      const { _reassignFrom, _reassignSuivis, _newSuivId, ...memberUpdates } = fd
      const { id, created_at, created_by, updated_at, updated_by, ...updates } = memberUpdates
      await modifierMembre(_reassignFrom, updates)
      if (_newSuivId) { for (const s of _reassignSuivis) { await modifierMembre(s.id, { suivi_par: _newSuivId }) } }
      setModal(null); setFd({})
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  return (
    <div>
      {/* Barre de recherche */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#6b7280' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." style={{ ...S.inp, paddingLeft: 30, width: '100%', boxSizing: 'border-box' }} />
      </div>
      {/* Filtres + actions — une seule ligne */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={fRole} onChange={e => setFRole(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontFamily: 'inherit', fontSize: 11, color: '#1a1e2e', outline: 'none' }}>
          <option value="all">Tous rôles</option>
          {(refs.roles || []).map(r => <option key={r.nom} value={r.nom}>{r.nom}</option>)}
        </select>
        <select value={fSt} onChange={e => setFSt(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontFamily: 'inherit', fontSize: 11, color: '#1a1e2e', outline: 'none' }}>
          <option value="actifs">Actifs</option>
          {myMembre && <option value="__mysuivis">★ Mes suivis</option>}
          <optgroup label="— Par statut —">
            {(refs.statuts || []).filter(s => !s.est_archive).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}
          </optgroup>
          <optgroup label="— Autres —">
            <option value="__archived">Archivés</option>
            <option value="all">Tout afficher</option>
          </optgroup>
        </select>
        <button onClick={() => { setFd({ statut: h.defaultStatut, role: h.defaultRole, date_inscription: today() }); setModal('add') }} style={{ ...S.btn('#0ea888', false), whiteSpace: 'nowrap', padding: '6px 12px', fontSize: 12 }}>+ Âme</button>
        <button onClick={() => setModal('import')} style={{ ...S.btn('#3060d0', true), display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', padding: '6px 10px', fontSize: 11 }}><Upload size={12} /> CSV</button>
        <button onClick={() => setBulkMode(!bulkMode)} style={{ ...S.btn(bulkMode ? '#7040d0' : '#6b7280', true), padding: '6px 10px', fontSize: 11 }}>{bulkMode ? '✓ Sélection' : '☐ Sélection'}</button>
      </div>

      {/* Bulk actions */}
      {bulkMode && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, padding: '8px 12px', background: '#7040d008', borderRadius: 7, border: '1px solid #7040d033', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
            <input type="checkbox" checked={filt.length > 0 && filt.every(m => bulkSel[m.id])} onChange={e => {
              const newSel = {}; if (e.target.checked) { filt.forEach(m => { newSel[m.id] = true }) }; setBulkSel(newSel)
            }} />
            <span style={{ color: '#7040d0', fontWeight: 600 }}>{Object.values(bulkSel).filter(Boolean).length}/{filt.length}</span>
          </label>
          <select id="bulk-statut" style={{ fontSize: 11, padding: '4px 6px', borderRadius: 4, border: '1px solid #e0e4ec' }}>
            <option value="">Changer statut →</option>
            {(refs.statuts || []).filter(s => !s.est_archive).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}
          </select>
          <button onClick={async () => {
            const st = document.getElementById('bulk-statut')?.value
            if (!st) { showToast('⚠ Choisissez un statut'); return }
            const ids = Object.keys(bulkSel).filter(k => bulkSel[k])
            if (!ids.length) return
            try {
              for (const id of ids) { await modifierMembre(id, { statut: st }) }
              showToast('✓ ' + ids.length + ' membre(s) mis à jour')
              setBulkSel({}); setBulkMode(false)
              reloadMembres()
            } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
          }} style={S.btn('#7040d0', false)}>Appliquer</button>
          <select id="bulk-suiveur" style={{ fontSize: 11, padding: '4px 6px', borderRadius: 4, border: '1px solid #e0e4ec' }}>
            <option value="">Assigner à →</option>
            {leaders.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
          </select>
          <button onClick={async () => {
            const suivId = document.getElementById('bulk-suiveur')?.value
            if (!suivId) { showToast('⚠ Choisissez un responsable'); return }
            const ids = Object.keys(bulkSel).filter(k => bulkSel[k])
            if (!ids.length) return
            try {
              for (const id of ids) { await modifierMembre(id, { suivi_par: suivId }) }
              showToast('✓ ' + ids.length + ' membre(s) assigné(s)')
              setBulkSel({}); setBulkMode(false)
              reloadMembres()
            } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
          }} style={S.btn('#0ea888', false)}>Assigner</button>
          <button onClick={() => { setBulkMode(false); setBulkSel({}) }} style={S.btn('#6b7280', true)}>Annuler</button>
        </div>
      )}

      {/* Liste — CARTES sur mobile, tableau sur desktop */}
      <div style={S.card}>
        {filt.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>Aucune âme. <span onClick={() => { setFd({ statut: h.defaultStatut, role: h.defaultRole, date_inscription: today() }); setModal('add') }} style={{ color: '#0ea888', cursor: 'pointer', textDecoration: 'underline' }}>+ Ajouter</span></div>
        ) : (
          <div>
            {/* Desktop: tableau */}
            <div className="desk-only">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {bulkMode && <th style={{ ...S.th, width: 32 }}></th>}
                  {['Nom', 'Rôle', 'Inscr.', 'Suivi par', 'Statut', 'Prés.', 'Ent.'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>{filt.map(m => {
                  const t = taux(m.id)
                  return (
                    <tr key={m.id} onClick={() => bulkMode ? setBulkSel(prev => ({ ...prev, [m.id]: !prev[m.id] })) : openFiche(m.id)} style={{ cursor: 'pointer', opacity: m.archive ? 0.5 : 1, background: bulkSel[m.id] ? '#7040d008' : 'transparent' }}>
                      {bulkMode && <td style={S.td}><input type="checkbox" checked={!!bulkSel[m.id]} readOnly /></td>}
                      <td style={S.td}><span style={{ fontWeight: 600, color: '#0ea888' }}>{m.prenom} {m.nom}</span></td>
                      <td style={S.td}><span style={S.pill(getRoleColor(refs, m.role))}>{m.role}</span></td>
                      <td style={{ ...S.td, color: '#5a6480' }}>{fmtS(m.date_inscription)}</td>
                      <td style={{ ...S.td, color: '#5a6480' }}>{getSuiveur(m.suivi_par)}</td>
                      <td style={S.td}><span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span></td>
                      <td style={{ ...S.td, fontWeight: 600, color: t !== null ? (t >= 80 ? '#1a9c60' : t >= 50 ? '#d48f00' : '#e03050') : '#6b7280' }}>{t !== null ? t + '%' : '—'}</td>
                      <td style={{ ...S.td, fontWeight: 600, color: mEn(m.id) ? '#3060d0' : '#6b7280' }}>{mEn(m.id)}</td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
            {/* Mobile: cartes */}
            <div className="mob-only">
              {filt.map(m => {
                const t = taux(m.id)
                return (
                  <div key={m.id} onClick={() => bulkMode ? setBulkSel(prev => ({ ...prev, [m.id]: !prev[m.id] })) : openFiche(m.id)} style={{ padding: '12px 10px', borderBottom: '1px solid #e0e4ec', cursor: 'pointer', opacity: m.archive ? 0.5 : 1, background: bulkSel[m.id] ? '#7040d008' : 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      {bulkMode && <input type="checkbox" checked={!!bulkSel[m.id]} readOnly style={{ marginRight: 4 }} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0ea888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.prenom} {m.nom}</span>
                      <span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
                      <span style={S.pill(getRoleColor(refs, m.role))}>{m.role}</span>
                      {t !== null && <span style={{ fontWeight: 600, color: t >= 80 ? '#1a9c60' : t >= 50 ? '#d48f00' : '#e03050' }}>{t}%</span>}
                      {mEn(m.id) > 0 && <span style={{ color: '#3060d0' }}>{mEn(m.id)} ent.</span>}
                      {m.suivi_par && <span>→ {getSuiveur(m.suivi_par)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal ajout/édition */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{modal === 'edit' ? 'Modifier' : 'Nouveau membre'}</div>
            </div>
            <div style={{ padding: '16px 20px', maxHeight: '55dvh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Nom</label><input value={fd.nom || ''} onChange={e => uf('nom', e.target.value)} style={{ ...S.inp, borderColor: fd.nom === '' ? '#e03050' : '#c8cfe0' }} /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Prénom</label><input value={fd.prenom || ''} onChange={e => uf('prenom', e.target.value)} style={{ ...S.inp, borderColor: fd.prenom === '' ? '#e03050' : '#c8cfe0' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Téléphone</label><input value={fd.telephone || ''} onChange={e => uf('telephone', e.target.value)} style={{ ...S.inp, borderColor: fd.telephone && !validTel(fd.telephone) ? '#e03050' : '#c8cfe0' }} placeholder="+225 07..." /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Email</label><input value={fd.email || ''} onChange={e => uf('email', e.target.value)} style={{ ...S.inp, borderColor: fd.email && !validEmail(fd.email) ? '#e03050' : '#c8cfe0' }} type="email" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Date d'inscription</label><input value={fd.date_inscription || ''} onChange={e => uf('date_inscription', e.target.value)} style={S.inp} type="date" /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Date de naissance</label><input value={fd.date_naissance || ''} onChange={e => uf('date_naissance', e.target.value)} style={S.inp} type="date" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut || h.defaultStatut} onChange={e => uf('statut', e.target.value)} style={S.inp}>{(refs.statuts || []).filter(s => !s.est_archive).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Rôle</label><select value={fd.role || h.defaultRole} onChange={e => { uf('role', e.target.value); if (h.isBergerRole(e.target.value)) uf('suivi_par', null) }} style={S.inp}>{(refs.roles || []).map(r => <option key={r.nom} value={r.nom}>{r.nom}</option>)}</select></div>
              </div>
              {(!h.isBergerRole(fd.role)) && <div style={{ marginBottom: 8 }}><label style={S.label}>Suivi par</label><select value={fd.suivi_par || ''} onChange={e => uf('suivi_par', e.target.value || null)} style={S.inp}><option value="">— Aucun —</option>{leaders.filter(l => l.id !== fd.id).map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom} ({l.role})</option>)}</select></div>}
              <div style={{ marginBottom: 8 }}><label style={S.label}>Notes</label><textarea value={fd.notes || ''} onChange={e => uf('notes', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#6b7280', true)}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ ...S.btn('#0ea888', false), opacity: saving ? 0.6 : 1 }}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal réassignation */}
      {modal === 'reassign' && fd._reassignSuivis && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#d48f00' }}>Réassigner avant changement de rôle</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: '#5a6480', marginBottom: 10 }}>Ce membre suit {fd._reassignSuivis.length} personne(s). Choisissez un nouveau responsable :</div>
              <div style={{ marginBottom: 8, padding: '8px 10px', background: '#f0f2f6', borderRadius: 6, fontSize: 11, color: '#5a6480' }}>
                {fd._reassignSuivis.map(s => s.prenom + ' ' + s.nom).join(', ')}
              </div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Nouveau responsable</label><select value={fd._newSuivId || ''} onChange={e => uf('_newSuivId', e.target.value || null)} style={S.inp}><option value="">— Choisir —</option>{leaders.filter(l => l.id !== fd._reassignFrom).map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom} ({l.role})</option>)}</select></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#6b7280', true)}>Annuler</button>
              <button onClick={doReassign} style={S.btn('#d48f00', false)}>Réassigner et modifier</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal import CSV */}
      {modal === 'import' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Importer des membres (CSV)</div></div>
            <div style={{ padding: '16px 20px' }}>
              {!fd._csvRows ? (
                <div>
                  <div style={{ fontSize: 12, color: '#5a6480', marginBottom: 10, lineHeight: 1.6 }}>Préparez un fichier CSV avec les colonnes : Prénom, Nom, Téléphone, Email, Date inscription</div>
                  <div style={{ padding: '8px 12px', background: '#f0f2f6', borderRadius: 6, fontSize: 11, fontFamily: "'Roboto Mono', monospace", marginBottom: 12, lineHeight: 1.8 }}>
                    Prénom,Nom,Téléphone,Email<br/>Marina,N'GUESSAN,+225 07 12 34 56,marina@email.com<br/>David,Mensah,+225 05 33 44 55,
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>Seuls Prénom et Nom sont obligatoires. Statut = Nouveau, Rôle = Membre par défaut.</div>
                  <input type="file" accept=".csv,.txt" onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return
                    const parseCSV = (text) => {
                      const sep = text.includes(';') ? ';' : ','
                      const lines = text.split(/\r?\n/).filter(l => l.trim())
                      if (lines.length < 2) { showToast('⚠ Fichier vide'); return }
                      const headerRaw = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
                      const colMap = {}
                      headerRaw.forEach((h, i) => {
                        if (/pr[ée]nom/i.test(h)) colMap.prenom = i
                        else if (/nom/i.test(h) && colMap.nom === undefined) colMap.nom = i
                        else if (/t[ée]l/i.test(h) || /phone/i.test(h)) colMap.telephone = i
                        else if (/mail/i.test(h)) colMap.email = i
                        else if (/date.*inscr/i.test(h) || /inscription/i.test(h)) colMap.date_inscription = i
                      })
                      if (colMap.prenom === undefined && colMap.nom === undefined) { showToast('⚠ Colonnes Prénom/Nom introuvables'); return }
                      const rows = lines.slice(1).map(line => {
                        const cells = line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''))
                        return {
                          prenom: cells[colMap.prenom] || '', nom: cells[colMap.nom] || '',
                          telephone: colMap.telephone !== undefined ? cells[colMap.telephone] || '' : '',
                          email: colMap.email !== undefined ? cells[colMap.email] || '' : '',
                          date_inscription: colMap.date_inscription !== undefined ? cells[colMap.date_inscription] || today() : today(),
                          statut: h.defaultStatut, role: h.defaultRole, _skip: false,
                          _dup: membres.some(m => m.nom?.toLowerCase() === (cells[colMap.nom] || '').toLowerCase() && m.prenom?.toLowerCase() === (cells[colMap.prenom] || '').toLowerCase())
                        }
                      }).filter(r => r.prenom || r.nom)
                      setFd(prev => ({ ...prev, _csvRows: rows }))
                    }
                    // Essayer UTF-8, fallback windows-1252 si accents cassés (�)
                    const r1 = new FileReader()
                    r1.onload = (ev) => {
                      const text = ev.target.result
                      if (/\ufffd/.test(text)) {
                        const r2 = new FileReader()
                        r2.onload = (ev2) => parseCSV(ev2.target.result)
                        r2.readAsText(file, 'windows-1252')
                      } else { parseCSV(text) }
                    }
                    r1.readAsText(file, 'UTF-8')
                  }} style={{ fontSize: 12 }} />
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: '#5a6480', marginBottom: 8 }}>
                    {fd._csvRows.length} ligne(s). {fd._csvRows.filter(r => r._dup).length > 0 && <span style={{ color: '#d48f00' }}>⚠ {fd._csvRows.filter(r => r._dup).length} doublon(s) en jaune.</span>}
                  </div>
                  <div style={{ maxHeight: '30dvh', overflowY: 'auto' }}>
                    {fd._csvRows.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', borderBottom: '1px solid #e0e4ec', background: r._dup ? '#FAEEDA' : 'transparent', opacity: r._skip ? 0.4 : 1 }}>
                        <input type="checkbox" checked={!r._skip} onChange={() => { const rows = [...fd._csvRows]; rows[i] = { ...rows[i], _skip: !rows[i]._skip }; setFd(prev => ({ ...prev, _csvRows: rows })) }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{r.prenom} {r.nom}</div>
                          <div style={{ fontSize: 10, color: '#6b7280' }}>{[r.telephone, r.email].filter(Boolean).join(' · ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#6b7280', true)}>Annuler</button>
              {fd._csvRows && (() => {
                const toImport = fd._csvRows.filter(r => !r._skip)
                return toImport.length > 0 && (
                  <button disabled={saving} onClick={async () => {
                    setSaving(true)
                    try {
                      const rows = toImport.map(({ _skip, _dup, ...r }) => r)
                      await importerCSV(rows)
                      showToast(`✓ ${rows.length} membre(s) importé(s)`)
                    } catch (e) { showToast('⚠ ' + e.message) }
                    setSaving(false)
                  }} style={{ ...S.btn('#3060d0', false), opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Import...' : `Importer ${toImport.length}`}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation */}
      {confirmAction && (
        <div className="modal-overlay danger">
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div style={{ padding: '20px 24px' }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Confirmation</div><div style={{ fontSize: 13, color: '#5a6480', lineHeight: 1.6 }}>{confirmAction.msg}</div></div>
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
