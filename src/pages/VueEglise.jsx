import { useState, useEffect } from 'react'
import { toLocalDate, S, dago } from '../lib/ui'
import { supabase } from '../lib/supabase'
import { Users, TrendingUp, AlertTriangle, UserPlus, TrendingDown } from 'lucide-react'

export default function VueEglisePage({ auth, refs, h }) {
  const [familles, setFamilles] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const egliseId = auth?.profil?.eglise_id
      if (!egliseId) { setLoading(false); return }

      // Charger toutes les familles de l'église
      const { data: fam } = await supabase.from('familles_disciples').select('*').eq('eglise_id', egliseId).order('nom')
      setFamilles(fam || [])

      // Charger toutes les données en parallèle
      const famIds = (fam || []).map(f => f.id)
      const [{ data: membres }, { data: presences }, { data: entretiens }, { data: activites }] = await Promise.all([
        supabase.from('membres').select('*').in('famille_id', famIds).eq('archive', false),
        supabase.from('presences').select('*').in('famille_id', famIds),
        supabase.from('entretiens').select('*').in('famille_id', famIds),
        supabase.from('activites').select('*').in('famille_id', famIds).eq('code', 'culte')
      ])

      // Calculer les stats par famille
      const perFam = {}
      const now = new Date()
      const fourWeeksAgo = new Date(now); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
      const eightWeeksAgo = new Date(now); eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
      const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Dernier dimanche
      const lastSunday = new Date(now)
      lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay())
      const lastSundayStr = toLocalDate(lastSunday)

      ;(fam || []).forEach(f => {
        const famMembres = (membres || []).filter(m => m.famille_id === f.id)
        const culteAct = (activites || []).find(a => a.famille_id === f.id)
        const famPresences = culteAct ? (presences || []).filter(p => p.famille_id === f.id && p.activite_id === culteAct.id && p.eligible) : []

        // Moyenne culte 4 dernières semaines
        const recentPres = famPresences.filter(p => new Date(p.date_presence) >= fourWeeksAgo)
        const recentDates = [...new Set(recentPres.map(p => p.date_presence))]
        let recentAvg = null
        if (recentDates.length > 0) {
          const rates = recentDates.map(d => {
            const ps = recentPres.filter(p => p.date_presence === d)
            const nel = ps.length
            const npr = ps.filter(p => p.present).length
            return nel > 0 ? npr / nel * 100 : 0
          })
          recentAvg = Math.round(rates.reduce((s, r) => s + r, 0) / rates.length)
        }

        // 4 semaines précédentes (pour tendance)
        const prevPres = famPresences.filter(p => new Date(p.date_presence) >= eightWeeksAgo && new Date(p.date_presence) < fourWeeksAgo)
        const prevDates = [...new Set(prevPres.map(p => p.date_presence))]
        let prevAvg = null
        if (prevDates.length > 0) {
          const rates = prevDates.map(d => {
            const ps = prevPres.filter(p => p.date_presence === d)
            const nel = ps.length
            const npr = ps.filter(p => p.present).length
            return nel > 0 ? npr / nel * 100 : 0
          })
          prevAvg = Math.round(rates.reduce((s, r) => s + r, 0) / rates.length)
        }

        const trend = (recentAvg !== null && prevAvg !== null) ? recentAvg - prevAvg : null

        // Taux dernier dimanche
        const lastSundayPres = famPresences.filter(p => p.date_presence === lastSundayStr)
        let lastSundayRate = null
        if (lastSundayPres.length > 0) {
          const nel = lastSundayPres.length
          const npr = lastSundayPres.filter(p => p.present).length
          lastSundayRate = nel > 0 ? Math.round(npr / nel * 100) : 0
        }

        // Nouveaux ce mois
        const nouveaux = famMembres.filter(m => m.date_inscription && new Date(m.date_inscription) >= thirtyDaysAgo).length

        // Entretiens ce mois
        const entMonth = (entretiens || []).filter(e => e.famille_id === f.id && e.date_entretien && new Date(e.date_entretien) >= thirtyDaysAgo).length

        perFam[f.id] = {
          nom: f.nom,
          nbMembres: famMembres.length,
          recentAvg, prevAvg, trend, lastSundayRate,
          nouveaux, entMonth,
          bergerName: (() => {
            const berger = famMembres.find(m => h.isBergerRole(m.role))
            return berger ? berger.prenom + ' ' + berger.nom : '—'
          })()
        }
      })

      setStats(perFam)
      setLoading(false)
    })()
  }, [auth, h])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Chargement...</div>
  if (!familles.length) return <div style={{ ...S.card, textAlign: 'center', color: '#6b7280' }}>Aucune famille dans cette église.</div>

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
      {/* KPIs globaux */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
        {kpi(Users, 'Total actifs', totalMembres, familles.length + ' famille(s)', '#0ea888')}
        {kpi(TrendingUp, 'Taux culte moyen', avgCulte !== null ? avgCulte + '%' : '—', '4 derniers dimanches', '#3060d0')}
        {kpi(UserPlus, 'Nouveaux 30j', totalNouveaux, 'toutes familles', '#1a9c60')}
        {kpi(AlertTriangle, 'Familles à risque', critiques.length, '< 80% dimanche dernier', critiques.length > 0 ? '#e03050' : '#6b7280')}
      </div>
      <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 14, fontStyle: 'italic' }}>
        💡 <strong>Tendance</strong> : évolution du taux de présence sur les 4 derniers dimanches vs 4 précédents. +10 pts = croissance, -10 pts = alerte.
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
                <div style={{ fontSize: 10, color: '#6b7280' }}>vs 4 dimanches précédents</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparatif toutes familles */}
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Comparatif par famille</div>

        {/* Desktop table */}
        <div className="desk-only">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={S.th}>Famille</th>
              <th style={S.th}>Berger</th>
              <th style={S.th}>Membres</th>
              <th style={S.th}>Taux moy. 4 dim.</th>
              <th style={S.th} title="Évolution du taux : moyenne des 4 derniers dimanches vs 4 précédents. Positif = famille en croissance, négatif = alerte.">Tendance <span style={{ color: '#7040d0', cursor: 'help', fontSize: 10 }}>ⓘ</span></th>
              <th style={S.th}>Taux dim. dernier</th>
              <th style={S.th}>Nouveaux 30j</th>
              <th style={S.th}>Entretiens 30j</th>
            </tr></thead>
            <tbody>
              {familles.map(f => {
                const s = stats[f.id] || {}
                const trendColor = s.trend > 0 ? '#1a9c60' : s.trend < 0 ? '#e03050' : '#6b7280'
                return (
                  <tr key={f.id}>
                    <td style={{ ...S.td, fontWeight: 600, color: '#0ea888' }}>{f.nom}</td>
                    <td style={{ ...S.td, color: '#5a6480', fontSize: 11 }}>{s.bergerName}</td>
                    <td style={S.td}>{s.nbMembres}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{s.recentAvg !== null ? s.recentAvg + '%' : '—'}</td>
                    <td style={{ ...S.td, color: trendColor, fontWeight: 600 }}>{s.trend !== null ? (s.trend > 0 ? '↗ +' : s.trend < 0 ? '↘ ' : '→ ') + s.trend + ' pts' : '—'}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: s.lastSundayRate < 80 ? '#e03050' : '#1a9c60' }}>{s.lastSundayRate !== null ? s.lastSundayRate + '%' : '—'}</td>
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
                    <div style={{ fontSize: 9, color: trendColor, fontWeight: 600 }}>{s.trend !== null ? (s.trend > 0 ? '+' : '') + s.trend + ' pts' : '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#6b7280' }}>
                  <span>Dim. dernier: <strong style={{ color: s.lastSundayRate < 80 ? '#e03050' : '#1a9c60' }}>{s.lastSundayRate !== null ? s.lastSundayRate + '%' : '—'}</strong></span>
                  <span>Nouveaux 30j: <strong>{s.nouveaux}</strong></span>
                  <span>Entretiens 30j: <strong>{s.entMonth}</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
