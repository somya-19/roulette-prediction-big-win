import { REDS, ZV_N, V_N, O_N, T_N, ZONE1, ZONE2, UP_NUMS, DOWN_NUMS } from '../../constants/roulette'
import { getSector, getNeighbourInfo, getWheelNeighbours } from '../../utils/analysis'

export default function Dashboard({ history: rawHistory }) {
  const history = rawHistory.filter(x => x !== null)
  const v = history.filter(x => x !== 0)

  // Neighbour label counts
  const nbrLabels = history.map((n, i) => getNeighbourInfo(n, i, history).label)
  const count = label => nbrLabels.filter(l => l === label).length

  // 19 Nos Y/N counts
  const ynResults = history.slice(1).map((n, i) => new Set(getWheelNeighbours(history[i], 9)).has(n))
  const yCount = ynResults.filter(Boolean).length
  const nCount = ynResults.filter(x => !x).length

  // Alternate 19 Nos Y/N (spin vs spin-2-ago's 17 nos)
  const altYN    = history.slice(2).map((n, i) => new Set(getWheelNeighbours(history[i], 9)).has(n))
  const altYCount = altYN.filter(Boolean).length
  const altNCount = altYN.filter(x => !x).length

  const zvCnt = history.filter(x => ZV_N.includes(x)).length
  const vCnt  = history.filter(x => V_N.includes(x) && !ZV_N.includes(x)).length
  const oCnt  = history.filter(x => O_N.includes(x)).length
  const tCnt  = history.filter(x => T_N.includes(x)).length

  // Prediction flags for blinking dashboard cards
  const last3   = history.slice(-3)
  const rowOf   = n => n === 0 ? null : (n % 3 === 0 ? 3 : n % 3)
  const dozOf   = n => n === 0 ? null : Math.ceil(n / 12)
  const rNums   = last3.map(rowOf)
  const dNums   = last3.map(dozOf)
  const rowPred = last3.length === 3 && rNums[0] !== null && rNums.every(r => r === rNums[0])
  const dozPred = last3.length === 3 && dNums[0] !== null && dNums.every(d => d === dNums[0])

  // Zone — 5 consecutive
  const z6 = history.slice(-5).map(x => ZONE1.includes(x)?'ZL':ZONE2.includes(x)?'ZR':null)
  const zonePred = z6.length===5 && z6[0]!==null && z6.every(z=>z===z6[0])

  // Up/Down — 5 consecutive
  const ud6 = history.filter(x=>UP_NUMS.includes(x)||DOWN_NUMS.includes(x)).slice(-5)
  const udPred = ud6.length===5 && ud6.every(n=>(UP_NUMS.includes(n)===UP_NUMS.includes(ud6[0])))

  // Red/Black — 7 consecutive
  let rbStreak=0, rbLast=null
  for(let i=history.length-1;i>=0;i--){
    const cur=history[i]===0?null:(REDS.includes(history[i])?'R':'B')
    if(cur===null) break
    if(i===history.length-1) rbLast=cur
    if(cur===rbLast) rbStreak++; else break
  }
  const rbPred = rbStreak >= 7

  // Odd/Even — 7 consecutive
  const vOE = history.filter(x=>x!==0)
  let oeStreak=0, oeLast=null
  for(let i=vOE.length-1;i>=0;i--){
    const cur=vOE[i]%2!==0?'O':'E'
    if(i===vOE.length-1) oeLast=cur
    if(cur===oeLast) oeStreak++; else break
  }
  const oePred = oeStreak >= 7

  // High/Low — 7 consecutive
  let hlStreak=0, hlLast=null
  for(let i=vOE.length-1;i>=0;i--){
    const cur=vOE[i]>=19?'H':'L'
    if(i===vOE.length-1) hlLast=cur
    if(cur===hlLast) hlStreak++; else break
  }
  const hlPred = hlStreak >= 7

  // 19 Nos — 3 consecutive N
  const yn19 = history.filter(x=>x!==null).slice(1).map((n,i,arr)=>new Set(getWheelNeighbours(arr[i],9)).has(n))
  const nos19Pred = yn19.slice(-3).length===3 && yn19.slice(-3).every(x=>!x)

  // Alt 19 Nos — 3 consecutive N
  const realH = history.filter(x=>x!==null)
  const altYN2 = realH.slice(2).map((n,i)=>new Set(getWheelNeighbours(realH[i],9)).has(n))
  const altNos19Pred = altYN2.slice(-3).length===3 && altYN2.slice(-3).every(x=>!x)

  // Voisins — T+O streak 7
  let toStreak=0
  for(let i=history.length-1;i>=0;i--){
    if(history[i]===null) break
    const v=ZV_N.includes(history[i])?'ZV':V_N.includes(history[i])?'V':O_N.includes(history[i])?'O':T_N.includes(history[i])?'T':'?'
    if(v==='T'||v==='O') toStreak++; else break
  }
  const voisinsPred = toStreak >= 7


  // COLD PREDICTIONS — haven't hit for N spins
  function spinsSince(predFn) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i] !== null && predFn(history[i])) return i === history.length - 1 ? 0 : history.length - 1 - i
    }
    return history.length
  }

  const r1Cold = spinsSince(n => n !== 0 && n % 3 === 1) >= 9
  const r2Cold = spinsSince(n => n !== 0 && n % 3 === 2) >= 9
  const r3Cold = spinsSince(n => n !== 0 && n % 3 === 0) >= 9
  const d1Cold = spinsSince(n => n !== 0 && n <= 12) >= 9
  const d2Cold = spinsSince(n => n !== 0 && n >= 13 && n <= 24) >= 9
  const d3Cold = spinsSince(n => n !== 0 && n >= 25) >= 9
  const zlCold = spinsSince(n => ZONE1.includes(n)) >= 9
  const zrCold = spinsSince(n => ZONE2.includes(n)) >= 9
  const upCold = spinsSince(n => UP_NUMS.includes(n)) >= 9
  const dnCold = spinsSince(n => DOWN_NUMS.includes(n)) >= 9
  const redCold = spinsSince(n => n !== 0 && REDS.includes(n)) >= 9
  const blackCold = spinsSince(n => n !== 0 && !REDS.includes(n)) >= 9
  const oddCold = spinsSince(n => n !== 0 && n % 2 !== 0) >= 9
  const evenCold = spinsSince(n => n !== 0 && n % 2 === 0) >= 9
  const highCold = spinsSince(n => n !== 0 && n >= 19) >= 9
  const lowCold = spinsSince(n => n !== 0 && n <= 18) >= 9
  const s13Cold = spinsSince(n => getSector(n) === 'S1' || getSector(n) === 'S3') >= 9
  const s24Cold = spinsSince(n => getSector(n) === 'S2' || getSector(n) === 'S4') >= 9

  const cards = [
    {
      lbl: 'Total Spins',
      val: String(history.length),
      color: '#d4af37',
    },
    {
      lbl: 'R/R1/R2/R3',
      val: `${count('R')}/${count('R1')}/${count('R2')}/${count('R3')}`,
      color: '#d4af37',
      small: true,
    },
    {
      lbl: 'A/A1/A2/A3',
      val: `${count('A')}/${count('A1')}/${count('A2')}/${count('A3')}`,
      color: '#ff9800',
      small: true,
    },
    {
      lbl: '19 Nos Y / N',
      blink: nos19Pred,
      val: null,
      isYN: true,
      yCount, nCount,
    },
    {
      lbl: 'Alt 19 Y / N',
      blink: altNos19Pred,
      val: null,
      isAltYN: true,
      altYCount, altNCount,
    },
    {
      lbl: 'UP / DN',
      blink: udPred || upCold || dnCold,
      val: `${history.filter(x => UP_NUMS.includes(x)).length} / ${history.filter(x => DOWN_NUMS.includes(x)).length}`,
      color: '#26a69a',
    },
    {
      lbl: 'ZL / ZR',
      blink: zonePred || zlCold || zrCold,
      val: `${history.filter(x => ZONE1.includes(x)).length} / ${history.filter(x => ZONE2.includes(x)).length}`,
      color: '#42a5f5',
    },
    {
      lbl: 'ZV/V/O/T',
      blink: voisinsPred,
      val: null,
      isVOT: true,
      zvCnt, vCnt, oCnt, tCnt,
    },
    {
      lbl: 'S13 / S24',
      blink: s13Cold || s24Cold,
      val: `${history.filter(x=>getSector(x)==='S1'||getSector(x)==='S3').length} / ${history.filter(x=>getSector(x)==='S2'||getSector(x)==='S4').length}`,
      color: '#f59e0b',
    },
    {
      lbl: 'Dozen 1/2/3',
      blink: dozPred || d1Cold || d2Cold || d3Cold,
      val: `${v.filter(x=>x<=12).length}/${v.filter(x=>x>=13&&x<=24).length}/${v.filter(x=>x>=25).length}`,
      color: '#d4af37',
      small: true,
    },
    {
      lbl: 'Row 1/2/3',
      blink: rowPred || r1Cold || r2Cold || r3Cold,
      val: `${v.filter(x=>x%3===1).length}/${v.filter(x=>x%3===2).length}/${v.filter(x=>x%3===0).length}`,
      color: '#d4af37',
      small: true,
    },
    {
      lbl: 'Odd / Even',
      blink: oePred || oddCold || evenCold,
      val: `${v.filter(x=>x%2!==0).length} / ${v.filter(x=>x%2===0).length}`,
      color: '#9c27b0',
    },
    {
      lbl: 'High / Low',
      blink: hlPred || highCold || lowCold,
      val: `${v.filter(x=>x>=19).length} / ${v.filter(x=>x>=1&&x<=18).length}`,
      color: '#ff9800',
    },
    {
      lbl: 'Red / Black',
      blink: rbPred || redCold || blackCold,
      val: `${history.filter(x=>REDS.includes(x)).length} / ${v.filter(x=>!REDS.includes(x)).length}`,
      color: '#e63946',
    },
  ]

  return (
    <div className="dashboard">
      {cards.map((c, i) => (
        <div className="card" key={i} style={{
          ...(c.blink ? { animation:'predictBlink 1s ease-in-out infinite', border:'1px solid #d4af37', boxShadow:'0 0 8px #d4af37' } : {})
        }}>
          <span className="lbl">{c.lbl}</span>
          {c.isYN ? (
            <div className="val" style={{ fontSize:'0.82rem' }}>
              <span style={{ color:'#00E676' }}>{c.yCount}Y</span>
              <span style={{ color:'#555' }}> / </span>
              <span style={{ color:'#ef5350' }}>{c.nCount}N</span>
            </div>
          ) : c.isAltYN ? (
            <div className="val" style={{ fontSize:'0.82rem' }}>
              <span style={{ color:'#00E676' }}>{c.altYCount}Y</span>
              <span style={{ color:'#555' }}> / </span>
              <span style={{ color:'#ef5350' }}>{c.altNCount}N</span>
            </div>
          ) : c.isVOT ? (
            <div className="val" style={{ fontSize:'0.78rem' }}>
              <span style={{ color:'#42a5f5' }}>{c.zvCnt}/{c.vCnt}</span>
              <span style={{ color:'#555' }}>/</span>
              <span style={{ color:'#ff9800' }}>{c.oCnt}/{c.tCnt}</span>
            </div>
          ) : (
            <div className="val" style={{ color:c.color, fontSize:c.small?'0.78rem':'1rem' }}>
              {c.val}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
