import { REDS, ZV_N, V_N, O_N, T_N, ZONE1, ZONE2, UP_NUMS, DOWN_NUMS } from '../../constants/roulette'
import { getSector } from '../../utils/analysis'

export default function Dashboard({ history }) {
  const v = history.filter(x => x !== 0)
  const zvCnt = history.filter(x => ZV_N.includes(x)).length
  const vCnt  = history.filter(x => V_N.includes(x) && !ZV_N.includes(x)).length
  const oCnt  = history.filter(x => O_N.includes(x)).length
  const tCnt  = history.filter(x => T_N.includes(x)).length
  const cards = [
    { lbl:'Total Spins',          val: String(history.length),                color:'#d4af37' },
    { lbl:'ZL / ZR',              val: `${history.filter(x=>ZONE1.includes(x)).length} / ${history.filter(x=>ZONE2.includes(x)).length}`, color:'#42a5f5' },
    { lbl:'UP / DN',              val: `${history.filter(x=>UP_NUMS.includes(x)).length} / ${history.filter(x=>DOWN_NUMS.includes(x)).length}`, color:'#26a69a' },
    { lbl:'S1/S2/S3/S4',          val: `${history.filter(x=>getSector(x)==='S1').length} / ${history.filter(x=>getSector(x)==='S2').length} / ${history.filter(x=>getSector(x)==='S3').length} / ${history.filter(x=>getSector(x)==='S4').length}`, color:'#ff9800', small:true },
    { lbl:'ZV/V/O/T',             val: null },
    { lbl:'Row1/Row2/Row3',       val: `${v.filter(x=>x%3===1).length} / ${v.filter(x=>x%3===2).length} / ${v.filter(x=>x%3===0).length}`, color:'#d4af37', small:true },
    { lbl:'Dozen1/Dozen2/Dozen3', val: `${v.filter(x=>x<=12).length} / ${v.filter(x=>x>=13&&x<=24).length} / ${v.filter(x=>x>=25).length}`, color:'#d4af37', small:true },
    { lbl:'Red / Black',          val: `${history.filter(x=>REDS.includes(x)).length} / ${v.filter(x=>!REDS.includes(x)).length}`, color:'#d4af37' },
    { lbl:'Odd / Even',           val: `${v.filter(x=>x%2!==0).length} / ${v.filter(x=>x%2===0).length}`, color:'#d4af37' },
    { lbl:'High / Low',           val: `${v.filter(x=>x>=19).length} / ${v.filter(x=>x>=1&&x<=18).length}`, color:'#d4af37' },
  ]
  return (
    <div className="dashboard">
      {cards.map((c, i) => (
        <div className="card" key={i}>
          <span className="lbl">{c.lbl}</span>
          {c.val !== null
            ? <div className="val" style={{ color:c.color, fontSize:c.small?'0.88rem':'1rem' }}>{c.val}</div>
            : <div className="val" style={{ fontSize:'0.88rem' }}>
                <span style={{ color:'#42a5f5' }}>{zvCnt} / {vCnt}</span>
                <span style={{ color:'#888' }}> / </span>
                <span style={{ color:'#ff9800' }}>{oCnt} / {tCnt}</span>
              </div>
          }
        </div>
      ))}
    </div>
  )
}
