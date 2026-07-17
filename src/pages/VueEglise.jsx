import { useState, useEffect } from 'react'
import { toLocalDate, S, dago } from '../lib/ui'
import { supabase } from '../lib/supabase'
import { Users, TrendingUp, AlertTriangle, UserPlus, TrendingDown } from 'lucide-react'

export default function VueEglisePage({ auth, refs, h }) {
  const [familles, setFamilles] = useState([])
  const [rawData, setRawData] = useState({ membres: [], presences: [], entretiens: [], activites: [], datesAnn: [] })
  const [loading, setLoading] = useState(true)
  const [egliseActive, setEgliseActive] = useState(true)
  const [fDateDe, setFDateDe] = useState('')
  const [fDateA, setFDateA] = useState('')

  useEffect(() => {
    (async () => {
      const egliseId = auth?.profil?.eglise_id
      if (!egliseId) { setLoading(false); return }

      // Vérifier si l'église est active
      const { data: eglise } = await supabase.from('eglises').select('*').eq('id', egliseId).single()
      setEgliseActive(eglise?.actif !== false)

      // Charger toutes les familles ACTIVES de l'église
      const { data: fam } = await supabase.from('familles_disciples').select('*').eq('eglise_id', egliseId).eq('actif', true).order('nom')
      setFamilles(fam || [])

      // Charger toutes les données en parallèle
      const famIds = (fam || []).map(f => f.id)
      const [{ data: membres }, { data: presences }, { data: entretiens }, { data: activites }, { data: datesAnn }] = await Promise.all([
        supabase.from('membres').select('*').in('famille_id', famIds).eq('archive', false),
        supabase.from('presences').select('*').in('famille_id', famIds),
        supabase.from('entretiens').select('*').in('famille_id', famIds),
        supabase.from('activites').select('*').eq('code', 'culte').or('famille_id.is.null,famille_id.in.(' + famIds.join(',') + ')'),
        supabase.from('dates_annulees').select('*')
      ])
      setRawData({ membres: membres || [], presences: presences || [], entretiens: entretiens || [], activites: activites || [], datesAnn: datesAnn || [] })
      setLoading(false)
    })()
  }, [auth, h])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Chargement...</div>
  if (!egliseActive) return (
    <div style={{ ...S.card, borderLeft: '3px solid #6b7280', background: '#f4f6f9' }}>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>Église désactivée</div>
      <div style={{ fontSize: 12, color: '#5a6480', lineHeight: 1.6 }}>
        Cette église a été désactivée. Les données historiques sont conservées mais aucune analyse n'est effectuée. Contactez un administrateur pour la réactiver.
      </div>
    </div>
  )
  if (!familles.length) return <div style={{ ...S.card, textAlign: 'center', color: '#6b7280' }}>Aucune famille dans cette église.</div>

  // ── Calcul dynamique basé sur le filtre de dates ──
  const now = new Date()
  const defaultDe = new Date(now); defaultDe.setDate(defaultDe.getDate() - 28)
  const defaultDeStr = toLocalDate(defaultDe)
  const filterDe = fDateDe || defaultDeStr
  const filterA = fDateA || toLocalDate(now)

  // Période précédente (pour tendance) = même durée avant filterDe
  const dureeJours = Math.round((new Date(filterA) - new Date(filterDe)) / 864e5)
  const prevDe = new Date(new Date(filterDe)); prevDe.setDate(prevDe.getDate() - dureeJours)
  const prevDeStr = toLocalDate(prevDe)

  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const lastSunday = new Date(now); lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay())
  const lastSundayStr = toLocalDate(lastSunday)

  const stats = {}
  familles.forEach(f => {
    const famMembres = rawData.membres.filter(m => m.famille_id === f.id)
    const culteAct = rawData.activites.find(a => a.famille_id === f.id) || rawData.activites.find(a => !a.famille_id)
    const cancelledDates = new Set((rawData.datesAnn || []).filter(d => culteAct && d.activite_id === culteAct.id).map(d => d.date_annulee))
    const famPresences = culteAct ? rawData.presences.filter(p => (p.famille_id === f.id || !p.famille_id) && p.activite_id === culteAct.id && p.eligible && !cancelledDates.has(p.date_presence)) : []

    // Moyenne culte dans la période sélectionnée
    const recentPres = famPresences.filter(p => p.date_presence >= filterDe && p.date_presence <= filterA)
    const recentDates = [...new Set(recentPres.map(p => p.date_presence))]
    let recentAvg = null
    if (recentDates.length > 0) {
      const rates = recentDates.map(d => {
        const ps = recentPres.filter(p => p.date_presence === d)
        return ps.length > 0 ? Math.round(ps.filter(p => p.present).length / ps.length * 100) : 0
      })
      recentAvg = Math.round(rates.reduce((s, r) => s + r, 0) / rates.length)
    }

    // Période précédente (pour tendance)
    const prevPres = famPresences.filter(p => p.date_presence >= prevDeStr && p.date_presence < filterDe)
    const prevDates = [...new Set(prevPres.map(p => p.date_presence))]
    let prevAvg = null
    if (prevDates.length > 0) {
      const rates = prevDates.map(d => {
        const ps = prevPres.filter(p => p.date_presence === d)
        return ps.length > 0 ? Math.round(ps.filter(p => p.present).length / ps.length * 100) : 0
      })
      prevAvg = Math.round(rates.reduce((s, r) => s + r, 0) / rates.length)
    }

    const trend = (recentAvg !== null && prevAvg !== null && recentDates.length >= 2 && prevDates.length >= 2) ? recentAvg - prevAvg : null

    // Taux dernier dimanche
    const lastSundayPres = famPresences.filter(p => p.date_presence === lastSundayStr)
    let lastSundayRate = null
    if (lastSundayPres.length > 0) {
      lastSundayRate = Math.round(lastSundayPres.filter(p => p.present).length / lastSundayPres.length * 100)
    }

    // Nouveaux et entretiens dans la période
    const nouveaux = famMembres.filter(m => m.date_inscription && m.date_inscription >= filterDe && m.date_inscription <= filterA).length
    const entMonth = rawData.entretiens.filter(e => e.famille_id === f.id && e.date_entretien >= filterDe && e.date_entretien <= filterA).length

    stats[f.id] = {
      nom: f.nom, nbMembres: famMembres.length,
      recentAvg, prevAvg, trend, lastSundayRate,
      recentCount: recentDates.length, prevCount: prevDates.length,
      nouveaux, entMonth,
      bergerName: (() => {
        const berger = famMembres.find(m => h.isBergerRole(m.role))
        return berger ? berger.prenom + ' ' + berger.nom : '—'
      })()
    }
  })

  // Agrégats globaux
  const totalMembres = familles.reduce((s, f) => s + (stats[f.id]?.nbMembres || 0), 0)
  const avgCulte = (() => {
    const rates = familles.map(f => stats[f.id]?.recentAvg).filter(r => r !== null)
    return rates.length > 0 ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length) : null
  })()
  const totalNouveaux = familles.reduce((s, f) => s + (stats[f.id]?.nouveaux || 0), 0)
  const totalEntretiens = familles.reduce((s, f) => s + (stats[f.id]?.entMonth || 0), 0)

  // Familles à risque
  const critiques = familles.filter(f => stats[f.id]?.lastSundayRate !== null && stats[f.id].lastSundayRate < 80).sort((a, b) => stats[a.id].lastSundayRate - stats[b.id].lastSundayRate)
  const enBaisse = familles.filter(f => stats[f.id]?.trend !== null && stats[f.id].trend <= -10 && !critiques.some(c => c.id === f.id)).sort((a, b) => stats[a.id].trend - stats[b.id].trend)

  const kpi = (Icon, label, value, sub, color) => (
    <div style={{ ...S.kpi(color), flex: '1 1 140px' }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon size={11} /> {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <div>
      {/* Filtre de période */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>Période</span>
          {!fDateDe && !fDateA && <span style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic', fontWeight: 400 }}>(par défaut : 4 dernières semaines)</span>}
          {(fDateDe || fDateA) && <button onClick={() => { setFDateDe(''); setFDateA('') }} style={{ background: 'none', border: 'none', fontSize: 10, color: '#e03050', cursor: 'pointer', marginLeft: 'auto' }}>✕ Effacer</button>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={fDateDe} onChange={e => setFDateDe(e.target.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 11, fontFamily: 'inherit', minWidth: 0 }} />
          <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>→</span>
          <input type="date" value={fDateA} onChange={e => setFDateA(e.target.value)} style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #c8cfe0', background: '#f0f2f6', fontSize: 11, fontFamily: 'inherit', minWidth: 0 }} />
        </div>
      </div>
      {/* KPIs globaux */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {kpi(Users, 'Total actifs', totalMembres, familles.length + ' famille(s)', '#0ea888')}
        {kpi(TrendingUp, 'Taux culte moyen', avgCulte !== null ? avgCulte + '%' : '—', fDateDe || fDateA ? 'période sélectionnée' : '4 dernières semaines', '#3060d0')}
        {kpi(UserPlus, 'Nouveaux', totalNouveaux, fDateDe || fDateA ? 'période sélectionnée' : '4 dernières semaines', '#1a9c60')}
        {kpi(AlertTriangle, 'Familles à risque', critiques.length, '< 80% dimanche dernier', critiques.length > 0 ? '#e03050' : '#6b7280')}
      </div>

      {/* Familles à risque - critique */}
      {critiques.length > 0 && (
        <div style={{ ...S.card, borderLeft: '3px solid #e03050', background: '#e0305005' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e03050', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> Familles avec moins de 80% au dernier culte
          </div>
          {critiques.map(f => (
            <div key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid #e0e4ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.nom}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>Berger : {stats[f.id].bergerName} · {stats[f.id].nbMembres} membres</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e03050', fontFamily: "'Outfit', sans-serif" }}>{stats[f.id].lastSundayRate}%</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>dimanche dernier</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Familles en baisse */}
      {enBaisse.length > 0 && (
        <div style={{ ...S.card, borderLeft: '3px solid #d48f00', background: '#d48f0005' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#d48f00', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingDown size={14} /> Familles en tendance baissière (-10 points ou plus)
          </div>
          {enBaisse.map(f => (
            <div key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid #e0e4ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.nom}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>Berger : {stats[f.id].bergerName} · {stats[f.id].nbMembres} membres</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#d48f00', fontFamily: "'Outfit', sans-serif" }}>{stats[f.id].trend > 0 ? '+' : ''}{stats[f.id].trend} pts</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>vs période précédente</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparatif toutes familles */}
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Comparatif par famille</div>
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 10 }}>Chiffres calculés sur la {fDateDe || fDateA ? 'période sélectionnée' : 'période des 4 dernières semaines'}. "Taux dim. dernier" reste toujours le dimanche le plus récent.</div>

        {/* Desktop table */}
        <div className="desk-only">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={S.th}>Famille</th>
              <th style={S.th}>Berger</th>
              <th style={S.th}>Membres</th>
              <th style={S.th}>Taux moy. période</th>
              <th style={S.th} title="Évolution du taux sur la période sélectionnée vs même durée précédente. Positif = croissance, négatif = alerte.">Tendance <span style={{ color: '#7040d0', cursor: 'help', fontSize: 10 }}>ⓘ</span></th>
              <th style={S.th}>Taux dim. dernier</th>
              <th style={S.th}>Nouveaux</th>
              <th style={S.th}>Entretiens</th>
            </tr></thead>
            <tbody>
              {familles.map(f => {
                const s = stats[f.id] || {}
                const trendColor = s.trend > 0 ? '#1a9c60' : s.trend < 0 ? '#e03050' : '#6b7280'
                const trendLabel = s.trend !== null
                  ? (s.trend > 0 ? '↗ +' : s.trend < 0 ? '↘ ' : '→ ') + s.trend + ' pts'
                  : (s.recentCount || 0) < 2 ? 'Pas assez de données' : (s.prevCount || 0) < 2 ? 'Pas d\'historique' : '—'
                return (
                  <tr key={f.id}>
                    <td style={{ ...S.td, fontWeight: 600, color: '#0ea888' }}>{f.nom}</td>
                    <td style={{ ...S.td, color: '#5a6480', fontSize: 11 }}>{s.bergerName}</td>
                    <td style={S.td}>{s.nbMembres}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{s.recentAvg !== null ? s.recentAvg + '%' : '—'}<span style={{ fontSize: 9, color: '#6b7280', fontWeight: 400 }}>{s.recentCount ? ' (' + s.recentCount + ' dim.)' : ''}</span></td>
                    <td style={{ ...S.td, color: s.trend !== null ? trendColor : '#6b7280', fontWeight: s.trend !== null ? 600 : 400, fontSize: s.trend !== null ? 12 : 10 }}>{trendLabel}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: s.lastSundayRate !== null ? (s.lastSundayRate < 80 ? '#e03050' : '#1a9c60') : '#6b7280' }}>{s.lastSundayRate !== null ? s.lastSundayRate + '%' : '—'}</td>
                    <td style={S.td}>{s.nouveaux}</td>
                    <td style={S.td}>{s.entMonth}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mob-only">
          {familles.map(f => {
            const s = stats[f.id] || {}
            const trendColor = s.trend > 0 ? '#1a9c60' : s.trend < 0 ? '#e03050' : '#6b7280'
            return (
              <div key={f.id} style={{ padding: '10px 0', borderBottom: '1px solid #e0e4ec' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0ea888' }}>{f.nom}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{s.bergerName} · {s.nbMembres} membres</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{s.recentAvg !== null ? s.recentAvg + '%' : '—'}</div>
                    <div style={{ fontSize: 9, color: s.trend !== null ? trendColor : '#6b7280', fontWeight: s.trend !== null ? 600 : 400 }}>{s.trend !== null ? (s.trend > 0 ? '+' : '') + s.trend + ' pts' : s.recentCount < 2 ? 'Pas assez de données' : '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#6b7280' }}>
                  <span>Dim. dernier: <strong style={{ color: s.lastSundayRate < 80 ? '#e03050' : '#1a9c60' }}>{s.lastSundayRate !== null ? s.lastSundayRate + '%' : '—'}</strong></span>
                  <span>Nouveaux: <strong>{s.nouveaux}</strong></span>
                  <span>Entretiens: <strong>{s.entMonth}</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
