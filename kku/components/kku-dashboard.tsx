'use client'

import { ShieldCheck, LogOut } from 'lucide-react'

interface KkuDashboardProps {
  user: { id: number; email: string }
  profile: {
    id: number
    kku_id: string
    name: string
    species: string
    age: number
    gender: string
    location: string
    blood_preference: string
    bite_count: number
    blood_collected: number
    health_status: string
    employment: string
    social_status: string
    pension_status: string
    life_history: string
    created_at?: string
  }
  onLogout: () => void
}

export default function KkuDashboard({ user, profile, onLogout }: KkuDashboardProps) {
  return (
    <section className="kku-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>
            <span className="eyebrow-dot" /> Official Citizen Identity
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', margin: '8px 0 0' }}>
            Welcome, <em>{profile.name}</em>
          </h2>
        </div>
        <button
          onClick={onLogout}
          className="text-link"
          style={{ cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="kku-passport-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="kku-id-badge">
              <ShieldCheck size={16} /> {profile.kku_id}
            </span>
            <p style={{ color: 'var(--dim)', fontSize: '11px', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '.12em' }}>
              Recognized Member • KKU Sovereign System
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', display: 'block' }}>Account Email</span>
            <span style={{ fontSize: '13px', color: 'var(--mint)', fontWeight: 600 }}>{user.email}</span>
          </div>
        </div>

        <div className="kku-passport-grid">
          <div className="passport-field">
            <strong>Full Mosquito Name</strong>
            <span>{profile.name}</span>
          </div>
          <div className="passport-field">
            <strong>Species Classification</strong>
            <span>{profile.species}</span>
          </div>
          <div className="passport-field">
            <strong>Gender / Role</strong>
            <span>{profile.gender}</span>
          </div>
          <div className="passport-field">
            <strong>Current Night Location</strong>
            <span>{profile.location}</span>
          </div>
          <div className="passport-field">
            <strong>Blood Preference</strong>
            <span>{profile.blood_preference}</span>
          </div>
          <div className="passport-field">
            <strong>Health Status</strong>
            <span style={{ color: 'var(--mint)' }}>{profile.health_status}</span>
          </div>
          <div className="passport-field">
            <strong>Total Successful Bites</strong>
            <span>{profile.bite_count} bites</span>
          </div>
          <div className="passport-field">
            <strong>Blood Collected</strong>
            <span>{profile.blood_collected} ml</span>
          </div>
          <div className="passport-field">
            <strong>Ecosystem Employment</strong>
            <span>{profile.employment}</span>
          </div>
          <div className="passport-field">
            <strong>Swarm Social Status</strong>
            <span>{profile.social_status}</span>
          </div>
          <div className="passport-field">
            <strong>KKU Pension Tier</strong>
            <span>{profile.pension_status}</span>
          </div>
          <div className="passport-field">
            <strong>Citizen Age</strong>
            <span>{profile.age} days</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '24px', paddingTop: '18px' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', display: 'block', marginBottom: '6px' }}>Life History</span>
          <p style={{ fontSize: '13px', color: 'var(--dim)', lineHeight: 1.7, margin: 0 }}>
            {profile.life_history}
          </p>
        </div>
      </div>
    </section>
  )
}
