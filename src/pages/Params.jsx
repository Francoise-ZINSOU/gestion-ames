import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { S } from '../lib/ui'
import { useRefAdmin, useProfils } from '../lib/data'

const REF_TABLES = [
  { key: 'ref_statuts', label: 'Statuts des membres', fields: ['nom', 'couleur'] },
  { key: 'ref_roles', label: 'Rôles des membres', fields: ['nom', 'couleur'] },
  { key: 'activites', label: 'Activités', fields: ['nom', 'code', 'icone', 'couleur'] },
  { key: 'modules', label: 'Modules de croissance', fields: ['nom'] },
  { key: 'sujets_entretien', label: "Sujets d'entretien", fields: ['nom'] },
  { key: 'ref_types_defi', label: 'Types de défis', fields: ['nom'] },
  { key: 'ref_statuts_defi', label: 'Statuts des défis', fields: ['nom', 'couleur'] },
  { key: 'ref_statuts_entretien', label: 'Statuts des entretiens', fields: ['nom', 'couleur'] },
  { key: 'ref_motifs_depart', label: 'Motifs de départ', fields: ['nom'] },
]

function AccordionRefTable({ table, label, fields, showToast }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 4 }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: open ? '#0ea88808' : '#f0f2f6', borderRadius: 7, cursor: 'pointer', border: '1px solid ' + (open ? '#0ea88833' : '#e0e4ec') }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: open ? '#0ea888' : '#5a6480' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#8892a8' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={{ padding: '10px 4px' }}><RefTable table={table} label={label} fields={fields} showToast={showToast} /></div>}
    </div>
  )
}

