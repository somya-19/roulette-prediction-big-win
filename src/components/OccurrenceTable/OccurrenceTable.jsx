import { REDS } from '../../constants/roulette'

export default function OccurrenceTable({ history }) {
  return (
    <div>
      <div className="box-header" style={{ fontSize:'1rem' }}>Occurrence Table</div>
      <div className="table-row" style={{ position:'sticky', top:0, zIndex:10, background:'#000' }}>
        <div className="row-n" style={{ color:'#aaa', fontSize:'0.65rem' }}>#</div>
        <div className="row-c" style={{ color:'#aaa', fontSize:'0.65rem' }}>CNT</div>
        <div className="row-h" style={{ color:'#aaa', fontSize:'0.65rem' }}>SPINS</div>
      </div>
      {Array.from({ length: 37 }, (_, i) => {
        const count = history.filter(x => x === i).length
        const spins = history.map((x,idx) => x===i ? idx+1 : null).filter(Boolean).join(', ')
        return (
          <div className="table-row" key={i}>
            <div className="row-n" style={{ color: i===0?'#0f8':REDS.includes(i)?'#f44':'#fff' }}>{i}</div>
            <div className="row-c">{count}</div>
            <div className="row-h">{count ? spins : '-'}</div>
          </div>
        )
      })}
    </div>
  )
}
