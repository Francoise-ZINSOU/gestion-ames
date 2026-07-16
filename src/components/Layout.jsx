import { useAuth } from '../lib/auth'
import { Home, CheckSquare, TrendingUp, Users, GitBranch, Bell, MessageCircle, BookOpen, Download, Settings, Search, LogOut, Menu } from 'lucide-react'

const navIcons = {
  home: Home, pres: CheckSquare, timeline: TrendingUp, ames: Users,
  filia: GitBranch, alerts: Bell, ents: MessageCircle, protos: BookOpen,
  export: Download, params: Settings, fiche: Search, menu: Menu
}

export default function Layout({ page, setPage, alertCount, membreCount, selectedMembre, children }) {
  const { logout, profil, isAdmin } = useAuth()

  const navBtn = (id, label, badge) => {
    const Icon = navIcons[id] || Home
    return (
      <button key={id} onClick={() => setPage(id)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px',
        border: 'none', borderRadius: 6, background: page === id ? '#0ea88816' : 'transparent',
        color: page === id ? '#0ea888' : '#5a6480', fontWeight: page === id ? 600 : 500,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 12, marginBottom: 1
      }}>
        <Icon size={15} strokeWidth={page === id ? 2.2 : 1.8} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge > 0 ? <span style={{ background: '#e03050', color: '#fff', fontSize: 9, fontWeight: 700, padding: '0 5px', borderRadius: 8 }}>{badge}</span> : null}
      </button>
    )
  }

  const titles = {
    home: 'Tableau de bord', pres: 'Saisie des présences', ames: 'Liste des âmes',
    fiche: 'Fiche 360°', alerts: 'Alertes croisées', ents: 'Entretiens',
    protos: 'Plan de croissance', timeline: 'Historique', filia: 'Arbre de suivi',
    export: 'Export', params: 'Paramètres', menu: 'Menu'
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#f4f6f9', color: '#1a1e2e', fontSize: 13, lineHeight: 1.55, minHeight: '100vh' }}>
      {/* Sidebar desktop */}
      <div className="sb" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 210, background: '#fff', borderRight: '1px solid #e0e4ec', display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #e0e4ec' }}>
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#0ea888', fontWeight: 700, marginBottom: 4 }}>Gestion Pastorale</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Suivi des Âmes</div>
          <div style={{ fontSize: 10, color: '#8892a8', marginTop: 2 }}>{membreCount} actif(s)</div>
        </div>

        <div style={{ padding: '8px 6px 2px' }}>
          <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: '#8892a8', fontWeight: 600, padding: '0 6px', marginBottom: 2 }}>PRÉSENCES</div>
          {navBtn('home', 'Accueil', 0)}
          {navBtn('pres', 'Saisie', 0)}
          {navBtn('timeline', 'Historique', 0)}
          {navBtn('ames', 'Âmes', 0)}
          {navBtn('filia', 'Arbre de suivi', 0)}
        </div>

        <div style={{ padding: '8px 6px 2px' }}>
          <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: '#8892a8', fontWeight: 600, padding: '0 6px', marginBottom: 2 }}>PASTORAL</div>
          {navBtn('alerts', 'Alertes', alertCount)}
          {navBtn('ents', 'Entretiens', 0)}
          {navBtn('protos', 'Plan de croissance', 0)}
          {navBtn('export', 'Export', 0)}
        </div>

        {isAdmin && (
          <div style={{ padding: '8px 6px 2px' }}>
            <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: '#8892a8', fontWeight: 600, padding: '0 6px', marginBottom: 2 }}>ADMIN</div>
            {navBtn('params', 'Paramètres', 0)}
          </div>
        )}

        {selectedMembre && <div style={{ padding: '2px 6px' }}>{navBtn('fiche', 'Fiche', 0)}</div>}

        <div style={{ marginTop: 'auto', padding: '10px 12px', borderTop: '1px solid #e0e4ec' }}>
          <div style={{ fontSize: 10, color: '#5a6480', marginBottom: 6 }}>{profil?.nom_affiche || profil?.email}</div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#8892a8', fontSize: 11, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <LogOut size={12} /> Se déconnecter
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="mn" style={{ marginLeft: 210, minHeight: '100vh' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e0e4ec', padding: '0 20px', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{titles[page] || '—'}</div>
          <span style={{ fontSize: 10, color: '#8892a8' }}>{membreCount} âmes</span>
        </div>
        <div style={{ padding: '16px 20px 50px' }}>{children}</div>
      </div>

      {/* Nav mobile */}
      <nav className="nv" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e0e4ec', display: 'none', zIndex: 200, padding: '4px 0 calc(2px + env(safe-area-inset-bottom, 0px))' }}>
        {[['home', 'Accueil', Home], ['pres', 'Saisie', CheckSquare], ['ames', 'Âmes', Users], ['alerts', 'Alertes', Bell], ['menu', 'Plus', Menu]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => id === 'menu' ? setPage('menu') : setPage(id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '4px 2px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 9, color: page === id ? '#0ea888' : '#8892a8', fontWeight: page === id ? 700 : 500
          }}>
            <Icon size={18} strokeWidth={page === id ? 2.2 : 1.5} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .mob-only{display:none}
        .desk-only{display:block}
        @media(max-width:768px){
          .sb{display:none!important}
          .mn{margin-left:0!important}
          .nv{display:flex!important}
          .mn>div:last-child{padding:12px 12px 70px!important}
          .mob-only{display:block!important}
          .desk-only{display:none!important}
          table{display:block;overflow-x:auto;white-space:nowrap}
        }
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);z-index:500;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;box-sizing:border-box;-webkit-overflow-scrolling:touch}
        body:has(.modal-overlay){overflow:hidden!important}
        .modal-overlay.danger{background:rgba(0,0,0,.5);z-index:600}
        .modal-box{width:100%;background:#fff;border-radius:12px;overflow:hidden;box-sizing:border-box;margin-top:4vh;max-height:92vh;display:flex;flex-direction:column}
        .modal-box>div:nth-child(2){overflow-y:auto;flex:1}
        @media(max-width:500px){
          .modal-overlay{padding:8px}
          .modal-box{margin-top:2vh;max-height:96vh;border-radius:10px}
        }
      `}</style>
    </div>
  )
}
