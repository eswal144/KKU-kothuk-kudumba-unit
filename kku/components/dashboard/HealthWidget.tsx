'use client'

import { HeartPulse, Feather, Clock } from 'lucide-react'

interface HealthData {
  healthPercent: number
  status: string
  wingCondition: string
  lastCheck: string
}

export default function HealthWidget({ data }: { data: HealthData | null }) {
  if (!data) return null

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        padding: '24px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HeartPulse size={16} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700 }}>
            KKU-CARE STATUS
          </span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--mint)' }}>
          {data.healthPercent}%
        </span>
      </div>

      {/* Health Progress Bar */}
      <div style={{ background: 'oklch(0.2 0.02 155)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
        <div
          style={{
            width: `${data.healthPercent}%`,
            height: '100%',
            background: 'var(--mint)',
            borderRadius: '3px',
            transition: 'width .5s ease'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', marginBottom: '2px' }}>STATUS</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mint)' }}>{data.status}</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', marginBottom: '2px' }}>WING CONDITION</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Feather size={12} style={{ color: 'var(--mint)' }} /> {data.wingCondition}
          </span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', marginBottom: '2px' }}>LAST CHECK</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={12} /> {data.lastCheck}
          </span>
        </div>
      </div>
    </div>
  )
}
