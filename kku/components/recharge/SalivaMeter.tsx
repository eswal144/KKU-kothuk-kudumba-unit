'use client'

import { Zap, AlertTriangle, ShieldCheck } from 'lucide-react'

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
        background: 'var(--panel)',
        border: isLow ? '1px solid oklch(0.6 0.2 20)' : '1px solid var(--border)',
        padding: '28px 24px',
        position: 'relative',
        boxShadow: isLow ? '0 0 30px oklch(0.55 0.2 20 / 15%)' : '0 10px 30px rgba(0,0,0,0.5)',
        transition: 'all 0.4s ease'
      }}
    >
      {/* Header Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} style={{ color: isLow ? 'oklch(0.85 0.15 20)' : 'var(--mint)' }} />
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.16em', fontWeight: 800, color: 'var(--mint)' }}>
            SALIVA RESERVE METER
          </span>
        </div>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', border: '1px solid var(--border)', padding: '2px 8px' }}>
          FICTIONAL SIMULATION MECHANIC
        </span>
      </div>

      {/* Low Saliva Alert Banner */}
      {isLow && (
        <div
          style={{
            background: 'oklch(0.25 0.1 20 / 40%)',
            border: '1px solid oklch(0.55 0.2 20)',
            color: 'oklch(0.85 0.15 20)',
            padding: '10px 14px',
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
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', display: 'block', marginBottom: '4px' }}>
            CURRENT SALIVA
          </span>
          <strong style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-.05em', color: isLow ? 'oklch(0.85 0.15 20)' : 'var(--mint)' }}>
            {currentSalivaNl.toFixed(1)} <small style={{ fontSize: '14px', color: 'var(--foreground)' }}>nL</small>
          </strong>
        </div>

        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', display: 'block', marginBottom: '4px' }}>
            MAXIMUM CAPACITY ({category})
          </span>
          <strong style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-.05em', color: 'var(--foreground)' }}>
            {maximumSalivaNl.toFixed(1)} <small style={{ fontSize: '14px', color: 'var(--dim)' }}>nL</small>
          </strong>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)' }}>
            RECHARGE LEVEL
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--mint)', fontFamily: 'monospace' }}>
            {percentage}%
          </span>
        </div>

        {/* ASCII Block Bar */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '18px',
            letterSpacing: '3px',
            color: isLow ? 'oklch(0.85 0.15 20)' : 'var(--mint)',
            marginBottom: '12px',
            textShadow: '0 0 10px oklch(0.79 0.17 154 / 30%)'
          }}
        >
          [{gaugeString}]
        </div>

        {/* Smooth CSS Bar */}
        <div
          style={{
            width: '100%',
            height: '10px',
            background: 'oklch(0.12 0.01 155)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: isLow
                ? 'linear-gradient(90deg, oklch(0.55 0.2 20), oklch(0.85 0.15 20))'
                : 'linear-gradient(90deg, oklch(0.55 0.15 154), var(--mint))',
              boxShadow: '0 0 12px var(--mint)',
              transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </div>
      </div>
    </div>
  )
}
