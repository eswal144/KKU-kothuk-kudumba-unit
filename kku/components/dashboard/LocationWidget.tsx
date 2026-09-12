'use client'

import { MapPin, Radio, Droplets } from 'lucide-react'

interface LocationData {
  location: string
  sector: string
  localPopulation: number
  humidity?: string
  riskLevel?: string
}

export default function LocationWidget({ data }: { data: LocationData | null }) {
  if (!data) return null

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
          <MapPin size={16} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700 }}>
            CURRENT LOCATION
          </span>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--mint)', fontWeight: 600 }}>
          <Radio size={10} className="eyebrow-dot" /> LIVE KKU-MAP
        </span>
      </div>

      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px' }}>
        {data.location}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--mint)', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
        {data.sector}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', marginBottom: '2px' }}>LOCAL SWARM</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>{data.localPopulation.toLocaleString()} citizens</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', marginBottom: '2px' }}>AIR HUMIDITY</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Droplets size={12} /> {data.humidity || '84%'}
          </span>
        </div>
      </div>
    </div>
  )
}
