import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const today = () => new Date().toISOString().slice(0, 10)

// ── Hook générique : charger une table ──
export function useTable(table, options = {}) {
  const { orderBy = 'ordre', filter, enabled = true } = options
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    if (!enabled) return
    let q = supabase.from(table).select('*')
    if (filter) Object.entries(filter).forEach(([k, v]) => { q = q.eq(k, v) })
    if (orderBy) q = q.order(orderBy)
    const { data: rows } = await q
    setData(rows || []); setLoading(false)
  }, [table, enabled, JSON.stringify(filter)])
  useEffect(() => { load() }, [load])
  return { data, loading, reload: load }
}

// ── Membres ──
export function useMembres() {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('membres').select('*').order('nom')
    setMembres(data || []); setLoading(false)
  }, [])
  useEffect(() => {
    load()
    const channel = supabase.channel('membres-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'membres' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])
  const actifs = membres.filter(m => !m.archive)
  const archives = membres.filter(m => m.archive)

  const ajouter = async (data) => {
    const { data: inserted, error } = await supabase.from('membres').insert(data).select('id').single()
    if (error) throw error
    await load()
    return inserted
  }
  const modifier = async (id, updates) => {
    const { error } = await supabase.from('membres').update(updates).eq('id', id)
    if (error) throw error
    await load()
  }
  const archiver = async (id) => {
    const { error } = await supabase.from('membres').update({ archive: true, statut: 'Archivé', date_archivage: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    await load()
  }
  const importerCSV = async (rows) => {
    const { error } = await supabase.from('membres').insert(rows)
    if (error) throw error
    await load()
  }

  return { membres, actifs, archives, loading, reload: load, ajouter, modifier, archiver, importerCSV }
}

// ── Présences ──
export function usePresences() {
  const [presences, setPresences] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('presences').select('*')
    setPresences(data || []); setLoading(false)
  }, [])
  useEffect(() => {
    load()
    const channel = supabase.channel('presences-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presences' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])
  const sauver = async (activiteId, date, presentsIds) => {
    const { error } = await supabase.rpc('sauver_presences', { p_activite_id: activiteId, p_date: date, p_presents: presentsIds })
    if (error) throw error; await load()
  }
  const supprimerDate = async (activiteId, date) => {
    const { error } = await supabase.rpc('supprimer_presences_date', { p_activite_id: activiteId, p_date: date })
    if (error) throw error; await load()
  }
  return { presences, loading, sauver, supprimerDate, reload: load }
}

// ── Entretiens (+ realtime) ──
export function useEntretiens() {
  const [entretiens, setEntretiens] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('entretiens').select('*').order('date_entretien', { ascending: false })
    setEntretiens(data || []); setLoading(false)
  }, [])
  useEffect(() => {
    load()
    const channel = supabase.channel('entretiens-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entretiens' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])
  const ajouter = async (entretien) => { const { error } = await supabase.from('entretiens').insert(entretien); if (error) throw error; await load() }
  const modifier = async (id, updates) => { const { error } = await supabase.from('entretiens').update(updates).eq('id', id); if (error) throw error; await load() }
  const supprimer = async (id) => { const { error } = await supabase.from('entretiens').delete().eq('id', id); if (error) throw error; await load() }
  return { entretiens, loading, ajouter, modifier, supprimer, reload: load }
}

// ── Défis (+ realtime) ──
export function useDefis() {
  const [defis, setDefis] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('defis').select('*')
    setDefis(data || []); setLoading(false)
  }, [])
  useEffect(() => {
    load()
    const channel = supabase.channel('defis-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'defis' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])
  const ajouter = async (defi) => { const { error } = await supabase.from('defis').insert(defi); if (error) throw error; await load() }
  const modifier = async (id, updates) => { const { error } = await supabase.from('defis').update(updates).eq('id', id); if (error) throw error; await load() }
  const supprimer = async (id) => { const { error } = await supabase.from('defis').delete().eq('id', id); if (error) throw error; await load() }
  return { defis, loading, ajouter, modifier, supprimer, reload: load }
}

// ── Plan de croissance (+ realtime) ──
export function usePlanCroissance() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('plan_croissance').select('*')
    setPlans(data || []); setLoading(false)
  }, [])
  useEffect(() => {
    load()
    const channel = supabase.channel('plan-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_croissance' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])
  const assigner = async (membreId, moduleId, defiId) => {
    const { error } = await supabase.from('plan_croissance').insert({ membre_id: membreId, module_id: moduleId, defi_id: defiId || null })
    if (error) throw error; await load()
  }
  const valider = async (id, valide) => {
    const { error } = await supabase.from('plan_croissance').update({ valide, date_validation: valide ? today() : null }).eq('id', id)
    if (error) throw error; await load()
  }
  const retirer = async (id) => { const { error } = await supabase.from('plan_croissance').delete().eq('id', id); if (error) throw error; await load() }
  return { plans, loading, assigner, valider, retirer, reload: load }
}

// ── Alertes ──
export function useAlertes() {
  const [alertes, setAlertes] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('v_alertes').select('*')
    setAlertes(data || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  return { alertes, loading, reload: load }
}

export function useStatsResponsable() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('v_stats_responsable').select('*')
    setStats(data || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  return { stats, loading, reload: load }
}

// ── Tables de référence ──
export function useRefs() {
  const [refs, setRefs] = useState({
    statuts: [], roles: [], activites: [], modules: [],
    sujetsEntretien: [], typesDefi: [], statutsDefi: [],
    statutsEntretien: [], motifsDepart: []
  })
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const [statuts, roles, activites, modules, sujets, typesD, statutsD, statutsE, motifs] = await Promise.all([
      supabase.from('ref_statuts').select('*').eq('actif', true).order('ordre'),
      supabase.from('ref_roles').select('*').eq('actif', true).order('ordre'),
      supabase.from('activites').select('*').eq('actif', true).order('ordre'),
      supabase.from('modules').select('*').eq('actif', true).order('ordre'),
      supabase.from('sujets_entretien').select('*').eq('actif', true).order('ordre'),
      supabase.from('ref_types_defi').select('*').eq('actif', true).order('ordre'),
      supabase.from('ref_statuts_defi').select('*').eq('actif', true).order('ordre'),
      supabase.from('ref_statuts_entretien').select('*').eq('actif', true).order('ordre'),
      supabase.from('ref_motifs_depart').select('*').eq('actif', true).order('ordre'),
    ])
    setRefs({
      statuts: statuts.data || [], roles: roles.data || [], activites: activites.data || [],
      modules: modules.data || [], sujetsEntretien: sujets.data || [], typesDefi: typesD.data || [],
      statutsDefi: statutsD.data || [], statutsEntretien: statutsE.data || [], motifsDepart: motifs.data || [],
    })
    setLoading(false)
  }, [])
  useEffect(() => {
    load()
    const channel = supabase.channel('refs-activites-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activites' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])
  return { refs, loading, reload: load }
}

// ── Admin : CRUD tables de référence ──
export function useRefAdmin(table) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from(table).select('*').order('ordre')
    setRows(data || []); setLoading(false)
  }, [table])
  useEffect(() => { load() }, [load])
  const ajouter = async (row) => {
    const maxOrdre = rows.length ? Math.max(...rows.map(r => r.ordre || 0)) + 1 : 1
    const { error } = await supabase.from(table).insert({ ...row, ordre: maxOrdre })
    if (error) throw error; await load()
  }
  const modifier = async (id, updates) => { const { error } = await supabase.from(table).update(updates).eq('id', id); if (error) throw error; await load() }
  const desactiver = async (id, actif) => { const { error } = await supabase.from(table).update({ actif }).eq('id', id); if (error) throw error; await load() }
  return { rows, loading, ajouter, modifier, desactiver, reload: load }
}

