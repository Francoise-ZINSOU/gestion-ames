import { useState, useEffect, useRef } from 'react'
import { useAuth } from './lib/auth'
import { useMembres, usePresences, useEntretiens, useDefis, usePlanCroissance, useAlertes, useRefs, useDatesAnnulees, useHistoriqueStatutsGlobal, refHelpers } from './lib/data'
import { Toast, useToast, today } from './lib/ui'
import LoginPage from './pages/Login'
import AccessDenied from './pages/AccessDenied'
import NoFamillePage from './pages/NoFamille'
import Layout from './components/Layout'
import HomePage from './pages/Home'
import PresencesPage from './pages/Presences'
import AmesPage from './pages/Ames'
import FichePage from './pages/Fiche'
import AlertesPage from './pages/Alertes'
import EntretiensPage from './pages/EntretiensGlobal'
import CroissancePage from './pages/Croissance'
import HistoriquePage from './pages/Historique'
import FiliationPage from './pages/Filiation'
import ExportPage from './pages/Export'
import RapportPage from './pages/Rapport'
import CGUPage from './pages/CGU'
import ParamsPage from './pages/Params'
import VueEglisePage from './pages/VueEglise'
import SetPasswordPage from './pages/SetPassword'
import MenuMobile from './pages/MenuMobile'

export default function App() {
  const auth = useAuth()
  const { toast, showToast } = useToast()
  const [page, setPage] = useState('home')
  const [selectedId, setSelectedId] = useState(null)
  // Landing selon le rôle, appliqué une seule fois quand le profil est chargé :
  // un berger d'église « pur » (sans famille propre) atterrit sur sa Synthèse,
  // pas sur un tableau de bord famille qui serait vide pour lui.
  const landedRef = useRef(false)
  useEffect(() => {
    if (landedRef.current || auth.loading || !auth.profil) return
    landedRef.current = true
    const bergerPur = auth.isBergerPur
    if (bergerPur) setPage('vueEglise')
  }, [auth.loading, auth.profil, auth.isBergerEglise, auth.isResponsable])

  if (auth.loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ color: '#5E7175', fontSize: 14 }}>Chargement...</div>
    </div>
  )
  if (!auth.session) return <LoginPage />
  if (auth.needsPassword) return <SetPasswordPage profil={auth.profil} onDone={auth.clearNeedsPassword} />
  if (!auth.isResponsable && !auth.isBergerEglise && !auth.isSuperAdmin) return <AccessDenied />

  // Utilisateur sans famille assignée : la RLS lui renverrait des listes
  // vides et des alertes absurdes → page dédiée avec instructions.
  // Portes de sortie : super-admin (administration de plateforme) et admin
  // sans famille (peut se réassigner lui-même dans Paramètres → Utilisateurs).
  // Un responsable simple reste bloqué : c'est à l'admin de le rattacher.
  if (!auth.profil?.famille_id && !auth.profil?.est_super_admin && !auth.profil?.est_admin && !auth.isBergerEglise) return <NoFamillePage />

  return <AuthorizedApp auth={auth} toast={toast} showToast={showToast} page={page} setPage={setPage} selectedId={selectedId} setSelectedId={setSelectedId} />
}

