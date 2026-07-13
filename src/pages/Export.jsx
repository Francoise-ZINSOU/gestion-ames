import { useState } from 'react'
import { S, today } from '../lib/ui'
import { supabase } from '../lib/supabase'

export default function ExportPage({ membres, presences, entretiens, defis, refs, showToast }) {
  const [confirmAction, setConfirmAction] = useState(null)

  const doExport = (type) => {
    let rows = [], header = ''
    const esc = (v) => '"' + String(v || '').replace(/"/g, '""').replace(/\n/g, ' ') + '"'
    const getSuiveur = (id) => { if (!id) return ''; const m = membres.find(x => x.id === id); return m ? m.prenom + ' ' + m.nom : '' }

    if (type === 'membres') {
      header = 'ID,Prénom,Nom,Rôle,Statut,Date inscription,Suivi par,Tél,Email,Notes'
      rows = membres.map(m => [m.id, m.prenom, m.nom, m.role, m.statut, m.date_inscription, getSuiveur(m.suivi_par), m.telephone, m.email, m.notes].map(esc).join(','))
    } else if (type === 'presences') {
      header = 'ID Membre,Prénom,Nom,Activité,Date,Présent,Éligible'
      rows = presences.map(p => {
        const m = membres.find(x => x.id === p.membre_id); const a = (refs.activites || []).find(x => x.id === p.activite_id)
        return [p.membre_id, m?.prenom, m?.nom, a?.nom, p.date_presence, p.present ? 'Oui' : 'Non', p.eligible ? 'Oui' : 'Non'].map(esc).join(',')
      })
    } else if (type === 'entretiens') {
      header = 'ID Membre,Prénom,Nom,Date,Avec qui,Sujet,Statut,Commentaires'
      rows = entretiens.map(e => {
        const m = membres.find(x => x.id === e.membre_id); const sujet = e.sujet_libre || (refs.sujetsEntretien || []).find(s => s.id === e.sujet_id)?.nom || ''
        return [e.membre_id, m?.prenom, m?.nom, e.date_entretien, getSuiveur(e.avec_qui), sujet, e.statut, e.commentaires].map(esc).join(',')
      })
    } else if (type === 'defis') {
      header = 'ID Membre,Prénom,Nom,Type,Statut,Description'
      rows = defis.map(d => { const m = membres.find(x => x.id === d.membre_id); return [d.membre_id, m?.prenom, m?.nom, d.type_defi, d.statut, d.description].map(esc).join(',') })
    }
    const csv = header + '\n' + rows.join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = type + '_' + today() + '.csv'; a.click(); URL.revokeObjectURL(url)
    showToast('✓ ' + type + ' exporté')
  }

  const doReset = async () => {
    try {
      await supabase.from('plan_croissance').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('defis').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('entretiens').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('presences').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('membres').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      showToast('✓ Toutes les données ont été supprimées')
      window.location.reload()
    } catch (e) { showToast('⚠ ' + e.message) }
  }

  return (
    <div>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Exporter les données</div>
        {[{ t: 'membres', ic: '👥', l: 'Membres', n: membres.length, c: '#0ea888' }, { t: 'presences', ic: '✅', l: 'Présences', n: presences.length, c: '#3060d0' }, { t: 'entretiens', ic: '💬', l: 'Entretiens', n: entretiens.length, c: '#d48f00' }, { t: 'defis', ic: '⚡', l: 'Défis', n: defis.length, c: '#d86820' }].map(item => (
          <div key={item.t} onClick={() => doExport(item.t)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e4ec', cursor: 'pointer', marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.c + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{item.ic}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{item.l}</div><div style={{ fontSize: 10, color: '#8892a8' }}>{item.n} enregistrement(s)</div></div>
            <span style={{ fontSize: 11, color: item.c, fontWeight: 600 }}>⬇ CSV</span>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#e03050' }}>🗑 Réinitialiser les données</div>
        <div style={{ fontSize: 11, color: '#8892a8', marginBottom: 10 }}>Supprime tous les membres, présences, entretiens et défis. Les tables de référence (statuts, rôles, activités) sont conservées. Exportez d'abord !</div>
        <button onClick={() => setConfirmAction({ msg: 'Supprimer TOUTES les données pastorales ?\n\nCette action est irréversible. Assurez-vous d\'avoir exporté avant.', fn: doReset })} style={S.btn('#e03050', true)}>Réinitialiser</button>
      </div>

      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px' }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Confirmation</div><div style={{ fontSize: 13, color: '#5a6480', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{confirmAction.msg}</div></div>
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
