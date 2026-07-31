// ── Palette « bleu-canard & sable » (pastorale, chaleureuse) ──
// Couleur d'identité : bleu-canard / sarcelle. Secondaire : ambre chaud.
// Un seul point de vérité — modifier ici se propage partout.
export const C = {
  primary: '#2E7D8A',      // bleu-canard (identité : nav, liens, actions)
  primaryDark: '#256470',  // canard foncé (texte sur fond clair)
  primarySoft: '#E4F0F1',  // canard très pâle (fonds de pills, badges)
  accent: '#C68A3E',       // ambre chaud (accent, moments positifs)
  accentSoft: '#F6ECDC',
  success: '#4E8D6E',      // vert d'eau (positif, présent)
  successSoft: '#E5F0EA',
  attention: '#C68A3E',    // « à accompagner » = ambre, pas rouge
  attentionSoft: '#F6ECDC',
  danger: '#C25A4A',       // corail-rouge doux (rare : suppression, erreur réelle)
  dangerSoft: '#F6E4E0',
  page: '#F5F3EE',         // fond crème doux
  surface: '#fff',
  text: '#2B3A3D',         // gris-canard profond (texte)
  sub: '#5E7175',          // gris-canard moyen (sous-texte)
  meta: '#8A9B9E',         // méta
  border: '#DCE6E5',       // bordure canard pâle
  borderInput: '#C3D4D3',
  fieldBg: '#F5F8F7',
  shadow: '0 1px 3px rgba(40,70,75,.06), 0 4px 12px rgba(40,70,75,.05)',
}

// ── Styles partagés ──
export const S = {
  pill: (color) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 12,
    fontSize: 12, fontWeight: 500, background: color + '1c', color, whiteSpace: 'nowrap', marginRight: 2
  }),
  card: {
    background: C.surface, border: 'none', borderRadius: 14,
    boxShadow: C.shadow, padding: '16px 20px', marginBottom: 12
  },
  th: {
    textAlign: 'left', padding: '7px 8px', fontSize: 12, fontWeight: 500,
    color: C.sub, borderBottom: '1px solid ' + C.border, background: C.page
  },
  td: { padding: '8px', borderBottom: '1px solid ' + C.border, fontSize: 13, color: C.text },
  inp: {
    width: '100%', padding: '8px 11px', borderRadius: 8,
    border: '1px solid ' + C.borderInput, background: C.fieldBg, color: C.text,
    fontFamily: 'inherit', fontSize: 13, outline: '2px solid transparent', outlineOffset: '2px',
    boxSizing: 'border-box'
  },
  label: {
    display: 'block', fontSize: 12, fontWeight: 500,
    color: C.sub, marginBottom: 4
  },
  btn: (c, outline) => ({
    padding: '8px 15px', borderRadius: 9,
    border: outline ? '1px solid ' + c : 'none',
    background: outline ? 'transparent' : c,
    color: outline ? c : '#fff',
    fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'opacity 0.15s'
  }),
  kpi: (c) => ({
    background: C.surface, border: 'none', borderRadius: 14, boxShadow: C.shadow,
    padding: '16px 18px', flex: '1 1 130px', minWidth: 120,
    borderTop: '3px solid ' + c
  }),
}

// ── Formatage dates ──
export function fmt(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

export function fmtS(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) }
  catch { return '—' }
}

export function dago(d) {
  if (!d) return null
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5))
}

export function dagoLabel(d) {
  const n = dago(d)
  if (n === null) return '—'
  if (n === 0) return "Aujourd'hui"
  if (n === 1) return 'Hier'
  if (n < 30) return n + 'j'
  if (n < 365) return Math.floor(n / 30) + ' mois'
  const y = Math.floor(n / 365)
  const m = Math.floor((n % 365) / 30)
  return y + ' an' + (y > 1 ? 's' : '') + (m > 0 ? ' ' + m + 'm' : '')
}

// Retourne YYYY-MM-DD en local (évite le bug UTC de toISOString)
// Retourne un Set des dates annulées pour une activité donnée
// Pluralisation intelligente : plural(3, 'défi', 'défis') → "3 défis"
export const plural = (n, singular, pluralWord) => n + ' ' + (n <= 1 ? singular : (pluralWord || singular + 's'))

export const cancelledDatesFor = (datesAnnulees, activiteId) =>
  new Set((datesAnnulees || []).filter(d => d.activite_id === activiteId).map(d => d.date_annulee))

export const toLocalDate = (d) => {
  const y = d.getFullYear()
  const m = ('0' + (d.getMonth() + 1)).slice(-2)
  const day = ('0' + d.getDate()).slice(-2)
  return y + '-' + m + '-' + day
}

export function today() { return toLocalDate(new Date()) }

// ── Validation ──
export const validEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
export const validTel = (t) => !t || /^[+\d\s()-]{6,}$/.test(t)

// ── Couleur par statut ──
export function getStatutColor(refs, statut) {
  const found = (refs.statuts || []).find(s => s.nom === statut)
  return found?.couleur || C.meta
}

export function getRoleColor(refs, role) {
  const found = (refs.roles || []).find(r => r.nom === role)
  return found?.couleur || C.meta
}

// ── Toast ──
export function Toast({ message }) {
  if (!message) return null
  const isError = message.startsWith('⚠')
  return (
    <div className="toast-msg" style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      padding: '10px 18px', borderRadius: 8, maxWidth: 'calc(100vw - 32px)',
      background: isError ? C.danger : C.success, color: '#fff', fontSize: 14,
      fontWeight: 600, zIndex: 999, boxShadow: '0 4px 12px rgba(0,0,0,.15)'
    }}>{message}</div>
  )
}

// ── Hook toast ──
import { useState, useCallback } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const show = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(''), 3500) }, [])
  return { toast: msg, showToast: show }
}


// Skeleton loader
export function Skeleton({ width, height, style }) {
  return <div className="skeleton" style={{ width: width || '100%', height: height || 16, ...style }} />
}

export function SkeletonCard() {
  return (
    <div style={{ padding: 16, background: C.surface, borderRadius: 12, border: '1px solid ' + C.border }}>
      <Skeleton height={12} width="40%" style={{ marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <Skeleton height={60} width="25%" />
        <Skeleton height={60} width="25%" />
        <Skeleton height={60} width="25%" />
        <Skeleton height={60} width="25%" />
      </div>
      <Skeleton height={12} width="60%" style={{ marginBottom: 6 }} />
      <Skeleton height={12} width="80%" style={{ marginBottom: 6 }} />
      <Skeleton height={12} width="50%" />
    </div>
  )
}
