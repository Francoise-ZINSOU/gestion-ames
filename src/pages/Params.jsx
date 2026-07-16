import { useState } from 'react'
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

function UsersTable({ showToast }) {
  const { profils, setRole } = useProfils()

  const handleRole = async (id, resp, admin) => {
    try { await setRole(id, resp, admin); showToast('✓ Droits mis à jour') }
    catch (e) { showToast(e.message?.includes('duplicate') ? '⚠ Ce nom existe déjà' : '⚠ ' + e.message) }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Utilisateurs</div>
      {profils.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #e0e4ec' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{p.nom_affiche || p.email}</div>
            <div style={{ fontSize: 10, color: '#8892a8' }}>{p.email}</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
            <input type="checkbox" checked={p.est_responsable || false} onChange={e => handleRole(p.id, e.target.checked, p.est_admin)} />
            Responsable
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
            <input type="checkbox" checked={p.est_admin || false} onChange={e => handleRole(p.id, p.est_responsable, e.target.checked)} />
            Admin
          </label>
        </div>
      ))}
    </div>
  )
}

export default function ParamsPage({ showToast }) {
  const [tab, setTab] = useState('refs')

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setTab('refs')} style={{ ...S.btn(tab === 'refs' ? '#0ea888' : '#8892a8', tab !== 'refs'), fontFamily: 'inherit' }}>Tables de référence</button>
        <button onClick={() => setTab('users')} style={{ ...S.btn(tab === 'users' ? '#0ea888' : '#8892a8', tab !== 'users'), fontFamily: 'inherit' }}>Utilisateurs</button>
      </div>
      <div style={S.card}>
        {tab === 'users' ? <UsersTable showToast={showToast} />
          : REF_TABLES.map(t => <AccordionRefTable key={t.key} table={t.key} label={t.label} fields={t.fields} showToast={showToast} />)}
      </div>
    </div>
  )
}
