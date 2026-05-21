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

// Returns wheel distance (1, 2, 3) between two numbers, or null if > 3
export function neighbourDist(a, b) {
  if (a == null || b == null) return null
  const ai = wheelIdx(a), bi = wheelIdx(b)
  if (ai < 0 || bi < 0) return null
  const len  = WHEEL_ORDER.length
  const diff = Math.min(Math.abs(bi - ai), len - Math.abs(bi - ai))
  if (diff === 1) return 1
  if (diff === 2) return 2
  if (diff === 3) return 3
  return null
}

// ── Neighbour Classification ─────────────────────────────────────
//
// R series  — based on spin -1 (previous spin):
//   R   = same number as spin -1
//   R1  = 1 wheel step from spin -1
//   R2  = 2 wheel steps from spin -1
//   R3  = 3 wheel steps from spin -1
//
// A series  — based on spin -2 (alternate / 2 spins ago):
//   A   = same number as spin -2
//   A1  = 1 wheel step from spin -2
//   A2  = 2 wheel steps from spin -2
//   A3  = 3 wheel steps from spin -2
//
// Priority: R > R1 > R2 > R3 > A > A1 > A2 > A3 > ∅
// (If a number qualifies for both R3 and A, R3 wins)
// ────────────────────────────────────────────────────────────────
export function getNeighbourInfo(n, origIdx, histArr) {
  const prev1 = origIdx > 0 ? histArr[origIdx - 1] : null  // spin -1
  const prev2 = origIdx > 1 ? histArr[origIdx - 2] : null  // spin -2

  // No previous spin at all
  if (prev1 === null) return { label:'∅', bg:'#2a2a2a', text:'#888' }

  // ── R series (spin -1) ───────────────────────────────────────
  if (n === prev1) return { label:'R',  bg:'#d4af37', text:'#000' }

  const d1 = neighbourDist(prev1, n)
  if (d1 === 1) return { label:'R1', bg:'#1b5e20', text:'#fff' }
  if (d1 === 2) return { label:'R2', bg:'#1a237e', text:'#fff' }
  if (d1 === 3) return { label:'R3', bg:'#4a0080', text:'#fff' }

  // ── A series (spin -2) ───────────────────────────────────────
  if (prev2 !== null) {
    if (n === prev2) return { label:'A',  bg:'#e65100', text:'#fff' }

    const d2 = neighbourDist(prev2, n)
    if (d2 === 1) return { label:'A1', bg:'#6a1b9a', text:'#fff' }
    if (d2 === 2) return { label:'A2', bg:'#880e4f', text:'#fff' }
    if (d2 === 3) return { label:'A3', bg:'#c62828', text:'#fff' }
  }

  return { label:'∅', bg:'#2a2a2a', text:'#888' }
}

// Get N neighbours each side on wheel (returns 2N+1 numbers in wheel order)
export function getWheelNeighbours(n, eachSide = 9) {
  const idx = WHEEL_ORDER.indexOf(n)
  if (idx < 0) return []
  const len = WHEEL_ORDER.length
  const result = []
  for (let i = -eachSide; i <= eachSide; i++) {
    result.push(WHEEL_ORDER[(idx + i + len) % len])
  }
  return result
}

export function buildStats(history) {
  const v = history.filter(x => x !== 0)
  return {
    red:         history.filter(x => REDS.includes(x)).length,
    black:       v.filter(x => !REDS.includes(x)).length,
    odd:         v.filter(x => x % 2 !== 0).length,
    even:        v.filter(x => x % 2 === 0).length,
    high:        v.filter(x => x >= 19).length,
    low:         v.filter(x => x >= 1 && x <= 18).length,
    zero:        history.filter(x => x === 0).length,
    dozen1:      v.filter(x => x <= 12).length,
    dozen2:      v.filter(x => x >= 13 && x <= 24).length,
    dozen3:      v.filter(x => x >= 25).length,
    row1:        v.filter(x => x % 3 === 1).length,
    row2:        v.filter(x => x % 3 === 2).length,
    row3:        v.filter(x => x % 3 === 0).length,
    zeroVoisins: history.filter(x => ZV_N.includes(x)).length,
    voisins:     history.filter(x => V_N.includes(x) && !ZV_N.includes(x)).length,
    orphelins:   history.filter(x => O_N.includes(x)).length,
    tiers:       history.filter(x => T_N.includes(x)).length,
    zone1:       history.filter(x => ZONE1.includes(x)).length,
    zone2:       history.filter(x => ZONE2.includes(x)).length,
    sector1:     history.filter(x => getSector(x) === 'S1').length,
    sector2:     history.filter(x => getSector(x) === 'S2').length,
    sector3:     history.filter(x => getSector(x) === 'S3').length,
    sector4:     history.filter(x => getSector(x) === 'S4').length,
  }
}
