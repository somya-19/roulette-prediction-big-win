import { REDS, ZV_N, V_N, O_N, T_N, SECTOR_COLORS, WHEEL_ORDER } from '../../constants/roulette'
import { getZone, getUpDown, getSector, getNeighbourInfo, getWheelNeighbours } from '../../utils/analysis'

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
    WHEEL_ORDER[(idx-2+len)%len],
    WHEEL_ORDER[(idx-1+len)%len],
    WHEEL_ORDER[idx],
    WHEEL_ORDER[(idx+1)%len],
    WHEEL_ORDER[(idx+2)%len],
  ]
}

const HIT_COLORS = ['#FF9F43','#54A0FF']

export default function PatternLogs({ history }) {
  const rev    = [...history].reverse()
  const sorted = [...history].sort((a,b) => a-b)

  const lastNum    = history.length >= 1 ? history[history.length-1] : null
  const altLastNum = history.length >= 2 ? history[history.length-2] : null

  // 19 nos of last spin sorted ascending
  const nineteenNos = lastNum !== null
    ? [...getWheelNeighbours(lastNum, 9)].sort((a,b) => a-b)
    : []

  // Y/N series: for each spin from index 1, did it land in prev spin's 19?
  const ynSeries = history.slice(1).map((n, i) => ({
    n,
    hit: new Set(getWheelNeighbours(history[i], 9)).has(n)
  }))

  return (
    <div className="scrollable-logs-zone">

      {/* 1. Hit History */}
      <Box header="Hit History">
        {rev.map((n,i) => <Ball key={i} n={n} bg={HIT_COLORS[i%2]} text="#000" />)}
      </Box>

      {/* 2. Sorted */}
      <Box header="Sorted">
        {sorted.map((n,i) => { const c=getBallStyle(n); return <Ball key={i} n={n} bg={c.bg} text={c.text} /> })}
      </Box>

      {/* 3. Alternate Neighbour — Alt only (2 spins ago) */}
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

      {/* 4. 19 Nos — simplified: just Y/N tags then 19 numbers */}
      <div className="list-box">
        <div className="box-header">19 Nos</div>
        {lastNum !== null ? (
          <>
            {/* Y/N series only — no extra text */}
            {ynSeries.length > 0 && (
              <div className="flex-wrap" style={{ marginBottom:'10px' }}>
                {[...ynSeries].reverse().map(({n, hit}, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                    <div style={{
                      width:'30px', height:'30px', borderRadius:'4px',
                      background: hit?'#1b5e20':'#7f1d1d',
                      border: hit?'1px solid #00E676':'1px solid #ef5350',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.75rem', fontWeight:900,
                      color: hit?'#00E676':'#ef5350',
                    }}>{hit?'Y':'N'}</div>
                    <span style={{ fontSize:'0.55rem', color:'#666' }}>{n}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 19 numbers ascending — no labels, no legend */}
            <div className="flex-wrap">
              {nineteenNos.map((n,i) => {
                const c   = getBallStyle(n)
                const isN = n === lastNum
                return (
                  <Ball key={i} n={n} bg={c.bg} text={c.text}
                    outline={isN?'2.5px solid #ffd700':undefined}/>
                )
              })}
            </div>
          </>
        ) : <div style={{ color:'#444', fontSize:'0.75rem' }}>No spins yet</div>}
      </div>

      {/* 5. Zone */}
      <Box header="Zone Pattern (ZL / ZR)">
        {rev.map((n,i) => {
          const z=getZone(n)
          return <Tag key={i} bg={z==='ZL'?'#1565c0':'#6a1b9a'} border={z==='ZL'?'1px solid #42a5f5':'1px solid #ba68c8'}>{z}</Tag>
        })}
      </Box>

      {/* 6. Up/Down */}
      <Box header="Up / Down Pattern">
        {rev.map((n,i) => {
          const ud=getUpDown(n)
          return <Tag key={i} bg={ud==='UP'?'#00695c':ud==='DN'?'#b71c1c':'#333'} border={ud==='UP'?'1px solid #26a69a':ud==='DN'?'1px solid #ef5350':'1px solid #555'}>
            {ud==='UP'?'UP':ud==='DN'?'DN':'Z'}
          </Tag>
        })}
      </Box>

      {/* 7. ZV/V/O/T */}
      <Box header="ZV / Voisins / Orphelins / Tiers">
        {rev.map((n,i) => {
          let bg='#444',label='?'
          if(ZV_N.includes(n)){label='ZV';bg='#1a237e';}
          else if(V_N.includes(n)){label='V';bg='#1565c0';}
          else if(O_N.includes(n)){label='O';bg='#c2185b';}
          else if(T_N.includes(n)){label='T';bg='#f57c00';}
          return <Tag key={i} bg={bg} border={`1px solid ${bg==='#1a237e'?'#42a5f5':bg}`}>{label}</Tag>
        })}
      </Box>

      {/* 8. Neighbour */}
      <Box header="Neighbour (R / R1 / R2 / R3 / A / A1 / A2 / A3 / ∅)">
        {rev.map((n,i) => {
          const {label,bg,text}=getNeighbourInfo(n,history.length-1-i,history)
          return <NTag key={i} bg={bg} text={text} num={n} label={label}/>
        })}
      </Box>

      {/* 9. Row */}
      <Box header="Row Pattern">
        {rev.map((n,i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const r=n%3===0?3:n%3
          return <Tag key={i} bg={r===1?'#2196f3':r===2?'#9c27b0':'#ff9800'}>R{r}</Tag>
        })}
      </Box>

      {/* 10. Dozen */}
      <Box header="Dozen Pattern">
        {rev.map((n,i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const d=Math.ceil(n/12)
          return <Tag key={i} bg={d===1?'#00bcd4':d===2?'#e91e63':'#8bc34a'}>D{d}</Tag>
        })}
      </Box>

      {/* 11. Red/Black */}
      <Box header="Red / Black Pattern">
        {rev.map((n,i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const r=REDS.includes(n)
          return <Tag key={i} bg={r?'#c0202e':'#222'} border={`1px solid ${r?'#ff6677':'#666'}`}>{r?'R':'B'}</Tag>
        })}
      </Box>

      {/* 12. Odd/Even */}
      <Box header="Odd / Even Pattern">
        {rev.map((n,i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const o=n%2!==0
          return <Tag key={i} bg={o?'#7b1fa2':'#1565c0'}>{o?'O':'E'}</Tag>
        })}
      </Box>

      {/* 13. High/Low */}
      <Box header="High / Low Pattern">
        {rev.map((n,i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          return <Tag key={i} bg={n>=19?'#e65100':'#01579b'}>{n>=19?'H':'L'}</Tag>
        })}
      </Box>

      {/* 14. Sector */}
      <Box header="Sector Pattern (S1 / S2 / S3 / S4)">
        {rev.map((n,i) => {
          const s=getSector(n)
          return <Tag key={i} bg={SECTOR_COLORS[s]||'#333'}>{s}</Tag>
        })}
      </Box>

    </div>
  )
}
