import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { REDS } from '../../constants/roulette'

export default function Sessions({ user }) {
  const [sessions, setSessions] = useState([])
  const [detail,   setDetail]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [filters,  setFilters]  = useState({ casino:'', dealer:'', table:'', from:'', to:'' })

  async function search() {
    setLoading(true); setDetail(null)
    let q = supabase.from('sessions').select('*').eq('user_id', user.id).order('updated_at',{ascending:false}).limit(200)
    if(filters.casino) q=q.eq('casino',filters.casino)
    if(filters.dealer) q=q.eq('dealer',filters.dealer)
    if(filters.table)  q=q.eq('table_num',filters.table)
    if(filters.from)   q=q.gte('date',filters.from)
    if(filters.to)     q=q.lte('date',filters.to)
    const { data } = await q
    setSessions(data||[]); setLoading(false)
  }

  const inp=(placeholder,key,type='text')=>(
    <input type={type} placeholder={placeholder} value={filters[key]} onChange={e=>setFilters(f=>({...f,[key]:e.target.value}))}
      style={{background:'#1a1a1a',border:'1px solid #444',borderRadius:'4px',color:'#d4af37',fontSize:'0.75rem',padding:'6px 8px',outline:'none',width:'100%'}}/>
  )

  if(detail) return (
    <div>
      <button className="btn" style={{background:'#444',padding:'8px 12px',fontSize:'0.75rem',marginBottom:'10px'}} onClick={()=>setDetail(null)}>← Back</button>
      <div className="list-box">
        <div className="sess-title">{detail.casino||'—'} — Table {detail.table_num||'—'}</div>
        <div className="sess-meta">Dealer: {detail.dealer||'—'} | Date: {detail.date||'—'} | Spins: <b style={{color:'#d4af37'}}>{detail.total_spins||0}</b></div>
      </div>
      <div className="stat-grid">
        {[['ZL/ZR',`${detail.stats?.zone1||0} / ${detail.stats?.zone2||0}`],['ZV/V/O/T',`${detail.stats?.zeroVoisins||0}/${detail.stats?.voisins||0}/${detail.stats?.orphelins||0}/${detail.stats?.tiers||0}`],['Red/Black',`${detail.stats?.red||0} / ${detail.stats?.black||0}`],['Odd/Even',`${detail.stats?.odd||0} / ${detail.stats?.even||0}`]].map(([l,v])=>(
          <div className="stat-box" key={l}><span className="stat-lbl">{l}</span><span className="stat-val" style={{fontSize:'0.8rem'}}>{v}</span></div>
        ))}
      </div>
      <div className="list-box">
        <div className="box-header">Numbers (most recent first)</div>
        <div className="flex-wrap">
          {[...(detail.numbers||[])].reverse().map((n,i)=>{const bg=n===0?'#00ff88':REDS.includes(n)?'#e63946':'#1a1a1a';return<div key={i} className="mini-ball" style={{background:bg,color:n===0?'#000':'#fff'}}>{n}</div>})}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="box-header" style={{fontSize:'1rem'}}>Past Sessions</div>
      <div className="list-box" style={{marginBottom:'10px'}}>
        <div className="box-header">Filters</div>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {inp('Casino','casino')}{inp('Dealer','dealer')}{inp('Table','table')}
          <div style={{display:'flex',gap:'6px'}}>{inp('From date','from','date')}{inp('To date','to','date')}</div>
          <button className="btn" style={{background:'#007bff',padding:'10px'}} onClick={search}>🔍 SEARCH SESSIONS</button>
        </div>
      </div>
      {loading&&<div style={{color:'#888',textAlign:'center',padding:'20px'}}>Loading...</div>}
      {!loading&&sessions.map((s,i)=>(
        <div key={i} className="sess-card" onClick={()=>setDetail(s)}>
          <div className="sess-title">{s.casino||'—'} | Table: {s.table_num||'—'}</div>
          <div className="sess-meta">👤 {s.dealer||'—'} | 📅 {s.date||'—'} | 🎰 {s.total_spins||0} spins</div>
          <div className="sess-meta" style={{marginTop:'4px',color:'#42a5f5'}}>ZL:{s.stats?.zone1||0} ZR:{s.stats?.zone2||0} | ZV:{s.stats?.zeroVoisins||0} V:{s.stats?.voisins||0} O:{s.stats?.orphelins||0} T:{s.stats?.tiers||0}</div>
        </div>
      ))}
      {!loading&&sessions.length===0&&<div style={{color:'#666',fontSize:'0.8rem',textAlign:'center',padding:'20px'}}>Set filters and click Search</div>}
    </div>
  )
}
