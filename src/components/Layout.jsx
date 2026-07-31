import { useState } from 'react'
import { useAuth } from '../lib/auth'

const APP_VERSION = 'v1.0.0'
import { Home, CheckSquare, TrendingUp, Users, GitBranch, Bell, MessageCircle, BookOpen, Download, Settings, Search, LogOut, Menu, Building2, FileText } from 'lucide-react'

const navIcons = {
  home: Home, pres: CheckSquare, timeline: TrendingUp, ames: Users,
  filia: GitBranch, alerts: Bell, ents: MessageCircle, protos: BookOpen,
  export: Download, params: Settings, fiche: Search, menu: Menu, vueEglise: Building2
}

export default function Layout({ page, setPage, alertCount, membreCount, selectedMembre, children, auth, actifs, onOpenFiche, scopeFamilleId, setScopeFamilleId, famillesScope }) {
  const familleName = auth?.profil?.famille_nom || null
  const egliseName = auth?.profil?.eglise_nom || null
  const { logout, profil, isAdmin, isBergerEglise, isSuperAdmin, isBergerPur } = useAuth()
  // Berger « pur » : supervise l'église sans gérer de famille. Menu minimal
  // (Synthèse + Alertes) — les pages « famille » n'ont pas de sens pour lui.
  const bergerPur = isBergerPur
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
        border: 'none', borderRadius: 6, background: page === id ? '#2E7D8A16' : 'transparent',
        color: page === id ? '#2E7D8A' : '#5E7175', fontWeight: page === id ? 600 : 500,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 13, marginBottom: 1
      }}>
        <Icon size={15} strokeWidth={page === id ? 2.2 : 1.8} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge > 0 ? <span style={{ background: '#C25A4A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '0 5px', borderRadius: 8 }}>{badge}</span> : null}
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
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F5F3EE', color: '#2B3A3D', fontSize: 14, lineHeight: 1.55, minHeight: '100dvh' }}>
      {/* Sidebar desktop */}
      <div className="sb" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 210, background: '#fff', borderRight: '1px solid #DCE6E5', display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #DCE6E5' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#2E7D8A', fontWeight: 700, marginBottom: 4 }}>{egliseName || 'Gestion Pastorale'}</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Suivi pastoral</div>
          {familleName && <div style={{ fontSize: 11, color: '#5E7175', marginTop: 2 }}>{familleName}</div>}
          <div style={{ fontSize: 11, color: '#5E7175', marginTop: 2 }}>{membreCount} membres</div>
          {auth?.isSuperAdmin && famillesScope && famillesScope.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #DCE6E5' }}>
              <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#8A9B9E', fontWeight: 600, marginBottom: 4 }}>Vue administrateur</div>
              <select value={scopeFamilleId || ''} onChange={e => setScopeFamilleId(e.target.value)} style={{ width: '100%', fontSize: 12, padding: '5px 6px', borderRadius: 6, border: '1px solid #C3D4D3', background: '#F5F8F7', color: '#2B3A3D', fontFamily: 'inherit' }}>
                <option value="">Toutes les églises</option>
                {famillesScope.map(f => <option key={f.id} value={f.id}>{f.nom}{f.eglises?.nom ? ' — ' + f.eglises.nom : ''}</option>)}
              </select>
            </div>
          )}
        </div>

        {isBergerEglise && !isAdmin && (
          <div style={{ padding: '8px 6px 2px' }}>
            <div style={{ fontSize: 11, letterSpacing: 0.5, color: '#8A9B9E', fontWeight: 500, padding: '0 6px', marginBottom: 2 }}>Supervision</div>
            {navBtn('vueEglise', 'Synthèse église', 0)}
            {navBtn('alerts', 'Alertes', alertCount)}
          </div>
        )}

        {!bergerPur && (
        <div style={{ padding: '8px 6px 2px' }}>
          
          {navBtn('home', 'Accueil', 0)}
          {navBtn('ames', 'Membres', 0)}
          {!bergerPur && navBtn('pres', 'Présences', 0)}
          {navBtn('timeline', 'Historique', 0)}
          {navBtn('filia', 'Organisation', 0)}
        </div>
        )}

        {!bergerPur && (
        <div style={{ padding: '8px 6px 2px' }}>
          <div style={{ fontSize: 11, letterSpacing: 0.5, color: '#8A9B9E', fontWeight: 500, padding: '0 6px', marginBottom: 2 }}>Suivi</div>
          {!(isBergerEglise && !isAdmin) && navBtn('alerts', 'Alertes', alertCount)}
          {!bergerPur && navBtn('ents', 'Entretiens', 0)}
          {navBtn('protos', 'Formation', 0)}
          {navBtn('rapport', 'Rapport mensuel', 0)}
        </div>
        )}

        {isSuperAdmin && (
          <div style={{ padding: '8px 6px 2px' }}>
            <div style={{ fontSize: 11, letterSpacing: 0.5, color: '#8A9B9E', fontWeight: 500, padding: '0 6px', marginBottom: 2 }}>Église</div>
            {navBtn('vueEglise', 'Synthèse', 0)}
          </div>
        )}

        {(isAdmin || isSuperAdmin) && (
          <div style={{ padding: '8px 6px 2px' }}>
            <div style={{ fontSize: 11, letterSpacing: 0.5, color: '#8A9B9E', fontWeight: 500, padding: '0 6px', marginBottom: 2 }}>Admin</div>
            {navBtn('params', 'Paramètres', 0)}
          </div>
        )}

        {selectedMembre && <div style={{ padding: '2px 6px' }}>{navBtn('fiche', 'Fiche', 0)}</div>}

        <div style={{ marginTop: 'auto', padding: '10px 12px', borderTop: '1px solid #DCE6E5' }}>
          <div style={{ fontSize: 11, color: '#5E7175', marginBottom: 6 }}>{profil?.nom_affiche || profil?.email}</div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#5E7175', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <LogOut size={12} /> Se déconnecter
          </button>
          <div style={{ fontSize: 10, color: '#C3D4D3', marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}><span>{APP_VERSION}</span><span onClick={() => setPage('cgu')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>CGU</span></div>
        </div>
      </div>

      {/* Contenu */}
      <div className="mn" style={{ marginLeft: 210, minHeight: '100dvh' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #DCE6E5', padding: '8px 16px', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titles[page] || '—'}</div>
            {(egliseName || familleName) && <div className="mob-only" style={{ fontSize: 10, color: '#2E7D8A', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginTop: -1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{egliseName}{egliseName && familleName ? ' · ' : ''}{familleName}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: '#5E7175', pointerEvents: 'none' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Rechercher..."
                style={{ padding: '6px 8px 6px 28px', borderRadius: 6, border: '1px solid #DCE6E5', background: '#F5F3EE', fontSize: 12, width: searchOpen ? 160 : 110, maxWidth: '42vw', transition: 'width .2s', fontFamily: 'inherit', boxSizing: 'border-box', minWidth: 0 }}
              />
              {searchOpen && searchQuery.length >= 2 && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid #DCE6E5', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 200, width: 280, maxWidth: '80vw', maxHeight: 300, overflowY: 'auto' }}>
                  {searchResults.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: '#5E7175', fontSize: 13 }}>Aucun résultat</div>}
                  {searchResults.map(m => (
                    <div key={m.id} onClick={() => { onOpenFiche(m.id); setSearchQuery(''); setSearchOpen(false) }}
                      style={{ padding: '10px 12px', borderBottom: '1px solid #F5F3EE', cursor: 'pointer', fontSize: 13 }}>
                      <div style={{ fontWeight: 600, color: '#2E7D8A' }}>{m.prenom} {m.nom}</div>
                      <div style={{ fontSize: 11, color: '#5E7175' }}>{m.role} · {m.statut}</div>
                    </div>
                  ))}
                </div>
              )}
              {searchOpen && <div onClick={() => { setSearchOpen(false); setSearchQuery('') }} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />}
            </div>
            <span className="desk-only" style={{ fontSize: 12, color: '#5E7175', whiteSpace: 'nowrap' }}>{membreCount} membres</span>
          </div>
        </div>
        <div style={{ padding: '16px 20px 50px' }}>{children}</div>
      </div>

      {/* Nav mobile — adaptée au rôle */}
      <nav className="nv" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #DCE6E5', display: 'none', zIndex: 200, padding: '4px 0 calc(2px + env(safe-area-inset-bottom, 0px))' }}>
        {(() => {
          const berger = isBergerEglise && !isAdmin
          let nav
          if (berger) {
            // Berger : pas de Présences (lecture seule), Synthèse en accès direct
            nav = [['home', 'Accueil', Home], ['ames', 'Membres', Users], ['alerts', 'Alertes', Bell], ['vueEglise', 'Synthèse', Building2], ['menu', 'Plus', Menu]]
          } else if (isAdmin) {
            // Admin : Paramètres en accès direct (Alertes reste dans Plus)
            nav = [['home', 'Accueil', Home], ['pres', 'Présences', CheckSquare], ['ames', 'Membres', Users], ['params', 'Réglages', Settings], ['menu', 'Plus', Menu]]
          } else {
            // Responsable : la barre standard
            nav = [['home', 'Accueil', Home], ['pres', 'Présences', CheckSquare], ['ames', 'Membres', Users], ['alerts', 'Alertes', Bell], ['menu', 'Plus', Menu]]
          }
          return nav.map(([id, label, Icon]) => (
            <button key={id} onClick={() => id === 'menu' ? setPage('menu') : setPage(id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '4px 2px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 10, color: page === id ? '#2E7D8A' : '#5E7175', fontWeight: page === id ? 700 : 500
            }}>
              <Icon size={18} strokeWidth={page === id ? 2.2 : 1.5} />
              <span>{label}</span>
            </button>
          ))
        })()}
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
        input:focus-visible,select:focus-visible,textarea:focus-visible,button:focus-visible{outline:2px solid #2E7D8A;outline-offset:2px}
        *,*::before,*::after{box-sizing:border-box}
        input,select,textarea,button{font-family:inherit;box-sizing:border-box}
        input[type="checkbox"],input[type="radio"]{accent-color:#2E7D8A}
        button,a{transition:opacity .15s,background .15s,transform .1s}
        button:active{transform:scale(0.97)}
        .modal-overlay{animation:fadeIn .2s}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
        .toast-msg{animation:slideUp .25s ease-out}
        @media print{
          .sb,.mn>div:first-child,.no-print,nav{display:none!important}
          .mn{margin-left:0!important}
          #rapport{box-shadow:none!important;border:none!important;padding:0!important}
          *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
          @page{margin:1.5cm}
          #rapport table{page-break-inside:auto}
          #rapport tr{page-break-inside:avoid;page-break-after:auto}
          #rapport thead{display:table-header-group}
          #rapport>div{page-break-inside:avoid}
          #rapport>div.print-flow{page-break-inside:auto}
          .print-keep{page-break-inside:avoid}
          body{background:#fff!important}
        }
        @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
        .skeleton{background:linear-gradient(90deg,#F5F3EE 25%,#DCE6E5 50%,#F5F3EE 75%);background-size:400px 100%;animation:shimmer 1.5s infinite;border-radius:6px}
        .scroll-fade{position:relative}
        .scroll-fade::after{content:'';position:absolute;top:0;right:0;bottom:0;width:20px;background:linear-gradient(to right, transparent, #F5F3EE);pointer-events:none}
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
