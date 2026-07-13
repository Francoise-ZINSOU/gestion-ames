// ── Styles partagés ──
export const S = {
  pill: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 10,
    fontSize: 10, fontWeight: 600, background: color + '18', color, whiteSpace: 'nowrap', marginRight: 2
  }),
  card: {
    background: '#fff', border: '1px solid #e0e4ec', borderRadius: 10,
    padding: '16px 18px', marginBottom: 12
  },
  th: {
    textAlign: 'left', padding: '6px 8px', fontSize: 9, fontWeight: 600,
    letterSpacing: 1, textTransform: 'uppercase', color: '#8892a8',
    borderBottom: '2px solid #e0e4ec', background: '#f0f2f6'
  },
  td: { padding: '7px 8px', borderBottom: '1px solid #e0e4ec', fontSize: 12 },
  inp: {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: '1px solid #c8cfe0', background: '#f0f2f6', color: '#1a1e2e',
    fontFamily: 'inherit', fontSize: 12, outline: 'none'
  },
  label: {
    display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: 1,
    textTransform: 'uppercase', color: '#5a6480', marginBottom: 3
  },
  btn: (c, outline) => ({
    padding: '7px 14px', borderRadius: 7,
    border: outline ? '1px solid ' + c : 'none',
    background: outline ? 'transparent' : c,
    color: outline ? c : '#fff',
    fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer'
  }),
  kpi: (c) => ({
    background: '#fff', border: '1px solid #e0e4ec', borderRadius: 10,
    padding: '14px 16px', flex: '1 1 130px', minWidth: 120,
    borderBottom: '3px solid ' + c
  }),
}

// ── Formatage dates ──
export function fmt(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
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

export function today() { return new Date().toISOString().slice(0, 10) }

// ── Validation ──
export const validEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
export const validTel = (t) => !t || /^[+\d\s()-]{6,}$/.test(t)

// ── Couleur par statut ──
export function getStatutColor(refs, statut) {
  const found = (refs.statuts || []).find(s => s.nom === statut)
  return found?.couleur || '#8892a8'
}

export function getRoleColor(refs, role) {
  const found = (refs.roles || []).find(r => r.nom === role)
  return found?.couleur || '#8892a8'
}

// ── Toast ──
export function Toast({ message }) {
  if (!message) return null
  const isError = message.startsWith('⚠')
  return (
    <div style={{
      position: 'fixed', top: 12, right: 12, padding: '10px 18px', borderRadius: 8,
      background: isError ? '#e03050' : '#1a9c60', color: '#fff', fontSize: 13,
      fontWeight: 600, zIndex: 999, boxShadow: '0 4px 12px rgba(0,0,0,.15)'
    }}>{message}</div>
  )
}

// ── Hook toast ──
import { useState, useCallback } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const show = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }, [])
  return { toast: msg, showToast: show }
}