// ── Admin : profils utilisateurs ──
export function useProfils() {
  const [profils, setProfils] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('profils').select('*').order('created_at')
    setProfils(data || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  const setRole = async (id, estResponsable, estAdmin) => {
    const { error } = await supabase.from('profils').update({ est_responsable: estResponsable, est_admin: estAdmin }).eq('id', id)
    if (error) throw error; await load()
  }
  return { profils, loading, setRole, reload: load }
}

// ── Historique des statuts ──
export function useHistoriqueStatuts(membreId) {
  const [hist, setHist] = useState([])
  const load = useCallback(async () => {
    if (!membreId) return
    const { data } = await supabase.from('historique_statuts').select('*').eq('membre_id', membreId).order('date_changement', { ascending: false })
    setHist(data || [])
  }, [membreId])
  useEffect(() => { load() }, [load])
  return { hist, reload: load }
}

// ── Reset toutes les données ──
export async function resetAllData() {
  await supabase.from('plan_croissance').delete().gte('created_at', '1970-01-01')
  await supabase.from('defis').delete().gte('created_at', '1970-01-01')
  await supabase.from('entretiens').delete().gte('created_at', '1970-01-01')
  await supabase.from('presences').delete().gte('created_at', '1970-01-01')
  await supabase.from('membres').delete().gte('created_at', '1970-01-01')
}

// ── Helpers pour lookups dynamiques ──
export function refHelpers(refs) {
  const bergerRole = (refs.roles || []).find(r => r.niveau === 0)
  const defaultStatut = (refs.statuts || []).find(s => s.ordre === 1) || refs.statuts?.[0]
  const defaultRole = (refs.roles || []).find(r => !r.peut_suivre) || (refs.roles || []).slice(-1)[0]
  const culteActivite = (refs.activites || []).find(a => a.code === 'culte')
  const statutFinalDefi = (refs.statutsDefi || []).find(s => s.est_final)
  const defaultStatutDefi = (refs.statutsDefi || []).find(s => s.ordre === 1) || refs.statutsDefi?.[0]
  const defaultStatutEnt = (refs.statutsEntretien || []).find(s => s.ordre === 1) || refs.statutsEntretien?.[0]
  const pilierRoles = (refs.roles || []).filter(r => r.peut_suivre && r.niveau !== 0)
  return {
    // Rôles
    bergerRoleName: bergerRole?.nom || 'Berger principal',
    isBergerRole: (role) => !!bergerRole && role === bergerRole.nom,
    defaultRole: defaultRole?.nom || 'Membre',
    isPilierRole: (role) => pilierRoles.some(r => r.nom === role),
    canFollow: (role) => (refs.roles || []).find(r => r.nom === role)?.peut_suivre,
    roleNiveau: (role) => (refs.roles || []).find(r => r.nom === role)?.niveau ?? 99,
    // Statuts membres
    defaultStatut: defaultStatut?.nom || 'Nouveau',
    statutByOrdre: (ordre) => (refs.statuts || []).find(s => s.ordre === ordre)?.nom,
    // Activités
    culteId: culteActivite?.id,
    // Défis
    statutFinalDefi: statutFinalDefi?.nom || 'Résolu',
    isStatutFinal: (statut) => statut === statutFinalDefi?.nom,
    defaultStatutDefi: defaultStatutDefi?.nom || 'Identifié',
    // Entretiens
    defaultStatutEnt: defaultStatutEnt?.nom || 'Réalisé',
  }
}

// ── Dates annulées ──
export function useDatesAnnulees() {
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('dates_annulees').select('*').order('date_annulee', { ascending: false })
    setDates(data || []); setLoading(false)
  }, [])
  useEffect(() => {
    load()
    const channel = supabase.channel('dates-annulees-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dates_annulees' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])
  const ajouter = async (activiteId, dateAnnulee, motif) => {
    const { data, error } = await supabase.from('dates_annulees').insert({ activite_id: activiteId, date_annulee: dateAnnulee, motif: motif || null }).select()
    if (error) throw error
    if (!data || data.length === 0) throw new Error("Impossible d'annuler cette date. Vérifiez vos droits.")
    await load()
  }
  const supprimer = async (id) => {
    const { data, error } = await supabase.from('dates_annulees').delete().eq('id', id).select()
    if (error) throw error
    if (!data || data.length === 0) throw new Error("Impossible de rétablir cette date. Vérifiez vos droits.")
    await load()
  }
  return { dates, loading, ajouter, supprimer, reload: load }
}

// ── Journal pastoral ──
export function useJournal(membreId) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    if (!membreId) return
    const { data } = await supabase.from('journal_pastoral').select('*').eq('membre_id', membreId).order('date_note', { ascending: false })
    setNotes(data || []); setLoading(false)
  }, [membreId])
  useEffect(() => { load() }, [load])
  const ajouter = async (note) => {
    const { error } = await supabase.from('journal_pastoral').insert({ ...note, membre_id: membreId })
    if (error) throw error; await load()
  }
  const supprimer = async (id) => {
    const { error } = await supabase.from('journal_pastoral').delete().eq('id', id)
    if (error) throw error; await load()
  }
  return { notes, loading, ajouter, supprimer, reload: load }
}
