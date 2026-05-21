import { REDS, ZV_N, V_N, O_N, T_N, ZONE1, ZONE2, UP_NUMS, DOWN_NUMS } from '../../constants/roulette'
import { getSector, getNeighbourInfo, getWheelNeighbours } from '../../utils/analysis'

export default function Dashboard({ history }) {
  const v = history.filter(x => x !== 0)

  // Neighbour label counts
  const nbrLabels = history.map((n, i) => getNeighbourInfo(n, i, history).label)
  const count = label => nbrLabels.filter(l => l === label).length

  // 19 Nos Y/N counts
  const ynResults = history.slice(1).map((n, i) => new Set(getWheelNeighbours(history[i], 9)).has(n))
  const yCount = ynResults.filter(Boolean).length
  const nCount = ynResults.filter(x => !x).length

  const zvCnt = history.filter(x => ZV_N.includes(x)).length
  const vCnt  = history.filter(x => V_N.includes(x) && !ZV_N.includes(x)).length
  const oCnt  = history.filter(x => O_N.includes(x)).length
  const tCnt  = history.filter(x => T_N.includes(x)).length

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
      val: null,
      isYN: true,
      yCount, nCount,
    },
    {
      lbl: 'UP / DN',
      val: `${history.filter(x => UP_NUMS.includes(x)).length} / ${history.filter(x => DOWN_NUMS.includes(x)).length}`,
      color: '#26a69a',
    },
    {
      lbl: 'ZL / ZR',
      val: `${history.filter(x => ZONE1.includes(x)).length} / ${history.filter(x => ZONE2.includes(x)).length}`,
      color: '#42a5f5',
    },
    {
      lbl: 'ZV/V/O/T',
      val: null,
      isVOT: true,
      zvCnt, vCnt, oCnt, tCnt,
    },
    {
      lbl: 'S1/S2/S3/S4',
      val: `${history.filter(x=>getSector(x)==='S1').length}/${history.filter(x=>getSector(x)==='S2').length}/${history.filter(x=>getSector(x)==='S3').length}/${history.filter(x=>getSector(x)==='S4').length}`,
      color: '#e65100',
      small: true,
    },
    {
      lbl: 'Dozen 1/2/3',
      val: `${v.filter(x=>x<=12).length}/${v.filter(x=>x>=13&&x<=24).length}/${v.filter(x=>x>=25).length}`,
      color: '#d4af37',
      small: true,
    },
    {
      lbl: 'Row 1/2/3',
      val: `${v.filter(x=>x%3===1).length}/${v.filter(x=>x%3===2).length}/${v.filter(x=>x%3===0).length}`,
      color: '#d4af37',
      small: true,
    },
    {
      lbl: 'Odd / Even',
      val: `${v.filter(x=>x%2!==0).length} / ${v.filter(x=>x%2===0).length}`,
      color: '#9c27b0',
    },
    {
      lbl: 'High / Low',
      val: `${v.filter(x=>x>=19).length} / ${v.filter(x=>x>=1&&x<=18).length}`,
      color: '#ff9800',
    },
    {
      lbl: 'Red / Black',
      val: `${history.filter(x=>REDS.includes(x)).length} / ${v.filter(x=>!REDS.includes(x)).length}`,
      color: '#e63946',
    },
  ]

  return (
    <div className="dashboard">
      {cards.map((c, i) => (
        <div className="card" key={i}>
          <span className="lbl">{c.lbl}</span>
          {c.isYN ? (
            <div className="val" style={{ fontSize:'0.82rem' }}>
              <span style={{ color:'#00E676' }}>{c.yCount}Y</span>
              <span style={{ color:'#555' }}> / </span>
              <span style={{ color:'#ef5350' }}>{c.nCount}N</span>
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
