import { S, getStatutColor } from '../lib/ui'

export default function FiliationPage({ actifs, refs, openFiche }) {
  const bergers = actifs.filter(m => m.role === 'Berger principal')
  const getSuivis = (id) => actifs.filter(m => m.suivi_par === id)
  const orphelins = actifs.filter(m => !m.suivi_par && m.role !== 'Berger principal')

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={S.kpi('#d48f00')}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8892a8', marginBottom: 6 }}>Bergers</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#d48f00' }}>{bergers.length}</div></div>
        <div style={S.kpi('#e03050')}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8892a8', marginBottom: 6 }}>Sans suiveur</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#e03050' }}>{orphelins.length}</div></div>
      </div>
      {bergers.map(b => {
        const enfB = getSuivis(b.id)
        return (
          <div key={b.id} style={S.card}>
            <div onClick={() => openFiche(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: enfB.length > 0 ? 10 : 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#d48f0018', border: '2px solid #d48f00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#d48f00' }}>{(b.prenom || '?').charAt(0)}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#d48f00' }}>{b.prenom} {b.nom}</div><div style={{ fontSize: 10, color: '#8892a8' }}>Berger · {enfB.length} suivis</div></div>
            </div>
            {enfB.length > 0 && (
              <div style={{ marginLeft: 20, borderLeft: '2px solid #d48f0040', paddingLeft: 14 }}>
                {enfB.map(e => {
                  const isP = e.role === 'Pilier'; const enfE = isP ? getSuivis(e.id) : []
                  return (
                    <div key={e.id} style={{ marginBottom: enfE.length > 0 ? 10 : 4 }}>
                      <div onClick={() => openFiche(e.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '3px 0' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: isP ? '#7040d018' : '#0ea88818', border: '2px solid ' + (isP ? '#7040d0' : '#0ea888'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isP ? '#7040d0' : '#0ea888' }}>{(e.prenom || '?').charAt(0)}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: isP ? '#7040d0' : '#1a1e2e' }}>{e.prenom} {e.nom}</div></div>
                        <span style={S.pill(getStatutColor(refs, e.statut))}>{e.statut}</span>
                      </div>
                      {enfE.length > 0 && (
                        <div style={{ marginLeft: 16, borderLeft: '2px solid #7040d040', paddingLeft: 12, marginTop: 3 }}>
                          {enfE.map(ee => (
                            <div key={ee.id} onClick={() => openFiche(ee.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 0' }}>
                              <span style={{ fontSize: 11, color: '#1a1e2e' }}>{ee.prenom} {ee.nom}</span>
                              <span style={S.pill(getStatutColor(refs, ee.statut))}>{ee.statut}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      {orphelins.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#e03050' }}>⚠ Sans suiveur ({orphelins.length})</div>
          {orphelins.map(o => (
            <div key={o.id} onClick={() => openFiche(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid #e0e4ec', cursor: 'pointer' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#0ea888', flex: 1 }}>{o.prenom} {o.nom}</span>
              <span style={S.pill(getStatutColor(refs, o.statut))}>{o.statut}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
