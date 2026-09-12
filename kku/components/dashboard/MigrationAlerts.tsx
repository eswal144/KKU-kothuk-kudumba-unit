'use client'

import { Navigation, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

interface MigrationAlert {
  id: number
  message: string
  level: string
  sector: string
  created_at?: string
}

export default function MigrationAlerts({ alerts }: { alerts: MigrationAlert[] }) {
  const getBadgeStyle = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return { color: 'oklch(0.85 0.15 20)', border: '1px solid oklch(0.6 0.2 20)', bg: 'oklch(0.4 0.15 20 / 20%)' }
      case 'WARNING':
        return { color: 'oklch(0.85 0.15 80)', border: '1px solid oklch(0.6 0.15 80)', bg: 'oklch(0.4 0.12 80 / 20%)' }
      default:
        return { color: 'var(--mint)', border: '1px solid var(--mint)', bg: 'oklch(0.79 0.17 154 / 15%)' }
    }
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        padding: '24px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Navigation size={16} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700 }}>
            MIGRATION ALERTS
          </span>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--mint)', fontWeight: 600 }}>
          KKU-MAP FLIGHT RADAR
        </span>
      </div>

      {alerts.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--dim)', margin: 0 }}>No migration alerts active.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map((item) => {
            const badge = getBadgeStyle(item.level)
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'oklch(0.18 0.01 155 / 50%)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={13} style={{ color: badge.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--foreground)' }}>{item.message}</span>
                </div>
                <span style={{ fontSize: '8px', padding: '2px 6px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: badge.color, border: badge.border, background: badge.bg, whiteSpace: 'nowrap' }}>
                  {item.sector || 'GLOBAL'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
