'use client'

import { Bell, MessageSquare, Volume2 } from 'lucide-react'

interface NotificationItem {
  id: number
  message: string
  read_status: number
  created_at?: string
}

const FUNNY_DISPATCHES = [
  { id: 101, message: '🦟 Host fell asleep watching TV! Night Squad assemble near sofa!', tag: 'HOT SPOT' },
  { id: 102, message: '⚡ WARNING: Electric swatter activated in Bedroom 2! Fly low!', tag: 'DANGER' },
  { id: 103, message: '🩸 Fresh O-Negative sweet blood detected in Zone 4. Rating: 10/10!', tag: 'DELICACY' },
  { id: 104, message: '🍃 Water tank lid left slightly open. Prime egg-laying real estate clear!', tag: 'REAL ESTATE' }
]

export default function SocialNotifications({ notifications }: { notifications: NotificationItem[] }) {
  const displayItems = notifications && notifications.length > 0 
    ? notifications.map((n, i) => ({ id: n.id, message: n.message, tag: 'DISPATCH' }))
    : FUNNY_DISPATCHES

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        color: 'var(--foreground)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Volume2 size={16} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700 }}>
            💬 CITIZEN BUZZ DISPATCHES
          </span>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--mint)', fontWeight: 700, background: 'rgba(5, 150, 105, 0.1)', padding: '2px 8px', border: '1px solid var(--mint)', borderRadius: '4px' }}>
          LIVE FREQUENCY: 600 Hz
        </span>
      </div>

      <p style={{ fontSize: '11px', color: 'var(--dim)', margin: '0 0 16px', fontStyle: 'italic' }}>
        Direct updates from mosquitoes hiding under ceiling fans & curtains
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {displayItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              transition: 'border-color 0.2s'
            }}
          >
            <MessageSquare size={14} style={{ color: 'var(--mint)', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '12px', color: 'var(--foreground)', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
                {item.message}
              </p>
            </div>
            <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--mint)', background: 'rgba(5, 150, 105, 0.08)', padding: '2px 6px', border: '1px solid var(--mint)', borderRadius: '3px', flexShrink: 0 }}>
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
