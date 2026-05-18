import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { REDS } from '../../constants/roulette'

const Bar=({label,val,total,color})=>{const p=total?Math.round(val/total*100):0;return<div className="an-bar-wrap"><div className="an-bar-label"><span>{label}</span><span style={{color}}>{val} ({p}%)</span></div><div className="an-bar-track"><div className="an-bar-fill" style={{width:`${p}%`,background:color}}/></div></div>}

export default function Analytics({ user }) {
  const [data,setData]=useState(null)
  const [loading,setLoading]=useState(false)
  const [filters,setFilters]=useState({casino:'',dealer:'',table:'',from:'',to:''})

  async function run(){
    setLoading(true)
    let q=supabase.from('sessions').select('*').eq('user_id',user.id).limit(200)
    if(filters.casino)q=q.eq('casino',filters.casino)
    if(filters.dealer)q=q.eq('dealer',filters.dealer)
    if(filters.table)q=q.eq('table_num',filters.table)
    if(filters.from)q=q.gte('date',filters.from)
    if(filters.to)q=q.lte('date',filters.to)
    const{data:rows}=await q
    if(!rows?.length){setData(null);setLoading(false);return}
    let totalSpins=0,red=0,black=0,odd=0,even=0,high=0,low=0,zero=0,ZV=0,V=0,O=0,T=0,d1=0,d2=0,d3=0,r1=0,r2=0,r3=0,s1=0,s2=0,s3=0,s4=0,z1=0,z2=0
    const numCount={}
    rows.forEach(r=>{const s=r.stats||{};totalSpins+=r.total_spins||0;red+=s.red||0;black+=s.black||0;odd+=s.odd||0;even+=s.even||0;high+=s.high||0;low+=s.low||0;zero+=s.zero||0;ZV+=s.zeroVoisins||0;V+=s.voisins||0;O+=s.orphelins||0;T+=s.tiers||0;d1+=s.dozen1||0;d2+=s.dozen2||0;d3+=s.dozen3||0;r1+=s.row1||0;r2+=s.row2||0;r3+=s.row3||0;s1+=s.sector1||0;s2+=s.sector2||0;s3+=s.sector3||0;s4+=s.sector4||0;z1+=s.zone1||0;z2+=s.zone2||0;(r.numbers||[]).forEach(n=>{numCount[n]=(numCount[n]||0)+1})})
    const sorted=Object.entries(numCount).sort((a,b)=>b[1]-a[1])
    setData({sessions:rows.length,totalSpins,red,black,odd,even,high,low,zero,ZV,V,O,T,d1,d2,d3,r1,r2,r3,s1,s2,s3,s4,z1,z2,hot:sorted.slice(0,6),cold:sorted.slice(-6).reverse()})
    setLoading(false)
  }

  const inp=(placeholder,key,type='text')=><input type={type} placeholder={placeholder} value={filters[key]} onChange={e=>setFilters(f=>({...f,[key]:e.target.value}))} style={{background:'#1a1a1a',border:'1px solid #444',borderRadius:'4px',color:'#d4af37',fontSize:'0.75rem',padding:'6px 8px',outline:'none',width:'100%'}}/>

  return(
    <div>
      <div className="box-header" style={{fontSize:'1rem'}}>Analytics</div>
      <div className="list-box" style={{marginBottom:'10px'}}>
        <div className="box-header">Filters</div>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {inp('Casino','casino')}{inp('Dealer','dealer')}{inp('Table','table')}
          <div style={{display:'flex',gap:'6px'}}>{inp('From','from','date')}{inp('To','to','date')}</div>
          <button className="btn" style={{background:'#d4af37',color:'#000',padding:'10px'}} onClick={run}>🔍 RUN ANALYTICS</button>
        </div>
      </div>
      {loading&&<div style={{color:'#888',textAlign:'center',padding:'20px'}}>Calculating...</div>}
      {data&&<>
        <div className="list-box"><div className="box-header">Overview</div><div className="stat-grid">{[['Sessions',data.sessions],['Total Spins',data.totalSpins],['Avg Spins',Math.round(data.totalSpins/data.sessions)],['Zero',data.zero]].map(([l,v])=><div key={l} className="stat-box"><span className="stat-lbl">{l}</span><span className="stat-val">{v}</span></div>)}</div></div>
        <div className="list-box"><div className="box-header">ZL / ZR</div><Bar label="Zone Left" val={data.z1} total={data.totalSpins} color="#42a5f5"/><Bar label="Zone Right" val={data.z2} total={data.totalSpins} color="#ba68c8"/></div>
        <div className="list-box"><div className="box-header">ZV / V / O / T</div><Bar label="Zero Spiel" val={data.ZV} total={data.totalSpins} color="#1a237e"/><Bar label="Voisins" val={data.V} total={data.totalSpins} color="#1565c0"/><Bar label="Orphelins" val={data.O} total={data.totalSpins} color="#c2185b"/><Bar label="Tiers" val={data.T} total={data.totalSpins} color="#f57c00"/></div>
        <div className="list-box"><div className="box-header">Red / Black</div><Bar label="Red" val={data.red} total={data.totalSpins} color="#e63946"/><Bar label="Black" val={data.black} total={data.totalSpins} color="#888"/></div>
        <div className="list-box"><div className="box-header">Odd / Even</div><Bar label="Odd" val={data.odd} total={data.totalSpins} color="#7b1fa2"/><Bar label="Even" val={data.even} total={data.totalSpins} color="#1565c0"/></div>
        <div className="list-box"><div className="box-header">High / Low</div><Bar label="High (19-36)" val={data.high} total={data.totalSpins} color="#ff9800"/><Bar label="Low (1-18)" val={data.low} total={data.totalSpins} color="#00bcd4"/></div>
        <div className="list-box"><div className="box-header">🔥 Hot Numbers</div><div className="hot-cold-grid">{data.hot.map(([n,c])=>{const bg=Number(n)===0?'#00cc66':REDS.includes(Number(n))?'#c0202e':'#333';return<div key={n}><div className="hc-ball" style={{background:bg,color:'#fff'}}>{n}</div><div style={{textAlign:'center',fontSize:'0.6rem',color:'#d4af37',marginTop:'2px'}}>{c}</div></div>})}</div></div>
        <div className="list-box"><div className="box-header">❄️ Cold Numbers</div><div className="hot-cold-grid">{data.cold.map(([n,c])=>{const bg=Number(n)===0?'#00cc66':REDS.includes(Number(n))?'#c0202e':'#333';return<div key={n}><div className="hc-ball" style={{background:bg,color:'#fff'}}>{n}</div><div style={{textAlign:'center',fontSize:'0.6rem',color:'#d4af37',marginTop:'2px'}}>{c}</div></div>})}</div></div>
      </>}
      {!loading&&!data&&<div style={{color:'#666',fontSize:'0.8rem',textAlign:'center',padding:'20px'}}>Set filters and click Run Analytics</div>}
    </div>
  )
}
