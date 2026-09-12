'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'

interface RechargeButtonProps {
  canRecharge: boolean
  isRecharging: boolean
  selectedCategory: 'ADULT' | 'CHILD'
  onCategoryChange: (category: 'ADULT' | 'CHILD') => void
  onRecharge: () => void
  successMessage?: string | null
  errorMessage?: string | null
  maxCapacityNl: number
}

export default function RechargeButton({
  canRecharge,
  isRecharging,
  selectedCategory,
  onCategoryChange,
  onRecharge,
  successMessage,
  errorMessage,
  maxCapacityNl
}: RechargeButtonProps) {
  return (
    <div style={{ margin: '24px 0', textAlign: 'center' }}>
      {/* Category Choice Selector (ADULT vs CHILD) */}
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
          CHOOSE CITIZEN CATEGORY FOR RECHARGE:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            type="button"
            onClick={() => onCategoryChange('ADULT')}
            style={{
              padding: '12px',
              background: selectedCategory === 'ADULT' ? 'oklch(0.79 0.17 154 / 20%)' : 'oklch(0.14 0.01 155)',
              border: selectedCategory === 'ADULT' ? '2px solid var(--mint)' : '1px solid var(--border)',
              color: selectedCategory === 'ADULT' ? 'var(--mint)' : 'var(--foreground)',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            🦟 ADULT (6.8 nL MAX)
          </button>

          <button
            type="button"
            onClick={() => onCategoryChange('CHILD')}
            style={{
              padding: '12px',
              background: selectedCategory === 'CHILD' ? 'oklch(0.79 0.17 154 / 20%)' : 'oklch(0.14 0.01 155)',
              border: selectedCategory === 'CHILD' ? '2px solid var(--mint)' : '1px solid var(--border)',
              color: selectedCategory === 'CHILD' ? 'var(--mint)' : 'var(--foreground)',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            🍼 CHILD (4.6 nL MAX)
          </button>
        </div>
      </div>

      {/* Success Notification Banner ("poyi kadicho!") */}
      {successMessage && (
        <div
          style={{
            background: 'oklch(0.25 0.12 155 / 40%)',
            border: '2px solid var(--mint)',
            color: 'var(--mint)',
            borderRadius: '6px',
            padding: '14px 20px',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '.08em',
            marginBottom: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 0 20px oklch(0.79 0.17 154 / 25%)'
          }}
        >
          <Sparkles size={18} />
          <span>✅ SALIVA RECHARGED &bull; poyi kadicho! 🦟🩸 ({maxCapacityNl.toFixed(1)} nL restored)</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            background: 'oklch(0.25 0.1 20 / 40%)',
            border: '1px solid oklch(0.55 0.2 20)',
            color: 'oklch(0.85 0.15 20)',
            borderRadius: '6px',
            padding: '12px 18px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '.1em',
            marginBottom: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span>🧪 SALIVA RESERVE FULL &bull; {errorMessage}</span>
        </div>
      )}

      {/* Main Action Button */}
      <div>
        <button
          onClick={onRecharge}
          disabled={!canRecharge || isRecharging}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '18px 24px',
            borderRadius: '8px',
            background: !canRecharge
              ? 'oklch(0.2 0.01 155)'
              : 'linear-gradient(90deg, var(--mint), oklch(0.88 0.15 154))',
            color: !canRecharge ? 'var(--dim)' : 'oklch(0.13 0.01 155)',
            border: !canRecharge ? '1px solid var(--border)' : 'none',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            cursor: !canRecharge || isRecharging ? 'not-allowed' : 'pointer',
            boxShadow: canRecharge ? '0 0 24px oklch(0.79 0.17 154 / 30%)' : 'none',
            transition: 'transform 0.2s, background 0.2s, boxShadow 0.2s'
          }}
        >
          <RefreshCw size={16} className={isRecharging ? 'spin' : ''} />
          {isRecharging
            ? 'RECHARGING SALIVA RESERVE...'
            : !canRecharge
            ? '🧪 SALIVA RESERVE FULL (NO RECHARGE REQUIRED)'
            : `[ RECHARGE AS ${selectedCategory} (${maxCapacityNl.toFixed(1)} nL) ]`}
        </button>
      </div>
    </div>
  )
}
