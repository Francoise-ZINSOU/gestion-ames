import { S } from '../lib/ui'

export default function CroissancePage({ plans, refs }) {
  const stats = (refs.modules || []).map(mod => {
    const a = plans.filter(p => p.module_id === mod.id)
    const v = a.filter(p => p.valide)
    return { id: mod.id, nom: mod.nom, an: a.length, vn: v.length, pc: a.length ? Math.round(v.length / a.length * 100) : 0 }
  })

  if (!actifs || !actifs.length) return (
    <div style={{ ...S.card, textAlign: 'center', color: '#6b7280', fontSize: 14, padding: 30, lineHeight: 1.7 }}>
      Aucun membre pour le moment. Ajoutez des âmes pour commencer le suivi de croissance.
    </div>
  )

  return (
    <div style={S.card}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Avancement des plans de croissance</div>
      {stats.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#5a6480', width: 180, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nom}</span>
          <div style={{ flex: 1, height: 6, background: '#f0f2f6', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: s.pc >= 80 ? '#1a9c60' : s.pc >= 50 ? '#d48f00' : s.pc > 0 ? '#3060d0' : '#e0e4ec', width: s.pc + '%' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, width: 42, textAlign: 'right' }}>{s.vn}/{s.an}</span>
        </div>
      ))}
    </div>
  )
}
