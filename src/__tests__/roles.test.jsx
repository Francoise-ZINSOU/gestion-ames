/**
 * ROLE & TRANSITION TESTS — vérifie la logique des rôles et surtout les
 * TRANSITIONS (le "film", pas la "photo"). Motivé par le cas réel "Alfred" :
 * un responsable passé berger d'église garde sa famille héritée et doit
 * malgré tout être reconnu comme berger PUR (logique fondée sur les rôles,
 * pas sur famille_id).
 *
 * On reproduit ici les définitions dérivées de auth.jsx et les transitions
 * telles que Params.jsx les applique (cases Resp./Admin liées, Berger
 * indépendant). Si auth.jsx change, METTRE À JOUR derive() ci-dessous.
 */
import { describe, it, expect } from 'vitest'

// ── Reproduction fidèle des flags dérivés (auth.jsx) ──
function derive(profil) {
  return {
    isAdmin: profil?.est_admin === true,
    isResponsable: profil?.est_responsable === true || profil?.est_admin === true,
    isSuperAdmin: profil?.est_super_admin === true,
    isBergerEglise: profil?.est_berger_eglise === true,
    isBergerPur: profil?.est_berger_eglise === true
      && profil?.est_responsable !== true
      && profil?.est_admin !== true
      && profil?.est_super_admin !== true,
  }
}

// ── Transitions telles que l'interface (Params.jsx) les applique ──
// Les cases Resp. et Admin sont liées ; Berger est indépendant.
const setResponsable = (p, checked) => ({ ...p, est_responsable: checked, est_admin: checked ? p.est_admin : false })
const setAdmin = (p, checked) => ({ ...p, est_admin: checked, est_responsable: checked ? true : p.est_responsable })
const setBerger = (p, checked) => ({ ...p, est_berger_eglise: checked })

// ── Vue effective (menu principal) selon l'état ──
function vue(p) {
  const a = derive(p)
  if (!a.isResponsable && !a.isBergerEglise && !a.isSuperAdmin) return 'access-denied'
  if (a.isBergerPur) return 'berger-pur'
  if (a.isSuperAdmin) return 'super-admin'
  if (a.isBergerEglise && a.isResponsable) return 'berger-responsable'
  if (a.isAdmin) return 'admin'
  if (a.isResponsable) return 'responsable'
  return 'inconnu'
}

describe('Rôles — états figés', () => {
  it('responsable pur', () => expect(vue({ est_responsable: true, famille_id: 'F1' })).toBe('responsable'))
  it('admin implique responsable', () => expect(derive({ est_admin: true }).isResponsable).toBe(true))
  it('berger pur (sans famille)', () => expect(vue({ est_berger_eglise: true })).toBe('berger-pur'))
  it('berger + responsable = cumul', () => expect(vue({ est_berger_eglise: true, est_responsable: true, famille_id: 'F1' })).toBe('berger-responsable'))
  it('super-admin', () => expect(vue({ est_super_admin: true })).toBe('super-admin'))
  it('aucun rôle = access denied', () => expect(vue({ famille_id: 'F1' })).toBe('access-denied'))
})

describe('Rôles — le cas Alfred (berger avec famille héritée)', () => {
  it('un berger qui garde une famille héritée reste berger pur', () => {
    // Fondé sur les rôles, PAS sur famille_id
    expect(vue({ est_berger_eglise: true, famille_id: 'ROYAUTES', membre_id: 'm1' })).toBe('berger-pur')
  })
  it('isBergerPur ignore le famille_id résiduel', () => {
    expect(derive({ est_berger_eglise: true, famille_id: 'ROYAUTES' }).isBergerPur).toBe(true)
    expect(derive({ est_berger_eglise: true }).isBergerPur).toBe(true)
  })
})

describe('Rôles — transitions (le film, pas la photo)', () => {
  it('T1 Alfred : responsable+famille → coche berger, décoche responsable → berger pur', () => {
    let p = { est_responsable: true, famille_id: 'ROYAUTES', membre_id: 'm_alfred' }
    p = setBerger(p, true)
    p = setResponsable(p, false)
    expect(vue(p)).toBe('berger-pur')
    // La famille reste en base mais n'affecte pas le rôle
    expect(p.famille_id).toBe('ROYAUTES')
    expect(derive(p).isBergerPur).toBe(true)
  })

  it('T2 admin → responsable (décoche admin)', () => {
    let p = { est_admin: true, est_responsable: true, famille_id: 'F1' }
    p = setAdmin(p, false)
    expect(vue(p)).toBe('responsable')
  })

  it('T3 responsable → plus aucun rôle (décoche responsable) → access denied', () => {
    let p = { est_responsable: true, famille_id: 'F1' }
    p = setResponsable(p, false)
    expect(vue(p)).toBe('access-denied')
  })

  it('T4 berger pur → +responsable = cumul', () => {
    let p = { est_berger_eglise: true }
    p = setResponsable(p, true)
    expect(vue(p)).toBe('berger-responsable')
    expect(derive(p).isBergerPur).toBe(false)
  })

  it('T5 néant → coche admin → responsable suit automatiquement', () => {
    let p = {}
    p = setAdmin(p, true)
    expect(derive(p).isResponsable).toBe(true)
    expect(derive(p).isAdmin).toBe(true)
  })

  it('T6 berger+responsable → décoche responsable → devient berger pur', () => {
    let p = { est_berger_eglise: true, est_responsable: true, famille_id: 'F1' }
    p = setResponsable(p, false)
    expect(vue(p)).toBe('berger-pur')
  })

  it('T7 super-admin qu\'on rétrograde (décoche super-admin) sans autre rôle → access denied', () => {
    // Note : le retrait de est_super_admin passe par un autre contrôle (garde-fou
    // dernier super-admin) ; ici on teste juste l'état résultant côté rôles.
    let p = { est_super_admin: true }
    p = { ...p, est_super_admin: false }
    expect(vue(p)).toBe('access-denied')
  })
})
