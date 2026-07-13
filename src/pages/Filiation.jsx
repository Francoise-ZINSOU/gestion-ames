import { S, getStatutColor } from '../lib/ui'

export default function FiliationPage({ actifs, refs, openFiche }) {
  const bergers = actifs.filter(m => m.role === 'Berger principal')
  const piliers = actifs.filter(m => m.role === 'Pilier')
  const getSuivis = (id) => actifs.filter(m => m.suivi_par === id)

  // Piliers sans berger (ont quand même des suivis à montrer)
  const piliersOrphelins = piliers.filter(p => !p.suivi_par || !actifs.some(m => m.id === p.suivi_par && m.role === 'Berger principal'))
  
  // Vrais orphelins : ni Berger, ni Pilier rattaché, sans suiveur
  const orphelins = actifs.filter(m => {
    if (m.role === 'Berger principal') return false
    if (!m.suivi_par) return true
    // suiveur archivé ou inexistant
    const suiveur = actifs.find(x => x.id === m.suivi_par)
    return !suiveur
  }).filter(m => m.role !== 'Pilier' || !piliersOrphelins.find(p => p.id === m.id))

  // Membres sans suiveur (pas Berger, pas Pilier orphelin déjà affiché)
  const membresOrphelins = actifs.filter(m => {
    if (m.role === 'Berger principal') return false
    if (m.role === 'Pilier') return false
    if (!m.suivi_par) return true
    return !actifs.some(x => x.id === m.suivi_par)
  })

  const renderMembre = (m, indent) => (
    <div key={m.id} onClick={() => openFiche(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 0' }}>
      <span style={{ fontSize: 11, color: '#1a1e2e' }}>{m.prenom} {m.nom}</span>
      <span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span>
    </div>
  )

  const renderPilier = (p) => {
    const enfP = getSuivis(p.id)
    return (
      <div key={p.id} style={{ marginBottom: enfP.length > 0 ? 10 : 4 }}>
        <div onClick={() => openFiche(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '3px 0' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#7040d018', border: '2px solid #7040d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#7040d0' }}>{(p.prenom || '?').charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7040d0' }}>{p.prenom} {p.nom}</div>
            <div style={{ fontSize: 9, color: '#8892a8' }}>Pilier · {enfP.length} suivis</div>
          </div>
          <span style={S.pill(getStatutColor(refs, p.statut))}>{p.statut}</span>
        </div>
        {enfP.length > 0 && (
          <div style={{ marginLeft: 16, borderLeft: '2px solid #7040d040', paddingLeft: 12, marginTop: 3 }}>
            {enfP.map(ee => renderMembre(ee))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={S.kpi('#d48f00')}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8892a8', marginBottom: 6 }}>Bergers</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#d48f00' }}>{bergers.length}</div></div>
        <div style={S.kpi('#7040d0')}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8892a8', marginBottom: 6 }}>Piliers</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#7040d0' }}>{piliers.length}</div></div>
        <div style={S.kpi('#e03050')}><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8892a8', marginBottom: 6 }}>Sans suiveur</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#e03050' }}>{membresOrphelins.length}</div></div>
      </div>

      {/* Arbres des Bergers */}
      {bergers.map(b => {
        const enfB = getSuivis(b.id)
        return (
          <div key={b.id} style={S.card}>
            <div onClick={() => openFiche(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: enfB.length > 0 ? 10 : 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#d48f0018', border: '2px solid #d48f00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#d48f00' }}>{(b.prenom || '?').charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#d48f00' }}>{b.prenom} {b.nom}</div>
                <div style={{ fontSize: 10, color: '#8892a8' }}>Berger principal · {enfB.length} suivis</div>
              </div>
            </div>
            {enfB.length > 0 && (
              <div style={{ marginLeft: 20, borderLeft: '2px solid #d48f0040', paddingLeft: 14 }}>
                {enfB.map(e => {
                  if (e.role === 'Pilier') return renderPilier(e)
                  return renderMembre(e)
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Piliers sans Berger (avec leurs suivis) */}
      {piliersOrphelins.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#7040d0' }}>Piliers non rattachés à un Berger ({piliersOrphelins.length})</div>
          {piliersOrphelins.map(p => renderPilier(p))}
        </div>
      )}

      {/* Membres sans suiveur */}
      {membresOrphelins.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#e03050' }}>⚠ Membres sans suiveur ({membresOrphelins.length})</div>
          {membresOrphelins.map(o => (
            <div key={o.id} onClick={() => openFiche(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid #e0e4ec', cursor: 'pointer' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#0ea888', flex: 1 }}>{o.prenom} {o.nom}</span>
              <span style={S.pill(getStatutColor(refs, o.statut))}>{o.statut}</span>
            </div>
          ))}
        </div>
      )}

      {bergers.length === 0 && piliersOrphelins.length === 0 && membresOrphelins.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', color: '#8892a8' }}>Aucun membre. Créez des membres et assignez des rôles.</div>
      )}
    </div>
  )
}
