import { useState } from 'react'
import { S, fmtS, getStatutColor, getRoleColor } from '../lib/ui'
import { supabase } from '../lib/supabase'

export default function AmesPage({ membres, actifs, refs, openFiche, showToast, reloadMembres, presences, entretiens, setPage }) {
  const [q, setQ] = useState('')
  const [fRole, setFRole] = useState('all')
  const [fSt, setFSt] = useState('actifs')
  const [modal, setModal] = useState(null)
  const [fd, setFd] = useState({})

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

  const handleSave = async () => {
    try {
      if (modal === 'edit' && fd.id) {
        const { id, created_at, created_by, updated_at, updated_by, ...updates } = fd
        await supabase.from('membres').update(updates).eq('id', id)
        showToast('✓ Membre modifié')
      } else {
        const { id, ...data } = fd
        await supabase.from('membres').insert({ ...data, statut: data.statut || 'Nouveau', role: data.role || 'Membre' })
        showToast('✓ Membre ajouté')
      }
      await reloadMembres()
      setModal(null); setFd({})
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  const getSuiveur = (id) => { if (!id) return '—'; const m = membres.find(x => x.id === id); return m ? `${m.prenom} ${m.nom}` : '—' }

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
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Georgia, serif' }}>{modal === 'edit' ? 'Modifier' : 'Nouveau membre'}</div>
            </div>
            <div style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Nom</label><input value={fd.nom || ''} onChange={e => uf('nom', e.target.value)} style={S.inp} /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Prénom</label><input value={fd.prenom || ''} onChange={e => uf('prenom', e.target.value)} style={S.inp} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Téléphone</label><input value={fd.telephone || ''} onChange={e => uf('telephone', e.target.value)} style={S.inp} /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Email</label><input value={fd.email || ''} onChange={e => uf('email', e.target.value)} style={S.inp} type="email" /></div>
              </div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Date d'inscription</label><input value={fd.date_inscription || ''} onChange={e => uf('date_inscription', e.target.value)} style={S.inp} type="date" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut || 'Nouveau'} onChange={e => uf('statut', e.target.value)} style={S.inp}>{(refs.statuts || []).filter(s => !s.est_archive).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Rôle</label><select value={fd.role || 'Membre'} onChange={e => uf('role', e.target.value)} style={S.inp}>{(refs.roles || []).map(r => <option key={r.nom} value={r.nom}>{r.nom}</option>)}</select></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Suivi par</label><select value={fd.suivi_par || ''} onChange={e => uf('suivi_par', e.target.value || null)} style={S.inp}><option value="">— Aucun —</option>{leaders.filter(l => l.id !== fd.id).map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom} ({l.role})</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Notes</label><textarea value={fd.notes || ''} onChange={e => uf('notes', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#8892a8', true)}>Annuler</button>
              <button onClick={handleSave} style={S.btn('#0ea888', false)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
