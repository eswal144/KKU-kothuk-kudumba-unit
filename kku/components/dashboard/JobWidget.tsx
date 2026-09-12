'use client'

import { BriefcaseBusiness, CheckCircle, Crosshair, Zap } from 'lucide-react'

interface JobData {
  title: string
  status: string
  todayMissions: number
  bites: number
  payoutNectar?: number
}

export default function JobWidget({ data }: { data: JobData | null }) {
  if (!data) return null

  return (
    <div
      id="bite-vacancies"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        padding: '24px',
        scrollMarginTop: '80px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BriefcaseBusiness size={16} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700 }}>
            BITE VACANCIES & EMPLOYMENT
          </span>
        </div>
        <span style={{ fontSize: '9px', background: 'oklch(0.79 0.17 154 / 15%)', color: 'var(--mint)', padding: '2px 8px', fontWeight: 800, border: '1px solid var(--mint)', letterSpacing: '.1em' }}>
          {data.status}
        </span>
      </div>

      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
        {data.title}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
        <div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)' }}>
            <Crosshair size={10} style={{ color: 'var(--mint)' }} /> Vacancies
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>{data.todayMissions} open</span>
        </div>
        <div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)' }}>
            <Zap size={10} style={{ color: 'var(--mint)' }} /> Bites
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mint)' }}>{data.bites}</span>
        </div>
        <div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)' }}>
            <CheckCircle size={10} style={{ color: 'var(--mint)' }} /> Payout
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>{data.payoutNectar || 450} Nectar</span>
        </div>
      </div>
    </div>
  )
}
