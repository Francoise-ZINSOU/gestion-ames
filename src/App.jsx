import { useState } from 'react'
import { useAuth } from './lib/auth'
import { useMembres, usePresences, useEntretiens, useDefis, usePlanCroissance, useAlertes, useRefs, useDatesAnnulees, refHelpers } from './lib/data'
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
import ParamsPage from './pages/Params'
import VueEglisePage from './pages/VueEglise'
import SetPasswordPage from './pages/SetPassword'
import MenuMobile from './pages/MenuMobile'

export default function App() {
  const auth = useAuth()
  const { toast, showToast } = useToast()
  const [page, setPage] = useState('home')
  const [selectedId, setSelectedId] = useState(null)

  if (auth.loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', fallback: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ color: '#5a6480', fontSize: 14 }}>Chargement...</div>
    </div>
  )
  if (!auth.session) return <LoginPage />
  if (auth.needsPassword) return <SetPasswordPage profil={auth.profil} onDone={auth.clearNeedsPassword} />
  if (!auth.isResponsable) return <AccessDenied />

  // Si famille_id est requis (multi-église activé) et pas super-admin
  const hasFamille = auth.profil?.famille_id || auth.profil?.est_super_admin
  // On ne bloque que si le système multi-église est activé (au moins 1 famille existe)
  // Pour le savoir sans query, on check si famille_id est null ET est_super_admin est false
  // Le blocage se fera côté RLS — pas de blocage frontend pour ne pas casser l'existant

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
  const h = refHelpers(rf.refs)

  const dataLoading = mb.loading || pr.loading || rf.loading

  const [prevPage, setPrevPage] = useState('ames')
  const openFiche = (id) => { setSelectedId(id); setPrevPage(page); setPage('fiche') }
  const selectedMembre = mb.membres.find(m => m.id === selectedId) || null

  // Wrappers avec toast
  const w = (fn, msg) => async (...args) => { try { const r = await fn(...args); showToast(msg); return r } catch (e) { showToast('⚠ ' + (e.message || 'Erreur inattendue')) } }

  // Alertes filtrées (masquer les membres avec entretien planifié dans les 30j)
  const _todayStr = new Date().toISOString().slice(0, 10)
  const _in30 = new Date(); _in30.setDate(_in30.getDate() + 30)
  const _in30Str = _in30.toISOString().slice(0, 10)
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
    membres: mb.membres, actifs: mb.actifs, presences: pr.presences,
    entretiens: en.entretiens, defis: df.defis, plans: pt.plans,
    alertes: alertesFiltrees, refs: rf.refs, h,
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
    <Layout page={page} setPage={setPage} alertCount={0} membreCount={0} selectedMembre={null} auth={auth}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#6b7280', fontSize: 13 }}>Chargement des données...</div>
    </Layout>
  )

  let content
  switch (page) {
    case 'home': content = <HomePage {...ctx} setPage={setPage} />; break
    case 'pres': content = <PresencesPage {...ctx} />; break
    case 'ames': content = <AmesPage {...ctx} setPage={setPage} />; break
    case 'fiche': content = <FichePage {...ctx} setPage={setPage} />; break
    case 'alerts': content = <AlertesPage {...ctx} />; break
    case 'ents': content = <EntretiensPage {...ctx} />; break
    case 'protos': content = <CroissancePage {...ctx} />; break
    case 'timeline': content = <HistoriquePage {...ctx} />; break
    case 'filia': content = <FiliationPage {...ctx} />; break
    case 'export': content = <ExportPage {...ctx} />; break
    case 'vueEglise': content = (auth.isBergerEglise || auth.isAdmin) ? <VueEglisePage auth={auth} refs={rf.refs} h={h} /> : null; break
    case 'params': content = auth.isAdmin ? <ParamsPage {...ctx} /> : null; break
    case 'menu': content = <MenuMobile setPage={setPage} isAdmin={auth.isAdmin} selectedMembre={selectedMembre} auth={auth} />; break
    default: content = <HomePage {...ctx} setPage={setPage} />
  }

  return (
    <Layout page={page} setPage={setPage} alertCount={alertesFiltrees.length} membreCount={mb.actifs.length} selectedMembre={selectedMembre} auth={auth}>
      {content}
      <Toast message={toast} />
    </Layout>
  )
}
