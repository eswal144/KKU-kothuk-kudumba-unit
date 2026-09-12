'use client'

import { AlertOctagon, ShieldAlert, Zap } from 'lucide-react'

interface AlertItem {
  id: number
  title: string
  message: string
  severity: string
}

export default function EmergencyAlerts({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alerts.map((alert) => {
          const isCritical = alert.severity?.toUpperCase() === 'CRITICAL'
          return (
            <div
              key={alert.id}
              style={{
                background: isCritical ? 'radial-gradient(ellipse at left, oklch(0.25 0.15 20 / 40%), oklch(0.14 0.01 155))' : 'var(--panel)',
                border: isCritical ? '1px solid oklch(0.65 0.2 20)' : '1px solid var(--mint)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {isCritical ? (
                  <AlertOctagon size={22} style={{ color: 'oklch(0.85 0.15 20)', flexShrink: 0 }} />
                ) : (
                  <ShieldAlert size={22} style={{ color: 'var(--mint)', flexShrink: 0 }} />
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, letterSpacing: '.12em', color: isCritical ? 'oklch(0.85 0.15 20)' : 'var(--mint)', textTransform: 'uppercase' }}>
                    🚨 {alert.title}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--foreground)', lineHeight: 1.4 }}>
                    {alert.message}
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  background: isCritical ? 'oklch(0.4 0.2 20 / 30%)' : 'oklch(0.79 0.17 154 / 15%)',
                  color: isCritical ? 'oklch(0.85 0.15 20)' : 'var(--mint)',
                  border: isCritical ? '1px solid oklch(0.6 0.2 20)' : '1px solid var(--mint)',
                  whiteSpace: 'nowrap'
                }}
              >
                {alert.severity || 'ACTIVE'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
