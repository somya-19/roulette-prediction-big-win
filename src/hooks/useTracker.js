import { useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { buildStats } from '../utils/analysis'

const LS_HISTORY = 'goa_history'
const LS_SES_ID  = 'goa_session_id'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY)) || [] }
  catch { return [] }
}

export function useTracker(user) {
  const [history,    setHistory]    = useState(loadHistory)
  const [sessionId,  setSessionId]  = useState(() => localStorage.getItem(LS_SES_ID))
  const [fields,     setFields]     = useState({ casino:'', dealer:'', table:'', date:'', spinType:'' })
  const [syncing,    setSyncing]    = useState(false)

  const saveLocal = useCallback((hist, sid) => {
    localStorage.setItem(LS_HISTORY, JSON.stringify(hist))
    if (sid) localStorage.setItem(LS_SES_ID, sid)
  }, [])

  const addNumber = useCallback(n => {
    setHistory(prev => {
      const next = [...prev, n]
      saveLocal(next, sessionId)
      return next
    })
  }, [sessionId, saveLocal])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (!prev.length) return prev
      const next = prev.slice(0, -1)
      saveLocal(next, sessionId)
      return next
    })
  }, [sessionId, saveLocal])

  const newSession = useCallback(() => {
    setHistory([])
    setFields({ casino:'', dealer:'', table:'', date:'', spinType:'' })
    setSessionId(null)
    localStorage.removeItem(LS_HISTORY)
    localStorage.removeItem(LS_SES_ID)
  }, [])

  const syncToCloud = useCallback(async (hist, f) => {
    if (!user) { alert('Not logged in'); return }
    if (!hist.length) { alert('No spins to sync'); return }
    setSyncing(true)
    try {
      const stats      = buildStats(hist)
      const occurrence = {}
      hist.forEach(n => { occurrence[String(n)] = (occurrence[String(n)] || 0) + 1 })
      const payload = {
        user_id:    user.id,
        casino:     f.casino,
        dealer:     f.dealer,
        table_num:  f.table,
        date:       f.date,
        spin_type:  f.spinType,
        numbers:    hist,
        total_spins: hist.length,
        stats,
        occurrence,
        updated_at: new Date().toISOString(),
      }
      if (sessionId) {
        const { error } = await supabase.from('sessions').update(payload).eq('id', sessionId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('sessions').insert(payload).select('id').single()
        if (error) throw error
        setSessionId(data.id)
        localStorage.setItem(LS_SES_ID, data.id)
      }
      alert('✅ Synced successfully!')
    } catch (e) {
      alert('❌ Sync failed: ' + e.message)
    } finally {
      setSyncing(false)
    }
  }, [user, sessionId])

  return { history, fields, setFields, syncing, addNumber, undo, newSession, syncToCloud }
}
