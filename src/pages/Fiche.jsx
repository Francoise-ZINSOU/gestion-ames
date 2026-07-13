import { useState } from 'react'
import { S, fmt, fmtS, dago, today, getStatutColor, getRoleColor } from '../lib/ui'
import { supabase } from '../lib/supabase'

export default function FichePage({ membres, actifs, presences, entretiens, defis, plans, refs, selectedMembre: m, selectedId, openFiche, showToast, ajouterEnt, modifierEnt, supprimerEnt, ajouterDefi, modifierDefi, assignerModule, validerModule, retirerModule, reloadMembres, setPage }) {
  const [ftab, setFtab] = useState('id')
  const [modal, setModal] = useState(null)
  const [fd, setFd] = useState({})
  const [editEntId, setEditEntId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const uf = (k, v) => setFd(prev => ({ ...prev, [k]: v }))

  if (!m) return <div style={{ padding: 24, textAlign: 'center', color: '#8892a8' }}>Sélectionnez une âme depuis la liste</div>

  const mEn = entretiens.filter(e => e.membre_id === m.id).sort((a, b) => new Date(b.date_entretien) - new Date(a.date_entretien))
  const mDf = defis.filter(d => d.membre_id === m.id)
  const mPt = plans.filter(p => p.membre_id === m.id)
  const mPr = (aid) => presences.filter(p => p.membre_id === m.id && (!aid || p.activite_id === aid))
  const getSuiveur = (id) => { if (!id) return null; return membres.find(x => x.id === id) }
  const getSuivis = () => actifs.filter(x => x.suivi_par === m.id)

  const taux = (aid) => {
    const ps = mPr(aid).filter(p => p.eligible)
    if (!ps.length) return null
    return Math.round(ps.filter(p => p.present).length / ps.length * 100)
  }

  const cAbs = () => {
    const culte = (refs.activites || []).find(a => a.code === 'culte')
    if (!culte) return 0
    const ps = mPr(culte.id).filter(p => p.eligible).sort((a, b) => new Date(b.date_presence) - new Date(a.date_presence))
    let c = 0
    for (let i = 0; i < ps.length; i++) { if (ps[i].present) break; c++ }
    return c
  }

  const spM = getSuiveur(m.suivi_par)
  const suivis = getSuivis()
  const ca = cAbs()
  const days = dago(m.date_inscription)
  const pv = mPt.filter(p => p.valide).length

  const leaders = actifs.filter(x => { const r = (refs.roles || []).find(r => r.nom === x.role); return r?.peut_suivre && x.id !== m.id })

  const handleArchive = async () => {
    const suivis = getSuivis()
    if (suivis.length > 0) {
      showToast('⚠ Réassignez d\'abord les ' + suivis.length + ' suivis de ce membre')
      return
    }
    await supabase.from('membres').update({ archive: true, statut: 'Archivé', date_archivage: new Date().toISOString() }).eq('id', m.id)
    showToast('✓ Membre archivé')
    await reloadMembres()
  }

  const handleSaveEnt = async () => {
    const data = { membre_id: m.id, date_entretien: fd.date_entretien || today(), avec_qui: fd.avec_qui || null, sujet_id: fd.sujet_id || null, sujet_libre: fd.sujet_libre || null, statut: fd.statut || 'Réalisé', commentaires: fd.commentaires || '' }
    if (editEntId) { await modifierEnt(editEntId, data) }
    else { await ajouterEnt(data) }
    setModal(null); setFd({}); setEditEntId(null)
  }

  const handleSaveDefi = async () => {
    await ajouterDefi({ membre_id: m.id, type_defi: fd.type_defi || (refs.typesDefi[0]?.nom), description: fd.description || '', statut: fd.statut_defi || 'Identifié' })
    setModal(null); setFd({})
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setPage('ames')} style={S.btn('#5a6480', true)}>← Liste</button>
        {[['id', '📋 Identité'], ['pr', '📊 Présences'], ['en', '💬 Entretiens'], ['df', '⚡ Défis'], ['pt', '📖 Plan']].map(t => (
          <button key={t[0]} onClick={() => setFtab(t[0])} style={{ padding: '4px 12px', borderRadius: 14, border: '1px solid ' + (ftab === t[0] ? '#0ea888' : '#e0e4ec'), background: ftab === t[0] ? '#0ea88814' : '#f0f2f6', color: ftab === t[0] ? '#0ea888' : '#5a6480', fontSize: 11, fontWeight: ftab === t[0] ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>{t[1]}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {!m.archive && <button onClick={() => setConfirmAction({ msg: 'Archiver ce membre ?', fn: handleArchive })} style={S.btn('#8892a8', true)}>📦 Archiver</button>}
        </div>
      </div>

      {/* Header */}
      <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: getStatutColor(refs, m.statut) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: getStatutColor(refs, m.statut), border: '2px solid ' + getStatutColor(refs, m.statut) }}>{(m.prenom || m.nom || '?').charAt(0)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Georgia, serif' }}>{m.prenom} {m.nom}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span>
            {m.role !== 'Membre' && <span style={S.pill(getRoleColor(refs, m.role))}>{m.role}</span>}
            {m.est_retour && <span style={S.pill('#7040d0')}>Retour</span>}
            {spM && <span style={{ fontSize: 10, color: '#5a6480' }}>suivi par {spM.prenom} {spM.nom}</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[{ v: days !== null ? days + 'j' : '—', l: 'Inscription', c: '#0ea888' }, { v: ca, l: 'Abs.', c: ca >= 3 ? '#e03050' : '#1a9c60' }, { v: mEn.length, l: 'Entretiens', c: '#3060d0' }, { v: pv + '/' + mPt.length, l: 'Plan', c: '#7040d0' }].map((x, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 6, background: '#f0f2f6', borderRadius: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: x.c, fontFamily: 'Georgia, serif' }}>{x.v}</div>
              <div style={{ fontSize: 8, color: '#8892a8', fontWeight: 600, textTransform: 'uppercase' }}>{x.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab: Identité */}
      {ftab === 'id' && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Informations</div>
          {m.telephone && <div style={{ fontSize: 12, marginBottom: 4 }}><a href={'tel:' + m.telephone.replace(/\s/g, '')} style={{ color: '#0ea888', textDecoration: 'none' }}>📞 {m.telephone}</a></div>}
          {m.email && <div style={{ fontSize: 12, marginBottom: 4 }}><a href={'mailto:' + m.email} style={{ color: '#3060d0', textDecoration: 'none' }}>✉️ {m.email}</a></div>}
          <div style={{ fontSize: 12, color: '#5a6480', marginBottom: 4 }}>📅 Inscription : {fmt(m.date_inscription)}</div>
          {m.est_retour && (
            <div style={{ marginTop: 6, padding: '6px 10px', background: '#7040d00a', borderRadius: 5, borderLeft: '3px solid #7040d0' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#7040d0' }}>↩ RETOUR</div>
              <div style={{ fontSize: 11, color: '#5a6480' }}>Départ : {fmt(m.date_depart)} · Motif : {m.motif_depart || '—'} · Retour : {fmt(m.date_retour)}</div>
            </div>
          )}
          {suivis.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#5a6480', marginBottom: 4 }}>Membres suivis ({suivis.length}) :</div>
              {suivis.map(s => (
                <div key={s.id} onClick={() => openFiche(s.id)} style={{ fontSize: 11, color: '#0ea888', cursor: 'pointer', padding: '2px 0' }}>{s.prenom} {s.nom} — {s.statut}</div>
              ))}
            </div>
          )}
          {m.notes && <div style={{ marginTop: 8, fontSize: 12, color: '#5a6480', lineHeight: 1.6, whiteSpace: 'pre-wrap', padding: '8px 10px', background: '#f0f2f6', borderRadius: 6 }}>{m.notes}</div>}
        </div>
      )}

      {/* Tab: Présences */}
      {ftab === 'pr' && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Taux et historique</div>
          {(refs.activites || []).map(a => {
            const t = taux(a.id)
            const mp = mPr(a.id).sort((x, y) => new Date(y.date_presence) - new Date(x.date_presence)).slice(0, 16)
            return (
              <div key={a.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: a.couleur }}>{a.icone} {a.nom}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t !== null ? (t >= 80 ? '#1a9c60' : t >= 50 ? '#d48f00' : '#e03050') : '#8892a8' }}>{t !== null ? t + '%' : '—'}</span>
                </div>
                <div style={{ height: 5, background: '#f0f2f6', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}><div style={{ height: '100%', borderRadius: 3, background: t !== null ? (t >= 80 ? '#1a9c60' : t >= 50 ? '#d48f00' : '#e03050') : '#e0e4ec', width: (t || 0) + '%' }} /></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {mp.length === 0 ? <span style={{ fontSize: 11, color: '#8892a8' }}>Aucune</span> : mp.map(p => (
                    <div key={p.id} style={{ textAlign: 'center', padding: '3px 2px', borderRadius: 4, border: '1px solid ' + (p.present ? '#1a9c60' : p.eligible ? '#e03050' : '#e0e4ec'), background: p.present ? '#1a9c6008' : p.eligible ? '#e0305008' : '#f0f2f6', minWidth: 42 }}>
                      <div style={{ fontSize: 8, color: '#8892a8' }}>{fmtS(p.date_presence)}</div>
                      <div style={{ fontSize: 12 }}>{p.present ? '✅' : p.eligible ? '❌' : '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Entretiens */}
      {ftab === 'en' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Entretiens ({mEn.length})</div>
            <button onClick={() => { setFd({ statut: 'Réalisé' }); setEditEntId(null); setModal('ent') }} style={S.btn('#3060d0', false)}>+ Entretien</button>
          </div>
          {mEn.length === 0 ? <div style={{ color: '#8892a8', fontSize: 12, padding: 8 }}>Aucun entretien. <span onClick={() => { setFd({ statut: 'Réalisé' }); setModal('ent') }} style={{ color: '#3060d0', cursor: 'pointer', textDecoration: 'underline' }}>Créer le premier</span></div>
            : mEn.map(e => {
              const avecM = getSuiveur(e.avec_qui)
              const sc = e.statut === 'Réalisé' ? '#1a9c60' : e.statut === 'Planifié' ? '#d48f00' : '#8892a8'
              const sujet = e.sujet_libre || (refs.sujetsEntretien || []).find(s => s.id === e.sujet_id)?.nom || ''
              return (
                <div key={e.id} style={{ padding: '10px 12px', borderRadius: 7, border: '1px solid #e0e4ec', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{sujet}</div>
                      <div style={{ fontSize: 10, color: '#8892a8' }}>{fmt(e.date_entretien)} · {avecM ? avecM.prenom + ' ' + avecM.nom : '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={S.pill(sc)}>{e.statut}</span>
                      <button onClick={() => { setFd({ ...e }); setEditEntId(e.id); setModal('ent') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#3060d0' }}>✏️</button>
                      <button onClick={() => setConfirmAction({ msg: 'Supprimer cet entretien ?', fn: () => supprimerEnt(e.id) })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#8892a8' }}>✕</button>
                    </div>
                  </div>
                  {e.commentaires && <div style={{ fontSize: 11, color: '#5a6480', lineHeight: 1.4, whiteSpace: 'pre-wrap', padding: '4px 8px', background: '#f0f2f6', borderRadius: 4, borderLeft: '3px solid ' + sc }}>{e.commentaires}</div>}
                </div>
              )
            })}
        </div>
      )}

      {/* Tab: Défis */}
      {ftab === 'df' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>Défis</div><div style={{ fontSize: 11, color: '#8892a8' }}>identifié → en cours → résolu</div></div>
            <button onClick={() => { setFd({}); setModal('defi') }} style={S.btn('#d86820', false)}>+ Défi</button>
          </div>
          {mDf.length === 0 ? <div style={{ color: '#8892a8', fontSize: 12, padding: 8 }}>Aucun défi. <span onClick={() => { setFd({}); setModal('defi') }} style={{ color: '#d86820', cursor: 'pointer', textDecoration: 'underline' }}>Ajouter le premier</span></div>
            : mDf.map(d => {
              const stColor = (refs.statutsDefi || []).find(s => s.nom === d.statut)?.couleur || '#8892a8'
              return (
                <div key={d.id} style={{ padding: '10px 12px', borderRadius: 7, border: '1px solid #e0e4ec', marginBottom: 6, display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                      <span style={S.pill('#3060d0')}>{d.type_defi}</span>
                      <span style={S.pill(stColor)}>{d.statut}</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.4 }}>{d.description}</div>
                  </div>
                  <select value={d.statut} onChange={e => modifierDefi(d.id, { statut: e.target.value })} style={{ fontSize: 11, border: '1px solid #e0e4ec', borderRadius: 4, padding: '2px 4px', background: '#f0f2f6', cursor: 'pointer', alignSelf: 'flex-start' }}>
                    {(refs.statutsDefi || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}
                  </select>
                </div>
              )
            })}
        </div>
      )}

      {/* Tab: Plan de croissance */}
      {ftab === 'pt' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Plan de croissance</div>
            <button onClick={() => setModal('asMod')} style={S.btn('#7040d0', false)}>+ Assigner</button>
          </div>
          {mPt.length === 0 ? <div style={{ color: '#8892a8', fontSize: 12, padding: 8 }}>Aucun module. <span onClick={() => setModal('asMod')} style={{ color: '#7040d0', cursor: 'pointer', textDecoration: 'underline' }}>Assigner le premier</span></div>
            : <div>
              {mPt.map(p => {
                const mod = (refs.modules || []).find(mod => mod.id === p.module_id)
                return (
                  <div key={p.id} onClick={() => validerModule(p.id, !p.valide)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid ' + (p.valide ? '#1a9c60' : '#e0e4ec'), background: p.valide ? '#1a9c6008' : '#fff', marginBottom: 5, cursor: 'pointer' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid ' + (p.valide ? '#1a9c60' : '#e0e4ec'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: p.valide ? '#1a9c60' : '#8892a8' }}>{p.valide ? '✓' : ''}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: p.valide ? '#1a9c60' : '#1a1e2e' }}>{mod?.nom || '?'}</div>
                      {p.valide && p.date_validation && <div style={{ fontSize: 9, color: '#8892a8' }}>Validé le {fmt(p.date_validation)}</div>}
                    </div>
                    <span style={S.pill(p.valide ? '#1a9c60' : '#8892a8')}>{p.valide ? 'Validé' : 'En attente'}</span>
                    <button onClick={e => { e.stopPropagation(); retirerModule(p.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#8892a8' }}>✕</button>
                  </div>
                )
              })}
              <div style={{ marginTop: 8, height: 5, background: '#f0f2f6', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, background: '#1a9c60', width: (mPt.length ? Math.round(pv / mPt.length * 100) : 0) + '%' }} /></div>
              <div style={{ textAlign: 'center', fontSize: 10, color: '#5a6480', marginTop: 3 }}>{pv}/{mPt.length} validés</div>
            </div>
          }
        </div>
      )}

      {/* Modal entretien */}
      {modal === 'ent' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{editEntId ? "Modifier l'entretien" : 'Nouvel entretien'}</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Date</label><input value={fd.date_entretien || today()} onChange={e => uf('date_entretien', e.target.value)} style={S.inp} type="date" /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut || 'Réalisé'} onChange={e => uf('statut', e.target.value)} style={S.inp}>{(refs.statutsEntretien || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Avec qui</label><select value={fd.avec_qui || ''} onChange={e => uf('avec_qui', e.target.value || null)} style={S.inp}><option value="">— Choisir —</option>{actifs.sort((a, b) => { const o = { 'Berger principal': 0, 'Pilier': 1 }; return (o[a.role] ?? 2) - (o[b.role] ?? 2) }).map(x => <option key={x.id} value={x.id}>{x.prenom} {x.nom}{x.role !== 'Membre' ? ' (' + x.role + ')' : ''}</option>)}</select></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Sujet</label><select value={fd.sujet_id || ''} onChange={e => { uf('sujet_id', e.target.value || null); if (e.target.value) uf('sujet_libre', null) }} style={S.inp}><option value="">— Libre —</option>{(refs.sujetsEntretien || []).map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></div>
              {!fd.sujet_id && <div style={{ marginBottom: 8 }}><label style={S.label}>Sujet libre</label><input value={fd.sujet_libre || ''} onChange={e => uf('sujet_libre', e.target.value)} style={S.inp} /></div>}
              <div style={{ marginBottom: 8 }}><label style={S.label}>Commentaires</label><textarea value={fd.commentaires || ''} onChange={e => uf('commentaires', e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}); setEditEntId(null) }} style={S.btn('#8892a8', true)}>Annuler</button>
              <button onClick={handleSaveEnt} style={S.btn('#3060d0', false)}>{editEntId ? 'Modifier' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal défi */}
      {modal === 'defi' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Nouveau défi</div></div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Type</label><select value={fd.type_defi || ''} onChange={e => uf('type_defi', e.target.value)} style={S.inp}>{(refs.typesDefi || []).map(t => <option key={t.nom} value={t.nom}>{t.nom}</option>)}</select></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Description</label><textarea value={fd.description || ''} onChange={e => uf('description', e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} /></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut_defi || 'Identifié'} onChange={e => uf('statut_defi', e.target.value)} style={S.inp}>{(refs.statutsDefi || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#8892a8', true)}>Annuler</button>
              <button onClick={handleSaveDefi} style={S.btn('#d86820', false)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal assigner module */}
      {modal === 'asMod' && (() => {
        const done = {}; mPt.forEach(p => { done[p.module_id] = true })
        const avail = (refs.modules || []).filter(mod => !done[mod.id])
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
            <div style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e4ec' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Assigner un module</div></div>
              <div style={{ padding: '16px 20px', maxHeight: '50vh', overflowY: 'auto' }}>
                {avail.length === 0 ? <div style={{ padding: 12, textAlign: 'center', color: '#1a9c60', fontSize: 12 }}>✓ Tous assignés</div>
                  : avail.map(mod => (
                    <div key={mod.id} onClick={() => { assignerModule(m.id, mod.id); setModal(null) }} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e4ec', marginBottom: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, flex: 1 }}>{mod.nom}</span>
                      <span style={{ fontSize: 10, color: '#0ea888', fontWeight: 600 }}>+ Assigner</span>
                    </div>
                  ))}
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e4ec', display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => setModal(null)} style={S.btn('#8892a8', true)}>Fermer</button></div>
            </div>
          </div>
        )
      })()}

      {/* Confirmation modal */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
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
