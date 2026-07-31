/**
 * CRASH TESTS — rend chaque page dans plusieurs scénarios de données
 * (vide / peuplé / valeurs nulles / archivés) avec Supabase et Auth mockés.
 * But : détecter les ReferenceError, accès à null, TDZ, props manquantes,
 * comme les crashs déjà trouvés (Croissance `actifs`, Ames `taux`).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, fireEvent, cleanup } from '@testing-library/react'

// ── Mock Supabase : builder chaînable, awaitable -> { data: [], error: null } ──
vi.mock('../lib/supabase', () => {
  const makeQuery = () => {
    const q = {}
    const chain = ['select','insert','update','delete','upsert','eq','neq','in','not','or',
      'gte','lte','gt','lt','order','limit','range','filter','is','match','contains','ilike','like']
    chain.forEach(m => { q[m] = () => q })
    q.single = () => Promise.resolve({ data: null, error: null })
    q.maybeSingle = () => Promise.resolve({ data: null, error: null })
    q.then = (resolve) => resolve({ data: [], error: null })
    return q
  }
  const channel = () => { const c = { on: () => c, subscribe: () => c, unsubscribe: () => {} }; return c }
  const supabase = {
    from: () => makeQuery(),
    rpc: () => Promise.resolve({ data: [], error: null }),
    channel,
    removeChannel: () => {},
    functions: { invoke: () => Promise.resolve({ data: {}, error: null }) },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ error: null }),
      signUp: () => Promise.resolve({ error: null }),
      signOut: () => Promise.resolve({}),
      updateUser: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }),
    },
  }
  return { supabase }
})

// ── Mock Auth (pour les pages qui appellent useAuth) ──
const fakeAuth = {
  session: { user: { id: 'u1' } },
  profil: { id: 'u1', est_admin: true, est_responsable: true, est_super_admin: false,
    est_berger_eglise: true, famille_id: 'f1', eglise_id: 'eg1', nom_affiche: 'Test', email: 'u@u.fr', membre_id: 'mb1' },
  loading: false, needsPassword: false,
  isAdmin: true, isResponsable: true, isSuperAdmin: false, isBergerEglise: true, isFamilleActive: true,
  login: async () => ({ error: null }), signup: async () => ({ error: null }), logout: () => {},
  clearNeedsPassword: () => {}, reloadProfil: () => {},
}
vi.mock('../lib/auth', () => ({
  useAuth: () => fakeAuth,
  AuthProvider: ({ children }) => children,
}))

import { refHelpers } from '../lib/data'

// ── Pages ──
import Home from '../pages/Home'
import Presences from '../pages/Presences'
import Ames from '../pages/Ames'
import Fiche from '../pages/Fiche'
import Alertes from '../pages/Alertes'
import EntretiensGlobal from '../pages/EntretiensGlobal'
import Croissance from '../pages/Croissance'
import Historique from '../pages/Historique'
import Filiation from '../pages/Filiation'
import Export from '../pages/Export'
import Rapport from '../pages/Rapport'
import CGU from '../pages/CGU'
import Params from '../pages/Params'
import VueEglise from '../pages/VueEglise'
import SetPassword from '../pages/SetPassword'
import MenuMobile from '../pages/MenuMobile'
import Login from '../pages/Login'
import AccessDenied from '../pages/AccessDenied'
import NoFamille from '../pages/NoFamille'
import Layout from '../components/Layout'

// ── Jeux de données par scénario ──
const REFS = {
  statuts: [
    { id: 's1', nom: 'Nouveau', ordre: 1, couleur: '#2E7D8A', actif: true },
    { id: 's2', nom: 'Archivé', ordre: 9, couleur: '#8A9B9E', actif: true },
  ],
  roles: [
    { id: 'r0', nom: 'Chef de famille', niveau: 0, peut_suivre: true, couleur: '#2E7D8A', actif: true },
    { id: 'r1', nom: 'Membre', niveau: 5, peut_suivre: false, couleur: '#8A9B9E', actif: true },
    { id: 'r2', nom: 'Pilier', niveau: 2, peut_suivre: true, couleur: '#7040d0', actif: true },
  ],
  activites: [{ id: 'a1', nom: 'Culte', code: 'culte', couleur: '#2E7D8A', icone: '⛪', actif: true, jour_semaine: 0 }],
  modules: [{ id: 'm1', nom: 'Fondations', actif: true, ordre: 1, url: '' }],
  sujetsEntretien: [{ id: 'su1', nom: 'Suivi', actif: true }],
  typesDefi: [{ id: 't1', nom: 'Spirituel', actif: true }],
  statutsDefi: [
    { id: 'sd1', nom: 'Identifié', ordre: 1, est_final: false, actif: true },
    { id: 'sd2', nom: 'Résolu', ordre: 2, est_final: true, actif: true },
  ],
  statutsEntretien: [
    { id: 'se1', nom: 'Planifié', ordre: 1, actif: true },
    { id: 'se2', nom: 'Réalisé', ordre: 2, actif: true },
  ],
  motifsDepart: [{ id: 'md1', nom: 'Déménagement', actif: true }],
}
const REFS_EMPTY = { statuts: [], roles: [], activites: [], modules: [], sujetsEntretien: [],
  typesDefi: [], statutsDefi: [], statutsEntretien: [], motifsDepart: [] }

const MEMBRES = [
  { id: 'mb1', prenom: 'A', nom: 'AA', role: 'Membre', statut: 'Nouveau', archive: false,
    date_inscription: '2025-01-01', suivi_par: 'mb2', telephone: '0102030405', email: 'a@a.fr', famille_id: 'f1' },
  { id: 'mb2', prenom: 'B', nom: 'BB', role: 'Chef de famille', statut: 'Nouveau', archive: false,
    date_inscription: '2024-06-01', suivi_par: null, telephone: null, email: null, famille_id: 'f1' },
]
const MEMBRES_ARCHIVED = [{ ...MEMBRES[0], archive: true, statut: 'Archivé' }, MEMBRES[1]]
const MEMBRES_NULLS = [{ id: 'mb9', nom: 'ZZ' }]  // prenom/role/statut/dates undefined

const PRES = [{ id: 'p1', membre_id: 'mb1', activite_id: 'a1', date_presence: '2025-06-01', present: true, eligible: true, famille_id: 'f1' }]
const ENTS = [{ id: 'e1', membre_id: 'mb1', date_entretien: '2025-06-01', statut: 'Réalisé', avec_qui: 'mb2', sujet_id: 'su1', commentaires: 'x', famille_id: 'f1' }]
const DEFIS = [{ id: 'd1', membre_id: 'mb1', type_defi: 'Spirituel', statut: 'Identifié', description: 'x', famille_id: 'f1' }]
const PLANS = [{ id: 'pc1', membre_id: 'mb1', module_id: 'm1', defi_id: null, valide: false }]
const ALERTES = [{ membre_id: 'mb1', absences: 3, defis_ouverts: 1, nom: 'AA', prenom: 'A' }]
const DATES_ANN = [{ id: 'da1', activite_id: 'a1', date_annulee: '2025-05-01', motif: 'Férié' }]

const noop = () => {}
const asyncNoop = async () => {}

function makeCtx(scn) {
  const membres = scn === 'empty' ? []
    : scn === 'archived' ? MEMBRES_ARCHIVED
    : scn === 'nulls' ? MEMBRES_NULLS
    : MEMBRES
  const refs = scn === 'empty' ? REFS_EMPTY : REFS
  const has = scn !== 'empty'
  const actifs = membres.filter(m => !m.archive)
  const ctx = {
    membres, actifs,
    presences: has ? PRES : [], entretiens: has ? ENTS : [], defis: has ? DEFIS : [],
    plans: has ? PLANS : [], alertes: has ? ALERTES : [], datesAnnulees: has ? DATES_ANN : [],
    refs, h: refHelpers(refs),
    selectedId: membres[0]?.id || null, selectedMembre: membres[0] || null,
    prevPage: 'ames', auth: fakeAuth,
    openFiche: noop, showToast: noop, setPage: noop, reloadMembres: noop, reloadRefs: noop,
    ajouterMembre: asyncNoop, modifierMembre: asyncNoop, archiverMembre: asyncNoop, importerCSV: asyncNoop,
    enregistrerPresences: asyncNoop, supprimerDate: asyncNoop,
    ajouterEnt: asyncNoop, modifierEnt: asyncNoop, supprimerEnt: asyncNoop,
    ajouterDefi: asyncNoop, modifierDefi: asyncNoop, supprimerDefi: asyncNoop,
    assignerModule: asyncNoop, validerModule: asyncNoop, retirerModule: asyncNoop,
    ajouterDateAnnulee: asyncNoop, supprimerDateAnnulee: asyncNoop,
  }
  return ctx
}

// Config des pages : comment les monter à partir du ctx
const PAGES = [
  ['Home', Home, c => ({ ...c })],
  ['Presences', Presences, c => ({ ...c })],
  ['Ames', Ames, c => ({ ...c })],
  ['Fiche', Fiche, c => ({ ...c })],
  ['Alertes', Alertes, c => ({ ...c })],
  ['EntretiensGlobal', EntretiensGlobal, c => ({ ...c })],
  ['Croissance', Croissance, c => ({ ...c })],
  ['Historique', Historique, c => ({ ...c })],
  ['Filiation', Filiation, c => ({ ...c })],
  ['Export', Export, c => ({ ...c })],
  ['Rapport', Rapport, c => ({ ...c })],
  ['CGU', CGU, () => ({})],
  ['Params', Params, c => ({ ...c })],
  ['VueEglise', VueEglise, c => ({ auth: c.auth, refs: c.refs, h: c.h })],
  ['MenuMobile', MenuMobile, c => ({ setPage: noop, isAdmin: true, selectedMembre: c.selectedMembre, auth: c.auth })],
  ['SetPassword', SetPassword, c => ({ profil: c.auth.profil, onDone: noop })],
  ['Login', Login, () => ({})],
  ['AccessDenied', AccessDenied, () => ({})],
  ['NoFamille', NoFamille, () => ({})],
  ['Layout', Layout, c => ({ page: 'home', setPage: noop, alertCount: 1, membreCount: c.actifs.length,
    selectedMembre: c.selectedMembre, auth: c.auth, actifs: c.actifs, onOpenFiche: noop, children: React.createElement('div') })],
]

const SCENARIOS = ['empty', 'populated', 'nulls', 'archived']

async function renderPage(Comp, props) {
  let container
  await act(async () => {
    const r = render(React.createElement(Comp, props))
    container = r.container
    await Promise.resolve(); await Promise.resolve()  // flush effects/microtasks
  })
  return container
}

// Capte aussi les erreurs remontées de façon asynchrone (effets)
let asyncErrors = []
const onErr = (e) => { asyncErrors.push(e.error || e.reason || e) }
beforeEach(() => { asyncErrors = []; window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr) })
afterEach(() => { window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr); cleanup() })

describe('Crash tests — rendu de toutes les pages × scénarios', () => {
  for (const [name, Comp, mk] of PAGES) {
    for (const scn of SCENARIOS) {
      it(`${name} — scénario "${scn}"`, async () => {
        const ctx = makeCtx(scn)
        await renderPage(Comp, mk(ctx))
        expect(asyncErrors, `erreur asynchrone dans ${name}/${scn}: ${asyncErrors[0]?.message || asyncErrors[0]}`).toHaveLength(0)
      })
    }
  }
})

describe('Crash tests — interactions de tri (chemin taux/TDZ)', () => {
  it('Ames — clic sur tous les en-têtes de tri ne crashe pas', async () => {
    const ctx = makeCtx('populated')
    const container = await renderPage(Ames, ctx)
    const clickables = [...container.querySelectorAll('th'), ...container.querySelectorAll('[role="button"]')]
    for (const el of clickables) {
      await act(async () => { fireEvent.click(el); await Promise.resolve() })
    }
    expect(asyncErrors, asyncErrors[0]?.message).toHaveLength(0)
  })
})
