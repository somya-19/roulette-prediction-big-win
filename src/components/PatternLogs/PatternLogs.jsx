import { REDS, ZV_N, V_N, O_N, T_N, SECTOR_COLORS, WHEEL_ORDER, ZONE1, ZONE2, UP_NUMS, DOWN_NUMS } from '../../constants/roulette'
import { getZone, getUpDown, getSector, getNeighbourInfo, getWheelNeighbours, getVOT } from '../../utils/analysis'

// ── Number sets ───────────────────────────────────────────────
const ROW1_NUMS   = [1,4,7,10,13,16,19,22,25,28,31,34]
const ROW2_NUMS   = [2,5,8,11,14,17,20,23,26,29,32,35]
const ROW3_NUMS   = [3,6,9,12,15,18,21,24,27,30,33,36]
const DOZEN1_NUMS = [1,2,3,4,5,6,7,8,9,10,11,12]
const DOZEN2_NUMS = [13,14,15,16,17,18,19,20,21,22,23,24]
const DOZEN3_NUMS = [25,26,27,28,29,30,31,32,33,34,35,36]
const BLACK_NUMS  = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]
const ODD_NUMS    = [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35]
const EVEN_NUMS   = [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36]
const HIGH_NUMS   = [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36]
const LOW_NUMS    = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]
const S13_NUMS    = [0,1,3,4,5,8,10,12,15,16,19,21,23,24,26,30,32,33,35]
const S24_NUMS    = [2,6,7,9,11,13,14,17,18,20,22,25,27,28,29,31,34,36]
const DOZEN_NUMS  = { 1: DOZEN1_NUMS, 2: DOZEN2_NUMS, 3: DOZEN3_NUMS }

// ── Small reusable UI pieces ──────────────────────────────────
const Tag  = ({ bg, border, children }) => <div className="tag" style={{ background:bg, border:border||`1px solid ${bg}` }}>{children}</div>
const NTag = ({ bg, text='#fff', num, label }) => <div className="ntag" style={{ background:bg, color:text }}><span style={{ fontSize:'0.6rem', opacity:0.7 }}>{num}</span><span>{label}</span></div>
const Ball = ({ n, bg, text, outline }) => (
  <div className="mini-ball" style={{
    background:bg, color:text,
    outline: outline||'none',
    boxShadow: outline ? `0 0 5px ${outline.split(' ')[2]}` : 'none',
    transform: outline ? 'scale(1.1)' : 'scale(1)',
  }}>{n}</div>
)
const Box = ({ header, children }) => (
  <div className="list-box">
    <div className="box-header">{header}</div>
    <div className="flex-wrap">{children}</div>
  </div>
)
const Divider = () => (
  <div style={{ width:'100%', display:'flex', alignItems:'center', gap:'8px', margin:'4px 0', opacity:0.6 }}>
    <div style={{ flex:1, height:'1px', background:'#d4af37' }} />
    <span style={{ fontSize:'0.6rem', color:'#d4af37', fontWeight:700, whiteSpace:'nowrap' }}>DEALER CHANGE</span>
    <div style={{ flex:1, height:'1px', background:'#d4af37' }} />
  </div>
)

function getBallStyle(n) {
  if (n === 0)          return { bg:'#00ff88', text:'#000' }
  if (REDS.includes(n)) return { bg:'#e63946', text:'#fff' }
  return                       { bg:'#1a1a1a', text:'#fff' }
}

function get5Neighbours(n) {
  const idx = WHEEL_ORDER.indexOf(n)
  if (idx < 0) return []
  const len = WHEEL_ORDER.length
  return [
    WHEEL_ORDER[(idx-2+len)%len], WHEEL_ORDER[(idx-1+len)%len],
    WHEEL_ORDER[idx],
    WHEEL_ORDER[(idx+1)%len],     WHEEL_ORDER[(idx+2)%len],
  ]
}

function lastReal(hist, fromEnd = 1) {
  let count = 0
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i] !== null) { count++; if (count === fromEnd) return hist[i] }
  }
  return null
}

const HIT_COLORS = ['#FF9F43','#54A0FF']

