'use client'

import RollingDigit from './RollingDigit'

interface PopulationOdometerProps {
  value: number
  digitHeight?: number
  digitWidth?: number
}

export default function PopulationOdometer({
  value,
  digitHeight = 52,
  digitWidth = 36
}: PopulationOdometerProps) {
  // Format with commas, e.g., 1,284,920 -> ["1", ",", "2", "8", "4", ",", "9", "2", "0"]
  const formattedStr = value.toLocaleString('en-US')
  const characters = formattedStr.split('')

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 18px',
        background: 'linear-gradient(180deg, #050806 0%, #111713 50%, #050806 100%)',
        border: '1.5px solid var(--mint)',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 15px rgba(16, 185, 129, 0.15), inset 0 2px 4px rgba(255,255,255,0.05)',
        position: 'relative'
      }}
    >
      {/* Top Metallic Bevel Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, var(--mint) 50%, transparent 100%)',
          opacity: 0.6
        }}
      />

      {/* Digits Container */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {characters.map((char, index) => (
          <RollingDigit
            key={`${index}-${char === ',' ? 'comma' : 'num'}`}
            digit={char}
            height={digitHeight}
            width={digitWidth}
          />
        ))}
      </div>

      {/* Bottom Metallic Accent Line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, var(--mint) 50%, transparent 100%)',
          opacity: 0.4
        }}
      />
    </div>
  )
}
