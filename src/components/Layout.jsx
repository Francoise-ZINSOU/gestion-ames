import { useState } from 'react'
import { useAuth } from '../lib/auth'

const APP_VERSION = 'v1.0.0'
import { Home, CheckSquare, TrendingUp, Users, GitBranch, Bell, MessageCircle, BookOpen, Download, Settings, Search, LogOut, Menu, Building2, FileText } from 'lucide-react'

const navIcons = {
  home: Home, pres: CheckSquare, timeline: TrendingUp, ames: Users,
  filia: GitBranch, alerts: Bell, ents: MessageCircle, protos: BookOpen,
  export: Download, params: Settings, fiche: Search, menu: Menu, vueEglise: Building2
}

export default function Layout({ page, setPage, alertCount, membreCount, selectedMembre, children, auth, actifs, onOpenFiche }) {
  const familleName = auth?.profil?.famille_nom || null
  const egliseName = auth?.profil?.eglise_nom || null
  const { logout, profil, isAdmin, isBergerEglise } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchResults = searchQuery.length >= 2
    ? (actifs || []).filter(m => 
        (m.prenom + ' ' + m.nom).toLowerCase().includes(searchQuery.toLowerCase())
        || (m.nom + ' ' + m.prenom).toLowerCase().includes(searchQuery.toLowerCase())
        || (m.telephone || '').includes(searchQuery)
        || (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : []

  const navBtn = (id, label, badge) => {
    const Icon = navIcons[id] || Home
    return (
      <button key={id} onClick={() => setPage(id)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px',
        border: 'none', borderRadius: 6, background: page === id ? '#0ea88816' : 'transparent',
        color: page === id ? '#0ea888' : '#5a6480', fontWeight: page === id ? 600 : 500,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 13, marginBottom: 1
      }}>
        <Icon size={15} strokeWidth={page === id ? 2.2 : 1.8} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge > 0 ? <span style={{ background: '#e03050', color: '#fff', fontSize: 10, fontWeight: 700, padding: '0 5px', borderRadius: 8 }}>{badge}</span> : null}
      </button>
    )
  }

  const titles = {
    home: 'Tableau de bord', pres: 'Présences', ames: 'Membres', vueEglise: 'Synthèse église',
    fiche: selectedMembre ? '' : 'Fiche', alerts: 'Alertes', ents: 'Entretiens',
    protos: 'Parcours de formation', timeline: 'Historique', filia: 'Organisation',
    rapport: 'Rapport mensuel', cgu: 'Conditions d\'utilisation', export: 'Export & sauvegarde', params: 'Paramètres', menu: 'Menu'
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#f4f6f9', color: '#1a1e2e', fontSize: 14, lineHeight: 1.55, minHeight: '100vh', minHeight: '100dvh' }}>
      {/* Sidebar desktop */}
      <div className="sb" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 210, background: '#fff', borderRight: '1px solid #e0e4ec', display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #e0e4ec' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#0ea888', fontWeight: 700, marginBottom: 4 }}>{egliseName || 'Gestion Pastorale'}</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Suivi pastoral</div>
          {familleName && <div style={{ fontSize: 11, color: '#5a6480', marginTop: 2 }}>{familleName}</div>}
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{membreCount} membres</div>
        </div>

        <div style={{ padding: '8px 6px 2px' }}>
          
          {navBtn('home', 'Accueil', 0)}
          {navBtn('ames', 'Membres', 0)}
          {navBtn('pres', 'Présences', 0)}
          {navBtn('timeline', 'Historique', 0)}
          {navBtn('filia', 'Organisation', 0)}
        </div>

        <div style={{ padding: '8px 6px 2px' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#6b7280', fontWeight: 600, padding: '0 6px', marginBottom: 2 }}>SUIVI</div>
          {navBtn('alerts', 'Alertes', alertCount)}
          {navBtn('ents', 'Entretiens', 0)}
          {navBtn('protos', 'Formation', 0)}
          {navBtn('rapport', 'Rapport mensuel', 0)}
          {navBtn('export', 'Export & sauvegarde', 0)}
        </div>

        {(isBergerEglise || isAdmin) && (
          <div style={{ padding: '8px 6px 2px' }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#6b7280', fontWeight: 600, padding: '0 6px', marginBottom: 2 }}>ÉGLISE</div>
            {navBtn('vueEglise', 'Synthèse', 0)}
          </div>
        )}

        {isAdmin && (
          <div style={{ padding: '8px 6px 2px' }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#6b7280', fontWeight: 600, padding: '0 6px', marginBottom: 2 }}>ADMIN</div>
            {navBtn('params', 'Paramètres', 0)}
          </div>
        )}

        {selectedMembre && <div style={{ padding: '2px 6px' }}>{navBtn('fiche', 'Fiche', 0)}</div>}

        <div style={{ marginTop: 'auto', padding: '10px 12px', borderTop: '1px solid #e0e4ec' }}>
          <div style={{ fontSize: 11, color: '#5a6480', marginBottom: 6 }}>{profil?.nom_affiche || profil?.email}</div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <LogOut size={12} /> Se déconnecter
          </button>
          <div style={{ fontSize: 10, color: '#c8cfe0', marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}><span>{APP_VERSION}</span><span onClick={() => setPage('cgu')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>CGU</span></div>
        </div>
      </div>

      {/* Contenu */}
      <div className="mn" style={{ marginLeft: 210, minHeight: '100vh', minHeight: '100dvh' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e0e4ec', padding: '0 20px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{titles[page] || '—'}</div>
            {(egliseName || familleName) && <div className="mob-only" style={{ fontSize: 10, color: '#0ea888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginTop: -1 }}>{egliseName}{egliseName && familleName ? ' · ' : ''}{familleName}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: '#6b7280', pointerEvents: 'none' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Rechercher..."
                style={{ padding: '6px 8px 6px 28px', borderRadius: 6, border: '1px solid #e0e4ec', background: '#f4f6f9', fontSize: 12, width: searchOpen ? 200 : 120, transition: 'width .2s', fontFamily: 'inherit', boxSizing: 'border-box', minWidth: 0 }}
              />
              {searchOpen && searchQuery.length >= 2 && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid #e0e4ec', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 200, width: 280, maxHeight: 300, overflowY: 'auto' }}>
                  {searchResults.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Aucun résultat</div>}
                  {searchResults.map(m => (
                    <div key={m.id} onClick={() => { onOpenFiche(m.id); setSearchQuery(''); setSearchOpen(false) }}
                      style={{ padding: '10px 12px', borderBottom: '1px solid #f0f2f6', cursor: 'pointer', fontSize: 13 }}>
                      <div style={{ fontWeight: 600, color: '#0ea888' }}>{m.prenom} {m.nom}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{m.role} · {m.statut}</div>
                    </div>
                  ))}
                </div>
              )}
              {searchOpen && <div onClick={() => { setSearchOpen(false); setSearchQuery('') }} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />}
            </div>
            <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{membreCount} membres</span>
          </div>
        </div>
        <div style={{ padding: '16px 20px 50px' }}>{children}</div>
      </div>

      {/* Nav mobile */}
      <nav className="nv" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e0e4ec', display: 'none', zIndex: 200, padding: '4px 0 calc(2px + env(safe-area-inset-bottom, 0px))' }}>
        {[['home', 'Accueil', Home], ['pres', 'Saisie', CheckSquare], ['ames', 'Âmes', Users], ['alerts', 'Alertes', Bell], ['menu', 'Plus', Menu]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => id === 'menu' ? setPage('menu') : setPage(id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '4px 2px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 10, color: page === id ? '#0ea888' : '#6b7280', fontWeight: page === id ? 700 : 500
          }}>
            <Icon size={18} strokeWidth={page === id ? 2.2 : 1.5} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        :root { --vh: 1vh; }
        @supports (height: 100dvh) { :root { --vh: 1dvh; } }
        .mob-only{display:none}
        .desk-only{display:block}
        @media(max-width:768px){.toast-msg{bottom:80px!important}
          .sb{display:none!important}
          .mn{margin-left:0!important}
          .nv{display:flex!important}
          .mn>div:last-child{padding:12px 12px 70px!important}
          .mob-only{display:block!important}
          .desk-only{display:none!important}
          .sticky-save{bottom:56px!important}
          table{display:block;overflow-x:auto;white-space:nowrap}
        }
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);z-index:500;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;box-sizing:border-box;-webkit-overflow-scrolling:touch}
        body:has(.modal-overlay){overflow:hidden!important}
        .hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
        .hide-scrollbar::-webkit-scrollbar{display:none;width:0;height:0}
        input:focus-visible,select:focus-visible,textarea:focus-visible,button:focus-visible{outline:2px solid #0ea888;outline-offset:2px}
        *,*::before,*::after{box-sizing:border-box}
        input,select,textarea,button{font-family:inherit;box-sizing:border-box}
        input[type="checkbox"],input[type="radio"]{accent-color:#0ea888}
        button,a{transition:opacity .15s,background .15s,transform .1s}
        button:active{transform:scale(0.97)}
        .modal-overlay{animation:fadeIn .2s}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
        .toast-msg{animation:slideUp .25s ease-out}
        @media print{.sb,.mn>div:first-child,.no-print,nav{display:none!important}.mn{margin-left:0!important}#rapport{box-shadow:none;border:none}}
        @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
        .skeleton{background:linear-gradient(90deg,#f0f2f6 25%,#e0e4ec 50%,#f0f2f6 75%);background-size:400px 100%;animation:shimmer 1.5s infinite;border-radius:6px}
        .scroll-fade{position:relative}
        .scroll-fade::after{content:'';position:absolute;top:0;right:0;bottom:0;width:20px;background:linear-gradient(to right, transparent, #f4f6f9);pointer-events:none}
        .modal-overlay.danger{background:rgba(0,0,0,.5);z-index:600}
        .modal-box{width:100%;background:#fff;border-radius:12px;overflow:hidden;overflow-x:hidden!important;box-sizing:border-box;margin-top:4vh;max-height:92vh;max-height:92dvh;display:flex;flex-direction:column}
        @media(max-width:768px){.toast-msg{bottom:80px!important}.modal-box{max-height:88dvh;margin-top:2vh}}
        .modal-box>div:nth-child(2){overflow-y:auto;overflow-x:hidden;flex:1}
        .modal-box textarea,.modal-box input,.modal-box select{max-width:100%;box-sizing:border-box}
        @media(max-width:500px){
          .modal-overlay{padding:8px}
          .modal-box{margin-top:2vh;max-height:96vh;max-height:96dvh;border-radius:10px}
        }
      `}</style>
    </div>
  )
}
