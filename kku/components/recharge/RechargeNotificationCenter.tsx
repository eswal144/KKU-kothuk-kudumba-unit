'use client'

import { useState, useEffect } from 'react'
import { Activity, BellRing, CheckCircle2 } from 'lucide-react'

interface RechargeHistoryItem {
  id: number
  event_type: string
  icon: string
  description: string
  created_at?: string
}

interface RechargeNotificationCenterProps {
  latestRechargeEvent?: RechargeHistoryItem | null
  history: RechargeHistoryItem[]
}

export default function RechargeNotificationCenter({
  latestRechargeEvent,
  history
}: RechargeNotificationCenterProps) {
  const [activeItem, setActiveItem] = useState<RechargeHistoryItem | null>(null)
  const [animStage, setAnimStage] = useState<'hidden' | 'flying-in' | 'settled' | 'flying-out'>('hidden')

  // Trigger special flying mosquito animation sequence whenever a new recharge occurs
  useEffect(() => {
    if (!latestRechargeEvent) return

    setActiveItem(latestRechargeEvent)
    setAnimStage('flying-in') // 1. Flies upward from bottom

    // 2. Settles into position after 700ms
    const settleTimer = setTimeout(() => {
      setAnimStage('settled')
    }, 700)

    // 3. Waits visible for 4.5 seconds, then flies upward out of the top
    const flyOutTimer = setTimeout(() => {
      setAnimStage('flying-out')
    }, 4500)

    // 4. Fully disappears after flight exit
    const hideTimer = setTimeout(() => {
      setAnimStage('hidden')
    }, 5200)

    return () => {
      clearTimeout(settleTimer)
      clearTimeout(flyOutTimer)
      clearTimeout(hideTimer)
    }
  }, [latestRechargeEvent])

  const getTransform = () => {
    switch (animStage) {
      case 'flying-in':
        return 'translateY(160px) rotate(4deg) scale(0.9)'
      case 'settled':
        return 'translateY(0) rotate(0deg) scale(1)'
      case 'flying-out':
        return 'translateY(-160px) rotate(-4deg) scale(0.9)'
      case 'hidden':
      default:
        return 'translateY(180px) opacity(0)'
    }
  }

  const getOpacity = () => {
    switch (animStage) {
      case 'flying-in':
        return 0.85
      case 'settled':
        return 1
      case 'flying-out':
        return 0
      case 'hidden':
      default:
        return 0
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '28px',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 800 }}>
            KKU RECHARGE ACTIVITY
          </span>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--mint)', fontWeight: 700, letterSpacing: '.1em' }}>
          CIVILIZATION LOGS
        </span>
      </div>

      {/* FLYING MOSQUITO ANIMATION STAGE (Fixed height viewport) */}
      <div
        style={{
          height: '90px',
          background: '#fdfbf7',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}
      >
        {activeItem && animStage !== 'hidden' ? (
          <div
            style={{
              position: 'absolute',
              width: '92%',
              background: '#ffffff',
              border: '1px solid var(--mint)',
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s ease',
              transform: getTransform(),
              opacity: getOpacity()
            }}
          >
            <span style={{ fontSize: '24px', lineHeight: 1 }}>🦟</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={13} style={{ color: 'var(--mint)' }} />
                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--mint)' }}>
                  🧪 SALIVA RECHARGED
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--foreground)', margin: '2px 0 0', lineHeight: 1.3, fontWeight: 600 }}>
                {activeItem.description}
              </p>
            </div>
            <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
              FLYING DISPATCH
            </span>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--dim)', fontSize: '11px' }}>
            <BellRing size={14} style={{ color: 'var(--mint)', display: 'inline-block', marginBottom: '4px' }} />
            <p style={{ margin: 0, fontSize: '10px', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              Recharge flight activity corridor ready
            </p>
          </div>
        )}
      </div>

      {/* History Log List */}
      <div>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', display: 'block', marginBottom: '10px', fontWeight: 700 }}>
          RECENT RECHARGE DISPATCHES
        </span>

        {history.length === 0 ? (
          <p style={{ fontSize: '11px', color: 'var(--dim)', margin: 0 }}>No recent recharge records logged.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: '#fdfbf7',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              >
                <span>{item.icon || '🧪'}</span>
                <span style={{ flex: 1, color: 'var(--foreground)', fontWeight: 600 }}>{item.description}</span>
                <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--mint)', fontWeight: 800 }}>
                  {item.event_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

