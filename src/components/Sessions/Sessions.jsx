import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { REDS } from '../../constants/roulette'
import PatternLogs from '../PatternLogs/PatternLogs'
import Dashboard from '../Dashboard/Dashboard'

const selStyle = {
  background:'#1a1a1a', border:'1px solid #444', borderRadius:'4px',
  color:'#d4af37', fontSize:'0.75rem', padding:'6px 8px',
  outline:'none', width:'100%'
}
const inpStyle = {
  background:'#1a1a1a', border:'1px solid #444', borderRadius:'4px',
  color:'#d4af37', fontSize:'0.75rem', padding:'6px 8px',
  outline:'none', width:'100%'
}

export default function Sessions({ user }) {
  const [allSessions, setAllSessions] = useState([])
  const [filtered,    setFiltered]    = useState([])
  const [detail,      setDetail]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [loaded,      setLoaded]      = useState(false)

  const [selCasino, setSelCasino] = useState('')
  const [selDealer, setSelDealer] = useState('')
  const [selTable,  setSelTable]  = useState('')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(500)
      if (!error && data) { setAllSessions(data); setFiltered(data) }
      setLoading(false)
      setLoaded(true)
    }
    load()
  }, [])

  // Cascading options
  const casinos = [...new Set(allSessions.map(s => s.casino).filter(Boolean))].sort()
  const casinoFiltered = selCasino ? allSessions.filter(s => s.casino === selCasino) : allSessions
  const dealers = [...new Set(casinoFiltered.map(s => s.dealer).filter(Boolean))].sort()
  const dealerFiltered = selDealer ? casinoFiltered.filter(s => s.dealer === selDealer) : casinoFiltered
  const tables = [...new Set(dealerFiltered.map(s => s.table_num).filter(Boolean))].sort()

  function search() {
    let result = allSessions
    if (selCasino) result = result.filter(s => s.casino    === selCasino)
    if (selDealer) result = result.filter(s => s.dealer    === selDealer)
    if (selTable)  result = result.filter(s => s.table_num === selTable)
    if (dateFrom)  result = result.filter(s => (s.date||'') >= dateFrom)
    if (dateTo)    result = result.filter(s => (s.date||'') <= dateTo)
    setFiltered(result); setDetail(null)
  }

  function clearFilters() {
    setSelCasino(''); setSelDealer(''); setSelTable('')
    setDateFrom(''); setDateTo('')
    setFiltered(allSessions); setDetail(null)
  }

  function onCasinoChange(val) { setSelCasino(val); setSelDealer(''); setSelTable('') }
  function onDealerChange(val) { setSelDealer(val); setSelTable('') }

  // ── Detail view — full analysis ──────────────────────────────
  if (detail) {
    const nums = detail.numbers || []
    return (
      <div>
        {/* Back button */}
        <button className="btn"
          style={{ background:'#444', padding:'8px 12px', fontSize:'0.75rem', marginBottom:'8px' }}
          onClick={() => setDetail(null)}>
          ← Back to Sessions
        </button>

        {/* Session header */}
        <div className="list-box" style={{ marginBottom:'8px' }}>
          <div className="sess-title">{detail.casino||'—'} — Table {detail.table_num||'—'}</div>
          <div className="sess-meta">
            👤 {detail.dealer||'—'} &nbsp;|&nbsp; 📅 {detail.date||'—'} &nbsp;|&nbsp;
            🎰 {detail.total_spins||0} spins &nbsp;|&nbsp; Spin: {detail.spin_type||'—'}
          </div>
        </div>

        {/* Dashboard stats for this session */}
        <div style={{ marginBottom:'8px' }}>
          <Dashboard history={nums} />
        </div>

        <PatternLogs history={nums} />
      </div>
    )
  }

  // ── Session list ─────────────────────────────────────────────
  return (
    <div>
      <div className="box-header" style={{ fontSize:'1rem' }}>Past Sessions</div>

      <div className="list-box" style={{ marginBottom:'10px' }}>
        <div className="box-header">Filters</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <select style={selStyle} value={selCasino} onChange={e => onCasinoChange(e.target.value)}>
            <option value="">All Casinos</option>
            {casinos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={selStyle} value={selDealer} onChange={e => onDealerChange(e.target.value)}>
            <option value="">All Dealers</option>
            {dealers.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select style={selStyle} value={selTable} onChange={e => setSelTable(e.target.value)}>
            <option value="">All Tables</option>
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{ display:'flex', gap:'6px' }}>
            <input type="date" style={inpStyle} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <input type="date" style={inpStyle} value={dateTo}   onChange={e => setDateTo(e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            <button className="btn" style={{ background:'#007bff', flex:1, padding:'10px' }} onClick={search}>
              🔍 SEARCH
            </button>
            <button className="btn" style={{ background:'#333', padding:'10px' }} onClick={clearFilters}>
              ✕ CLEAR
            </button>
          </div>
        </div>
      </div>

      {loading && <div style={{ color:'#888', textAlign:'center', padding:'20px' }}>Loading sessions...</div>}

      {loaded && !loading && (
        <div style={{ fontSize:'0.7rem', color:'#555', marginBottom:'8px', textAlign:'right' }}>
          {filtered.length} session{filtered.length !== 1 ? 's' : ''} found
        </div>
      )}

      {!loading && filtered.map((s, i) => (
        <div key={i} className="sess-card" onClick={() => { setDetail(s) }}>
          <div className="sess-title">{s.casino||'—'} | Table: {s.table_num||'—'}</div>
          <div className="sess-meta">
            👤 {s.dealer||'—'} | 📅 {s.date||'—'} | 🎰 {s.total_spins||0} spins
          </div>
          <div className="sess-meta" style={{ marginTop:'4px', color:'#42a5f5' }}>
            ZL:{s.stats?.zone1||0} ZR:{s.stats?.zone2||0} | R:{s.stats?.red||0} B:{s.stats?.black||0}
          </div>
        </div>
      ))}

      {loaded && !loading && filtered.length === 0 && (
        <div style={{ color:'#666', fontSize:'0.8rem', textAlign:'center', padding:'20px' }}>
          No sessions found
        </div>
      )}
    </div>
  )
}
