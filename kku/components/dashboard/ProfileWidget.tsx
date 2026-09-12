'use client'

import { ShieldCheck, MapPin, Activity, Calendar, Dna, Droplets, Zap, AlertTriangle } from 'lucide-react'

interface ProfileData {
  kku_id: string
  name: string
  species: string
  age: number
  gender?: string
  location: string
  health_status?: string
  blood_preference?: string
  bite_count?: number
  dengue_risk?: string
  employment?: string
}

export default function ProfileWidget({ profile }: { profile: ProfileData | null }) {
  if (!profile) return null

  const dengueRisk = profile.dengue_risk || 'HIGH'
  const isHighRisk = dengueRisk.toUpperCase() === 'HIGH'

  return (
    <div
      style={{
        background: 'radial-gradient(ellipse at top left, oklch(0.22 0.05 155 / 35%), transparent 70%), var(--panel)',
        border: '1px solid var(--mint)',
        padding: '24px 28px',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'oklch(0.79 0.17 154 / 15%)', border: '1px solid var(--mint)', color: 'var(--mint)', padding: '4px 12px', fontSize: '12px', fontWeight: 800, letterSpacing: '.18em', fontFamily: 'monospace' }}>
            <ShieldCheck size={14} /> MOSQUITO ID: {profile.kku_id || 'M-QT-28491'}
          </div>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', marginLeft: '12px' }}>
            OFFICIAL MOSQUITO PROFILE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              padding: '3px 10px',
              background: isHighRisk ? 'oklch(0.4 0.2 20 / 30%)' : 'oklch(0.79 0.17 154 / 15%)',
              color: isHighRisk ? 'oklch(0.85 0.15 20)' : 'var(--mint)',
              border: isHighRisk ? '1px solid oklch(0.6 0.2 20)' : '1px solid var(--mint)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <AlertTriangle size={11} /> Dengue Risk: {dengueRisk}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: '4px' }}>Name</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>{profile.name}</span>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: '4px' }}>Species</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Dna size={12} style={{ color: 'var(--mint)' }} /> {profile.species}
          </span>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: '4px' }}>Age</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} style={{ color: 'var(--mint)' }} /> {profile.age} days
          </span>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: '4px' }}>Status</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Activity size={12} /> {profile.health_status || 'Active'}
          </span>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: '4px' }}>Blood Group Preference</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Droplets size={12} style={{ color: 'var(--mint)' }} /> {profile.blood_preference || 'O+'}
          </span>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: '4px' }}>Current Location</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={12} style={{ color: 'var(--mint)' }} /> {profile.location}
          </span>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: '4px' }}>Bites Completed</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={12} /> {profile.bite_count ?? 17} bites
          </span>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: '4px' }}>Dengue Risk</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: isHighRisk ? 'oklch(0.85 0.15 20)' : 'var(--mint)' }}>
            {dengueRisk}
          </span>
        </div>
      </div>
    </div>
  )
}
