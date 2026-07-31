import { S } from '../lib/ui'

export default function CroissancePage({ plans, refs, actifs }) {
  const stats = (refs.modules || []).map(mod => {
    const a = plans.filter(p => p.module_id === mod.id)
    const v = a.filter(p => p.valide)
    return { id: mod.id, nom: mod.nom, an: a.length, vn: v.length, pc: a.length ? Math.round(v.length / a.length * 100) : 0 }
  })

  if (!actifs || !actifs.length) return (
    <div style={{ ...S.card, textAlign: 'center', color: '#8B7355', fontSize: 14, padding: 30, lineHeight: 1.7 }}>
      Aucun membre pour le moment. Ajoutez des membres pour commencer le parcours de formation.
    </div>
  )

  return (
    <div style={S.card}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Avancement des plans de croissance</div>
      {stats.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#6B5D4A', width: 180, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nom}</span>
          <div style={{ flex: 1, height: 6, background: '#FBF7F1', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: s.pc >= 80 ? '#5B8266' : s.pc >= 50 ? '#B87333' : s.pc > 0 ? '#B87333' : '#EADFCF', width: s.pc + '%' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, width: 42, textAlign: 'right' }}>{s.vn}/{s.an}</span>
        </div>
      ))}
    </div>
  )
}
