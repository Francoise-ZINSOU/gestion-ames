import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ── Helpers ──
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
    setData(rows || [])
    setLoading(false)
  }, [table, enabled, JSON.stringify(filter)])

  useEffect(() => { load() }, [load])

  return { data, loading, reload: load }
}

// ── Membres (actifs) ──
export function useMembres() {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('membres')
      .select('*')
      .order('nom')
    setMembres(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    // Realtime
    const channel = supabase.channel('membres-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'membres' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const actifs = membres.filter(m => !m.archive)
  const archives = membres.filter(m => m.archive)

  return { membres, actifs, archives, loading, reload: load }
}

// ── Présences ──
export function usePresences() {
  const [presences, setPresences] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('presences').select('*')
    setPresences(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase.channel('presences-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presences' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const sauver = async (activiteId, date, presentsIds) => {
    const { error } = await supabase.rpc('sauver_presences', {
      p_activite_id: activiteId,
      p_date: date,
      p_presents: presentsIds
    })
    if (error) throw error
    await load()
  }

  const supprimerDate = async (activiteId, date) => {
    const { error } = await supabase.rpc('supprimer_presences_date', {
      p_activite_id: activiteId,
      p_date: date
    })
    if (error) throw error
    await load()
  }

  return { presences, loading, sauver, supprimerDate, reload: load }
}

// ── Entretiens ──
export function useEntretiens() {
  const [entretiens, setEntretiens] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('entretiens').select('*').order('date_entretien', { ascending: false })
    setEntretiens(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const ajouter = async (entretien) => {
    const { error } = await supabase.from('entretiens').insert(entretien)
    if (error) throw error
    await load()
  }

  const modifier = async (id, updates) => {
    const { error } = await supabase.from('entretiens').update(updates).eq('id', id)
    if (error) throw error
    await load()
  }

  const supprimer = async (id) => {
    const { error } = await supabase.from('entretiens').delete().eq('id', id)
    if (error) throw error
    await load()
  }

  return { entretiens, loading, ajouter, modifier, supprimer, reload: load }
}

// ── Défis ──
export function useDefis() {
  const [defis, setDefis] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('defis').select('*')
    setDefis(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const ajouter = async (defi) => {
    const { error } = await supabase.from('defis').insert(defi)
    if (error) throw error
    await load()
  }

  const modifier = async (id, updates) => {
    const { error } = await supabase.from('defis').update(updates).eq('id', id)
    if (error) throw error
    await load()
  }

  return { defis, loading, ajouter, modifier, reload: load }
}

// ── Plan de croissance ──
export function usePlanCroissance() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('plan_croissance').select('*')
    setPlans(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const assigner = async (membreId, moduleId, defiId) => {
    const { error } = await supabase.from('plan_croissance').insert({
      membre_id: membreId,
      module_id: moduleId,
      defi_id: defiId || null
    })
    if (error) throw error
    await load()
  }

  const valider = async (id, valide) => {
    const { error } = await supabase.from('plan_croissance').update({
      valide,
      date_validation: valide ? today() : null
    }).eq('id', id)
    if (error) throw error
    await load()
  }

  const retirer = async (id) => {
    const { error } = await supabase.from('plan_croissance').delete().eq('id', id)
    if (error) throw error
    await load()
  }

  return { plans, loading, assigner, valider, retirer, reload: load }
}

// ── Vues SQL (alertes, stats) ──
export function useAlertes() {
  const [alertes, setAlertes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('v_alertes').select('*')
    setAlertes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { alertes, loading, reload: load }
}

export function useStatsResponsable() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('v_stats_responsable').select('*')
    setStats(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { stats, loading, reload: load }
}

// ── Tables de référence (pour les dropdowns) ──
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
      statuts: statuts.data || [],
      roles: roles.data || [],
      activites: activites.data || [],
      modules: modules.data || [],
      sujetsEntretien: sujets.data || [],
      typesDefi: typesD.data || [],
      statutsDefi: statutsD.data || [],
      statutsEntretien: statutsE.data || [],
      motifsDepart: motifs.data || [],
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { refs, loading, reload: load }
}

// ── Admin : CRUD sur une table de référence ──
export function useRefAdmin(table) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from(table).select('*').order('ordre')
    setRows(data || [])
    setLoading(false)
  }, [table])

  useEffect(() => { load() }, [load])

  const ajouter = async (row) => {
    const maxOrdre = rows.length ? Math.max(...rows.map(r => r.ordre || 0)) + 1 : 1
    const { error } = await supabase.from(table).insert({ ...row, ordre: maxOrdre })
    if (error) throw error
    await load()
  }

  const modifier = async (id, updates) => {
    const { error } = await supabase.from(table).update(updates).eq('id', id)
    if (error) throw error
    await load()
  }

  const desactiver = async (id, actif) => {
    const { error } = await supabase.from(table).update({ actif }).eq('id', id)
    if (error) throw error
    await load()
  }

  return { rows, loading, ajouter, modifier, desactiver, reload: load }
}

// ── Admin : gestion des profils utilisateurs ──
export function useProfils() {
  const [profils, setProfils] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('profils').select('*').order('created_at')
    setProfils(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const setRole = async (id, estResponsable, estAdmin) => {
    const { error } = await supabase.from('profils').update({
      est_responsable: estResponsable,
      est_admin: estAdmin
    }).eq('id', id)
    if (error) throw error
    await load()
  }

  return { profils, loading, setRole, reload: load }
}