// ── Star for Neighbour pattern box ────────────────────────────
const NeighbourStar = ({ n, label }) => {
  const isR   = label.startsWith('R')
  const isA   = label.startsWith('A')
  const color = isR ? '#FFD700' : isA ? '#00E5FF' : '#333'
  const txtC  = (isR || isA) ? '#000' : '#777'
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
      <div style={{ position:'relative', width:'48px', height:'48px', flexShrink:0 }}>
        <div style={{
          width:'48px', height:'48px', background:color,
          clipPath:'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
          position:'absolute', top:0, left:0,
        }} />
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'0.72rem', fontWeight:900, color:txtC, paddingTop:'3px',
        }}>{label}</div>
      </div>
      <span style={{ fontSize:'0.52rem', color:'#888', fontWeight:600 }}>{n}</span>
    </div>
  )
}

// ── Mini number ball for prediction display ───────────────────
const MiniNum = ({ n }) => {
  const { bg, text } = getBallStyle(n)
  return (
    <div style={{
      width:'22px', height:'22px', borderRadius:'50%',
      background:bg, color:text, border:'1px solid rgba(255,255,255,0.15)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'0.48rem', fontWeight:700, flexShrink:0,
    }}>{n}</div>
  )
}

// ── Numbers block shown below a pattern box when prediction fires
const PredNumsBox = ({ label, nums }) => (
  <div style={{
    background:'#0a0a0a', border:'1px solid #2a2a2a', borderTop:'none',
    borderRadius:'0 0 6px 6px', padding:'8px 10px', marginTop:'-6px', marginBottom:'10px',
  }}>
    <div style={{ fontSize:'0.62rem', color:'#d4af37', fontWeight:800, marginBottom:'6px', letterSpacing:'0.5px' }}>
      🎯 {label}
    </div>
    <div style={{ display:'flex', flexWrap:'wrap', gap:'3px' }}>
      {[...nums].sort((a,b)=>a-b).map((n,i) => <MiniNum key={i} n={n} />)}
    </div>
  </div>
)

