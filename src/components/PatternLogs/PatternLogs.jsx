import { REDS, ZV_N, V_N, O_N, T_N, SECTOR_COLORS, WHEEL_ORDER } from '../../constants/roulette'
import { getZone, getUpDown, getSector, getNeighbourInfo } from '../../utils/analysis'

const Tag  = ({ bg, border, children }) => <div className="tag" style={{ background:bg, border:border||`1px solid ${bg}` }}>{children}</div>
const NTag = ({ bg, text='#fff', num, label }) => <div className="ntag" style={{ background:bg, color:text }}><span style={{ fontSize:'0.6rem', opacity:0.7 }}>{num}</span><span>{label}</span></div>
const Ball = ({ n, bg, text }) => <div className="mini-ball" style={{ background:bg, color:text }}>{n}</div>
const Box  = ({ header, children }) => <div className="list-box"><div className="box-header">{header}</div><div className="flex-wrap">{children}</div></div>

// Get 5 wheel neighbours of a number: 2 left, the number itself, 2 right
function get5Neighbours(n) {
  const idx = WHEEL_ORDER.indexOf(n)
  if (idx < 0) return []
  const len = WHEEL_ORDER.length
  return [
    WHEEL_ORDER[(idx - 2 + len) % len],
    WHEEL_ORDER[(idx - 1 + len) % len],
    WHEEL_ORDER[idx],
    WHEEL_ORDER[(idx + 1) % len],
    WHEEL_ORDER[(idx + 2) % len],
  ]
}

function getBallColor(n) {
  if (n === 0) return { bg:'#00ff88', text:'#000' }
  if (REDS.includes(n)) return { bg:'#e63946', text:'#fff' }
  return { bg:'#333', text:'#fff' }
}

// Vibrant alternating colours for hit history — not red
const HIT_COLORS = [
  '#FF9F43', // orange
  '#54A0FF', // blue
]