function AuthorizedApp({ auth, toast, showToast, page, setPage, selectedId, setSelectedId }) {
  const mb = useMembres()
  const pr = usePresences()
  const en = useEntretiens()
  const df = useDefis()
  const pt = usePlanCroissance()
  const al = useAlertes()
  const rf = useRefs()
  const da = useDatesAnnulees()
  const hs = useHistoriqueStatutsGlobal(30)

  // ── Sélecteur de périmètre (super-admin uniquement) ──
  // Le super-admin voit TOUTES les églises via la RLS. Pour éviter le mélange
  // (membres d'autres églises qui apparaissent), il choisit un périmètre :
  // une famille précise, ou « Toutes ». Le choix filtre le ctx en amont, donc
  // toutes les pages en héritent sans modification. '' = toutes.
  const [scopeFamilleId, setScopeFamilleId] = useState('')
  const [famillesScope, setFamillesScope] = useState([])
  useEffect(() => {
    if (!auth.isSuperAdmin) return
    import('./lib/supabase').then(({ supabase }) => {
      supabase.from('familles_disciples').select('id, nom, eglises(nom)').eq('actif', true).order('nom')
        .then(({ data }) => setFamillesScope(data || []))
    })
  }, [auth.isSuperAdmin])

  // Filtre de périmètre : n'affecte QUE le super-admin ayant choisi une famille.
  // Pour tout le monde d'autre, la RLS fait déjà le cloisonnement → aucun effet.
  const inScope = (arr) => {
    if (!auth.isSuperAdmin || !scopeFamilleId) return arr
    return (arr || []).filter(x => x.famille_id === scopeFamilleId)
  }

  // Activités : ne garder que celles de la famille de travail de l'utilisateur.
  // Un super-admin ou un Berger d'église voit les activités de TOUTES les familles
  // via la RLS (voulu pour la Synthèse église), mais les pages opérationnelles
  // (Présences, Historique, Fiche...) ne doivent afficher que celles de SA famille,
  // sinon chaque activité apparaît en plusieurs exemplaires.
  const _actsAll = rf.refs.activites || []
  const _actsMine = auth.profil?.famille_id ? _actsAll.filter(a => a.famille_id === auth.profil.famille_id) : _actsAll
  const refsOp = { ...rf.refs, activites: _actsMine.length ? _actsMine : _actsAll }
  const h = refHelpers(refsOp)

  const dataLoading = mb.loading || pr.loading || rf.loading

  const [prevPage, setPrevPage] = useState('ames')
  const openFiche = (id) => { setSelectedId(id); setPrevPage(page); setPage('fiche') }
  // Navigation : quitter la fiche vers une autre page efface le membre sélectionné
  // (pour que le raccourci « Fiche » du menu ne reste pas affiché indéfiniment)
  const navigateTo = (p) => { if (p !== 'fiche') setSelectedId(null); setPage(p) }
  const selectedMembre = mb.membres.find(m => m.id === selectedId) || null

  // Wrappers avec toast
  // Mode lecture seule : si la famille (ou son église) est désactivée, aucune
  // écriture n'est permise. Comme TOUTES les actions passent par ce wrapper,
  // on bloque en un seul endroit — les données restent consultables.
  const lectureSeule = auth.isFamilleActive === false
  const w = (fn, msg) => async (...args) => {
    if (lectureSeule) { showToast('⚠ Famille désactivée : modification impossible (lecture seule)'); return }
    try { const r = await fn(...args); showToast(msg); return r } catch (e) { showToast('⚠ ' + (e.message || 'Erreur inattendue')) }
  }

  // Alertes filtrées (masquer les membres avec entretien planifié dans les 30j)
  const _todayStr = today()
  const _in30 = new Date(); _in30.setDate(_in30.getDate() + 30)
  const _in30Str = _in30.getFullYear() + '-' + ('0' + (_in30.getMonth() + 1)).slice(-2) + '-' + ('0' + _in30.getDate()).slice(-2)
  const _statutPlanifie = (rf.refs?.statutsEntretien || []).find(s => s.nom?.toLowerCase().includes('planif'))?.nom || 'Planifié'
  const alertesFiltrees = al.alertes.filter(a => {
    const hasPlanned = (en.entretiens || []).some(e =>
      e.membre_id === a.membre_id && e.statut === _statutPlanifie
      && e.date_entretien >= _todayStr && e.date_entretien <= _in30Str
    )
    if (!hasPlanned) return true
    return a.absences >= 3 || a.defis_ouverts > 0
  })

  const ctx = {
    membres: inScope(mb.membres), actifs: inScope(mb.actifs), presences: inScope(pr.presences),
    entretiens: inScope(en.entretiens), defis: inScope(df.defis), plans: inScope(pt.plans),
    alertes: inScope(alertesFiltrees), refs: refsOp, h,
    histStatuts: inScope(hs.histStatuts),
    superAdminSansPerimetre: auth.isSuperAdmin === true && !scopeFamilleId,
    scopeFamilleId: auth.isSuperAdmin === true ? scopeFamilleId : '',
    openFiche, showToast, selectedMembre, selectedId, auth, prevPage,
    // Membres
    ajouterMembre: w(mb.ajouter, '✓ Membre ajouté'),
    modifierMembre: w(mb.modifier, '✓ Membre modifié'),
    archiverMembre: w(mb.archiver, '✓ Membre archivé'),
    importerCSV: w(mb.importerCSV, '✓ Import terminé'),
    reloadMembres: mb.reload,
    // Presences
    enregistrerPresences: w(pr.sauver, '✓ Présences enregistrées'),
    supprimerDate: w(pr.supprimerDate, '✓ Date supprimée'),
    // Entretiens
    ajouterEnt: w(en.ajouter, '✓ Entretien ajouté'),
    modifierEnt: w(en.modifier, '✓ Entretien modifié'),
    supprimerEnt: w(en.supprimer, '✓ Entretien supprimé'),
    // Défis
    ajouterDefi: w(df.ajouter, '✓ Défi ajouté'),
    modifierDefi: w(df.modifier, '✓ Défi mis à jour'),
    supprimerDefi: w(df.supprimer, '✓ Défi supprimé'),
    // Plan
    assignerModule: w(pt.assigner, '✓ Module assigné'),
    validerModule: async (id, v) => { try { await pt.valider(id, v) } catch (e) { showToast('⚠ ' + (e.message || 'Erreur inattendue')) } },
    retirerModule: w(pt.retirer, '✓ Module retiré'),
    // Refs
    reloadRefs: rf.reload,
    datesAnnulees: da.dates,
    ajouterDateAnnulee: w(da.ajouter, '✓ Date annulée ajoutée'),
    supprimerDateAnnulee: w(da.supprimer, '✓ Date rétablie'),
  }

  if (dataLoading) return (
    <Layout page={page} setPage={navigateTo} alertCount={0} membreCount={0} selectedMembre={null} auth={auth} actifs={[]} onOpenFiche={() => {}}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#5E7175', fontSize: 13 }}>Chargement des données...</div>
    </Layout>
  )

  let content
  // Garde-fou berger pur : il ne peut atteindre que ses pages « église ».
  // Toute page « famille » est redirigée vers sa Synthèse.
  const bergerPurRoute = auth.isBergerPur
  const pageEffective = (bergerPurRoute && !['vueEglise', 'alerts', 'cgu', 'menu'].includes(page)) ? 'vueEglise' : page
  switch (pageEffective) {
    case 'home': content = <HomePage {...ctx} setPage={navigateTo} />; break
    case 'pres': content = <PresencesPage {...ctx} />; break
    case 'ames': content = <AmesPage {...ctx} setPage={navigateTo} />; break
    case 'fiche': content = <FichePage {...ctx} setPage={navigateTo} />; break
    case 'alerts': content = <AlertesPage {...ctx} />; break
    case 'ents': content = <EntretiensPage {...ctx} />; break
    case 'protos': content = <CroissancePage {...ctx} />; break
    case 'timeline': content = <HistoriquePage {...ctx} />; break
    case 'filia': content = <FiliationPage {...ctx} />; break
    case 'export': content = null; break  /* Export & sauvegarde désactivé — remettre <ExportPage {...ctx} /> pour réactiver */
    case 'rapport': content = <RapportPage {...ctx} />; break
    case 'cgu': content = <CGUPage />; break
    case 'vueEglise': content = (auth.isBergerEglise || auth.isSuperAdmin) ? <VueEglisePage auth={auth} refs={rf.refs} h={h} /> : null; break
    case 'params': content = (auth.isAdmin || auth.isSuperAdmin) ? <ParamsPage {...ctx} /> : null; break
    case 'menu': content = <MenuMobile setPage={navigateTo} isAdmin={auth.isAdmin} selectedMembre={selectedMembre} auth={auth} scopeFamilleId={scopeFamilleId} setScopeFamilleId={setScopeFamilleId} famillesScope={famillesScope} />; break
    default: content = <HomePage {...ctx} setPage={navigateTo} />
  }

  return (
    <Layout page={page} setPage={navigateTo} alertCount={ctx.alertes.length} membreCount={ctx.actifs.length} selectedMembre={selectedMembre} auth={auth} actifs={ctx.actifs} onOpenFiche={openFiche}
      scopeFamilleId={scopeFamilleId} setScopeFamilleId={setScopeFamilleId} famillesScope={famillesScope}>
      {(mb.loadError || pr.loadError) && (
        <div style={{ background: '#C25A4A15', border: '1px solid #C25A4A', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#C25A4A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>Connexion aux données interrompue. Vérifiez votre réseau — vos données ne sont pas perdues.</span>
          <button onClick={() => { mb.reload(); pr.reload() }} style={{ background: '#C25A4A', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Réessayer</button>
        </div>
      )}
      {content}
      <Toast message={toast} />
    </Layout>
  )
}
