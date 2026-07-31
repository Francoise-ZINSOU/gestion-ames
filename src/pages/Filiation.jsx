import { S, getStatutColor } from '../lib/ui'

export default function FiliationPage({ actifs, refs, h, openFiche }) {
  const bergers = actifs.filter(m => h.isBergerRole(m.role))
  const getSuivis = (id) => actifs.filter(m => m.suivi_par === id).sort((a, b) => {
    const aLeader = h.canFollow(a.role) ? 0 : 1
    const bLeader = h.canFollow(b.role) ? 0 : 1
    if (aLeader !== bLeader) return aLeader - bLeader
    return (a.nom + a.prenom).localeCompare(b.nom + b.prenom)
  })

  // Trouver tous les membres rattachés à un Berger (directement ou via chaîne de Piliers)
  const rattaches = new Set()
  const markRattaches = (id) => {
    getSuivis(id).forEach(m => {
      rattaches.add(m.id)
      if (h.canFollow(m.role)) markRattaches(m.id)
    })
  }
  bergers.forEach(b => { rattaches.add(b.id); markRattaches(b.id) })

  // Vrais orphelins = pas rattachés du tout à un Berger
  const orphelinsPiliers = actifs.filter(m => h.canFollow(m.role) && !h.isBergerRole(m.role) && !rattaches.has(m.id))
  const orphelinsMembres = actifs.filter(m => !h.canFollow(m.role) && !h.isBergerRole(m.role) && !rattaches.has(m.id))

  // Composant récursif pour afficher un membre et ses suivis
  const renderMembre = (m, depth) => {
    const enfants = getSuivis(m.id)
    const isLeader = h.canFollow(m.role) && !h.isBergerRole(m.role)
    const color = isLeader ? '#8B5B9E' : '#B87333'

    return (
      <div key={m.id} style={{ marginBottom: enfants.length > 0 ? 8 : 3 }}>
        <div onClick={() => openFiche(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '3px 0' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: color + '18', border: '2px solid ' + color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{(m.prenom || '?').charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color }}>{m.prenom} {m.nom}</div>
            {isLeader && <div style={{ fontSize: 10, color: '#8B7355' }}>{m.role} · {enfants.length} suivi(s)</div>}
          </div>
          <span style={S.pill(getStatutColor(refs, m.statut))}>{m.statut}</span>
        </div>
        {enfants.length > 0 && (
          <div style={{ marginLeft: 12, borderLeft: '2px solid ' + color + '40', paddingLeft: 10, marginTop: 3 }}>
            {enfants.map(e => renderMembre(e, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const piliers = actifs.filter(m => h.canFollow(m.role) && !h.isBergerRole(m.role))

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={S.kpi('#B87333')}><div style={{ fontSize: 12, fontWeight: 500, color: '#8B7355', marginBottom: 6 }}>Bergers</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#B87333' }}>{bergers.length}</div></div>
        <div style={S.kpi('#8B5B9E')}><div style={{ fontSize: 12, fontWeight: 500, color: '#8B7355', marginBottom: 6 }}>Piliers</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#8B5B9E' }}>{piliers.length}</div></div>
        <div style={S.kpi('#C0563A')}><div style={{ fontSize: 12, fontWeight: 500, color: '#8B7355', marginBottom: 6 }}>Sans suiveur</div><div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#C0563A' }}>{orphelinsMembres.length}</div></div>
      </div>

      {/* Arbres des Bergers — récursif */}
      {bergers.map(b => {
        const enfB = getSuivis(b.id)
        return (
          <div key={b.id} style={S.card}>
            <div onClick={() => openFiche(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: enfB.length > 0 ? 10 : 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#B8733318', border: '2px solid #B87333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#B87333' }}>{(b.prenom || '?').charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#B87333' }}>{b.prenom} {b.nom}</div>
                <div style={{ fontSize: 11, color: '#8B7355' }}>Chef de famille · {enfB.length} suivi(s) directs</div>
              </div>
            </div>
            {enfB.length > 0 && (
              <div style={{ marginLeft: 20, borderLeft: '2px solid #B8733340', paddingLeft: 14 }}>
                {enfB.map(e => renderMembre(e, 1))}
              </div>
            )}
          </div>
        )
      })}

      {/* Piliers orphelins (sans suiveur du tout ou lien cassé) */}
      {orphelinsPiliers.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#B87333' }}>Piliers sans suiveur ({orphelinsPiliers.length})</div>
          <div style={{ fontSize: 12, color: '#8B7355', marginBottom: 8 }}>Ces piliers n'ont pas de "Suivi par" — assignez-les au Berger ou à un autre Pilier.</div>
          {orphelinsPiliers.map(p => renderMembre(p, 0))}
        </div>
      )}

      {/* Membres sans suiveur */}
      {orphelinsMembres.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#C0563A' }}>Membres sans suiveur ({orphelinsMembres.length})</div>
          {orphelinsMembres.map(o => (
            <div key={o.id} onClick={() => openFiche(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid #EADFCF', cursor: 'pointer' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#B87333', flex: 1 }}>{o.prenom} {o.nom}</span>
              <span style={S.pill(getStatutColor(refs, o.statut))}>{o.statut}</span>
            </div>
          ))}
        </div>
      )}

      {bergers.length === 0 && orphelinsPiliers.length === 0 && orphelinsMembres.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', color: '#8B7355' }}>Aucun membre. Créez des membres et assignez des rôles.</div>
      )}
    </div>
  )
}
