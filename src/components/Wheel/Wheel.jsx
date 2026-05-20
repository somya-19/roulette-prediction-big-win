import { useEffect, useRef } from 'react'
import { WHEEL_ORDER, REDS, ZV_N, V_N, O_N, T_N, ZONE1, ZONE2 } from '../../constants/roulette'

const total = WHEEL_ORDER.length
const cx = 450, cy = 200, rx = 400, ry = 160
const votColor = n => ZV_N.includes(n)?'#1a237e':V_N.includes(n)?'#1565c0':O_N.includes(n)?'#c2185b':T_N.includes(n)?'#f57c00':'#555'
const votLabel = n => ZV_N.includes(n)?'ZV':V_N.includes(n)?'V':O_N.includes(n)?'O':T_N.includes(n)?'T':'?'

export default function Wheel({ history, onSelect, fields, onFieldChange }) {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''
    const ns = 'http://www.w3.org/2000/svg'
    const el = (tag, attrs) => {
      const e = document.createElementNS(ns, tag)
      Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, v))
      return e
    }

    svg.appendChild(el('ellipse', { cx, cy, rx:rx+22, ry:ry+22, fill:'none', stroke:'#333', 'stroke-width':1 }))

    const bRx=rx*0.78, bRy=ry*0.78, biRx=rx*0.55, biRy=ry*0.55
    let sections = [], curr = null
    WHEEL_ORDER.forEach((n, i) => {
      const lbl = votLabel(n), col = votColor(n), a = (i/total)*2*Math.PI
      if (!curr || curr.label !== lbl) { curr = {label:lbl, color:col, sa:a, ea:a}; sections.push(curr) }
      else curr.ea = a
    })
    sections.forEach(s => {
      const slot=(2*Math.PI/total), sa=s.sa-slot*0.3, ea=s.ea+slot*0.3
      const x1o=cx+bRx*Math.cos(sa), y1o=cy+bRy*Math.sin(sa)
      const x2o=cx+bRx*Math.cos(ea), y2o=cy+bRy*Math.sin(ea)
      const x1i=cx+biRx*Math.cos(ea), y1i=cy+biRy*Math.sin(ea)
      const x2i=cx+biRx*Math.cos(sa), y2i=cy+biRy*Math.sin(sa)
      const lg = (ea-sa)>Math.PI?1:0
      svg.appendChild(el('path',{d:`M ${x1o} ${y1o} A ${bRx} ${bRy} 0 ${lg} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${biRx} ${biRy} 0 ${lg} 0 ${x2i} ${y2i} Z`, fill:s.color, opacity:'0.18'}))
      svg.appendChild(el('path',{d:`M ${x1o} ${y1o} A ${bRx} ${bRy} 0 ${lg} 1 ${x2o} ${y2o}`, fill:'none', stroke:s.color, 'stroke-width':'2.5', opacity:'0.7'}))
      const midA=(s.sa+s.ea)/2, lx=cx+((bRx+biRx)/2)*Math.cos(midA), ly=cy+((bRy+biRy)/2)*Math.sin(midA)
      const lt = el('text',{x:lx, y:ly+6, 'text-anchor':'middle', fill:s.color, 'font-size':'22', 'font-weight':'900', 'font-family':'Segoe UI,sans-serif', opacity:'0.9'})
      lt.textContent = s.label; svg.appendChild(lt)
    })

    const drawZone = (nums, color) => {
      const idxs = nums.map(n => WHEEL_ORDER.indexOf(n)).filter(i => i>=0).sort((a,b)=>a-b)
      if (!idxs.length) return
      const oRx=rx+14, oRy=ry+14
      const aS=(idxs[0]/total)*2*Math.PI-(Math.PI/total)
      const aE=(idxs[idxs.length-1]/total)*2*Math.PI+(Math.PI/total)
      const lg=(aE-aS)>Math.PI?1:0
      const x1=cx+oRx*Math.cos(aS), y1=cy+oRy*Math.sin(aS)
      const x2=cx+oRx*Math.cos(aE), y2=cy+oRy*Math.sin(aE)
      svg.appendChild(el('path',{d:`M ${x1} ${y1} A ${oRx} ${oRy} 0 ${lg} 1 ${x2} ${y2}`, fill:'none', stroke:color, 'stroke-width':'4', opacity:'0.75', 'stroke-linecap':'round'}))
    }
    drawZone(ZONE1, '#42a5f5')
    drawZone(ZONE2, '#ba68c8')

    const grp = el('g', { id:'wheel-group' })
    WHEEL_ORDER.forEach((n, i) => {
      const angle=(i/total)*2*Math.PI, bx=cx+rx*Math.cos(angle), by=cy+ry*Math.sin(angle)
      const fill   = n===0?'#00cc66':REDS.includes(n)?'#c0202e':'#1c1c1c'
      const stroke = n===0?'#00ff88':REDS.includes(n)?'#ff6677':'#555'
      const g = el('g', { id:`w-${n}`, style:'cursor:pointer' })
      g.onclick = () => onSelect(n)
      const zColor = ZONE1.includes(n)?'#42a5f5':ZONE2.includes(n)?'#ba68c8':null
      if (zColor) {
        g.appendChild(el('circle', { cx:bx, cy:by, r:25, fill:'none', stroke:zColor, 'stroke-width':'2', opacity:'0.5' }))
      }
      const circ = el('circle', { cx:bx, cy:by, r:22, fill, stroke, 'stroke-width':'1.5', id:`wc-${n}` })
      g.appendChild(circ)
      const txt = el('text', { x:bx, y:by+5, 'text-anchor':'middle', fill:n===0?'#000':'#fff', 'font-size':n>=10?'16':'18', 'font-weight':'900', 'font-family':'Segoe UI,sans-serif' })
      txt.textContent = n; g.appendChild(txt)
      grp.appendChild(g)
    })
    svg.appendChild(grp)

    // Centre input fields
    const fo = document.createElementNS(ns, 'foreignObject')
    fo.setAttribute('x', 450-90); fo.setAttribute('y', 200-75)
    fo.setAttribute('width', '180'); fo.setAttribute('height', '150')
    fo.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;flex-direction:column;gap:5px;">
      <input id="wf-casino" placeholder="Casino Name" maxlength="16" style="width:100%;background:rgba(0,0,0,0.7);border:1px solid #555;border-radius:4px;color:#d4af37;font-size:0.65rem;font-weight:700;padding:4px 6px;text-align:center;outline:none;-webkit-user-select:text;user-select:text;"/>
      <input id="wf-dealer" placeholder="Dealer Name"  maxlength="14" style="width:100%;background:rgba(0,0,0,0.7);border:1px solid #555;border-radius:4px;color:#d4af37;font-size:0.65rem;font-weight:700;padding:4px 6px;text-align:center;outline:none;-webkit-user-select:text;user-select:text;"/>
      <input id="wf-table"  placeholder="Table No."    maxlength="6"  style="width:100%;background:rgba(0,0,0,0.7);border:1px solid #555;border-radius:4px;color:#d4af37;font-size:0.65rem;font-weight:700;padding:4px 6px;text-align:center;outline:none;-webkit-user-select:text;user-select:text;"/>
      <input id="wf-date"   type="date"                               style="width:100%;background:rgba(0,0,0,0.7);border:1px solid #555;border-radius:4px;color:#d4af37;font-size:0.65rem;font-weight:700;padding:4px 6px;text-align:center;outline:none;-webkit-user-select:text;user-select:text;"/>
      <select id="wf-spin" style="width:100%;background:rgba(0,0,0,0.7);border:1px solid #555;border-radius:4px;color:#d4af37;font-size:0.65rem;font-weight:700;padding:4px 6px;outline:none;">
        <option value="" disabled selected>Spin Type</option>
        <option value="Clockwise">↻ Clockwise</option>
        <option value="Anti-Clockwise">↺ Anti-Clockwise</option>
      </select>
    </div>`
    svg.appendChild(fo)

    setTimeout(() => {
      const map = [['casino','casino'],['dealer','dealer'],['table','table'],['date','date'],['spin','spinType']]
      map.forEach(([f, k]) => {
        const inp = document.getElementById(`wf-${f}`)
        if (!inp) return
        inp.value = fields[k] || ''
        inp.addEventListener('input',  e => onFieldChange(k, e.target.value))
        inp.addEventListener('change', e => onFieldChange(k, e.target.value))
      })
    }, 50)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.querySelectorAll('[id^="wc-"]').forEach(c => {
      c.setAttribute('stroke-width', '1.5')
      c.classList.remove('wheel-ring-selected', 'wheel-ring-history')
    })
    new Set(history).forEach(n => {
      const c = document.getElementById(`wc-${n}`)
      if (c) c.classList.add('wheel-ring-history')
    })
    if (history.length) {
      const last = history[history.length - 1]
      const c = document.getElementById(`wc-${last}`)
      if (c) { c.classList.remove('wheel-ring-history'); c.classList.add('wheel-ring-selected') }
    }
  }, [history])

  return (
    <div className="wheel-box">
      <svg ref={svgRef} className="wheel-svg" viewBox="0 0 900 400" overflow="visible" xmlns="http://www.w3.org/2000/svg" />
    </div>
  )
}
