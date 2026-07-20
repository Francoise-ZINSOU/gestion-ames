import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { S } from '../lib/ui'
import { useRefAdmin, useProfils } from '../lib/data'

const REF_TABLES = [
  { key: 'ref_statuts', label: 'Statuts des membres', fields: ['nom', 'couleur'] },
  { key: 'ref_roles', label: 'Rôles des membres', fields: ['nom', 'couleur'] },
  { key: 'activites', label: 'Activités', fields: ['nom', 'code', 'icone', 'couleur', 'jour_semaine'] },
  { key: 'modules', label: 'Parcours de formation', fields: ['nom', 'description', 'url'] },
  { key: 'sujets_entretien', label: "Sujets d'entretien", fields: ['nom'] },
  { key: 'ref_types_defi', label: 'Types de défis', fields: ['nom'] },
  { key: 'ref_statuts_defi', label: 'Statuts des défis', fields: ['nom', 'couleur'] },
  { key: 'ref_statuts_entretien', label: 'Statuts des entretiens', fields: ['nom', 'couleur'] },
  { key: 'ref_motifs_depart', label: 'Motifs de départ', fields: ['nom'] },
]

function AccordionRefTable({ table, label, fields, showToast, familleId }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 4 }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: open ? '#0ea88808' : '#f0f2f6', borderRadius: 7, cursor: 'pointer', border: '1px solid ' + (open ? '#0ea88833' : '#e0e4ec') }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: open ? '#0ea888' : '#5a6480' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={{ padding: '10px 4px' }}><RefTable table={table} label={label} fields={fields} showToast={showToast} familleId={familleId} /></div>}
    </div>
  )
}

