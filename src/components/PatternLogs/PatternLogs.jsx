import { REDS, ZV_N, V_N, O_N, T_N, SECTOR_COLORS } from '../../constants/roulette'
import { getZone, getUpDown, getSector, getNeighbourInfo } from '../../utils/analysis'

const Tag  = ({ bg, border, children }) => <div className="tag" style={{ background:bg, border:border||`1px solid ${bg}` }}>{children}</div>
const NTag = ({ bg, text='#fff', num, label }) => <div className="ntag" style={{ background:bg, color:text }}><span style={{ fontSize:'0.6rem', opacity:0.7 }}>{num}</span><span>{label}</span></div>
const Ball = ({ n, bg, text }) => <div className="mini-ball" style={{ background:bg, color:text }}>{n}</div>
const Box  = ({ header, children }) => <div className="list-box"><div className="box-header">{header}</div><div className="flex-wrap">{children}</div></div>

export default function PatternLogs({ history }) {
  const rev    = [...history].reverse()
  const sorted = [...history].sort((a, b) => a - b)

  return (
    <div className="scrollable-logs-zone">

      <Box header="Hit History">
        {rev.map((n, i) => <Ball key={i} n={n} bg={i%2===0?'#FFD700':'#00E676'} text="#000" />)}
      </Box>

      <Box header="Sorted">
        {sorted.map((n, i) => {
          const c = n===0 ? {bg:'#00ff88',t:'#000'} : REDS.includes(n) ? {bg:'#e63946',t:'#fff'} : {bg:'#1a1a1a',t:'#fff'}
          return <Ball key={i} n={n} bg={c.bg} text={c.t} />
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
          const bg = ud==='UP' ? '#00695c' : ud==='DN' ? '#b71c1c' : '#333'
          const border = ud==='UP' ? '1px solid #26a69a' : ud==='DN' ? '1px solid #ef5350' : '1px solid #555'
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
