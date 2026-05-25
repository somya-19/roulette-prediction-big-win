import { REDS } from '../../constants/roulette'

export default function Board({ history, onSelect }) {
  const last = [...history].reverse().find(x => x !== null) ?? null
  return (
    <div className="board-wrap">
      <div className={`zero-cell${last === 0 ? ' selected' : ''}`} onClick={() => onSelect(0)}>0</div>
      <div className="board-grid">
        {Array.from({ length: 12 }, (_, c) =>
          [3, 2, 1].map(r => {
            const n = c * 3 + r
            return (
              <div key={n}
                className={`board-cell${last === n ? ' selected' : ''}`}
                style={{ background: REDS.includes(n) ? '#e63946' : '#1a1a1a' }}
                onClick={() => onSelect(n)}>
                {n}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
