import { useState, useEffect } from 'react'

const sliderStyle = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  background: '#333',
  outline: 'none',
  WebkitAppearance: 'none',
}

export default function Settings() {
  const [open, setOpen] = useState(false)
  const [thresholds, setThresholds] = useState({
    row: 6,
    dozen: 6,
    zone: 6,
    updn: 6,
    rbc: 7,
    oe: 7,
    hl: 7,
    s13s24: 6,
  })

  useEffect(() => {
    const saved = localStorage.getItem('predictionThresholds')
    if (saved) {
      try {
        setThresholds(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load thresholds')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('predictionThresholds', JSON.stringify(thresholds))
  }, [thresholds])

  const updateThreshold = (key, value) => {
    setThresholds(prev => ({ ...prev, [key]: parseInt(value) }))
  }

  const SliderRow = ({ label, key, min = 3, max = 15 }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.8rem', color: '#d4af37', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.9rem', color: '#42a5f5', fontWeight: 700 }}>{thresholds[key]}+</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={thresholds[key]}
        onChange={e => updateThreshold(key, e.target.value)}
        style={sliderStyle}
      />
    </div>
  )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: '#d4af37',
          color: '#000',
          fontSize: '1.2rem',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 999,
        }}
      >
        ⚙️
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '300px',
      maxHeight: '90vh',
      background: '#0d0d0d',
      border: '2px solid #d4af37',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      overflowY: 'auto',
      zIndex: 999,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.9rem', color: '#d4af37', fontWeight: 700 }}>⚙️ THRESHOLDS</span>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#d4af37',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ borderTop: '1px solid #333', paddingTop: '12px' }}>
        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>
          Pattern not hit for N spins → predict
        </div>

        <SliderRow label="Row 1/2/3" key="row" min={3} max={15} />
        <SliderRow label="Dozen 1/2/3" key="dozen" min={3} max={15} />
        <SliderRow label="Zone (ZL/ZR)" key="zone" min={3} max={15} />
        <SliderRow label="Up / Down" key="updn" min={3} max={15} />
        <SliderRow label="Red / Black" key="rbc" min={4} max={15} />
        <SliderRow label="Odd / Even" key="oe" min={4} max={15} />
        <SliderRow label="High / Low" key="hl" min={4} max={15} />
        <SliderRow label="S13 / S24" key="s13s24" min={3} max={15} />
      </div>

      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #333',
        fontSize: '0.65rem',
        color: '#555',
        lineHeight: '1.4',
      }}>
        💡 Higher = more conservative (waits longer)
        <br/>
        Lower = more aggressive (predicts sooner)
      </div>
    </div>
  )
}
