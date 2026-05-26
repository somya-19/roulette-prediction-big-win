import { REDS, ZV_N, V_N, O_N, T_N, SECTOR_COLORS, WHEEL_ORDER, ZONE1, ZONE2, UP_NUMS, DOWN_NUMS } from '../../constants/roulette'
import { getZone, getUpDown, getSector, getNeighbourInfo, getWheelNeighbours, getVOT } from '../../utils/analysis'

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

// Helper: find last real number in history (skip nulls)
function lastReal(hist, fromEnd = 1) {
  let count = 0
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i] !== null) { count++; if (count === fromEnd) return hist[i] }
  }
  return null
}

const HIT_COLORS = ['#FF9F43','#54A0FF']

export default function PatternLogs({ history }) {
  const rev    = [...history].reverse()
  const sorted = history.filter(x => x !== null).sort((a,b) => a-b)
  const real   = history.filter(x => x !== null)  // all real numbers, no markers

  // Last and alternate last — skip null markers
  const lastNum    = lastReal(history, 1)
  const altLastNum = lastReal(history, 2)

  // 19 nos of last spin
  const nineteenNos = lastNum !== null
    ? [...getWheelNeighbours(lastNum, 9)].sort((a,b) => a-b)
    : []

  // Y/N series for 19 nos — skip null markers
  const ynSeries = real.slice(1).map((n, i) => ({
    n,
    hit: new Set(getWheelNeighbours(real[i], 9)).has(n)
  }))


  return (
    <div className="scrollable-logs-zone">

      {/* PREDICT BOX */}
      {(() => {
        const real2 = history.filter(x => x !== null)

        // 1. Row — 2 consecutive same
        const last2r  = real2.slice(-2).map(n => n===0?null:(n%3===0?3:n%3))
        const rowHot  = last2r.length===2 && last2r[0]!==null && last2r[0]===last2r[1] ? last2r[0] : null
        const rowColors = {1:'#2196f3',2:'#9c27b0',3:'#ff9800'}

        // 2. Dozen — 2 consecutive same
        const last2d  = real2.slice(-2).map(n => n===0?null:Math.ceil(n/12))
        const dozHot  = last2d.length===2 && last2d[0]!==null && last2d[0]===last2d[1] ? last2d[0] : null
        const dozColors = {1:'#00bcd4',2:'#e91e63',3:'#8bc34a'}

        // 3. Zone — 6 consecutive same
        const z6  = real2.slice(-6).map(getZone)
        const zoneHot = z6.length===6 && z6.every(z=>z===z6[0]) ? z6[0] : null

        // 4. Up/Down — 6 consecutive same
        const ud6 = real2.slice(-6).map(getUpDown).filter(x=>x!=='?')
        const udHot = ud6.length===6 && ud6.every(u=>u===ud6[0]) ? ud6[0] : null

        // 5. 19 Nos — 3 consecutive N
        const yn19   = real2.slice(1).map((n,i) => new Set(getWheelNeighbours(real2[i],9)).has(n))
        const last3yn = yn19.slice(-3)
        const nos19Pred = last3yn.length===3 && last3yn.every(x=>!x)

        // 6. Alternate 19 Nos — 3 consecutive N
        const altYN   = real2.slice(2).map((n,i) => new Set(getWheelNeighbours(real2[i],9)).has(n))
        const last3alt = altYN.slice(-3)
        const altNos19Pred = last3alt.length===3 && last3alt.every(x=>!x)

        // 7. Tiers + Orphelins 7 consecutive → predict Voisins
        let toStreak = 0
        for(let i=real2.length-1;i>=0;i--){
          const v=getVOT(real2[i])
          if(v==='T'||v==='O') toStreak++; else break
        }
        const voisinsPred = toStreak >= 7

        // 8. Red/Black — 7 consecutive
        let rbStreak=0, rbLast=null
        for(let i=real2.length-1;i>=0;i--){
          const cur = real2[i]===0?null:(REDS.includes(real2[i])?'R':'B')
          if(cur===null) break
          if(i===real2.length-1) rbLast=cur
          if(cur===rbLast) rbStreak++; else break
        }
        const rbPred = rbStreak>=7 ? (rbLast==='R'?'Black':'Red') : null

        // 9. Odd/Even — 7 consecutive
        let oeStreak=0, oeLast=null
        for(let i=real2.length-1;i>=0;i--){
          const cur = real2[i]===0?null:(real2[i]%2!==0?'O':'E')
          if(cur===null) break
          if(i===real2.length-1) oeLast=cur
          if(cur===oeLast) oeStreak++; else break
        }
        const oePred = oeStreak>=7 ? (oeLast==='O'?'Even':'Odd') : null

        // 10. High/Low — 7 consecutive
        let hlStreak=0, hlLast=null
        for(let i=real2.length-1;i>=0;i--){
          const cur = real2[i]===0?null:(real2[i]>=19?'H':'L')
          if(cur===null) break
          if(i===real2.length-1) hlLast=cur
          if(cur===hlLast) hlStreak++; else break
        }
        const hlPred = hlStreak>=7 ? (hlLast==='H'?'Low':'High') : null


        // ── COLD PREDICTIONS — patterns that haven't hit for N spins ──────
        // Helper: find spins since last hit of a pattern
        function spinsSince(predFn) {
          for (let i = real2.length - 1; i >= 0; i--) {
            if (predFn(real2[i])) return i === real2.length - 1 ? 0 : real2.length - 1 - i
          }
          return real2.length
        }

        // Rows (threshold: 6 spins)
        const r1Cold = spinsSince(n => n !== 0 && n % 3 === 1) >= 9
        const r2Cold = spinsSince(n => n !== 0 && n % 3 === 2) >= 9
        const r3Cold = spinsSince(n => n !== 0 && n % 3 === 0) >= 9

        // Dozens (threshold: 6 spins)
        const d1Cold = spinsSince(n => n !== 0 && n <= 12) >= 9
        const d2Cold = spinsSince(n => n !== 0 && n >= 13 && n <= 24) >= 9
        const d3Cold = spinsSince(n => n !== 0 && n >= 25) >= 9

        // Zone (threshold: 6 spins)
        const zlCold = spinsSince(n => ZONE1.includes(n)) >= 9
        const zrCold = spinsSince(n => ZONE2.includes(n)) >= 9

        // Up/Down (threshold: 6 spins)
        const upCold = spinsSince(n => UP_NUMS.includes(n)) >= 9
        const dnCold = spinsSince(n => DOWN_NUMS.includes(n)) >= 9

        // Red/Black (threshold: 7 spins)
        const redCold = spinsSince(n => n !== 0 && REDS.includes(n)) >= 9
        const blackCold = spinsSince(n => n !== 0 && !REDS.includes(n)) >= 9

        // Odd/Even (threshold: 7 spins)
        const oddCold = spinsSince(n => n !== 0 && n % 2 !== 0) >= 9
        const evenCold = spinsSince(n => n !== 0 && n % 2 === 0) >= 9

        // High/Low (threshold: 7 spins)
        const highCold = spinsSince(n => n !== 0 && n >= 19) >= 9
        const lowCold = spinsSince(n => n !== 0 && n <= 18) >= 9

        // S13/S24 (threshold: 6 spins)
        const s13Cold = spinsSince(n => getSector(n) === 'S1' || getSector(n) === 'S3') >= 9
        const s24Cold = spinsSince(n => getSector(n) === 'S2' || getSector(n) === 'S4') >= 9


                const Pill = ({label, color, border}) => (
          <div style={{
            padding:'6px 14px', borderRadius:'6px',
            background:color, border:border||`1px solid ${color}`,
            fontWeight:800, fontSize:'0.78rem', color:'#fff',
            display:'flex', flexDirection:'column', alignItems:'center', gap:'1px'
          }}>{label}</div>
        )

        const hasPred = rowHot||dozHot||zoneHot||udHot||nos19Pred||altNos19Pred||voisinsPred||rbPred||oePred||hlPred

        return (
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

              {/* COLD PREDICTIONS — due to hit soon */}
              {r1Cold && <Pill label='R1 due' color='#1976d2' border='1px solid #42a5f5' />}
              {r2Cold && <Pill label='R2 due' color='#7b1fa2' border='1px solid #ba68c8' />}
              {r3Cold && <Pill label='R3 due' color='#d32f2f' border='1px solid #ef5350' />}
              {d1Cold && <Pill label='D1 due' color='#00838f' border='1px solid #26c6da' />}
              {d2Cold && <Pill label='D2 due' color='#c2185b' border='1px solid #ff4081' />}
              {d3Cold && <Pill label='D3 due' color='#f57f17' border='1px solid #fbc02d' />}
              {zlCold && <Pill label='ZL due' color='#0d47a1' border='1px solid #2196f3' />}
              {zrCold && <Pill label='ZR due' color='#4a148c' border='1px solid #9c27b0' />}
              {upCold && <Pill label='UP due' color='#1b5e20' border='1px solid #4caf50' />}
              {dnCold && <Pill label='DN due' color='#880e4f' border='1px solid #e91e63' />}
              {redCold && <Pill label='Red due' color='#b71c1c' border='1px solid #f44336' />}
              {blackCold && <Pill label='Black due' color='#212121' border='1px solid #666' />}
              {oddCold && <Pill label='Odd due' color='#512da8' border='1px solid #7c4dff' />}
              {evenCold && <Pill label='Even due' color='#0277bd' border='1px solid #03a9f4' />}
              {highCold && <Pill label='High due' color='#e65100' border='1px solid #ff9800' />}
              {lowCold && <Pill label='Low due' color='#01579b' border='1px solid #0288d1' />}
              {s13Cold && <Pill label='S13 due' color='#b45309' border='1px solid #f59e0b' />}
              {s24Cold && <Pill label='S24 due' color='#1e3a8a' border='1px solid #60a5fa' />}
            </div>
          </div>
        )
      })()}

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

      {/* S13 / S24 box */}
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

      {/* 6. Zone */}
      <Box header="Zone Pattern (ZL / ZR)">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          const z=getZone(n)
          return <Tag key={i} bg={z==='ZL'?'#1565c0':'#6a1b9a'} border={z==='ZL'?'1px solid #42a5f5':'1px solid #ba68c8'}>{z}</Tag>
        })}
      </Box>

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

      {/* 9. Neighbour */}
      <Box header="Neighbour (R / R1 / R2 / R3 / A / A1 / A2 / A3 / ∅)">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          const {label,bg,text}=getNeighbourInfo(n,history.length-1-i,history)
          return <NTag key={i} bg={bg} text={text} num={n} label={label}/>
        })}
      </Box>

      {/* 10. Row */}
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

      {/* 13. Odd/Even */}
      <Box header="Odd / Even Pattern">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const o=n%2!==0
          return <Tag key={i} bg={o?'#7b1fa2':'#1565c0'}>{o?'O':'E'}</Tag>
        })}
      </Box>

      {/* 14. High/Low */}
      <Box header="High / Low Pattern">
        {rev.map((n,i) => {
          if(n===null) return <Divider key={i}/>
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          return <Tag key={i} bg={n>=19?'#e65100':'#01579b'}>{n>=19?'H':'L'}</Tag>
        })}
      </Box>

    </div>
  )
}
