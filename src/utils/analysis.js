import { WHEEL_ORDER, REDS, V_N, ZV_N, O_N, T_N, ZONE1, ZONE2, UP_NUMS, DOWN_NUMS, SECTOR_MAP } from '../constants/roulette'

export const getZone   = n => ZONE1.includes(n) ? 'ZL' : ZONE2.includes(n) ? 'ZR' : '?'
export const getUpDown = n => UP_NUMS.includes(n) ? 'UP' : DOWN_NUMS.includes(n) ? 'DN' : '?'
export const getSector = n => SECTOR_MAP[n] || '?'

export function getVOT(n) {
  if (ZV_N.includes(n)) return 'ZV'
  if (V_N.includes(n))  return 'V'
  if (O_N.includes(n))  return 'O'
  if (T_N.includes(n))  return 'T'
  return '?'
}

export function wheelIdx(n) { return WHEEL_ORDER.indexOf(n) }

export function neighbourDist(prev, curr) {
  if (prev == null) return null
  const pi = wheelIdx(prev), ci = wheelIdx(curr)
  if (pi < 0 || ci < 0) return null
  const len  = WHEEL_ORDER.length
  const diff = Math.min(Math.abs(ci - pi), len - Math.abs(ci - pi))
  if (diff === 1) return '1N'
  if (diff === 2) return '2N'
  if (diff === 3) return '3N'
  return null
}

export function getNeighbourInfo(n, origIdx, histArr) {
  const prev1 = origIdx > 0 ? histArr[origIdx - 1] : null
  const prev2 = origIdx > 1 ? histArr[origIdx - 2] : null
  const prev3 = origIdx > 2 ? histArr[origIdx - 3] : null
  if (prev1 === null)                              return { label:'∅',   bg:'#2a2a2a', text:'#888' }
  if (n === prev1)                                 return { label:'R',   bg:'#d4af37', text:'#000' }
  if (prev2 !== null && n === prev2)               return { label:'AR',  bg:'#e65100', text:'#fff' }
  if (prev2 !== null && neighbourDist(prev2, n))   return { label:'2AN', bg:'#6a1b9a', text:'#fff' }
  if (prev3 !== null && neighbourDist(prev3, n))   return { label:'3AN', bg:'#880e4f', text:'#fff' }
  const d = neighbourDist(prev1, n)
  if (d === '1N') return { label:'1N', bg:'#1b5e20', text:'#fff' }
  if (d === '2N') return { label:'2N', bg:'#1a237e', text:'#fff' }
  if (d === '3N') return { label:'3N', bg:'#4a0080', text:'#fff' }
  return { label:'∅', bg:'#2a2a2a', text:'#888' }
}

export function buildStats(history) {
  const v = history.filter(x => x !== 0)
  return {
    totalSpins:   history.length,
    red:          history.filter(x => REDS.includes(x)).length,
    black:        v.filter(x => !REDS.includes(x)).length,
    odd:          v.filter(x => x % 2 !== 0).length,
    even:         v.filter(x => x % 2 === 0).length,
    high:         v.filter(x => x >= 19).length,
    low:          v.filter(x => x >= 1 && x <= 18).length,
    zero:         history.filter(x => x === 0).length,
    dozen1:       v.filter(x => x <= 12).length,
    dozen2:       v.filter(x => x >= 13 && x <= 24).length,
    dozen3:       v.filter(x => x >= 25).length,
    row1:         v.filter(x => x % 3 === 1).length,
    row2:         v.filter(x => x % 3 === 2).length,
    row3:         v.filter(x => x % 3 === 0).length,
    zeroVoisins:  history.filter(x => ZV_N.includes(x)).length,
    voisins:      history.filter(x => V_N.includes(x) && !ZV_N.includes(x)).length,
    orphelins:    history.filter(x => O_N.includes(x)).length,
    tiers:        history.filter(x => T_N.includes(x)).length,
    zone1:        history.filter(x => ZONE1.includes(x)).length,
    zone2:        history.filter(x => ZONE2.includes(x)).length,
    sector1:      history.filter(x => getSector(x) === 'S1').length,
    sector2:      history.filter(x => getSector(x) === 'S2').length,
    sector3:      history.filter(x => getSector(x) === 'S3').length,
    sector4:      history.filter(x => getSector(x) === 'S4').length,
  }
}
