'use client'

import { Zap, AlertTriangle } from 'lucide-react'

interface SalivaMeterProps {
  currentSalivaNl: number
  maximumSalivaNl: number
  percentage: number
  isLow: boolean
  category: 'ADULT' | 'CHILD'
  isRecharging?: boolean
}

export default function SalivaMeter({
  currentSalivaNl,
  maximumSalivaNl,
  percentage,
  isLow,
  category,
  isRecharging = false
}: SalivaMeterProps) {
  // Generate block gauge visualization (e.g. ███████░░░)
  const totalBlocks = 15
  const filledBlocks = Math.round((percentage / 100) * totalBlocks)
  const emptyBlocks = totalBlocks - filledBlocks
  const gaugeString = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks)

  return (
    <div
      style={{
        background: '#ffffff',
        border: isLow ? '1px solid #ef4444' : '1px solid var(--border)',
        borderRadius: '12px',
        padding: '28px 24px',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        transition: 'all 0.4s ease'
      }}
    >
      {/* Header Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} style={{ color: isLow ? '#dc2626' : 'var(--mint)' }} />
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.16em', fontWeight: 800, color: isLow ? '#dc2626' : 'var(--mint)' }}>
            SALIVA RESERVE METER
          </span>
        </div>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          FICTIONAL SIMULATION MECHANIC
        </span>
      </div>

      {/* Low Saliva Alert Banner */}
      {isLow && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '.08em',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={15} />
          <span>⚠️ LOW SALIVA &bull; Recharge required before next mission</span>
        </div>
      )}

      {/* Main Stats Display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px'
        }}
      >
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
            CURRENT SALIVA
          </span>
          <strong style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-.05em', color: isLow ? '#dc2626' : 'var(--mint)' }}>
            {currentSalivaNl.toFixed(1)} <small style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 600 }}>nL</small>
          </strong>
        </div>

        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
            MAXIMUM CAPACITY ({category})
          </span>
          <strong style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-.05em', color: 'var(--foreground)' }}>
            {maximumSalivaNl.toFixed(1)} <small style={{ fontSize: '14px', color: 'var(--dim)', fontWeight: 600 }}>nL</small>
          </strong>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', fontWeight: 700 }}>
            RECHARGE LEVEL
          </span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: isLow ? '#dc2626' : 'var(--mint)', fontFamily: 'monospace' }}>
            {percentage}%
          </span>
        </div>

        {/* ASCII Block Bar */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '18px',
            letterSpacing: '3px',
            color: isLow ? '#dc2626' : 'var(--mint)',
            marginBottom: '12px'
          }}
        >
          [{gaugeString}]
        </div>

        {/* Smooth CSS Bar */}
        <div
          style={{
            width: '100%',
            height: '10px',
            background: '#e7e2d7',
            borderRadius: '5px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              borderRadius: '5px',
              background: isLow
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : 'linear-gradient(90deg, #10b981, #059669)',
              transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </div>
      </div>
    </div>
  )
}