// ── Main component ────────────────────────────────────────────
export default function PatternLogs({ history }) {
  const rev    = [...history].reverse()
  const sorted = history.filter(x => x !== null).sort((a,b) => a-b)
  const real   = history.filter(x => x !== null)

  const lastNum    = lastReal(history, 1)
  const altLastNum = lastReal(history, 2)

  const nineteenNos = lastNum !== null
    ? [...getWheelNeighbours(lastNum, 9)].sort((a,b) => a-b)
    : []

  const ynSeries = real.slice(1).map((n, i) => ({
    n,
    hit: new Set(getWheelNeighbours(real[i], 9)).has(n)
  }))

  // ── All prediction logic at component level ───────────────────
  const real2 = real

  function spinsSince(predFn) {
    for (let i = real2.length - 1; i >= 0; i--) {
      if (predFn(real2[i])) return i === real2.length - 1 ? 0 : real2.length - 1 - i
    }
    return real2.length
  }

  // Hot streaks
  const last3r  = real2.slice(-3).map(n => n===0?null:(n%3===0?3:n%3))
  const rowHot  = last3r.length===3 && last3r[0]!==null && last3r.every(r=>r===last3r[0]) ? last3r[0] : null
  const rowColors = {1:'#2196f3',2:'#9c27b0',3:'#ff9800'}

  const last3d  = real2.slice(-3).map(n => n===0?null:Math.ceil(n/12))
  const dozHot  = last3d.length===3 && last3d[0]!==null && last3d.every(d=>d===last3d[0]) ? last3d[0] : null
  const dozColors = {1:'#00bcd4',2:'#e91e63',3:'#8bc34a'}

  const z5      = real2.slice(-5).map(getZone)
  const zoneHot = z5.length===5 && z5[0]!==null && z5.every(z=>z===z5[0]) ? z5[0] : null

  const ud5     = real2.slice(-5).map(getUpDown).filter(x=>x!=='?')
  const udHot   = ud5.length===5 && ud5.every(u=>u===ud5[0]) ? ud5[0] : null

  const yn19        = real2.slice(1).map((n,i) => new Set(getWheelNeighbours(real2[i],9)).has(n))
  const nos19Pred   = yn19.slice(-3).length===3 && yn19.slice(-3).every(x=>!x)

  const altYN2      = real2.slice(2).map((n,i) => new Set(getWheelNeighbours(real2[i],9)).has(n))
  const altNos19Pred = altYN2.slice(-3).length===3 && altYN2.slice(-3).every(x=>!x)

  let toStreak = 0
  for(let i=real2.length-1;i>=0;i--){
    const v=getVOT(real2[i])
    if(v==='T'||v==='O') toStreak++; else break
  }
  const voisinsPred = toStreak >= 7

  let rbStreak=0, rbLast=null
  for(let i=real2.length-1;i>=0;i--){
    const cur=real2[i]===0?null:(REDS.includes(real2[i])?'R':'B')
    if(cur===null) break
    if(i===real2.length-1) rbLast=cur
    if(cur===rbLast) rbStreak++; else break
  }
  const rbPred = rbStreak>=7 ? (rbLast==='R'?'Black':'Red') : null

  let oeStreak=0, oeLast=null
  for(let i=real2.length-1;i>=0;i--){
    const cur=real2[i]===0?null:(real2[i]%2!==0?'O':'E')
    if(cur===null) break
    if(i===real2.length-1) oeLast=cur
    if(cur===oeLast) oeStreak++; else break
  }
  const oePred = oeStreak>=7 ? (oeLast==='O'?'Even':'Odd') : null

  let hlStreak=0, hlLast=null
  for(let i=real2.length-1;i>=0;i--){
    const cur=real2[i]===0?null:(real2[i]>=19?'H':'L')
    if(cur===null) break
    if(i===real2.length-1) hlLast=cur
    if(cur===hlLast) hlStreak++; else break
  }
  const hlPred = hlStreak>=7 ? (hlLast==='H'?'Low':'High') : null

  // Cold predictions
  const r1Cold    = spinsSince(n => n !== 0 && n % 3 === 1) >= 9
  const r2Cold    = spinsSince(n => n !== 0 && n % 3 === 2) >= 9
  const r3Cold    = spinsSince(n => n !== 0 && n % 3 === 0) >= 9
  const d1Cold    = spinsSince(n => n !== 0 && n <= 12) >= 9
  const d2Cold    = spinsSince(n => n !== 0 && n >= 13 && n <= 24) >= 9
  const d3Cold    = spinsSince(n => n !== 0 && n >= 25) >= 9
  const zlCold    = spinsSince(n => ZONE1.includes(n)) >= 9
  const zrCold    = spinsSince(n => ZONE2.includes(n)) >= 9
  const upCold    = spinsSince(n => UP_NUMS.includes(n)) >= 9
  const dnCold    = spinsSince(n => DOWN_NUMS.includes(n)) >= 9
  const redCold   = spinsSince(n => n !== 0 && REDS.includes(n)) >= 9
  const blackCold = spinsSince(n => n !== 0 && !REDS.includes(n)) >= 9
  const oddCold   = spinsSince(n => n !== 0 && n % 2 !== 0) >= 9
  const evenCold  = spinsSince(n => n !== 0 && n % 2 === 0) >= 9
  const highCold  = spinsSince(n => n !== 0 && n >= 19) >= 9
  const lowCold   = spinsSince(n => n !== 0 && n <= 18) >= 9
  const s13Cold   = spinsSince(n => getSector(n) === 'S1' || getSector(n) === 'S3') >= 9
  const s24Cold   = spinsSince(n => getSector(n) === 'S2' || getSector(n) === 'S4') >= 9

  // ── Predicted numbers for display below each pattern box ─────
  // Zone
  const zonePredEntry = zoneHot === 'ZL' ? { label:'Predict ZR', nums:[...ZONE2].sort((a,b)=>a-b) }
    : zoneHot === 'ZR'                   ? { label:'Predict ZL', nums:[...ZONE1].sort((a,b)=>a-b) }
    : zlCold                             ? { label:'ZL due',     nums:[...ZONE1].sort((a,b)=>a-b) }
    : zrCold                             ? { label:'ZR due',     nums:[...ZONE2].sort((a,b)=>a-b) }
    : null

  // Up/Down
  const udPredEntry = udHot === 'UP' ? { label:'Predict DOWN', nums:[...DOWN_NUMS].sort((a,b)=>a-b) }
    : udHot === 'DN'                  ? { label:'Predict UP',   nums:[...UP_NUMS].sort((a,b)=>a-b) }
    : upCold                          ? { label:'UP due',       nums:[...UP_NUMS].sort((a,b)=>a-b) }
    : dnCold                          ? { label:'DN due',       nums:[...DOWN_NUMS].sort((a,b)=>a-b) }
    : null

  // Red/Black
  const rbPredEntry = rbPred === 'Red'   ? { label:'Predict Red',   nums:[...REDS].sort((a,b)=>a-b) }
    : rbPred === 'Black'                  ? { label:'Predict Black', nums:[...BLACK_NUMS].sort((a,b)=>a-b) }
    : redCold                             ? { label:'Red due',       nums:[...REDS].sort((a,b)=>a-b) }
    : blackCold                           ? { label:'Black due',     nums:[...BLACK_NUMS].sort((a,b)=>a-b) }
    : null

  // Odd/Even
  const oePredEntry = oePred === 'Odd'  ? { label:'Predict Odd',  nums:ODD_NUMS }
    : oePred === 'Even'                  ? { label:'Predict Even', nums:EVEN_NUMS }
    : oddCold                            ? { label:'Odd due',      nums:ODD_NUMS }
    : evenCold                           ? { label:'Even due',     nums:EVEN_NUMS }
    : null

  // High/Low
  const hlPredEntry = hlPred === 'High' ? { label:'Predict High', nums:HIGH_NUMS }
    : hlPred === 'Low'                   ? { label:'Predict Low',  nums:LOW_NUMS }
    : highCold                           ? { label:'High due',     nums:HIGH_NUMS }
    : lowCold                            ? { label:'Low due',      nums:LOW_NUMS }
    : null

  // Dozens — can be multiple at once
  const dozPredEntries = []
  if (dozHot) {
    ;[1,2,3].filter(d=>d!==dozHot).forEach(d =>
      dozPredEntries.push({ label:`Predict Dozen ${d}`, nums:DOZEN_NUMS[d] })
    )
  } else {
    if (d1Cold) dozPredEntries.push({ label:'D1 due', nums:DOZEN1_NUMS })
    if (d2Cold) dozPredEntries.push({ label:'D2 due', nums:DOZEN2_NUMS })
    if (d3Cold) dozPredEntries.push({ label:'D3 due', nums:DOZEN3_NUMS })
  }

  // S13 / S24
  const s13PredEntry = s13Cold ? { label:'S13 due', nums:S13_NUMS } : null
  const s24PredEntry = s24Cold ? { label:'S24 due', nums:S24_NUMS } : null

  // ── Render ────────────────────────────────────────────────────
  const Pill = ({label, color, border}) => (
    <div style={{
      padding:'6px 14px', borderRadius:'6px',
      background:color, border:border||`1px solid ${color}`,
      fontWeight:800, fontSize:'0.78rem', color:'#fff',
      display:'flex', flexDirection:'column', alignItems:'center', gap:'1px'
    }}>{label}</div>
  )

  return (
    <div className="scrollable-logs-zone">

      {/* PREDICT BOX — labels only */}
      <div className="list-box" style={{ border:'1px solid #d4af37', background:'#0d0d0d', minHeight:'48px' }}>
        <div className="box-header" style={{ color:'#d4af37' }}>🎯 Predictions</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {rowHot && [1,2,3].filter(r=>r!==rowHot).map(r=>(
            <Pill key={`r${r}`} label={`Row ${r}`} color={rowColors[r]} />
          ))}
          {dozHot && [1,2,3].filter(d=>d!==dozHot).map(d=>(
            <Pill key={`d${d}`} label={`Dozen ${d}`} color={dozColors[d]} />
          ))}
          {zoneHot && (
            <Pill label={zoneHot==='ZL'?'ZR':'ZL'} color='#6a1b9a' border='1px solid #ba68c8' />
          )}
          {udHot && (
            <Pill label={udHot==='UP'?'DOWN':'UP'} color={udHot==='UP'?'#b71c1c':'#00695c'} />
          )}
          {nos19Pred && (
            <Pill label='19 Nos ↑' color='#1b5e20' border='1px solid #00E676' />
          )}
          {altNos19Pred && (
            <Pill label='Alt 19 ↑' color='#0d47a1' border='1px solid #42a5f5' />
          )}
          {voisinsPred && (
            <Pill label='Voisins' color='#1565c0' border='1px solid #42a5f5' />
          )}
          {rbPred && (
            <Pill label={rbPred} color={rbPred==='Red'?'#c0202e':'#222'} border={rbPred==='Red'?'1px solid #ff6677':'1px solid #666'} />
          )}
          {oePred && (
            <Pill label={oePred} color={oePred==='Odd'?'#7b1fa2':'#1565c0'} />
          )}
          {hlPred && (
            <Pill label={hlPred} color={hlPred==='High'?'#e65100':'#01579b'} />
          )}
          {/* COLD */}
          {r1Cold    && <Pill label='R1 due'    color='#1976d2' border='1px solid #42a5f5' />}
          {r2Cold    && <Pill label='R2 due'    color='#7b1fa2' border='1px solid #ba68c8' />}
          {r3Cold    && <Pill label='R3 due'    color='#d32f2f' border='1px solid #ef5350' />}
          {d1Cold    && <Pill label='D1 due'    color='#00838f' border='1px solid #26c6da' />}
          {d2Cold    && <Pill label='D2 due'    color='#c2185b' border='1px solid #ff4081' />}
          {d3Cold    && <Pill label='D3 due'    color='#f57f17' border='1px solid #fbc02d' />}
          {zlCold    && <Pill label='ZL due'    color='#0d47a1' border='1px solid #2196f3' />}
          {zrCold    && <Pill label='ZR due'    color='#4a148c' border='1px solid #9c27b0' />}
          {upCold    && <Pill label='UP due'    color='#1b5e20' border='1px solid #4caf50' />}
          {dnCold    && <Pill label='DN due'    color='#880e4f' border='1px solid #e91e63' />}
          {redCold   && <Pill label='Red due'   color='#b71c1c' border='1px solid #f44336' />}
          {blackCold && <Pill label='Black due' color='#212121' border='1px solid #666'    />}
          {oddCold   && <Pill label='Odd due'   color='#512da8' border='1px solid #7c4dff' />}
          {evenCold  && <Pill label='Even due'  color='#0277bd' border='1px solid #03a9f4' />}
          {highCold  && <Pill label='High due'  color='#e65100' border='1px solid #ff9800' />}
          {lowCold   && <Pill label='Low due'   color='#01579b' border='1px solid #0288d1' />}
          {s13Cold   && <Pill label='S13 due'   color='#b45309' border='1px solid #f59e0b' />}
          {s24Cold   && <Pill label='S24 due'   color='#1e3a8a' border='1px solid #60a5fa' />}
        </div>
      </div>

      {/* 1. Hit History */}
      <Box header="Hit History">
        {rev.map((n,i) => n === null
          ? <Divider key={i} />
          : <Ball key={i} n={n} bg={HIT_COLORS[i%2]} text="#000" />
        )}
      </Box>

      {/* 2. Sorted */}
      <Box header="Sorted">
        {sorted.map((n,i) => { const c=getBallStyle(n); return <Ball key={i} n={n} bg={c.bg} text={c.text} /> })}
      </Box>

      {/* 3. Alternate Neighbour */}
      <div className="list-box">
        <div className="box-header">Alternate Neighbour (2L · N · 2R)</div>
        {altLastNum !== null ? (
          <>
            <div style={{ fontSize:'0.65rem', color:'#aaa', marginBottom:'6px' }}>
              Alt: <strong style={{ color:'#42a5f5' }}>{altLastNum}</strong>
            </div>
            <div className="flex-wrap">
              {get5Neighbours(altLastNum).map((n,i) => {
                const c = getBallStyle(n)
                return (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                    <Ball n={n} bg={c.bg} text={c.text} outline={i===2?'2.5px solid #42a5f5':undefined}/>
                    {i===2 && <span style={{ fontSize:'0.5rem', color:'#42a5f5' }}>alt</span>}
                  </div>
                )
              })}
            </div>
          </>
        ) : <div style={{ color:'#444', fontSize:'0.75rem' }}>Need 2 spins to show alt neighbour</div>}
      </div>

      {/* 4. 19 Nos */}
      <div className="list-box">
        <div className="box-header">19 Nos</div>
        {lastNum !== null ? (
          <>
            {ynSeries.length > 0 && (
              <div className="flex-wrap" style={{ marginBottom:'10px' }}>
                {[...ynSeries].reverse().map(({n, hit}, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                    <div style={{
                      width:'30px', height:'30px', borderRadius:'4px',
                      background:hit?'#1b5e20':'#7f1d1d',
                      border:hit?'1px solid #00E676':'1px solid #ef5350',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.75rem', fontWeight:900, color:hit?'#00E676':'#ef5350',
                    }}>{hit?'Y':'N'}</div>
                    <span style={{ fontSize:'0.55rem', color:'#666' }}>{n}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-wrap">
              {nineteenNos.map((n,i) => {
                const c = getBallStyle(n)
                return <Ball key={i} n={n} bg={c.bg} text={c.text} outline={n===lastNum?'2.5px solid #ffd700':undefined}/>
              })}
            </div>
          </>
        ) : <div style={{ color:'#444', fontSize:'0.75rem' }}>No spins yet</div>}
      </div>

      {/* 5. Alternate 19 Nos */}
      <div className="list-box">
        <div className="box-header">Alternate 19 Nos</div>
        {altLastNum !== null ? (
          <>
            {(() => {
              const altYN = real.slice(2).map((n, i) => ({
                n, hit: new Set(getWheelNeighbours(real[i], 9)).has(n)
              }))
              return altYN.length > 0 ? (
                <div className="flex-wrap" style={{ marginBottom:'10px' }}>
                  {[...altYN].reverse().map(({n, hit}, i) => (
                    <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                      <div style={{
                        width:'30px', height:'30px', borderRadius:'4px',
                        background:hit?'#1b5e20':'#7f1d1d',
                        border:hit?'1px solid #00E676':'1px solid #ef5350',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'0.75rem', fontWeight:900, color:hit?'#00E676':'#ef5350',
                      }}>{hit?'Y':'N'}</div>
                      <span style={{ fontSize:'0.55rem', color:'#666' }}>{n}</span>
                    </div>
                  ))}
                </div>
              ) : null
            })()}
            <div style={{ fontSize:'0.65rem', color:'#aaa', marginBottom:'8px' }}>
              19 nos of alt <strong style={{ color:'#42a5f5' }}>{altLastNum}</strong>:
            </div>
            <div className="flex-wrap">
              {[...getWheelNeighbours(altLastNum, 9)].sort((a,b)=>a-b).map((n,i) => {
                const c = getBallStyle(n)
                return <Ball key={i} n={n} bg={c.bg} text={c.text} outline={n===altLastNum?'2.5px solid #42a5f5':undefined}/>
              })}
            </div>
          </>
        ) : <div style={{ color:'#444', fontSize:'0.75rem' }}>Need 2 spins to show</div>}
      </div>

      {/* S13 / S24 */}
      <Box header="S13 / S24 Pattern">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          const s = getSector(n)
          const grp = (s==='S1'||s==='S3') ? 'S13' : 'S24'
          const bg  = grp==='S13' ? '#b45309' : '#1e3a8a'
          const brd = grp==='S13' ? '1px solid #f59e0b' : '1px solid #60a5fa'
          return <Tag key={i} bg={bg} border={brd}>{grp}</Tag>
        })}
      </Box>
      {s13PredEntry && <PredNumsBox label={s13PredEntry.label} nums={s13PredEntry.nums} />}
      {s24PredEntry && <PredNumsBox label={s24PredEntry.label} nums={s24PredEntry.nums} />}

      {/* 6. Zone */}
      <Box header="Zone Pattern (ZL / ZR)">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          const z=getZone(n)
          return <Tag key={i} bg={z==='ZL'?'#1565c0':'#6a1b9a'} border={z==='ZL'?'1px solid #42a5f5':'1px solid #ba68c8'}>{z}</Tag>
        })}
      </Box>
      {zonePredEntry && <PredNumsBox label={zonePredEntry.label} nums={zonePredEntry.nums} />}

      {/* 7. Up/Down */}
      <Box header="Up / Down Pattern">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          const ud=getUpDown(n)
          return <Tag key={i} bg={ud==='UP'?'#00695c':ud==='DN'?'#b71c1c':'#333'} border={ud==='UP'?'1px solid #26a69a':ud==='DN'?'1px solid #ef5350':'1px solid #555'}>
            {ud==='UP'?'UP':ud==='DN'?'DN':'Z'}
          </Tag>
        })}
      </Box>
      {udPredEntry && <PredNumsBox label={udPredEntry.label} nums={udPredEntry.nums} />}

      {/* 8. ZV/V/O/T */}
      <Box header="ZV / Voisins / Orphelins / Tiers">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          let bg='#444',label='?'
          if(ZV_N.includes(n)){label='ZV';bg='#1a237e';}
          else if(V_N.includes(n)){label='V';bg='#1565c0';}
          else if(O_N.includes(n)){label='O';bg='#c2185b';}
          else if(T_N.includes(n)){label='T';bg='#f57c00';}
          return <Tag key={i} bg={bg} border={`1px solid ${bg==='#1a237e'?'#42a5f5':bg}`}>{label}</Tag>
        })}
      </Box>
      {voisinsPred && <PredNumsBox label="Predict Voisins" nums={[...V_N].sort((a,b)=>a-b)} />}

      {/* 9. Neighbour */}
      <Box header="Neighbour (R / R1 / R2 / R3 / A / A1 / A2 / A3 / ∅)">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          const {label}=getNeighbourInfo(n,history.length-1-i,history)
          return <NeighbourStar key={i} n={n} label={label}/>
        })}
      </Box>

      {/* 10. Row — no prediction numbers */}
      <Box header="Row Pattern">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const r=n%3===0?3:n%3
          return <Tag key={i} bg={r===1?'#2196f3':r===2?'#9c27b0':'#ff9800'}>R{r}</Tag>
        })}
      </Box>

      {/* 11. Dozen */}
      <Box header="Dozen Pattern">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const d=Math.ceil(n/12)
          return <Tag key={i} bg={d===1?'#00bcd4':d===2?'#e91e63':'#8bc34a'}>D{d}</Tag>
        })}
      </Box>

      {/* 12. Red/Black */}
      <Box header="Red / Black Pattern">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const r=REDS.includes(n)
          return <Tag key={i} bg={r?'#c0202e':'#222'} border={`1px solid ${r?'#ff6677':'#666'}`}>{r?'R':'B'}</Tag>
        })}
      </Box>
      {rbPredEntry && <PredNumsBox label={rbPredEntry.label} nums={rbPredEntry.nums} />}

      {/* 13. Odd/Even */}
      <Box header="Odd / Even Pattern">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const o=n%2!==0
          return <Tag key={i} bg={o?'#7b1fa2':'#1565c0'}>{o?'O':'E'}</Tag>
        })}
      </Box>
      {oePredEntry && <PredNumsBox label={oePredEntry.label} nums={oePredEntry.nums} />}

      {/* 14. High/Low */}
      <Box header="High / Low Pattern">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          return <Tag key={i} bg={n>=19?'#e65100':'#01579b'}>{n>=19?'H':'L'}</Tag>
        })}
      </Box>
      {hlPredEntry && <PredNumsBox label={hlPredEntry.label} nums={hlPredEntry.nums} />}

    </div>
  )
}
