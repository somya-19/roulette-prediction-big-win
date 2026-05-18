import { useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { buildStats } from '../utils/analysis'

const LS_KEY    = 'goa_history'
const LS_SES_ID = 'goa_current_session_id'

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] }
}

export function useTracker(user) {
  const [history,          setHistory]          = useState(load)
  const [currentSessionId, setCurrentSessionId] = useState(() => localStorage.getItem(LS_SES_ID))
  const [sessionFields,    setSessionFields]    = useState({ casino:'', dealer:'', table:'', date:'', spinType:'' })
  const [syncing,          setSyncing]          = useState(false)

  const persist = useCallback((hist, sesId) => {
    localStorage.setItem(LS_KEY, JSON.stringify(hist))
    if (sesId) localStorage.setItem(LS_SES_ID, sesId)
  }, [])

  const addNumber = useCallback(n => {
    setHistory(prev => {
      const next = [...prev, n]
      persist(next, currentSessionId)
      return next
    })
  }, [currentSessionId, persist])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (!prev.length) return prev
      const next = prev.slice(0, -1)
      persist(next, currentSessionId)
      return next
    })
  }, [currentSessionId, persist])

  const newSession = useCallback(() => {
    setHistory([])
    setSessionFields({ casino:'', dealer:'', table:'', date:'', spinType:'' })
    setCurrentSessionId(null)
    localStorage.removeItem(LS_KEY)
    localStorage.removeItem(LS_SES_ID)
  }, [])

  const buildPayload = useCallback((hist, fields) => {
    const stats = buildStats(hist)
    const occurrence = {}
    hist.forEach(n => { occurrence[String(n)] = (occurrence[String(n)] || 0) + 1 })
    return {
      user_id:      user?.id,
      casino:       fields.casino,
      dealer:       fields.dealer,
      table_num:    fields.table,
      date:         fields.date,
      spin_type:    fields.spinType,
      numbers:      hist,
      total_spins:  hist.length,
      stats,
      occurrence,
      is_draft:     false,
      updated_at:   new Date().toISOString(),
    }
  }, [user])

  const syncToCloud = useCallback(async (hist, fields) => {
    if (!user) throw new Error('Not logged in')
    if (!hist.length) throw new Error('No data to sync')
    setSyncing(true)
    try {
      const payload = buildPayload(hist, fields)
      if (currentSessionId) {
        const { error } = await supabase.from('sessions').update(payload).eq('id', currentSessionId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('sessions').insert(payload).select('id').single()
        if (error) throw error
        setCurrentSessionId(data.id)
        localStorage.setItem(LS_SES_ID, data.id)
      }
    } finally {
      setSyncing(false)
    }
  }, [user, currentSessionId, buildPayload])

  return { history, sessionFields, setSessionFields, currentSessionId, syncing, addNumber, undo, newSession, syncToCloud }
}