function RefTable({ table, label, fields, showToast }) {
  const { rows, ajouter, modifier, desactiver } = useRefAdmin(table)
  const [newNom, setNewNom] = useState('')

  const handleAdd = async () => {
    if (!newNom.trim()) return
    try { await ajouter({ nom: newNom.trim() }); setNewNom(''); showToast('✓ Ajouté') }
    catch (e) { showToast(e.message?.includes('duplicate') ? '⚠ Ce nom existe déjà' : '⚠ ' + e.message) }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {rows.map(r => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #e0e4ec', opacity: r.actif ? 1 : 0.4 }}>
          {r.couleur && <div style={{ width: 12, height: 12, borderRadius: 3, background: r.couleur, flexShrink: 0 }} />}
          <span style={{ flex: 1, fontSize: 12 }}>{r.nom}</span>
          <button onClick={() => desactiver(r.id, !r.actif)} style={{ background: 'none', border: 'none', fontSize: 10, color: r.actif ? '#8892a8' : '#0ea888', cursor: 'pointer' }}>
            {r.actif ? 'Désactiver' : 'Réactiver'}
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <input value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Nouveau..." style={{ ...S.inp, flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} style={S.btn('#0ea888', false)}>+</button>
      </div>
    </div>
  )
}

function UsersTable({ showToast, actifs }) {
  const { profils, setRole } = useProfils()

  const handleRole = async (id, resp, admin) => {
    try { await setRole(id, resp, admin); showToast('✓ Droits mis à jour') }
    catch (e) { showToast(e.message?.includes('duplicate') ? '⚠ Ce nom existe déjà' : '⚠ ' + e.message) }
  }

  const linkMembre = async (profilId, membreId) => {
    try {
      const { error } = await supabase.from('profils').update({ membre_id: membreId || null }).eq('id', profilId)
      if (error) throw error
      showToast('✓ Membre lié')
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Utilisateurs</div>
      {profils.map(p => {
        const linkedMembre = (actifs || []).find(m => m.id === p.membre_id)
        return (
          <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #e0e4ec' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{p.nom_affiche || p.email}</div>
                <div style={{ fontSize: 10, color: '#8892a8' }}>{p.email}</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" checked={p.est_responsable || false} onChange={e => handleRole(p.id, e.target.checked, p.est_admin)} />
                Resp.
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" checked={p.est_admin || false} onChange={e => handleRole(p.id, p.est_responsable, e.target.checked)} />
                Admin
              </label>
            </div>
            <div style={{ marginTop: 4 }}>
              <select value={p.membre_id || ''} onChange={e => linkMembre(p.id, e.target.value || null)} style={{ fontSize: 10, padding: '3px 6px', border: '1px solid #e0e4ec', borderRadius: 4, background: '#f0f2f6', color: '#5a6480', fontFamily: 'inherit', width: '100%', maxWidth: 250 }}>
                <option value="">— Lier à un membre —</option>
                {(actifs || []).sort((a, b) => a.nom.localeCompare(b.nom)).map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom} ({m.role})</option>)}
              </select>
              {linkedMembre && <span style={{ fontSize: 10, color: '#0ea888', marginLeft: 6 }}>→ {linkedMembre.prenom} {linkedMembre.nom}</span>}
            </div>
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
  useState(() => { loadAll() })

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
      const { error } = await supabase.from('familles_disciples').insert({ eglise_id: newFamille.eglise_id, nom: newFamille.nom.trim() })
      if (error) throw error
      showToast('✓ Famille ajoutée'); setNewFamille({ eglise_id: '', nom: '' }); loadAll()
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Églises</div>
        {eglises.map(e => (
          <div key={e.id} style={{ padding: '6px 0', borderBottom: '1px solid #e0e4ec', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>{e.nom}</span>
            <span style={{ fontSize: 10, color: '#8892a8' }}>({familles.filter(f => f.eglise_id === e.id).length} famille(s))</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input value={newEglise} onChange={e => setNewEglise(e.target.value)} placeholder="Nom de l'église..." style={{ ...S.inp, flex: 1, fontSize: 11 }} />
          <button onClick={addEglise} style={S.btn('#0ea888', false)}>+</button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Familles de disciples</div>
        {familles.map(f => {
          const eg = eglises.find(e => e.id === f.eglise_id)
          return (
            <div key={f.id} style={{ padding: '6px 0', borderBottom: '1px solid #e0e4ec', fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>{f.nom}</span>
              <span style={{ fontSize: 10, color: '#8892a8', marginLeft: 6 }}>({eg?.nom})</span>
            </div>
          )
        })}
        {eglises.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <select value={newFamille.eglise_id} onChange={e => setNewFamille(prev => ({ ...prev, eglise_id: e.target.value }))} style={{ ...S.inp, flex: '1 1 120px', fontSize: 11 }}>
              <option value="">— Église —</option>
              {eglises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
            <input value={newFamille.nom} onChange={e => setNewFamille(prev => ({ ...prev, nom: e.target.value }))} placeholder="Nom de la famille..." style={{ ...S.inp, flex: '2 1 150px', fontSize: 11 }} />
            <button onClick={addFamille} style={S.btn('#0ea888', false)}>+</button>
          </div>
        )}
      </div>

      {eglises.length === 0 && (
        <div style={{ padding: 12, textAlign: 'center', color: '#8892a8', fontSize: 11 }}>
          Créez une église pour commencer. Les familles de disciples permettront ensuite de séparer les données par groupe.
        </div>
      )}
    </div>
  )
}

export default function ParamsPage({ showToast, actifs }) {
  const [tab, setTab] = useState('refs')

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setTab('refs')} style={{ ...S.btn(tab === 'refs' ? '#0ea888' : '#8892a8', tab !== 'refs'), fontFamily: 'inherit' }}>Références</button>
        <button onClick={() => setTab('users')} style={{ ...S.btn(tab === 'users' ? '#0ea888' : '#8892a8', tab !== 'users'), fontFamily: 'inherit' }}>Utilisateurs</button>
        <button onClick={() => setTab('eglise')} style={{ ...S.btn(tab === 'eglise' ? '#0ea888' : '#8892a8', tab !== 'eglise'), fontFamily: 'inherit' }}>Église</button>
      </div>
      <div style={S.card}>
        {tab === 'users' ? <UsersTable showToast={showToast} actifs={actifs} />
          : tab === 'eglise' ? <EglisePanel showToast={showToast} />
          : REF_TABLES.map(t => <AccordionRefTable key={t.key} table={t.key} label={t.label} fields={t.fields} showToast={showToast} />)}
      </div>
    </div>
  )
}
