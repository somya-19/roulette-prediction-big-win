import { useState, useEffect } from 'react'
import { supabase }        from './supabaseClient'
import AuthPage            from './components/Auth/AuthPage'
import Dashboard           from './components/Dashboard/Dashboard'
import Wheel               from './components/Wheel/Wheel'
import Board               from './components/Board/Board'
import PatternLogs         from './components/PatternLogs/PatternLogs'
import OccurrenceTable     from './components/OccurrenceTable/OccurrenceTable'
import Sessions            from './components/Sessions/Sessions'
import Analytics           from './components/Analytics/Analytics'
import { useTracker }      from './hooks/useTracker'

export default function App() {
  const [user, setUser] = useState({ id: 'test-user', email: 'test@test.com' })
  const [authReady,  setAuthReady]  = useState(false)
  
  
  const [tab,        setTab]        = useState('occ')
  const [showModal,  setShowModal]  = useState(false)

  const { history, fields, setFields, syncing, addNumber, undo, newSession, syncToCloud } = useTracker(user)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── AUTH DISABLED FOR TESTING — re-enable when ready ──────────
  // if (!authReady) return <div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"/></div>
  // if (!user) return <AuthPage onLogin={setUser} />
  // ────────────────────────────────────────────────────────────

  return (
    <>
      {/* Watermark */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:99998, pointerEvents:'none', overflow:'hidden', opacity:0.035, userSelect:'none' }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} style={{ position:'absolute', top:`${(i%7)*15}%`, left:`${Math.floor(i/7)*25-10}%`, transform:'rotate(-30deg)', fontSize:'0.9rem', fontWeight:900, color:'#fff', whiteSpace:'nowrap' }}>
            {user.email}
          </div>
        ))}
      </div>

      {/* New Session Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#1a1a1a', border:'2px solid #d4af37', borderRadius:'10px', padding:'24px', maxWidth:'320px', width:'90%', textAlign:'center' }}>
            <div style={{ fontSize:'1rem', fontWeight:900, color:'#d4af37', marginBottom:'10px' }}>🎰 New Session?</div>
            <div style={{ fontSize:'0.8rem', color:'#aaa', marginBottom:'18px', lineHeight:1.5 }}>
              <strong>{history.length}</strong> spins recorded. Save before starting fresh?
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button className="btn" style={{ background:'#007bff' }} onClick={async () => { await syncToCloud(history, fields); newSession(); setShowModal(false) }}>💾 Save &amp; New Session</button>
              <button className="btn" style={{ background:'#444' }} onClick={() => { newSession(); setShowModal(false) }}>🗑 Discard &amp; New Session</button>
              <button className="btn" style={{ background:'#111', border:'1px solid #444', color:'#aaa' }} onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="main-wrapper">
        <div className="left-panel">
          <Dashboard history={history} />
          <div className="input-container">
            <Wheel history={history} onSelect={addNumber} fields={fields} onFieldChange={(k,v) => setFields(f => ({...f,[k]:v}))} />
            <Board history={history} onSelect={addNumber} />
          </div>
          <PatternLogs history={history} />
          <div className="bottom-controls">
            <button className="btn" style={{ background:'#444' }} onClick={undo}>↩ UNDO</button>
            <button className="btn" style={{ background:'#1a6b2a' }} onClick={() => setShowModal(true)}>✚ NEW SESSION</button>
          </div>
          <div className="bottom-sync-row">
            <button className="btn" style={{ background:'#007bff', flex:1, padding:'12px' }} onClick={() => syncToCloud(history, fields)} disabled={syncing}>
              {syncing ? '⏳ Syncing...' : '☁ SYNC TO CLOUD'}
            </button>
            <button className="btn" style={{ background:'#d4af37', color:'#000', flex:1, padding:'12px' }} onClick={() => window.print()}>🖨 PRINT</button>
          </div>
          <div style={{ padding:'8px 12px', background:'#0a0a0a', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #1a1a1a' }}>
            <span style={{ fontSize:'0.65rem', color:'#444' }}>👤 Test Mode</span>
            <button onClick={() => {}} style={{ background:'none', border:'none', color:'#444', fontSize:'0.65rem', cursor:'pointer' }}>—</button>
          </div>
        </div>

        <div className="right-panel">
          <div style={{ display:'flex', gap:'4px', marginBottom:'10px', position:'sticky', top:0, zIndex:100, background:'#050505', paddingBottom:'8px' }}>
            {['occ','sessions','analytics'].map(t => (
              <button key={t} className={`tab-btn${tab===t?' active-tab':''}`} onClick={() => setTab(t)}>
                {t==='occ'?'Occurrence':t==='sessions'?'Sessions':'Analytics'}
              </button>
            ))}
          </div>
          {tab==='occ'       && <OccurrenceTable history={history} />}
          {tab==='sessions'  && <Sessions user={user} />}
          {tab==='analytics' && <Analytics user={user} />}
        </div>
      </div>
    </>
  )
}
