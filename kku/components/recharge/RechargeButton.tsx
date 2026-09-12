'use client'

import { RefreshCw, Sparkles, AlertCircle } from 'lucide-react'

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
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'left',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}
      >
        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 800, display: 'block', marginBottom: '12px' }}>
          CHOOSE CITIZEN CATEGORY FOR RECHARGE:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <button
            type="button"
            onClick={() => onCategoryChange('ADULT')}
            style={{
              padding: '14px',
              background: selectedCategory === 'ADULT' ? 'rgba(5, 150, 105, 0.08)' : '#ffffff',
              border: selectedCategory === 'ADULT' ? '2px solid var(--mint)' : '1px solid var(--border)',
              color: selectedCategory === 'ADULT' ? 'var(--mint)' : 'var(--foreground)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: selectedCategory === 'ADULT' ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none'
            }}
          >
            🦟 ADULT (6.8 nL MAX)
          </button>

          <button
            type="button"
            onClick={() => onCategoryChange('CHILD')}
            style={{
              padding: '14px',
              background: selectedCategory === 'CHILD' ? 'rgba(5, 150, 105, 0.08)' : '#ffffff',
              border: selectedCategory === 'CHILD' ? '2px solid var(--mint)' : '1px solid var(--border)',
              color: selectedCategory === 'CHILD' ? 'var(--mint)' : 'var(--foreground)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: selectedCategory === 'CHILD' ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none'
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
            background: '#ecfdf5',
            border: '2px solid #059669',
            color: '#047857',
            borderRadius: '8px',
            padding: '16px 22px',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '.06em',
            marginBottom: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.15)'
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
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            borderRadius: '8px',
            padding: '14px 20px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '.08em',
            marginBottom: '20px',
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
              ? '#f5f5f4'
              : 'var(--mint)',
            color: !canRecharge ? '#78716c' : '#ffffff',
            border: !canRecharge ? '1px solid var(--border)' : 'none',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            cursor: !canRecharge || isRecharging ? 'not-allowed' : 'pointer',
            boxShadow: canRecharge ? '0 4px 14px rgba(5, 150, 105, 0.25)' : 'none',
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

