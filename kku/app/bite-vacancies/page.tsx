'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Radio } from 'lucide-react'
import ProfileBadge from '@/components/profile-badge'
import KkuMapWidget from '@/components/dashboard/KkuMapWidget'

export default function BiteVacanciesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('kku_token')
    if (!token) {
      router.replace('/')
      return
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <main className="kku-site" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> Loading Bite Vacancy Map...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="kku-site" style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="kku-nav" aria-label="Bite Vacancies navigation" id="top">
        <a href="/dashboard" className="kku-mark" aria-label="KKU home">
          <span>KKU</span>
          <small>Kothuk Kudumba Unit</small>
        </a>
        <div className="kku-nav-links">
          <a href="/dashboard">Home</a>
          <a href="/bank">🩸 MOSQ-BANK</a>
          <a href="/hospital">🏥 MOSQ-HOSPITAL</a>
          <a href="/bite-vacancies" style={{ color: 'var(--mint)', fontWeight: 800 }}>Bite Vacancies</a>
          <a href="/pension">🏛️ MOSQ-PENSION</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href="/recharge">🧪 MOSQ-RECHARGE™</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ProfileBadge />
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 5vw 80px' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>
              <span className="eyebrow-dot" /> KKU MOSQUITO BITE MARKETPLACE
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--foreground)' }}>
              🗺️ Bite Vacancies & Demand Map
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--dim)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--mint)', background: 'oklch(0.79 0.17 154 / 10%)', padding: '6px 12px', border: '1px solid var(--mint)' }}>
              <Globe size={12} /> REAL GEOGRAPHY ONLINE
            </div>
          </div>
        </div>

        {/* Dedicated Mosquito Demand & Bite Vacancies Map */}
        <KkuMapWidget />

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dim)' }}>
          <span>© KKU / Kothuk Kudumba Unit</span>
          <span>Fictional Mosquito Civilization Engine</span>
          <a href="/bite-vacancies#top" style={{ color: 'var(--mint)' }}>Back to Top ↑</a>
        </div>

      </div>
    </main>
  )
}
