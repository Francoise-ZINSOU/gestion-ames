import { S } from '../lib/ui'

const APP_VERSION = 'v1.0.0'
import { useAuth } from '../lib/auth'
import { Home, CheckSquare, TrendingUp, Users, GitBranch, Bell, MessageCircle, BookOpen, Download, Settings, LogOut, Search, Building2, FileText } from 'lucide-react'

export default function MenuMobile({ setPage, isAdmin, selectedMembre, auth, scopeFamilleId, setScopeFamilleId, famillesScope }) {
  const { logout, profil } = useAuth()

  const berger = auth?.isBergerEglise === true && isAdmin !== true
  // Berger « pur » (sans famille) : menu minimal, cohérent avec le desktop
  const bergerPur = berger && auth?.isResponsable !== true && !auth?.profil?.famille_id
  const items = bergerPur ? [
    { id: 'vueEglise', Icon: Building2, label: 'Synthèse église' },
    { id: 'alerts', Icon: Bell, label: 'Alertes' },
  ] : berger ? [
    // Berger : supervision d'abord, cohérent avec le desktop
    { id: 'home', Icon: Home, label: 'Accueil' },
    { id: 'vueEglise', Icon: Building2, label: 'Synthèse église' },
    { id: 'alerts', Icon: Bell, label: 'Alertes' },
    { id: 'ames', Icon: Users, label: 'Membres' },
    { id: 'timeline', Icon: TrendingUp, label: 'Historique' },
    { id: 'filia', Icon: GitBranch, label: 'Organisation' },
    { id: 'protos', Icon: BookOpen, label: 'Parcours de formation' },
    { id: 'rapport', Icon: FileText, label: 'Rapport mensuel' },
  ] : [
    { id: 'home', Icon: Home, label: 'Accueil' },
    { id: 'pres', Icon: CheckSquare, label: 'Présences' },
    { id: 'timeline', Icon: TrendingUp, label: 'Historique' },
    { id: 'ames', Icon: Users, label: 'Membres' },
    { id: 'filia', Icon: GitBranch, label: 'Organisation' },
    { id: 'alerts', Icon: Bell, label: 'Alertes' },
    { id: 'ents', Icon: MessageCircle, label: 'Entretiens' },
    { id: 'protos', Icon: BookOpen, label: 'Parcours de formation' },
    { id: 'rapport', Icon: FileText, label: 'Rapport mensuel' },
  ]
  if (!berger && auth?.isSuperAdmin) items.push({ id: 'vueEglise', Icon: Building2, label: 'Synthèse église' })
  if (isAdmin || auth?.isSuperAdmin) items.push({ id: 'params', Icon: Settings, label: 'Paramètres' })

  return (
    <div>
      {auth?.isSuperAdmin && famillesScope && famillesScope.length > 0 && (
        <div style={{ ...S.card, marginBottom: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#8A9B9E', fontWeight: 600, marginBottom: 6 }}>Vue administrateur</div>
          <select value={scopeFamilleId || ''} onChange={e => setScopeFamilleId(e.target.value)} style={{ width: '100%', fontSize: 14, padding: '10px 8px', borderRadius: 8, border: '1px solid #C3D4D3', background: '#F5F8F7', color: '#2B3A3D', fontFamily: 'inherit' }}>
            <option value="">Toutes les églises</option>
            {famillesScope.map(f => <option key={f.id} value={f.id}>{f.nom}{f.eglises?.nom ? ' — ' + f.eglises.nom : ''}</option>)}
          </select>
          {!scopeFamilleId && <div style={{ fontSize: 11, color: '#8A9B9E', marginTop: 6, fontStyle: 'italic' }}>Choisissez une église pour pouvoir ajouter un membre.</div>}
        </div>
      )}

      {selectedMembre && (
        <div style={{ ...S.card, marginBottom: 10 }}>
          <div onClick={() => setPage('fiche')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', cursor: 'pointer' }}>
            <Search size={18} strokeWidth={1.8} color="#2E7D8A" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2E7D8A' }}>Fiche — {selectedMembre.prenom} {selectedMembre.nom}</div>
              <div style={{ fontSize: 11, color: '#5E7175' }}>Dernière fiche consultée</div>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Menu</div>
        {items.map(({ id, Icon, label }) => (
          <div key={id} onClick={() => setPage(id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
            borderBottom: '1px solid #DCE6E5', cursor: 'pointer'
          }}>
            <Icon size={18} strokeWidth={1.8} color="#5E7175" />
            <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginTop: 10 }}>
        <div style={{ fontSize: 12, color: '#5E7175', marginBottom: 8 }}>{profil?.nom_affiche || profil?.email}</div>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #C25A4A', borderRadius: 7, padding: '8px 14px', color: '#C25A4A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
          <LogOut size={14} /> Se déconnecter
        </button>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#C3D4D3', marginTop: 8 }}>{APP_VERSION}</div>
      </div>
    </div>
  )
}
