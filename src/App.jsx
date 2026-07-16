import { useState } from 'react'
import { useAuth } from './lib/auth'
import { useMembres, usePresences, useEntretiens, useDefis, usePlanCroissance, useAlertes, useRefs, refHelpers } from './lib/data'
import { Toast, useToast, today } from './lib/ui'
import LoginPage from './pages/Login'
import AccessDenied from './pages/AccessDenied'
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
import MenuMobile from './pages/MenuMobile'

export default function App() {
  const auth = useAuth()
  const { toast, showToast } = useToast()
  const [page, setPage] = useState('home')
  const [selectedId, setSelectedId] = useState(null)

  if (auth.loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Trebuchet MS, Gill Sans, Calibri, sans-serif' }}>
      <div style={{ color: '#5a6480', fontSize: 14 }}>Chargement...</div>
    </div>
  )
  if (!auth.session) return <LoginPage />
  if (!auth.isResponsable) return <AccessDenied />

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
  const h = refHelpers(rf.refs)

  const dataLoading = mb.loading || pr.loading || rf.loading

  const openFiche = (id) => { setSelectedId(id); setPage('fiche') }
  const selectedMembre = mb.membres.find(m => m.id === selectedId) || null

  // Wrappers avec toast
  const w = (fn, msg) => async (...args) => { try { const r = await fn(...args); showToast(msg); return r } catch (e) { showToast('⚠ ' + (e.message || 'Erreur inattendue')) } }

  const ctx = {
    membres: mb.membres, actifs: mb.actifs, presences: pr.presences,
    entretiens: en.entretiens, defis: df.defis, plans: pt.plans,
    alertes: al.alertes, refs: rf.refs, h,
    openFiche, showToast, selectedMembre, selectedId, auth,
    // Membres
    ajouterMembre: w(mb.ajouter, '✓ Membre ajouté'),
    modifierMembre: w(mb.modifier, '✓ Membre modifié'),
    archiverMembre: w(mb.archiver, '✓ Membre archivé'),
    importerCSV: w(mb.importerCSV, '✓ Import terminé'),
    reloadMembres: mb.reload,
    // Presences
    sauverPresences: w(pr.sauver, '✓ Présences enregistrées'),
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
  }

  if (dataLoading) return (
    <Layout page={page} setPage={setPage} alertCount={0} membreCount={0} selectedMembre={null}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#8892a8', fontSize: 13 }}>Chargement des données...</div>
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
    case 'params': content = auth.isAdmin ? <ParamsPage {...ctx} /> : null; break
    case 'menu': content = <MenuMobile setPage={setPage} isAdmin={auth.isAdmin} selectedMembre={selectedMembre} />; break
    default: content = <HomePage {...ctx} setPage={setPage} />
  }

  return (
    <Layout page={page} setPage={setPage} alertCount={al.alertes.length} membreCount={mb.actifs.length} selectedMembre={selectedMembre}>
      {content}
      <Toast message={toast} />
    </Layout>
  )
}