function RefTable({ table, label, fields, showToast, familleId }) {
  const { rows: allRows, ajouter, modifier, desactiver, reload } = useRefAdmin(table)
  const [newNom, setNewNom] = useState('')

  // Activités : filtrer par famille_id de l'utilisateur
  const rows = familleId ? allRows.filter(r => r.famille_id === familleId) : allRows

  const slugify = (s) => s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)

  const handleAdd = async () => {
    if (!newNom.trim()) return
    const payload = { nom: newNom.trim() }
    if (fields.includes('code') || table === 'activites') {
      payload.code = slugify(newNom.trim())
    }
    // Rattacher automatiquement à la famille
    if (familleId) payload.famille_id = familleId
    try { await ajouter(payload); setNewNom(''); showToast('✓ Ajouté') }
    catch (e) { showToast(e.message?.includes('duplicate') ? '⚠ Ce nom existe déjà' : '⚠ ' + e.message) }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {rows.map(r => (
        <div key={r.id} style={{ padding: '6px 0', borderBottom: '1px solid #e0e4ec', opacity: r.actif ? 1 : 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {r.couleur && <div style={{ width: 12, height: 12, borderRadius: 3, background: r.couleur, flexShrink: 0 }} />}
            <span style={{ flex: 1, fontSize: 13 }}>{r.nom}</span>
            {fields.includes('jour_semaine') && (
              <select value={r.jour_semaine ?? ''} onChange={async e => {
                const v = e.target.value === '' ? null : parseInt(e.target.value)
                try {
                  const { error } = await supabase.from(table).update({ jour_semaine: v, est_recurrente: v !== null }).eq('id', r.id)
                  if (error) throw error
                  showToast('✓ Mis à jour'); reload()
                } catch (err) { showToast('⚠ ' + err.message) }
              }} style={{ fontSize: 11, padding: '3px 6px', border: '1px solid #e0e4ec', borderRadius: 4, background: '#f0f2f6', fontFamily: 'inherit' }}>
                <option value="">Ponctuelle</option>
                <option value="0">Dimanche</option>
                <option value="1">Lundi</option>
                <option value="2">Mardi</option>
                <option value="3">Mercredi</option>
                <option value="4">Jeudi</option>
                <option value="5">Vendredi</option>
                <option value="6">Samedi</option>
              </select>
            )}
            <button onClick={() => desactiver(r.id, !r.actif)} style={{ background: 'none', border: 'none', fontSize: 11, color: r.actif ? '#6b7280' : '#0ea888', cursor: 'pointer' }}>
              {r.actif ? 'Désactiver' : 'Réactiver'}
            </button>
          </div>
          {fields.includes('url') && (
            <div style={{ marginTop: 4, marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input defaultValue={r.description || ''} placeholder="Description courte..." onBlur={async e => {
                if (e.target.value !== (r.description || '')) {
                  try { await modifier(r.id, { description: e.target.value }); showToast('✓') } catch(err) { showToast('⚠ ' + err.message) }
                }
              }} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e0e4ec', borderRadius: 4, background: '#f4f6f9', boxSizing: 'border-box', width: '100%' }} />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input defaultValue={r.url || ''} placeholder="Lien (YouTube, PDF, Drive...)" onBlur={async e => {
                  if (e.target.value !== (r.url || '')) {
                    try { await modifier(r.id, { url: e.target.value }); showToast('✓') } catch(err) { showToast('⚠ ' + err.message) }
                  }
                }} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e0e4ec', borderRadius: 4, background: '#f4f6f9', boxSizing: 'border-box', flex: 1 }} />
                {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#3060d0', flexShrink: 0 }}>Ouvrir</a>}
              </div>
            </div>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <input value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Nouveau..." style={{ ...S.inp, flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} style={S.btn('#0ea888', false)}>+</button>
      </div>
    </div>
  )
}

function UsersTable({ showToast, actifs, refs }) {
  const { profils, setRole, reload: reloadProfils } = useProfils()
  const [familles, setFamilles] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', nom_affiche: '', membre_id: '', famille_id: '', est_admin: false, est_responsable: true, est_berger_eglise: false, eglise_id: '' })
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    supabase.from('familles_disciples').select('*, eglises(nom, actif)').order('nom').then(({ data }) => setFamilles(data || []))
  }, [])

  const handleInvite = async () => {
    if (!inviteData.email?.trim()) { showToast('⚠ Email requis'); return }
    setInviting(true)
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: inviteData
      })
      if (error) {
        // Edge Function errors : extraire le message utile
        let detail = error.message || 'Erreur Edge Function'
        try {
          const ctx = error.context
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json()
            if (body?.error) detail = body.error
          }
        } catch (_) {}
        throw new Error(detail)
      }
      if (data?.error) throw new Error(data.error)
      showToast('✓ Invitation envoyée à ' + inviteData.email)
      setShowInvite(false)
      setInviteData({ email: '', nom_affiche: '', membre_id: '', famille_id: '', est_admin: false, est_responsable: true, est_berger_eglise: false, eglise_id: '' })
      setTimeout(reloadProfils, 2000)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('404') || msg.includes('not found') || msg.includes('FunctionNotFound')) {
        showToast('⚠ Fonction "invite-user" non trouvée. Déployez-la dans Supabase → Edge Functions.')
      } else if (msg.includes('401') || msg.includes('JWT')) {
        showToast('⚠ Session expirée. Reconnectez-vous.')
      } else {
        showToast('⚠ ' + msg)
      }
    } finally { setInviting(false) }
  }

  const handleRole = async (id, resp, admin) => {
    try { await setRole(id, resp, admin); showToast('✓ Droits mis à jour') }
    catch (e) { showToast(e.message?.includes('duplicate') ? '⚠ Ce nom existe déjà' : '⚠ ' + e.message) }
  }

  const linkMembre = async (profilId, membreId) => {
    try {
      const { error } = await supabase.from('profils').update({ membre_id: membreId || null }).eq('id', profilId)
      if (error) throw error
      showToast('✓ Membre lié'); reloadProfils()
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  const linkBergerEglise = async (profilId, checked, egliseId) => {
    try {
      const updates = { est_berger_eglise: checked }
      if (checked && egliseId) updates.eglise_id = egliseId
      const { error } = await supabase.from('profils').update(updates).eq('id', profilId)
      if (error) throw error
      showToast(checked ? '✓ Berger d\'église assigné' : '✓ Retiré')
      reloadProfils()
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  const linkFamille = async (profilId, familleId) => {
    try {
      const { error } = await supabase.from('profils').update({ famille_id: familleId || null }).eq('id', profilId)
      if (error) throw error
      showToast('✓ Famille assignée'); reloadProfils()
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Utilisateurs</div>
        <button onClick={() => setShowInvite(!showInvite)} style={{ ...S.btn('#0ea888', false), fontSize: 12, padding: '4px 10px' }}>{showInvite ? '✕ Fermer' : '+ Inviter'}</button>
      </div>

      {showInvite && (
        <div style={{ padding: 12, background: '#0ea88808', border: '1px solid #0ea88833', borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#5a6480', marginBottom: 8, lineHeight: 1.5 }}>
            L'utilisateur recevra un email l'invitant à définir son mot de passe.
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Email</label>
            <input type="email" value={inviteData.email} onChange={e => setInviteData(p => ({ ...p, email: e.target.value }))} style={S.inp} placeholder="marie@exemple.com" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Nom affiché</label>
            <input value={inviteData.nom_affiche} onChange={e => setInviteData(p => ({ ...p, nom_affiche: e.target.value }))} style={S.inp} placeholder="Marie DUPONT" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Famille</label>
            <select value={inviteData.famille_id} onChange={e => setInviteData(p => ({ ...p, famille_id: e.target.value }))} style={S.inp}>
              <option value="">— Aucune —</option>
              {familles.map(f => <option key={f.id} value={f.id}>{f.nom}{f.eglises?.nom ? ' (' + f.eglises.nom + ')' : ''}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Lier à un membre existant (optionnel)</label>
            <select value={inviteData.membre_id} onChange={e => {
              const mid = e.target.value
              const m = (actifs || []).find(x => x.id === mid)
              setInviteData(p => ({ ...p, membre_id: mid, nom_affiche: m ? m.prenom + ' ' + m.nom : p.nom_affiche }))
            }} style={S.inp}>
              <option value="">— Aucun —</option>
              {(actifs || []).sort((a, b) => a.nom.localeCompare(b.nom)).map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, fontSize: 12 }}>
            <label style={{ display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={inviteData.est_responsable} onChange={e => setInviteData(p => ({ ...p, est_responsable: e.target.checked }))} /> Responsable (accès à l'app)
            </label>
            <label style={{ display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={inviteData.est_admin} onChange={e => setInviteData(p => ({ ...p, est_admin: e.target.checked }))} /> Admin
            </label>
          </div>
          <button onClick={handleInvite} disabled={inviting || !inviteData.email} style={{ ...S.btn('#0ea888', false), width: '100%', opacity: inviting || !inviteData.email ? 0.6 : 1 }}>
            {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
          </button>
        </div>
      )}
      {profils.map(p => {
        const linkedMembre = (actifs || []).find(m => m.id === p.membre_id)
        return (
          <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #e0e4ec' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nom_affiche || p.email}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{p.email}</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={p.est_responsable || false} onChange={e => handleRole(p.id, e.target.checked, p.est_admin)} />
                Resp.
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={p.est_admin || false} onChange={e => handleRole(p.id, p.est_responsable, e.target.checked)} />
                Admin
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: '#7040d0' }}>
                <input type="checkbox" checked={p.est_berger_eglise || false} onChange={e => {
                  const famille = familles.find(f => f.id === p.famille_id)
                  linkBergerEglise(p.id, e.target.checked, famille?.eglise_id)
                }} />
                Berger d'église
              </label>
            </div>
            <div style={{ marginTop: 4 }}>
              <select value={p.membre_id || ''} onChange={e => linkMembre(p.id, e.target.value || null)} style={{ fontSize: 11, padding: '3px 6px', border: '1px solid #e0e4ec', borderRadius: 4, background: '#f0f2f6', color: '#5a6480', fontFamily: 'inherit', width: '100%', maxWidth: 250 }}>
                <option value="">— Lier à un membre —</option>
                {(actifs || []).filter(m => {
                    const role = (refs?.roles || []).find(r => r.nom === m.role)
                    if (!role?.peut_suivre) return false
                    if (p.famille_id && m.famille_id && m.famille_id !== p.famille_id) return false
                    return true
                  }).sort((a, b) => a.nom.localeCompare(b.nom)).map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom} ({m.role})</option>)}
              </select>
              {linkedMembre && <span style={{ fontSize: 11, color: '#0ea888', marginLeft: 6 }}>→ {linkedMembre.prenom} {linkedMembre.nom}</span>}
            </div>
            {familles.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <select value={p.famille_id || ''} onChange={e => linkFamille(p.id, e.target.value || null)} style={{ fontSize: 11, padding: '3px 6px', border: '1px solid #e0e4ec', borderRadius: 4, background: p.famille_id ? '#0ea88808' : '#e0305008', color: '#5a6480', fontFamily: 'inherit', width: '100%', maxWidth: 250 }}>
                  <option value="">— Assigner à une famille —</option>
                  {familles.filter(f => f.actif !== false && (!f.eglises || f.eglises.actif !== false)).map(f => <option key={f.id} value={f.id}>{f.eglises?.nom} → {f.nom}</option>)}
                </select>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


function EglisePanel({ showToast }) {
  const [eglises, setEglises] = useState([])
  const [familles, setFamilles] = useState([])
  const [newEglise, setNewEglise] = useState('')
  const [newFamille, setNewFamille] = useState({ eglise_id: '', nom: '' })

  const loadAll = async () => {
    const { data: eg } = await supabase.from('eglises').select('*').order('nom')
    const { data: fa } = await supabase.from('familles_disciples').select('*').order('nom')
    setEglises(eg || []); setFamilles(fa || [])
  }
  useEffect(() => { loadAll() }, [])

  const addEglise = async () => {
    if (!newEglise.trim()) return
    try {
      const { error } = await supabase.from('eglises').insert({ nom: newEglise.trim() })
      if (error) throw error
      showToast('✓ Église ajoutée'); setNewEglise(''); loadAll()
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  const addFamille = async () => {
    if (!newFamille.eglise_id || !newFamille.nom.trim()) return
    try {
      const { data, error } = await supabase.from('familles_disciples').insert({ eglise_id: newFamille.eglise_id, nom: newFamille.nom.trim() }).select().single()
      if (error) throw error

      // Créer automatiquement les activités de base pour cette famille
      const defaultActivites = [
        { nom: 'Culte du dimanche', code: 'culte', icone: '⛪', couleur: '#0ea888', jour_semaine: 0, est_recurrente: true },
        { nom: 'Enseignement', code: 'enseignement', icone: '📖', couleur: '#3060d0', jour_semaine: null, est_recurrente: false },
        { nom: 'Réunion de prière', code: 'priere', icone: '🙏', couleur: '#7040d0', jour_semaine: null, est_recurrente: false },
      ]
      const { error: actErr } = await supabase.from('activites').insert(
        defaultActivites.map(a => ({ ...a, famille_id: data.id }))
      )
      if (actErr) console.error('Activités auto:', actErr)

      showToast('✓ Famille ajoutée avec ses activités'); setNewFamille({ eglise_id: '', nom: '' }); loadAll()
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Églises</div>
        {eglises.map(e => {
          const nbFam = familles.filter(f => f.eglise_id === e.id).length
          const nbFamActives = familles.filter(f => f.eglise_id === e.id && f.actif !== false).length
          return (
            <div key={e.id} style={{ padding: '6px 0', borderBottom: '1px solid #e0e4ec', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: e.actif === false ? 0.4 : 1 }}>
              <span style={{ fontWeight: 600, flex: 1 }}>{e.nom}{e.actif === false && <span style={{ fontSize: 10, marginLeft: 6, color: '#6b7280' }}>(désactivée)</span>}</span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{nbFamActives}/{nbFam} famille(s)</span>
              <button onClick={async () => {
                try {
                  const willDisable = e.actif !== false
                  const { error } = await supabase.from('eglises').update({ actif: !willDisable }).eq('id', e.id)
                  if (error) throw error
                  // Cascade : désactiver toutes les familles de cette église (mais pas les réactiver au retour)
                  if (willDisable) {
                    await supabase.from('familles_disciples').update({ actif: false }).eq('eglise_id', e.id)
                    showToast('✓ Église et ses familles désactivées')
                  } else {
                    showToast('✓ Église réactivée. Réactivez ses familles individuellement.')
                  }
                  loadAll()
                } catch (err) { showToast('⚠ ' + err.message) }
              }} style={{ background: 'none', border: 'none', fontSize: 11, color: e.actif !== false ? '#6b7280' : '#0ea888', cursor: 'pointer' }}>
                {e.actif !== false ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          )
        })}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input value={newEglise} onChange={e => setNewEglise(e.target.value)} placeholder="Nom de l'église..." style={{ ...S.inp, flex: 1, fontSize: 12 }} />
          <button onClick={addEglise} style={S.btn('#0ea888', false)}>+</button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Familles de disciples</div>
        {familles.map(f => {
          const eg = eglises.find(e => e.id === f.eglise_id)
          return (
            <div key={f.id} style={{ padding: '6px 0', borderBottom: '1px solid #e0e4ec', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: f.actif === false ? 0.4 : 1 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{f.nom}</span>
                <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>({eg?.nom}){f.actif === false && ' (désactivée)'}</span>
              </div>
              <button onClick={async () => {
                try {
                  const { error } = await supabase.from('familles_disciples').update({ actif: !(f.actif !== false) }).eq('id', f.id)
                  if (error) throw error
                  showToast(f.actif !== false ? '✓ Famille désactivée' : '✓ Famille réactivée')
                  loadAll()
                } catch (err) { showToast('⚠ ' + err.message) }
              }} style={{ background: 'none', border: 'none', fontSize: 11, color: f.actif !== false ? '#6b7280' : '#0ea888', cursor: 'pointer' }}>
                {f.actif !== false ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          )
        })}
        {eglises.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <select value={newFamille.eglise_id} onChange={e => setNewFamille(prev => ({ ...prev, eglise_id: e.target.value }))} style={{ ...S.inp, flex: '1 1 120px', fontSize: 12 }}>
              <option value="">— Église —</option>
              {eglises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
            <input value={newFamille.nom} onChange={e => setNewFamille(prev => ({ ...prev, nom: e.target.value }))} placeholder="Nom de la famille..." style={{ ...S.inp, flex: '2 1 150px', fontSize: 12 }} />
            <button onClick={addFamille} style={S.btn('#0ea888', false)}>+</button>
          </div>
        )}
      </div>

      {eglises.length === 0 && (
        <div style={{ padding: 12, textAlign: 'center', color: '#6b7280', fontSize: 12 }}>
          Créez une église pour commencer. Les familles de disciples permettront ensuite de séparer les données par groupe.
        </div>
      )}
    </div>
  )
}

export default function ParamsPage({ showToast, actifs, refs, auth }) {
  const [tab, setTab] = useState('refs')
  const [familles, setFamilles] = useState([])
  const [selectedFamilleId, setSelectedFamilleId] = useState(auth?.profil?.famille_id || '')

  // Charger les familles accessibles
  useEffect(() => {
    supabase.from('familles_disciples').select('*, eglises(nom)').eq('actif', true).order('nom').then(({ data }) => {
      setFamilles(data || [])
      if (!auth?.profil?.famille_id && data?.length) setSelectedFamilleId(data[0].id)
    })
  }, [])

  // Tables partagées (pas de famille_id)
  const sharedTables = REF_TABLES.filter(t => t.key !== 'activites')
  // Table activités (par famille)
  const activitesTable = REF_TABLES.find(t => t.key === 'activites')

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setTab('refs')} style={{ ...S.btn(tab === 'refs' ? '#0ea888' : '#6b7280', tab !== 'refs'), fontFamily: 'inherit' }}>Références</button>
        <button onClick={() => setTab('users')} style={{ ...S.btn(tab === 'users' ? '#0ea888' : '#6b7280', tab !== 'users'), fontFamily: 'inherit' }}>Utilisateurs</button>
        <button onClick={() => setTab('eglise')} style={{ ...S.btn(tab === 'eglise' ? '#0ea888' : '#6b7280', tab !== 'eglise'), fontFamily: 'inherit' }}>Église</button>
      </div>
      <div style={S.card}>
        {tab === 'users' ? <UsersTable showToast={showToast} actifs={actifs} refs={refs} />
          : tab === 'eglise' ? <EglisePanel showToast={showToast} />
          : <>
            {sharedTables.map(t => <AccordionRefTable key={t.key} table={t.key} label={t.label} fields={t.fields} showToast={showToast} />)}

            {/* Activités — par famille */}
            {activitesTable && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e0e4ec' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0ea888' }}>Activités</span>
                  <select value={selectedFamilleId} onChange={e => setSelectedFamilleId(e.target.value)} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 12 }}>
                    {familles.map(f => <option key={f.id} value={f.id}>{f.nom}{f.eglises?.nom ? ' (' + f.eglises.nom + ')' : ''}</option>)}
                  </select>
                </div>
                {selectedFamilleId && <RefTable table={activitesTable.key} label="" fields={activitesTable.fields} showToast={showToast} familleId={selectedFamilleId} />}
                {!selectedFamilleId && <div style={{ fontSize: 12, color: '#6b7280', padding: 8 }}>Sélectionnez une famille pour gérer ses activités.</div>}
              </div>
            )}
          </>}
      </div>
    </div>
  )
}