export default function PatternLogs({ history }) {
  const rev    = [...history].reverse()
  const sorted = [...history].sort((a, b) => a - b)

  // Last number and alternate last number
  const lastNum    = history.length >= 1 ? history[history.length - 1] : null
  const altLastNum = history.length >= 2 ? history[history.length - 2] : null

  const lastNeighbours    = lastNum    !== null ? get5Neighbours(lastNum)    : []
  const altLastNeighbours = altLastNum !== null ? get5Neighbours(altLastNum) : []

  return (
    <div className="scrollable-logs-zone">

      {/* Hit History — vibrant orange / blue alternating */}
      <Box header="Hit History">
        {rev.map((n, i) => <Ball key={i} n={n} bg={HIT_COLORS[i % 2]} text="#000" />)}
      </Box>

      {/* Neighbour of Last + Alternate Last */}
      <div className="list-box">
        <div className="box-header">Last Number Neighbours (2L · N · 2R)</div>

        {lastNum !== null ? (
          <>
            <div style={{ fontSize:'0.65rem', color:'#aaa', marginBottom:'6px' }}>
              Last spin: <strong style={{ color:'#d4af37' }}>{lastNum}</strong> — 5 wheel neighbours
            </div>
            <div className="flex-wrap" style={{ marginBottom:'10px' }}>
              {lastNeighbours.map((n, i) => {
                const c = getBallColor(n)
                const isCenter = i === 2
                return (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                    <div className="mini-ball" style={{
                      background: c.bg, color: c.text,
                      outline: isCenter ? '2px solid #ffd700' : 'none',
                      boxShadow: isCenter ? '0 0 8px #ffd700' : 'none',
                      transform: isCenter ? 'scale(1.15)' : 'scale(1)',
                    }}>{n}</div>
                    {isCenter && <span style={{ fontSize:'0.55rem', color:'#d4af37' }}>last</span>}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ color:'#444', fontSize:'0.75rem' }}>No spins yet</div>
        )}

        {altLastNum !== null && (
          <>
            <div style={{ fontSize:'0.65rem', color:'#aaa', marginBottom:'6px', marginTop:'4px' }}>
              Alternate last: <strong style={{ color:'#42a5f5' }}>{altLastNum}</strong> — 5 wheel neighbours
            </div>
            <div className="flex-wrap">
              {altLastNeighbours.map((n, i) => {
                const c = getBallColor(n)
                const isCenter = i === 2
                return (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                    <div className="mini-ball" style={{
                      background: c.bg, color: c.text,
                      outline: isCenter ? '2px solid #42a5f5' : 'none',
                      boxShadow: isCenter ? '0 0 8px #42a5f5' : 'none',
                      transform: isCenter ? 'scale(1.15)' : 'scale(1)',
                    }}>{n}</div>
                    {isCenter && <span style={{ fontSize:'0.55rem', color:'#42a5f5' }}>alt</span>}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Sorted */}
      <Box header="Sorted">
        {sorted.map((n, i) => {
          const c = n===0?{bg:'#00ff88',text:'#000'}:REDS.includes(n)?{bg:'#e63946',text:'#fff'}:{bg:'#1a1a1a',text:'#fff'}
          return <Ball key={i} n={n} bg={c.bg} text={c.text} />
        })}
      </Box>

      <Box header="Zone Pattern (ZL / ZR)">
        {rev.map((n, i) => {
          const z = getZone(n)
          return <Tag key={i} bg={z==='ZL'?'#1565c0':'#6a1b9a'} border={z==='ZL'?'1px solid #42a5f5':'1px solid #ba68c8'}>{z}</Tag>
        })}
      </Box>

      <Box header="Up / Down Pattern">
        {rev.map((n, i) => {
          const ud = getUpDown(n)
          const bg = ud==='UP'?'#00695c':ud==='DN'?'#b71c1c':'#333'
          const border = ud==='UP'?'1px solid #26a69a':ud==='DN'?'1px solid #ef5350':'1px solid #555'
          return <Tag key={i} bg={bg} border={border}>{ud==='UP'?'UP':ud==='DN'?'DN':'Z'}</Tag>
        })}
      </Box>

      <Box header="ZV / Voisins / Orphelins / Tiers">
        {rev.map((n, i) => {
          let bg='#444', label='?'
          if(ZV_N.includes(n)){label='ZV';bg='#1a237e';}
          else if(V_N.includes(n)){label='V';bg='#1565c0';}
          else if(O_N.includes(n)){label='O';bg='#c2185b';}
          else if(T_N.includes(n)){label='T';bg='#f57c00';}
          return <Tag key={i} bg={bg} border={`1px solid ${bg==='#1a237e'?'#42a5f5':bg}`}>{label}</Tag>
        })}
      </Box>

      <Box header="Neighbour (R / AR / 2AN / 3AN / 1N / 2N / 3N / ∅)">
        {rev.map((n, i) => {
          const { label, bg, text } = getNeighbourInfo(n, history.length-1-i, history)
          return <NTag key={i} bg={bg} text={text} num={n} label={label} />
        })}
      </Box>

      <Box header="Row Pattern">
        {rev.map((n, i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const r = n%3===0?3:n%3
          return <Tag key={i} bg={r===1?'#2196f3':r===2?'#9c27b0':'#ff9800'}>R{r}</Tag>
        })}
      </Box>

      <Box header="Dozen Pattern">
        {rev.map((n, i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const d = Math.ceil(n/12)
          return <Tag key={i} bg={d===1?'#00bcd4':d===2?'#e91e63':'#8bc34a'}>D{d}</Tag>
        })}
      </Box>

      <Box header="Red / Black Pattern">
        {rev.map((n, i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const r = REDS.includes(n)
          return <Tag key={i} bg={r?'#c0202e':'#222'} border={`1px solid ${r?'#ff6677':'#666'}`}>{r?'R':'B'}</Tag>
        })}
      </Box>

      <Box header="Odd / Even Pattern">
        {rev.map((n, i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          const o = n%2!==0
          return <Tag key={i} bg={o?'#7b1fa2':'#1565c0'}>{o?'O':'E'}</Tag>
        })}
      </Box>

      <Box header="High / Low Pattern">
        {rev.map((n, i) => {
          if(n===0) return <Tag key={i} bg="#00ff88"><span style={{color:'#000'}}>Z</span></Tag>
          return <Tag key={i} bg={n>=19?'#e65100':'#01579b'}>{n>=19?'H':'L'}</Tag>
        })}
      </Box>

      <Box header="Sector Pattern (S1 / S2 / S3 / S4)">
        {rev.map((n, i) => {
          const s = getSector(n)
          return <Tag key={i} bg={SECTOR_COLORS[s]||'#333'}>{s}</Tag>
        })}
      </Box>

    </div>
  )
}
