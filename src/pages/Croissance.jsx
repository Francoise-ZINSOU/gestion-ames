import { useState } from 'react'
import { S, C, fmtS } from '../lib/ui'
import { BookOpen, Check, Plus, X, ExternalLink } from 'lucide-react'

export default function CroissancePage({ plans, refs, actifs, h, openFiche, assignerModule, validerModule, retirerModule, showToast }) {
  const [vue, setVue] = useState('parcours')
  const [modal, setModal] = useState(null)
  const [selMembre, setSelMembre] = useState('')
  const [selModule, setSelModule] = useState('')

  const modules = refs.modules || []

  if (!actifs || !actifs.length) return (
    <div style={{ ...S.card, textAlign: 'center', color: C.sub, fontSize: 14, padding: 30, lineHeight: 1.7 }}>
      Aucun membre pour le moment. Ajoutez des membres pour commencer le parcours de formation.
    </div>
  )

  // Stats par parcours
  const statsParcours = modules.map(mod => {
    const a = plans.filter(p => p.module_id === mod.id)
    const v = a.filter(p => p.valide)
    return { ...mod, assignes: a.length, valides: v.length, pc: a.length ? Math.round(v.length / a.length * 100) : 0 }
  })

  // Vue par personne : chaque membre actif avec ses parcours
  const parPersonne = actifs.map(m => {
    const mp = plans.filter(p => p.membre_id === m.id)
    return { membre: m, parcours: mp, valides: mp.filter(p => p.valide).length }
  }).filter(x => x.parcours.length > 0)
    .sort((a, b) => b.parcours.length - a.parcours.length)

  const modName = (id) => modules.find(m => m.id === id)?.nom || '—'
  const modUrl = (id) => modules.find(m => m.id === id)?.url

  const doAssign = async () => {
    if (!selMembre || !selModule) { showToast('⚠ Choisissez une personne et un parcours'); return }
    const exists = plans.some(p => p.membre_id === selMembre && p.module_id === selModule)
    if (exists) { showToast('⚠ Ce parcours est déjà assigné à cette personne'); return }
    try { await assignerModule(selMembre, selModule); setModal(null); setSelMembre(''); setSelModule('') }
    catch (e) { showToast('⚠ ' + (e.message || 'Erreur')) }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: C.page, borderRadius: 9, padding: 3 }}>
          <button onClick={() => setVue('parcours')} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: vue === 'parcours' ? C.surface : 'transparent', color: vue === 'parcours' ? C.primary : C.sub, boxShadow: vue === 'parcours' ? C.shadow : 'none' }}>Par parcours</button>
          <button onClick={() => setVue('personne')} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: vue === 'personne' ? C.surface : 'transparent', color: vue === 'personne' ? C.primary : C.sub, boxShadow: vue === 'personne' ? C.shadow : 'none' }}>Par personne</button>
        </div>
        <button onClick={() => setModal('assign')} style={{ ...S.btn(C.primary, false), marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px' }}><Plus size={15} />Assigner un parcours</button>
      </div>

      {vue === 'parcours' && (
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: C.text, marginBottom: 12 }}>Les 6 parcours de formation</div>
          {statsParcours.map(s => (
            <div key={s.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <BookOpen size={15} color={C.primary} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: C.text, flex: 1 }}>{s.nom}</span>
                {s.url && <a href={s.url} target="_blank" rel="noreferrer" style={{ color: C.primary, display: 'flex' }} title="Ouvrir la playlist"><ExternalLink size={14} /></a>}
                <span style={{ fontSize: 12, color: C.sub, minWidth: 90, textAlign: 'right' }}>{s.assignes === 0 ? 'personne' : s.valides + ' / ' + s.assignes + ' validé' + (s.valides > 1 ? 's' : '')}</span>
              </div>
              <div style={{ height: 7, background: C.page, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: s.pc >= 80 ? C.success : C.primary, width: s.pc + '%', transition: 'width .3s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {vue === 'personne' && (
        <div style={S.card}>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: C.text, marginBottom: 12 }}>Personnes en formation ({parPersonne.length})</div>
          {parPersonne.length === 0 ? (
            <div style={{ color: C.sub, fontSize: 13, padding: '8px 0' }}>Aucun parcours assigné pour l'instant. Utilisez « Assigner un parcours » pour commencer.</div>
          ) : parPersonne.map(({ membre, parcours, valides }) => (
            <div key={membre.id} style={{ padding: '10px 0', borderBottom: '1px solid ' + C.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span onClick={() => openFiche(membre.id)} style={{ fontSize: 14, fontWeight: 500, color: C.text, cursor: 'pointer', flex: 1 }}>{membre.prenom} {membre.nom}</span>
                <span style={{ fontSize: 12, color: valides === parcours.length ? C.success : C.sub }}>{valides} / {parcours.length} validé{valides > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {parcours.map(p => (
                  <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 10px', borderRadius: 12, fontSize: 12, background: p.valide ? C.success + '18' : C.primary + '12', color: p.valide ? C.success : C.primary }}>
                    {p.valide && <Check size={12} />}
                    {modName(p.module_id)}
                    <button onClick={() => validerModule(p.id, !p.valide)} title={p.valide ? 'Marquer non validé' : 'Marquer validé'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', opacity: .7 }}>{p.valide ? <X size={12} /> : <Check size={12} />}</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === 'assign' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border }}><div style={{ fontSize: 15, fontWeight: 600 }}>Assigner un parcours</div></div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 10 }}>
                <label style={S.label}>Personne</label>
                <select value={selMembre} onChange={e => setSelMembre(e.target.value)} style={S.inp}>
                  <option value="">— Choisir —</option>
                  {actifs.slice().sort((a, b) => a.nom.localeCompare(b.nom)).map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Parcours de formation</label>
                <select value={selModule} onChange={e => setSelModule(e.target.value)} style={S.inp}>
                  <option value="">— Choisir —</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid ' + C.border, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={S.btn(C.sub, true)}>Annuler</button>
              <button onClick={doAssign} style={S.btn(C.primary, false)}>Assigner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
