'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, ArrowLeft } from 'lucide-react'
import ProfileBadge from '@/components/profile-badge'
import Leaderboard from '@/components/dashboard/Leaderboard'
import { API_BASE } from '@/lib/api/config'

export default function LeaderboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    const loadLeaderboard = () => {
      fetch(`${API_BASE}/leaderboard`)
        .then((res) => res.json())
        .then((data) => {
          setLeaderboard(data.leaderboard || [])
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }

    loadLeaderboard()
    // Auto-refresh leaderboard every 20 seconds
    const interval = setInterval(loadLeaderboard, 20000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <main className="kku-site" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> Loading KKU Hall of Fame Leaderboard...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="kku-site" style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="kku-nav" aria-label="Leaderboard navigation" id="top">
        <a href="/dashboard" className="kku-mark" aria-label="KKU home">
          <img src="/kku-logo.png" alt="KKM - Kothuk Kodumba Unit" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
        </a>
        <div className="kku-nav-links">
          <a href="/dashboard">Home</a>
          <a href="/bank">🩸 MOSQ-BANK</a>
          <a href="/hospital">🏥 MOSQ-HOSPITAL</a>
          <a href="/bite-vacancies">Bite Vacancies</a>
          <a href="/pension">🏛️ MOSQ-PENSION</a>
          <a href="/leaderboard" style={{ color: 'var(--mint)', fontWeight: 800 }}>Leaderboard</a>
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
              <span className="eyebrow-dot" /> 🦟 MONTHLY MOSQUITO RANKINGS
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--foreground)' }}>
              🏆 Top Mosquitoes & Monthly Harvest Hall of Fame
            </h1>
          </div>

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
            <ArrowLeft size={14} /> Back to Home
          </button>
        </div>

        {/* Dedicated Leaderboard Component */}
        <div style={{ marginBottom: '40px' }}>
          <Leaderboard leaderboard={leaderboard} />
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dim)' }}>
          <span>© KKU / Kothuk Kudumba Unit</span>
          <span>Fictional Mosquito Civilization Engine</span>
          <a href="/leaderboard#top" style={{ color: 'var(--mint)' }}>Back to Top ↑</a>
        </div>

      </div>
    </main>
  )
}
