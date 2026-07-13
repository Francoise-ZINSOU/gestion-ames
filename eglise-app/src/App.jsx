import { useState } from 'react'
import { useAuth } from './lib/auth'
import { useMembres, usePresences, useEntretiens, useDefis, usePlanCroissance, useAlertes, useRefs } from './lib/data'
import { Toast, useToast, today } from './lib/ui'
import LoginPage from './pages/Login'
import AccessDenied from './pages/AccessDenied'
import Layout from './components/Layout'

// Pages (chargées directement pour simplifier le build)
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

  // Auth states
  if (auth.loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Trebuchet MS, sans-serif' }}>
      <div style={{ color: '#5a6480', fontSize: 14 }}>Chargement...</div>
    </div>
  )

  if (!auth.session) return <LoginPage />
  if (!auth.isResponsable) return <AccessDenied />

  // Data hooks (only loaded when authenticated + authorized)
  return <AuthorizedApp auth={auth} toast={toast} showToast={showToast} page={page} setPage={setPage} selectedId={selectedId} setSelectedId={setSelectedId} />
}

function AuthorizedApp({ auth, toast, showToast, page, setPage, selectedId, setSelectedId }) {
  const { membres, actifs, reload: reloadMembres } = useMembres()
  const { presences, sauver: sauverPresences, supprimerDate, reload: reloadPresences } = usePresences()
  const { entretiens, ajouter: ajouterEnt, modifier: modifierEnt, supprimer: supprimerEnt } = useEntretiens()
  const { defis, ajouter: ajouterDefi, modifier: modifierDefi } = useDefis()
  const { plans, assigner: assignerModule, valider: validerModule, retirer: retirerModule } = usePlanCroissance()
  const { alertes } = useAlertes()
  const { refs } = useRefs()

  const openFiche = (id) => { setSelectedId(id); setPage('fiche') }
  const selectedMembre = membres.find(m => m.id === selectedId) || null

  // Context passé à toutes les pages
  const ctx = {
    membres, actifs, presences, entretiens, defis, plans, alertes, refs,
    openFiche, showToast, selectedMembre, selectedId,
    // CRUD wrappers avec toast
    sauverPresences: async (aid, date, ids) => { try { await sauverPresences(aid, date, ids); showToast('✓ Présences enregistrées') } catch (e) { showToast('⚠ ' + e.message) } },
    supprimerDate: async (aid, date) => { try { await supprimerDate(aid, date); showToast('✓ Date supprimée') } catch (e) { showToast('⚠ ' + e.message) } },
    ajouterEnt: async (ent) => { try { await ajouterEnt(ent); showToast('✓ Entretien ajouté') } catch (e) { showToast('⚠ ' + e.message) } },
    modifierEnt: async (id, u) => { try { await modifierEnt(id, u); showToast('✓ Entretien modifié') } catch (e) { showToast('⚠ ' + e.message) } },
    supprimerEnt: async (id) => { try { await supprimerEnt(id); showToast('✓ Entretien supprimé') } catch (e) { showToast('⚠ ' + e.message) } },
    ajouterDefi: async (d) => { try { await ajouterDefi(d); showToast('✓ Défi ajouté') } catch (e) { showToast('⚠ ' + e.message) } },
    modifierDefi: async (id, u) => { try { await modifierDefi(id, u); showToast('✓ Défi mis à jour') } catch (e) { showToast('⚠ ' + e.message) } },
    assignerModule: async (mid, modId) => { try { await assignerModule(mid, modId); showToast('✓ Module assigné') } catch (e) { showToast('⚠ ' + e.message) } },
    validerModule: async (id, v) => { try { await validerModule(id, v) } catch (e) { showToast('⚠ ' + e.message) } },
    retirerModule: async (id) => { try { await retirerModule(id) } catch (e) { showToast('⚠ ' + e.message) } },
    reloadMembres,
    reloadPresences,
    auth,
  }

  let content
  switch (page) {
    case 'home': content = <HomePage {...ctx} />; break
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
    case 'menu': content = <MenuMobile setPage={setPage} isAdmin={auth.isAdmin} />; break
    default: content = <HomePage {...ctx} />
  }

  return (
    <Layout page={page} setPage={setPage} alertCount={alertes.length} membreCount={actifs.length} selectedMembre={selectedMembre}>
      {content}
      <Toast message={toast} />
    </Layout>
  )
}
