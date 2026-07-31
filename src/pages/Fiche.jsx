import { useState, useEffect } from 'react'
import { S, fmt, fmtS, dago, dagoLabel, today, getStatutColor, getRoleColor } from '../lib/ui'
import { useHistoriqueStatuts, useJournal } from '../lib/data'
import { ClipboardList, BarChart3, MessageCircle, Zap, BookOpen, Pencil, Archive, ArchiveRestore, ArrowRightLeft, NotebookPen, Phone, Mail, CalendarDays, RotateCcw, Check, X, History, Globe, Briefcase } from 'lucide-react'

export default function FichePage({ membres, actifs, presences, entretiens, defis, plans, refs, h, selectedMembre: m, selectedId, openFiche, showToast, ajouterEnt, modifierEnt, supprimerEnt, ajouterDefi, modifierDefi, supprimerDefi, assignerModule, validerModule, retirerModule, modifierMembre, archiverMembre, reloadMembres, setPage, prevPage, auth, datesAnnulees }) {
  const [ftab, setFtab] = useState('id')
  const [modal, setModal] = useState(null)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [fd, setFd] = useState({})
  const [editEntId, setEditEntId] = useState(null)
  const { hist: historiqueStatuts } = useHistoriqueStatuts(m?.id)
  const { notes: journalNotes, ajouter: ajouterNote, supprimer: supprimerNote } = useJournal(m?.id)
  const peutSuppr = auth?.isAdmin === true || auth?.isSuperAdmin === true  // suppression : admin de sa famille ou super-admin (RLS v3.2)
  const estBerger = auth?.isBergerEglise === true && auth?.isAdmin !== true  // berger : consultation, pas le journal
  const [histSuivi, setHistSuivi] = useState([])
  useEffect(() => {
    if (m?.id) {
      import('../lib/supabase').then(({ supabase }) => {
        supabase.from('historique_suivi').select('*').eq('membre_id', m.id).order('date_changement', { ascending: false }).limit(5).then(({ data }) => setHistSuivi(data || []))
      })
    }
  }, [m?.id])
  const [confirmAction, setConfirmAction] = useState(null)
  const uf = (k, v) => setFd(prev => ({ ...prev, [k]: v }))

  if (!m) return <div style={{ padding: 24, textAlign: 'center', color: '#5E7175' }}>Sélectionnez un membre depuis la liste</div>

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

  const culte = h.culteId ? { id: h.culteId } : null

  const cAbs = () => {
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

  const leaders = actifs.filter(x => { const r = (refs.roles || []).find(r => r.nom === x.role); return r?.peut_suivre && x.id !== m.id && x.famille_id === m.famille_id })

  const handleArchive = async () => {
    // Protection: ne pas archiver le Chef de famille s'il est le seul
    if (h.isBergerRole(m.role)) {
      showToast('⚠ Impossible d\'archiver le ' + h.bergerRoleName + '. Transférez d\'abord le rôle à quelqu\'un d\'autre.')
      return
    }
    // Confirmation renforcée : super-admin agissant HORS de sa propre famille
    if (auth?.isSuperAdmin && auth?.profil?.famille_id && m.famille_id && m.famille_id !== auth.profil.famille_id) {
      const ok = window.confirm('⚠ Attention : ' + m.prenom + ' ' + m.nom + ' n\'appartient pas à votre famille.\n\nVous agissez en tant que super-administrateur sur une communauté qui n\'est pas la vôtre. Archiver ce membre quand même ?')
      if (!ok) return
    }
    const mesSuivis = getSuivis()
    if (mesSuivis.length > 0) {
      setFd(prev => ({ ...prev, _archiveSuivis: mesSuivis }))
      setModal('archiveReassign')
      return
    }
    await archiverMembre(m.id)
  }

  const doArchiveReassign = async () => {
    try {
      const newSuivId = fd._archiveNewSuiv || null
      if (newSuivId) {
        for (const s of fd._archiveSuivis) {
          await modifierMembre(s.id, { suivi_par: newSuivId })
        }
      }
      await archiverMembre(m.id)
      setModal(null); setFd({})
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  const handleSaveEnt = async () => {
    const dateEnt = fd.date_entretien || today()
    // Check: entretien avant inscription?
    if (m.date_inscription && dateEnt < m.date_inscription) {
      showToast('⚠ Date de l\'entretien antérieure à l\'inscription (' + fmt(m.date_inscription) + ')')
      return
    }
    const data = { membre_id: m.id, date_entretien: dateEnt, avec_qui: fd.avec_qui || null, sujet_id: fd.sujet_id || null, sujet_libre: fd.sujet_libre || null, statut: fd.statut || h.defaultStatutEnt, commentaires: fd.commentaires || '' }
    try {
      if (editEntId) { await modifierEnt(editEntId, data) }
      else { await ajouterEnt(data) }
      setModal(null); setFd({}); setEditEntId(null)
    } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
  }

  const handleSaveDefi = async () => {
    try {
      await ajouterDefi({ membre_id: m.id, type_defi: fd.type_defi || (refs.typesDefi[0]?.nom), description: fd.description || '', statut: fd.statut_defi || h.defaultStatutDefi })
      setModal(null); setFd({})
    } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, alignItems: 'center', position: 'sticky', top: 48, zIndex: 40, background: '#F5F3EE', paddingBottom: 4 }}>
        <button onClick={() => setPage(prevPage || 'ames')} style={{ ...S.btn('#5E7175', true), flexShrink: 0 }}>{({ alerts: '← Alertes', ames: '← Liste', ents: '← Entretiens', home: '← Accueil' })[prevPage] || '← Liste'}</button>
        <div className="hide-scrollbar scroll-fade" style={{ display: 'flex', gap: 5, alignItems: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, minWidth: 0 }}>
          {[['id', 'Identité', ClipboardList], ...(estBerger ? [] : [['jn', 'Journal', NotebookPen]]), ['en', 'Entretiens', MessageCircle], ['pr', 'Présences', BarChart3], ['df', 'Défis', Zap], ['pt', 'Formation', BookOpen]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setFtab(id)} style={{ padding: '4px 12px', borderRadius: 14, border: '1px solid ' + (ftab === id ? '#2E7D8A' : '#DCE6E5'), background: ftab === id ? '#2E7D8A14' : '#F5F3EE', color: ftab === id ? '#2E7D8A' : '#5E7175', fontSize: 12, fontWeight: ftab === id ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0 }}><Icon size={12} /> {label}</button>
          ))}
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowActionMenu(!showActionMenu)} style={{ ...S.btn('#5E7175', true), display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 14 }}>⋯ Actions</button>
          {showActionMenu && (
            <>
              <div onClick={() => setShowActionMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid #DCE6E5', borderRadius: 7, boxShadow: '0 4px 12px rgba(0,0,0,.08)', zIndex: 100, minWidth: 160, maxWidth: 'calc(100vw - 40px)', overflow: 'hidden' }}>
              <div onClick={() => { setFd({ ...m }); setModal('edMb'); setShowActionMenu(false) }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F5F3EE' }}><Pencil size={13} color="#5E7175" /> Modifier</div>
              {!m.archive && <div onClick={() => { setConfirmAction({ msg: 'Archiver ce membre ?', fn: handleArchive }); setShowActionMenu(false) }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F5F3EE' }}><Archive size={13} color="#5E7175" /> Archiver</div>}
              {m.archive && <div onClick={() => { setConfirmAction({ msg: 'Restaurer ce membre ? Il redeviendra actif avec le statut "' + h.defaultStatut + '".', fn: async () => {
                try { await modifierMembre(m.id, { archive: false, statut: h.defaultStatut }); showToast('✓ Membre restauré'); reloadMembres() } catch(e) { showToast('⚠ Erreur') }
              } }); setShowActionMenu(false) }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#2E7D8A', borderBottom: '1px solid #F5F3EE' }}><ArchiveRestore size={13} /> Restaurer</div>}
              {false /* transfert désactivé temporairement — remettre auth?.isAdmin pour réactiver (admin only) */ && <div onClick={async () => {
                const { supabase } = await import('../lib/supabase')
                const { data } = await supabase.from('familles_disciples').select('*, eglises(nom, actif)').eq('actif', true).order('nom')
                setFd({ _familles: data || [] }); setModal('transfer'); setShowActionMenu(false)
              }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#8B5B9E' }}><ArrowRightLeft size={13} /> Transférer</div>}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: getStatutColor(refs, m.statut) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: getStatutColor(refs, m.statut), border: '2px solid ' + getStatutColor(refs, m.statut), flexShrink: 0 }}>{(m.prenom || m.nom || '?').charAt(0)}</div>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{m.prenom} {m.nom}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span>
            {m.role !== h.defaultRole && <span style={S.pill(getRoleColor(refs, m.role))}>{m.role}</span>}
            {m.est_retour && <span style={S.pill('#8B5B9E')}>Retour</span>}
            {spM && <span style={{ fontSize: 11, color: '#5E7175' }}>suivi par {spM.prenom} {spM.nom}</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, width: '100%', maxWidth: 340 }}>
          {[{ v: dagoLabel(m.date_inscription), l: 'Inscription', c: '#2E7D8A' }, { v: ca, l: 'Abs.', c: ca >= 3 ? '#C25A4A' : '#4E8D6E' }, { v: mEn.length, l: 'Entretiens', c: '#2E7D8A' }, { v: pv + '/' + mPt.length, l: 'Plan', c: '#8B5B9E' }].map((x, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 6, background: '#F5F3EE', borderRadius: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: x.c, fontFamily: "'Outfit', sans-serif" }}>{x.v}</div>
              <div style={{ fontSize: 11, color: '#5E7175', fontWeight: 500 }}>{x.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab: Identité */}
      {ftab === 'id' && (
        <div style={S.card}>
          {culte && (() => {
            const todayStr = today()
            const alreadyPresent = presences.some(p => p.membre_id === m.id && p.activite_id === culte.id && p.date_presence === todayStr && p.present)
            return (
              <div style={{ marginBottom: 12, padding: '10px 12px', background: alreadyPresent ? '#4E8D6E08' : '#2E7D8A08', border: '1px solid ' + (alreadyPresent ? '#4E8D6E33' : '#2E7D8A33'), borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: alreadyPresent ? '#4E8D6E' : '#2E7D8A', fontWeight: 600 }}>{alreadyPresent ? '✓ Présent aujourd\'hui' : 'Marquer présent aujourd\'hui ?'}</span>
                {!alreadyPresent && (
                  <button onClick={async () => {
                    try {
                      const { supabase } = await import('../lib/supabase')
                      // Récupérer les présences existantes de cette date pour ne pas les écraser
                      const existingIds = presences
                        .filter(p => p.activite_id === culte.id && p.date_presence === todayStr && p.present)
                        .map(p => p.membre_id)
                      const allPresents = [...new Set([...existingIds, m.id])]
                      await supabase.rpc('sauver_presences', { p_activite_id: culte.id, p_date: todayStr, p_presents: allPresents })
                      showToast('✓ Présent marqué pour aujourd\'hui')
                      reloadMembres()
                    } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
                  }} style={{ ...S.btn('#2E7D8A', false), fontSize: 12, padding: '4px 10px' }}>Marquer présent</button>
                )}
              </div>
            )
          })()}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Informations</div>
          {m.telephone && <div style={{ fontSize: 13, marginBottom: 4 }}><a href={'tel:' + m.telephone.replace(/\s/g, '')} style={{ color: '#2E7D8A', textDecoration: 'none' }}><Phone size={12} style={{display:'inline',verticalAlign:'middle',marginRight:4}} />{m.telephone}</a></div>}
          {m.email && <div style={{ fontSize: 13, marginBottom: 4 }}><a href={'mailto:' + m.email} style={{ color: '#2E7D8A', textDecoration: 'none' }}><Mail size={12} style={{display:'inline',verticalAlign:'middle',marginRight:4}} />{m.email}</a></div>}
          <div style={{ fontSize: 13, color: '#5E7175', marginBottom: 4 }}><CalendarDays size={12} style={{display:'inline',verticalAlign:'middle',marginRight:4}} />Inscription : {fmt(m.date_inscription)}</div>
          {m.nationalite && <div style={{ fontSize: 13, color: '#5E7175', marginBottom: 4 }}><Globe size={12} style={{display:'inline',verticalAlign:'middle',marginRight:4}} />Nationalité : {m.nationalite}</div>}
          {m.situation_professionnelle && <div style={{ fontSize: 13, color: '#5E7175', marginBottom: 4 }}><Briefcase size={12} style={{display:'inline',verticalAlign:'middle',marginRight:4}} />Situation pro. : {m.situation_professionnelle}</div>}
          {m.est_retour && (
            <div style={{ marginTop: 6, padding: '6px 10px', background: '#8B5B9E0a', borderRadius: 5, borderLeft: '3px solid #8B5B9E' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8B5B9E' }}><RotateCcw size={11} style={{display:'inline',verticalAlign:'middle',marginRight:3}} />RETOUR</div>
              <div style={{ fontSize: 12, color: '#5E7175' }}>Départ : {fmt(m.date_depart)} · Motif : {m.motif_depart || '—'} · Retour : {fmt(m.date_retour)}</div>
            </div>
          )}
          {suivis.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#5E7175', marginBottom: 4 }}>Membres suivis ({suivis.length}) :</div>
              {suivis.map(s => (
                <div key={s.id} onClick={() => openFiche(s.id)} style={{ fontSize: 12, color: '#2E7D8A', cursor: 'pointer', padding: '2px 0' }}>{s.prenom} {s.nom} — {s.statut}</div>
              ))}
            </div>
          )}
          {m.notes && <div style={{ marginTop: 8, fontSize: 13, color: '#5E7175', lineHeight: 1.6, whiteSpace: 'pre-wrap', padding: '8px 10px', background: '#F5F3EE', borderRadius: 6 }}>{m.notes}</div>}
          {historiqueStatuts.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#5E7175', marginBottom: 4 }}><History size={12} /> Historique des statuts</div>
              {historiqueStatuts.slice(0, 8).map(h => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 0', borderBottom: '1px solid #DCE6E5' }}>
                  <span style={{ color: '#5E7175', width: 70, flexShrink: 0 }}>{fmtS(h.date_changement)}</span>
                  <span style={S.pill(getStatutColor(refs, h.ancien_statut))}>{h.ancien_statut}</span>
                  <span style={{ color: '#5E7175' }}>→</span>
                  <span style={S.pill(getStatutColor(refs, h.nouveau_statut))}>{h.nouveau_statut}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Présences */}
      {ftab === 'pr' && (
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Taux et historique</div>
          {(refs.activites || []).map(a => {
            const t = taux(a.id)
            const mp = mPr(a.id).sort((x, y) => new Date(y.date_presence) - new Date(x.date_presence)).slice(0, 16)
            return (
              <div key={a.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: a.couleur }}>{a.icone} {a.nom}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: t !== null ? (t >= 80 ? '#4E8D6E' : t >= 50 ? '#2E7D8A' : '#C25A4A') : '#5E7175' }}>{t !== null ? t + '%' : '—'}</span>
                </div>
                <div style={{ height: 5, background: '#F5F3EE', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}><div style={{ height: '100%', borderRadius: 3, background: t !== null ? (t >= 80 ? '#4E8D6E' : t >= 50 ? '#2E7D8A' : '#C25A4A') : '#DCE6E5', width: (t || 0) + '%' }} /></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {mp.length === 0 ? <span style={{ fontSize: 12, color: '#5E7175' }}>Aucune</span> : mp.map(p => (
                    <div key={p.id} style={{ textAlign: 'center', padding: '3px 2px', borderRadius: 4, border: '1px solid ' + (p.present ? '#4E8D6E' : p.eligible ? '#C25A4A' : '#DCE6E5'), background: p.present ? '#4E8D6E08' : p.eligible ? '#C25A4A08' : '#F5F3EE', minWidth: 42 }}>
                      <div style={{ fontSize: 10, color: '#5E7175' }}>{fmtS(p.date_presence)}</div>
                      <div style={{ fontSize: 13 }}>{p.present ? <Check size={14} color="#4E8D6E" /> : p.eligible ? <X size={14} color="#C25A4A" /> : '—'}</div>
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
            <div style={{ fontSize: 14, fontWeight: 600 }}>Entretiens ({mEn.length})</div>
            <button onClick={() => { setFd({ statut: h.defaultStatutEnt }); setEditEntId(null); setModal('ent') }} style={S.btn('#2E7D8A', false)}>+ Entretien</button>
          </div>
          {mEn.length === 0 ? <div style={{ color: '#5E7175', fontSize: 13, padding: 8 }}>Aucun entretien. <span onClick={() => { setFd({ statut: h.defaultStatutEnt }); setModal('ent') }} style={{ color: '#2E7D8A', cursor: 'pointer', textDecoration: 'underline' }}>Créer le premier</span></div>
            : mEn.map(e => {
              const avecM = getSuiveur(e.avec_qui)
              const sc = (() => { const found = (refs.statutsEntretien || []).find(s => s.nom === e.statut); return found?.couleur || '#5E7175' })()
              const sujet = e.sujet_libre || (refs.sujetsEntretien || []).find(s => s.id === e.sujet_id)?.nom || ''
              return (
                <div key={e.id} style={{ padding: '10px 12px', borderRadius: 7, border: '1px solid #DCE6E5', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{sujet}</div>
                      <div style={{ fontSize: 11, color: '#5E7175' }}>{fmt(e.date_entretien)} · {avecM ? avecM.prenom + ' ' + avecM.nom : '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={S.pill(sc)}>{e.statut}</span>
                      <button onClick={() => { setFd({ ...e }); setEditEntId(e.id); setModal('ent') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#2E7D8A' }}><Pencil size={12} /></button>
                      {peutSuppr && <button onClick={() => setConfirmAction({ msg: 'Supprimer cet entretien ?', fn: () => supprimerEnt(e.id) })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#5E7175', padding: '4px 8px' }}>✕</button>}
                    </div>
                  </div>
                  {e.commentaires && <div style={{ fontSize: 12, color: '#5E7175', lineHeight: 1.4, whiteSpace: 'pre-wrap', padding: '4px 8px', background: '#F5F3EE', borderRadius: 4, borderLeft: '3px solid ' + sc }}>{e.commentaires}</div>}
                </div>
              )
            })}
        </div>
      )}

      {/* Tab: Défis */}
      {ftab === 'df' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>Défis</div><div style={{ fontSize: 12, color: '#5E7175' }}>identifié → en cours → résolu</div></div>
            <button onClick={() => { setFd({}); setModal('defi') }} style={S.btn('#2E7D8A', false)}>+ Défi</button>
          </div>
          {mDf.length === 0 ? <div style={{ color: '#5E7175', fontSize: 13, padding: 8 }}>Aucun défi. <span onClick={() => { setFd({}); setModal('defi') }} style={{ color: '#2E7D8A', cursor: 'pointer', textDecoration: 'underline' }}>Ajouter le premier</span></div>
            : mDf.map(d => {
              const stColor = (refs.statutsDefi || []).find(s => s.nom === d.statut)?.couleur || '#5E7175'
              return (
                <div key={d.id} style={{ padding: '10px 12px', borderRadius: 7, border: '1px solid #DCE6E5', marginBottom: 6, display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={S.pill('#2E7D8A')}>{d.type_defi}</span>
                      <span style={S.pill(stColor)}>{d.statut}</span>
                      <button onClick={() => { setFd({ _editDefiId: d.id, type_defi: d.type_defi, description: d.description, statut_defi: d.statut }); setModal('editDefi') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2E7D8A', padding: '4px 8px' }}><Pencil size={13} /></button>
                      {peutSuppr && <button onClick={() => setConfirmAction({ msg: 'Supprimer ce défi ?', fn: async () => { await supprimerDefi(d.id) } })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5E7175', padding: '4px 8px', fontSize: 14 }}>✕</button>}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>{d.description}</div>
                  </div>
                  <select value={d.statut} onChange={e => modifierDefi(d.id, { statut: e.target.value })} style={{ fontSize: 12, border: '1px solid #DCE6E5', borderRadius: 4, padding: '2px 4px', background: '#F5F3EE', cursor: 'pointer', alignSelf: 'flex-start' }}>
                    {(refs.statutsDefi || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}
                  </select>
                </div>
              )
            })}
        </div>
      )}

      {/* Tab: Parcours de formation */}
      {ftab === 'pt' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Parcours de formation</div>
            {mDf.length > 0 && <button onClick={() => { setFd({ _asDefiId: mDf[0]?.id }); setModal('asMod') }} style={S.btn('#8B5B9E', false)}>+ Assigner</button>}
          </div>
          {mDf.length === 0 ? (
            <div style={{ color: '#5E7175', fontSize: 13, padding: 8 }}>Créez d'abord un défi dans l'onglet Défis, puis assignez des modules pour y répondre.</div>
          ) : mPt.length === 0 ? (
            <div style={{ color: '#5E7175', fontSize: 13, padding: 8 }}>Aucun module assigné. <span onClick={() => { setFd({ _asDefiId: mDf[0]?.id }); setModal('asMod') }} style={{ color: '#8B5B9E', cursor: 'pointer', textDecoration: 'underline' }}>Assigner le premier</span></div>
          ) : (
            <div>
              {mDf.map(d => {
                const modulesForDefi = mPt.filter(p => p.defi_id === d.id)
                const stColor = (refs.statutsDefi || []).find(s => s.nom === d.statut)?.couleur || '#5E7175'
                const vCount = modulesForDefi.filter(p => p.valide).length
                const pct = modulesForDefi.length ? Math.round(vCount / modulesForDefi.length * 100) : 0
                const allDone = modulesForDefi.length > 0 && vCount === modulesForDefi.length
                return (
                  <div key={d.id} style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, border: '1px solid ' + (allDone ? '#4E8D6E' : '#DCE6E5'), background: allDone ? '#4E8D6E06' : '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={S.pill('#2E7D8A')}>{d.type_defi}</span>
                      <span style={S.pill(stColor)}>{d.statut}</span>
                      <span style={{ fontSize: 12, color: '#5E7175', flex: 1 }}>{d.description?.substring(0, 50)}{d.description?.length > 50 ? '...' : ''}</span>
                      <button onClick={() => { setFd({ _asDefiId: d.id }); setModal('asMod') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#8B5B9E', fontWeight: 600 }}>+ Module</button>
                    </div>
                    {modulesForDefi.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#5E7175', padding: '4px 0 0 12px' }}>Aucun module assigné — <span onClick={() => { setFd({ _asDefiId: d.id }); setModal('asMod') }} style={{ color: '#8B5B9E', cursor: 'pointer', textDecoration: 'underline' }}>assigner</span></div>
                    ) : (
                      <div>
                        {modulesForDefi.map(p => {
                          const mod = (refs.modules || []).find(mod => mod.id === p.module_id)
                          return (
                            <div key={p.id} onClick={() => validerModule(p.id, !p.valide)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid ' + (p.valide ? '#4E8D6E' : '#DCE6E5'), background: p.valide ? '#4E8D6E08' : '#fff', marginBottom: 3, cursor: 'pointer', marginLeft: 8 }}>
                              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (p.valide ? '#4E8D6E' : '#DCE6E5'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: p.valide ? '#4E8D6E' : '#5E7175' }}>{p.valide ? '✓' : ''}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: p.valide ? '#4E8D6E' : '#2B3A3D' }}>{mod?.nom || '?'}</div>
                                {p.valide && p.date_validation && <div style={{ fontSize: 10, color: '#5E7175' }}>Validé le {fmt(p.date_validation)}</div>}
                              </div>
                              <span style={S.pill(p.valide ? '#4E8D6E' : '#5E7175')}>{p.valide ? 'Validé' : 'En attente'}</span>
                              {peutSuppr && <button onClick={e => { e.stopPropagation(); retirerModule(p.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#5E7175' }}>✕</button>}
                            </div>
                          )
                        })}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, marginLeft: 8 }}>
                          <div style={{ flex: 1, height: 4, background: '#F5F3EE', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 2, background: allDone ? '#4E8D6E' : '#8B5B9E', width: pct + '%' }} /></div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: allDone ? '#4E8D6E' : '#5E7175' }}>{vCount}/{modulesForDefi.length}</span>
                          {allDone && !h.isStatutFinal(d.statut) && <button onClick={e => { e.stopPropagation(); modifierDefi(d.id, { statut: h.statutFinalDefi }) }} style={{ background: 'none', border: '1px solid #4E8D6E', borderRadius: 5, padding: '2px 8px', fontSize: 11, color: '#4E8D6E', fontWeight: 600, cursor: 'pointer' }}>Passer en Résolu</button>}
                          {allDone && h.isStatutFinal(d.statut) && <span style={{ fontSize: 11, color: '#4E8D6E', fontWeight: 600 }}>Parcours terminé</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Modules sans défi (anciens) */}
              {mPt.filter(p => !p.defi_id).length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#5E7175', fontWeight: 600, marginBottom: 6 }}>Non liés à un défi</div>
                  {mPt.filter(p => !p.defi_id).map(p => {
                    const mod = (refs.modules || []).find(mod => mod.id === p.module_id)
                    return (
                      <div key={p.id} onClick={() => validerModule(p.id, !p.valide)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid ' + (p.valide ? '#4E8D6E' : '#DCE6E5'), background: p.valide ? '#4E8D6E08' : '#fff', marginBottom: 4, cursor: 'pointer' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (p.valide ? '#4E8D6E' : '#DCE6E5'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: p.valide ? '#4E8D6E' : '#5E7175' }}>{p.valide ? '✓' : ''}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: p.valide ? '#4E8D6E' : '#2B3A3D' }}>{mod?.nom || '?'}</div></div>
                        <span style={S.pill(p.valide ? '#4E8D6E' : '#5E7175')}>{p.valide ? 'Validé' : 'En attente'}</span>
                        {peutSuppr && <button onClick={e => { e.stopPropagation(); retirerModule(p.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#5E7175' }}>✕</button>}
                      </div>
                    )
                  })}
                </div>
              )}
              <div style={{ marginTop: 8, height: 5, background: '#F5F3EE', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, background: '#4E8D6E', width: (mPt.length ? Math.round(pv / mPt.length * 100) : 0) + '%' }} /></div>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#5E7175', marginTop: 3 }}>{pv}/{mPt.length} validés</div>
            </div>
          )}
        </div>
      )}

      {/* Tab Journal */}
      {ftab === 'jn' && !estBerger && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Journal pastoral</div>
            <button onClick={() => { setFd({ date_note: today(), type_note: 'note' }); setModal('journal') }} style={S.btn('#8B5B9E', false)}>+ Note</button>
          </div>
          {journalNotes.length === 0
            ? <div style={{ padding: 12, textAlign: 'center', color: '#5E7175', fontSize: 13 }}>Aucune note. <span onClick={() => { setFd({ date_note: today(), type_note: 'note' }); setModal('journal') }} style={{ color: '#8B5B9E', cursor: 'pointer', textDecoration: 'underline' }}>Écrire la première</span></div>
            : journalNotes.map(n => (
              <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid #DCE6E5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#5E7175' }}>{fmt(n.date_note)}</span>
                    {n.type && n.type !== 'note' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: '#8B5B9E14', color: '#8B5B9E', fontWeight: 600 }}>{n.type}</span>}
                  </div>
                  {peutSuppr && <button onClick={() => setConfirmAction({ msg: 'Supprimer cette note ?', fn: async () => { try { await supprimerNote(n.id) } catch(e) { showToast('⚠ Erreur') } } })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#5E7175', padding: '4px 8px' }}>✕</button>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.contenu}</div>
              </div>
            ))}
        </div>
      )}

      {/* Modal journal */}
      {modal === 'journal' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCE6E5' }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Nouvelle note — {m.prenom}</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Date</label><input type="date" value={fd.date_note || today()} onChange={e => uf('date_note', e.target.value)} style={S.inp} /></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Type</label>
                <select value={fd.type_note || 'note'} onChange={e => uf('type_note', e.target.value)} style={S.inp}>
                  <option value="note">Note libre</option>
                  <option value="appel">Appel téléphonique</option>
                  <option value="visite">Visite</option>
                  <option value="sms">SMS / Message</option>
                  <option value="observation">Observation</option>
                </select>
              </div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Contenu</label><textarea value={fd.contenu || ''} onChange={e => uf('contenu', e.target.value)} rows={4} placeholder="Qu'avez-vous observé ou échangé ?" style={{ ...S.inp, resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #DCE6E5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#5E7175', true)}>Annuler</button>
              <button onClick={async () => {
                if (!fd.contenu?.trim()) { showToast('⚠ Écrivez quelque chose'); return }
                try {
                  await ajouterNote({ date_note: fd.date_note || today(), contenu: fd.contenu.trim(), type: fd.type_note || 'note' })
                  showToast('✓ Note ajoutée')
                  setModal(null); setFd({})
                } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
              }} style={S.btn('#8B5B9E', false)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal entretien */}
      {modal === 'ent' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCE6E5' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{editEntId ? "Modifier l'entretien" : 'Nouvel entretien'}</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Date</label><input value={fd.date_entretien || today()} onChange={e => uf('date_entretien', e.target.value)} style={S.inp} type="date" /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut || h.defaultStatutEnt} onChange={e => uf('statut', e.target.value)} style={S.inp}>{(refs.statutsEntretien || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Avec qui</label><select value={fd.avec_qui || ''} onChange={e => uf('avec_qui', e.target.value || null)} style={S.inp}><option value="">— Choisir —</option>{actifs.filter(x => h.canFollow(x.role) && x.famille_id === m.famille_id && x.id !== m.id).sort((a, b) => { const niv = (r) => (refs.roles || []).find(ro => ro.nom === r)?.niveau ?? 99; return niv(a.role) - niv(b.role) || a.nom.localeCompare(b.nom) }).map(x => <option key={x.id} value={x.id}>{x.prenom} {x.nom} ({x.role})</option>)}</select></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Sujet</label><select value={fd.sujet_id || ''} onChange={e => { uf('sujet_id', e.target.value || null); if (e.target.value) uf('sujet_libre', null) }} style={S.inp}><option value="">— Libre —</option>{(refs.sujetsEntretien || []).map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></div>
              {!fd.sujet_id && <div style={{ marginBottom: 8 }}><label style={S.label}>Sujet libre</label><input value={fd.sujet_libre || ''} onChange={e => uf('sujet_libre', e.target.value)} style={S.inp} /></div>}
              <div style={{ marginBottom: 8 }}><label style={S.label}>Commentaires</label><textarea value={fd.commentaires || ''} onChange={e => uf('commentaires', e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #DCE6E5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}); setEditEntId(null) }} style={S.btn('#5E7175', true)}>Annuler</button>
              <button onClick={handleSaveEnt} style={S.btn('#2E7D8A', false)}>{editEntId ? 'Modifier' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal défi */}
      {modal === 'defi' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCE6E5' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Nouveau défi</div></div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Type</label><select value={fd.type_defi || ''} onChange={e => uf('type_defi', e.target.value)} style={S.inp}>{(refs.typesDefi || []).map(t => <option key={t.nom} value={t.nom}>{t.nom}</option>)}</select></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Description</label><textarea value={fd.description || ''} onChange={e => uf('description', e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} /></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut_defi || h.defaultStatutDefi} onChange={e => uf('statut_defi', e.target.value)} style={S.inp}>{(refs.statutsDefi || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #DCE6E5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#5E7175', true)}>Annuler</button>
              <button onClick={handleSaveDefi} style={S.btn('#2E7D8A', false)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal édition défi */}
      {modal === 'editDefi' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCE6E5' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Modifier le défi</div></div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Type</label><select value={fd.type_defi || ''} onChange={e => uf('type_defi', e.target.value)} style={S.inp}>{(refs.typesDefi || []).map(t => <option key={t.nom} value={t.nom}>{t.nom}</option>)}</select></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Description</label><textarea value={fd.description || ''} onChange={e => uf('description', e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} /></div>
              <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut_defi || ''} onChange={e => uf('statut_defi', e.target.value)} style={S.inp}>{(refs.statutsDefi || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #DCE6E5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#5E7175', true)}>Annuler</button>
              <button onClick={async () => {
                try {
                  await modifierDefi(fd._editDefiId, { type_defi: fd.type_defi, description: fd.description, statut: fd.statut_defi })
                  setModal(null); setFd({})
                } catch (e) { showToast('⚠ ' + e.message) }
              }} style={S.btn('#2E7D8A', false)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal assigner module */}
      {modal === 'asMod' && (() => {
        const done = {}; mPt.forEach(p => { done[p.module_id + '_' + (p.defi_id || '')] = true })
        const avail = (refs.modules || []).filter(mod => !done[mod.id + '_' + (fd._asDefiId || '')])
        const sel = fd._asModIds || {}
        const nSel = Object.keys(sel).filter(k => sel[k]).length
        const toggleMod = (id) => setFd(prev => ({ ...prev, _asModIds: { ...(prev._asModIds || {}), [id]: !(prev._asModIds || {})[id] } }))
        const doAssignAll = async () => {
          try {
            const ids = Object.keys(sel).filter(k => sel[k])
            for (const modId of ids) { await assignerModule(m.id, modId, fd._asDefiId) }
            setModal(null); setFd({})
          } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
        }
        return (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: 460 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCE6E5' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Assigner des modules</div></div>
              <div style={{ padding: '16px 20px', maxHeight: '45dvh', overflowY: 'auto' }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={S.label}>Lié au défi</label>
                  <select value={fd._asDefiId || ''} onChange={e => setFd(prev => ({ ...prev, _asDefiId: e.target.value || null, _asModIds: {} }))} style={S.inp}>
                    <option value="">— Choisir un défi —</option>
                    {mDf.map(d => <option key={d.id} value={d.id}>{d.type_defi} — {(d.description || '').substring(0, 40)}{d.description?.length > 40 ? '...' : ''} ({d.statut})</option>)}
                  </select>
                </div>
                {!fd._asDefiId ? (
                  <div style={{ padding: 12, textAlign: 'center', color: '#5E7175', fontSize: 13 }}>Sélectionnez d'abord un défi ci-dessus.</div>
                ) : avail.length === 0 ? (
                  <div style={{ padding: 12, textAlign: 'center', color: '#4E8D6E', fontSize: 13 }}>Tous les modules sont déjà assignés pour ce défi.</div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#5E7175' }}>Cochez les modules à assigner</span>
                      <button onClick={() => { const all = {}; avail.forEach(mod => { all[mod.id] = true }); setFd(prev => ({ ...prev, _asModIds: all })) }} style={{ background: 'none', border: 'none', fontSize: 12, color: '#2E7D8A', cursor: 'pointer', fontWeight: 600 }}>Tout cocher</button>
                    </div>
                    {avail.map(mod => (
                      <div key={mod.id} onClick={() => toggleMod(mod.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: '1px solid ' + (sel[mod.id] ? '#8B5B9E' : '#DCE6E5'), background: sel[mod.id] ? '#8B5B9E08' : '#fff', marginBottom: 4, cursor: 'pointer' }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (sel[mod.id] ? '#8B5B9E' : '#DCE6E5'), background: sel[mod.id] ? '#8B5B9E' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', flexShrink: 0 }}>
                          {sel[mod.id] ? '✓' : ''}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13 }}>{mod.nom}</span>
                          {mod.description && <div style={{ fontSize: 11, color: '#5E7175', marginTop: 2 }}>{mod.description}</div>}
                          {mod.url && <a href={mod.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2E7D8A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2 }}>Accéder au contenu →</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #DCE6E5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#5E7175', true)}>Annuler</button>
                {nSel > 0 && <button onClick={doAssignAll} style={S.btn('#8B5B9E', false)}>Assigner {nSel} module{nSel > 1 ? 's' : ''}</button>}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal transfert de famille */}
      {modal === 'transfer' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCE6E5' }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Transférer {m.prenom} {m.nom}</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 10 }}><label style={S.label}>Nouvelle famille</label>
                <select value={fd._transferFamilleId || ''} onChange={e => uf('_transferFamilleId', e.target.value || null)} style={S.inp}>
                  <option value="">— Choisir une famille —</option>
                  {(fd._familles || []).filter(f => f.id !== m.famille_id).map(f => (
                    <option key={f.id} value={f.id}>{f.eglises?.nom || '?'} → {f.nom}</option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Données à conserver</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={fd._keepCulte !== false} onChange={e => uf('_keepCulte', e.target.checked)} />
                Présences du Culte (dimanche)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={fd._keepOtherPres === true} onChange={e => uf('_keepOtherPres', e.target.checked)} />
                Autres présences (enseignement, prière...)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={fd._keepEntretiens !== false} onChange={e => uf('_keepEntretiens', e.target.checked)} />
                Entretiens
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={fd._keepDefis !== false} onChange={e => uf('_keepDefis', e.target.checked)} />
                Défis et plan de croissance
              </label>

              <div style={{ marginTop: 10, marginBottom: 8 }}><label style={S.label}>Date d'inscription dans la nouvelle famille</label>
                <input type="date" value={fd._transferDate || today()} onChange={e => uf('_transferDate', e.target.value)} style={S.inp} />
              </div>

              <div style={{ padding: '8px 10px', background: '#2E7D8A08', borderRadius: 6, border: '1px solid #2E7D8A33', fontSize: 12, color: '#2E7D8A', lineHeight: 1.5 }}>
                ⚠ Le "Suivi par" sera réinitialisé. Le statut passera à "{h.defaultStatut}".
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #DCE6E5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#5E7175', true)}>Annuler</button>
              <button disabled={!fd._transferFamilleId} onClick={async () => {
                try {
                  const { supabase } = await import('../lib/supabase')
                  // Transfert atomique côté serveur (tout ou rien) — voir TRANSFERT-MEMBRE-RPC.sql
                  const { error } = await supabase.rpc('transferer_membre', {
                    p_membre_id: m.id,
                    p_famille_id: fd._transferFamilleId,
                    p_date: fd._transferDate || today(),
                    p_statut: h.defaultStatut,
                    p_keep_culte: fd._keepCulte !== false,
                    p_keep_other: fd._keepOtherPres === true,
                    p_keep_entretiens: fd._keepEntretiens !== false,
                    p_keep_defis: fd._keepDefis !== false,
                  })
                  if (error) throw error

                  showToast('✓ Membre transféré')
                  setModal(null); setFd({})
                  reloadMembres()
                  setPage(prevPage || 'ames')
                } catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
              }} style={{ ...S.btn('#8B5B9E', false), opacity: fd._transferFamilleId ? 1 : 0.5 }}>Transférer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="modal-overlay danger">
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div style={{ padding: '20px 24px' }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Confirmation</div><div style={{ fontSize: 14, color: '#5E7175', lineHeight: 1.6 }}>{confirmAction.msg}</div></div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid #DCE6E5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmAction(null)} style={S.btn('#5E7175', true)}>Annuler</button>
              <button onClick={() => { confirmAction.fn(); setConfirmAction(null) }} style={S.btn('#C25A4A', false)}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal réassignation archivage */}
      {modal === 'archiveReassign' && fd._archiveSuivis && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCE6E5' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2E7D8A' }}>⚠ Réassigner avant archivage</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, color: '#5E7175', marginBottom: 10 }}>{m.prenom} {m.nom} suit {fd._archiveSuivis.length} membre(s). Choisissez un nouveau responsable :</div>
              <div style={{ marginBottom: 8, padding: '8px 10px', background: '#F5F3EE', borderRadius: 6, fontSize: 12, color: '#5E7175' }}>
                {fd._archiveSuivis.map(s => s.prenom + ' ' + s.nom).join(', ')}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Nouveau responsable</label>
                <select value={fd._archiveNewSuiv || ''} onChange={e => uf('_archiveNewSuiv', e.target.value || null)} style={S.inp}>
                  <option value="">— Choisir —</option>
                  {leaders.filter(l => l.id !== m.id).map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom} ({l.role})</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #DCE6E5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#5E7175', true)}>Annuler</button>
              <button onClick={doArchiveReassign} style={S.btn('#2E7D8A', false)}>Réassigner et archiver</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal édition membre */}
      {modal === 'edMb' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #DCE6E5' }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Modifier le membre</div>
            </div>
            <div style={{ padding: '16px 20px', maxHeight: '55dvh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Nom</label><input value={fd.nom || ''} onChange={e => uf('nom', e.target.value)} style={S.inp} /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Prénom</label><input value={fd.prenom || ''} onChange={e => uf('prenom', e.target.value)} style={S.inp} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Téléphone</label><input value={fd.telephone || ''} onChange={e => uf('telephone', e.target.value)} style={S.inp} /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Email</label><input value={fd.email || ''} onChange={e => uf('email', e.target.value)} style={S.inp} type="email" /></div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Date d'inscription</label>
                <input value={fd.date_inscription || ''} onChange={e => uf('date_inscription', e.target.value)} max={today()} style={S.inp} type="date" />
                {fd.date_inscription && m.date_inscription && fd.date_inscription !== m.date_inscription && (
                  <div style={{ fontSize: 11, color: '#2E7D8A', marginTop: 4, padding: '4px 8px', background: '#2E7D8A08', border: '1px solid #2E7D8A33', borderRadius: 4 }}>
                    ⚠ Modifier la date d'inscription recalcule l'éligibilité des présences passées. Le taux du membre peut changer.
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Nationalité</label><input value={fd.nationalite || ''} onChange={e => uf('nationalite', e.target.value)} style={S.inp} placeholder="Ex. Ivoirienne" /></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Situation professionnelle</label><select value={fd.situation_professionnelle || ''} onChange={e => uf('situation_professionnelle', e.target.value || null)} style={S.inp}><option value="">— Non renseignée —</option>{(refs.situationsPro || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Statut</label><select value={fd.statut || h.defaultStatut} onChange={e => uf('statut', e.target.value)} style={S.inp}>{(refs.statuts || []).filter(s => !s.est_archive).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
                <div style={{ marginBottom: 8 }}><label style={S.label}>Rôle</label><select value={fd.role || h.defaultRole} onChange={e => { uf('role', e.target.value); if (h.isBergerRole(e.target.value)) uf('suivi_par', null) }} style={S.inp}>{(refs.roles || []).map(r => <option key={r.nom} value={r.nom}>{r.nom}</option>)}</select></div>
              </div>
              {(!h.isBergerRole(fd.role)) && <div style={{ marginBottom: 8 }}><label style={S.label}>Suivi par</label><select value={fd.suivi_par || ''} onChange={e => uf('suivi_par', e.target.value || null)} style={S.inp}><option value="">— Aucun —</option>{leaders.filter(l => l.id !== m.id).map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom} ({l.role})</option>)}</select></div>}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}><input type="checkbox" checked={!!fd.est_retour} onChange={e => uf('est_retour', e.target.checked)} /><span style={{ fontSize: 13, color: '#5E7175', fontWeight: 600 }}>C'est un retour</span></label>
              {fd.est_retour && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                  <div style={{ marginBottom: 8 }}><label style={S.label}>Date départ</label><input value={fd.date_depart || ''} onChange={e => uf('date_depart', e.target.value)} style={S.inp} type="date" /></div>
                  <div style={{ marginBottom: 8 }}><label style={S.label}>Motif</label><select value={fd.motif_depart || ''} onChange={e => uf('motif_depart', e.target.value)} style={S.inp}><option value="">—</option>{(refs.motifsDepart || []).map(s => <option key={s.nom} value={s.nom}>{s.nom}</option>)}</select></div>
                  <div style={{ marginBottom: 8 }}><label style={S.label}>Date retour</label><input value={fd.date_retour || ''} onChange={e => uf('date_retour', e.target.value)} style={S.inp} type="date" /></div>
                </div>
              )}
              <div style={{ marginBottom: 8 }}><label style={S.label}>Notes</label><textarea value={fd.notes || ''} onChange={e => uf('notes', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #DCE6E5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setFd({}) }} style={S.btn('#5E7175', true)}>Annuler</button>
              <button onClick={async () => {
                try {
                  const { id, created_at, created_by, updated_at, updated_by, ...updates } = fd
                  await modifierMembre(m.id, updates)
                  setModal(null); setFd({})
                } catch (e) { showToast('⚠ ' + e.message) }
              }} style={S.btn('#2E7D8A', false)}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
