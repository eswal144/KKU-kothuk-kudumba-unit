'use client'

import { useEffect, useState } from 'react'

interface RollingDigitProps {
  digit: string | number
  height?: number
  width?: number
}

export default function RollingDigit({ digit, height = 48, width = 32 }: RollingDigitProps) {
  const targetNum = typeof digit === 'number' ? digit : parseInt(digit, 10)
  const isNumber = !isNaN(targetNum)

  // Track position index on our extended wheel track [0..9, 0]
  const [currentIndex, setCurrentIndex] = useState(isNumber ? targetNum : 0)

  useEffect(() => {
    if (!isNumber) return
    setCurrentIndex(targetNum)
  }, [targetNum, isNumber])

  if (!isNumber) {
    // Render static separator (e.g. comma)
    return (
      <div
        style={{
          width: '16px',
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--mint)',
          userSelect: 'none',
          opacity: 0.8
        }}
      >
        ,
      </div>
    )
  }

  // Wheel track contains digits 0 through 9
  const digitList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(180deg, #090c0a 0%, #161c18 50%, #090c0a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '3px',
        boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.8), inset 0 -4px 6px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)',
        margin: '0 2px'
      }}
    >
      {/* Subtle Glare Overlay for Mechanical Cylinder Effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      {/* Horizontal Alignment Guideline */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'rgba(16, 185, 129, 0.15)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      {/* Rolling Cylinder Wheel */}
      <div
        style={{
          transform: `translateY(-${currentIndex * height}px)`,
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {digitList.map((num, i) => (
          <div
            key={i}
            style={{
              width: `${width}px`,
              height: `${height}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono, monospace), Courier, monospace',
              color: '#f8fafc',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
              userSelect: 'none',
              flexShrink: 0
            }}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  )
}
