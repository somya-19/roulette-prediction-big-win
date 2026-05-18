import { useState, useEffect } from 'react'
import { supabase }         from './supabaseClient'
import AuthPage             from './components/Auth/AuthPage'
import PaywallScreen        from './components/Subscription/PaywallScreen'
import Dashboard            from './components/Dashboard/Dashboard'
import Wheel                from './components/Wheel/Wheel'
import Board                from './components/Board/Board'
import PatternLogs          from './components/PatternLogs/PatternLogs'
import OccurrenceTable      from './components/OccurrenceTable/OccurrenceTable'
import Sessions             from './components/Sessions/Sessions'
import Analytics            from './components/Analytics/Analytics'
import { useTracker }       from './hooks/useTracker'

export default function App() {
  const [user,       setUser]       = useState(null)
  const [authReady,  setAuthReady]  = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [tab,        setTab]        = useState('occ')
  const [showModal,  setShowModal]  = useState(false)

  const { history, sessionFields, setSessionFields, syncing, addNumber, undo, newSession, syncToCloud } = useTracker(user)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data?.session?.user || null); setAuthReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user || null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    async function checkSub() {
      // No trial — only check if admin has manually activated this user
      const { data } = await supabase
        .from('subscriptions')
        .select('expires_at')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('expires_at', { ascending: false })
        .limit(1)
        .single()
      if (data && new Date(data.expires_at) > new Date()) {
        setSubscribed(true)
      } else {
        setSubscribed(false)
      }
    }
    checkSub()
  }, [user])

  if (!authReady) return <div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"/></div>
  if (!user) return <AuthPage onLogin={setUser} />
  if (!subscribed) return <PaywallScreen user={user} onSubscribed={()=>setSubscribed(true)} />

  return (
    <>
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#1a1a1a',border:'2px solid #d4af37',borderRadius:'10px',padding:'24px',maxWidth:'340px',width:'90%',textAlign:'center'}}>
            <div style={{fontSize:'1.1rem',fontWeight:900,color:'#d4af37',marginBottom:'10px'}}>🎰 Start New Session?</div>
            <div style={{fontSize:'0.8rem',color:'#aaa',marginBottom:'18px',lineHeight:1.5}}>You have <strong>{history.length}</strong> spins recorded.<br/>Save to cloud before starting fresh?</div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <button className="btn" style={{background:'#007bff'}} onClick={async()=>{await syncToCloud(history,sessionFields);newSession();setShowModal(false)}}>💾 Save &amp; New Session</button>
              <button className="btn" style={{background:'#444'}} onClick={()=>{newSession();setShowModal(false)}}>🗑 Discard &amp; New Session</button>
              <button className="btn" style={{background:'#222',border:'1px solid #555',color:'#aaa'}} onClick={()=>setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="main-wrapper">
        <div className="left-panel">
          <Dashboard history={history} />
          <div className="input-container">
            <Wheel history={history} onSelect={addNumber} sessionFields={sessionFields} onFieldChange={(k,v)=>setSessionFields(f=>({...f,[k]:v}))} />
            <Board history={history} onSelect={addNumber} />
          </div>
          <PatternLogs history={history} />
          <div className="bottom-controls">
            <button className="btn" style={{background:'#444'}} onClick={undo}>↩ UNDO</button>
            <button className="btn" style={{background:'#1a6b2a'}} onClick={()=>setShowModal(true)}>✚ NEW SESSION</button>
          </div>
          <div className="bottom-sync-row">
            <button className="btn" style={{background:'#007bff',flex:1,padding:'12px'}} onClick={()=>syncToCloud(history,sessionFields)} disabled={syncing}>
              {syncing?'⏳ Syncing...':'☁ SYNC TO CLOUD'}
            </button>
            <button className="btn" style={{background:'#d4af37',color:'#000',flex:1,padding:'12px'}} onClick={()=>window.print()}>🖨 PRINT</button>
          </div>
          <div style={{padding:'8px 15px',background:'#0a0a0a',display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid #222'}}>
            <span style={{fontSize:'0.65rem',color:'#555'}}>👤 {user.email}</span>
            <button onClick={()=>supabase.auth.signOut()} style={{background:'none',border:'none',color:'#555',fontSize:'0.65rem',cursor:'pointer'}}>Sign out</button>
          </div>
        </div>

        <div className="right-panel">
          <div style={{display:'flex',gap:'4px',marginBottom:'10px',position:'sticky',top:0,zIndex:100,background:'#050505',paddingBottom:'8px'}}>
            {['occ','sessions','analytics'].map(t=>(
              <button key={t} className={`tab-btn${tab===t?' active-tab':''}`} onClick={()=>setTab(t)}>
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
