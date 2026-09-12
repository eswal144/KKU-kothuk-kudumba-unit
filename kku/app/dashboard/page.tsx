'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Radio, Sparkles, AlertCircle } from 'lucide-react'
import ProfileBadge from '@/components/profile-badge'

import ProfileWidget from '@/components/dashboard/ProfileWidget'
import PopulationWidget from '@/components/dashboard/PopulationWidget'
import LocationWidget from '@/components/dashboard/LocationWidget'
import JobWidget from '@/components/dashboard/JobWidget'
import BankWidget from '@/components/dashboard/BankWidget'
import HealthWidget from '@/components/dashboard/HealthWidget'
import SocialNotifications from '@/components/dashboard/SocialNotifications'
import MigrationAlerts from '@/components/dashboard/MigrationAlerts'
import Leaderboard from '@/components/dashboard/Leaderboard'
import PopulationEvents from '@/components/dashboard/PopulationEvents'
import EmergencyAlerts from '@/components/dashboard/EmergencyAlerts'
import KkuMapWidget from '@/components/dashboard/KkuMapWidget'

const API_BASE = 'http://localhost:5000/api'



export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Widget States
  const [profile, setProfile] = useState<any>(null)
  const [location, setLocation] = useState<any>(null)
  const [population, setPopulation] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [job, setJob] = useState<any>(null)
  const [bank, setBank] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [migrationAlerts, setMigrationAlerts] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([])

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    const token = localStorage.getItem('kku_token')
    if (!token) {
      router.replace('/')
      return
    }

    if (isManualRefresh) setRefreshing(true)
    setError(null)

    const headers = { Authorization: `Bearer ${token}` }

    try {
      // Parallel API Fetching from Node.js Express Backend
      const [
        resProfile,
        resLocation,
        resPop,
        resEvents,
        resJob,
        resBank,
        resHealth,
        resSocial,
        resMigration,
        resLeaderboard,
        resAlerts
      ] = await Promise.all([
        fetch(`${API_BASE}/mosquito/profile`, { headers }),
        fetch(`${API_BASE}/mosquito/location`, { headers }),
        fetch(`${API_BASE}/population/overview`),
        fetch(`${API_BASE}/population/events`),
        fetch(`${API_BASE}/jobs/my`, { headers }),
        fetch(`${API_BASE}/bank/summary`, { headers }),
        fetch(`${API_BASE}/care/status`, { headers }),
        fetch(`${API_BASE}/social/notifications`, { headers }),
        fetch(`${API_BASE}/migration/alerts`),
        fetch(`${API_BASE}/leaderboard`),
        fetch(`${API_BASE}/alerts`)
      ])

      // Parse JSON
      if (resProfile.ok) {
        const d = await resProfile.json()
        setProfile(d.profile)
      } else if (resProfile.status === 401) {
        localStorage.removeItem('kku_token')
        router.replace('/')
        return
      }

      if (resLocation.ok) setLocation(await resLocation.json())
      if (resPop.ok) setPopulation(await resPop.json())
      if (resEvents.ok) {
        const d = await resEvents.json()
        setEvents(d.events || [])
      }
      if (resJob.ok) {
        const d = await resJob.json()
        setJob(d.job)
      }
      if (resBank.ok) setBank(await resBank.json())
      if (resHealth.ok) setHealth(await resHealth.json())
      if (resSocial.ok) {
        const d = await resSocial.json()
        setNotifications(d.notifications || [])
      }
      if (resMigration.ok) {
        const d = await resMigration.json()
        setMigrationAlerts(d.alerts || [])
      }
      if (resLeaderboard.ok) {
        const d = await resLeaderboard.json()
        setLeaderboard(d.leaderboard || [])
      }
      if (resAlerts.ok) {
        const d = await resAlerts.json()
        setEmergencyAlerts(d.alerts || [])
      }

    } catch (err: any) {
      setError('Could not connect to KKU Backend API server. Please ensure backend is running on http://localhost:5000.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    fetchDashboardData()

    // Auto-refresh dashboard telemetry & civilization events every 3 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 3000)

    const handleProfileUpdate = () => {
      fetchDashboardData(true)
    }
    window.addEventListener('kku_profile_updated', handleProfileUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('kku_profile_updated', handleProfileUpdate)
    }
  }, [fetchDashboardData])

  if (loading) {
    return (
      <main className="kku-site" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> Loading KKU Command Center...</div>
          <p style={{ color: 'var(--dim)', fontSize: '13px', marginTop: '12px' }}>Connecting to SQLite3 civilization backend</p>
        </div>
      </main>
    )
  }

  return (
    <main className="kku-site" style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="kku-nav" aria-label="Dashboard navigation" id="top">
        <a href="/dashboard" className="kku-mark" aria-label="KKU home">
          <span>KKU</span>
          <small>Kothuk Kudumba Unit</small>
        </a>
        <div className="kku-nav-links">
          <a href="/dashboard" style={{ color: 'var(--mint)', fontWeight: 800 }}>Home</a>
          <a href="/bite-vacancies">Bite Vacancies</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href="/recharge">🧪 MOSQ-RECHARGE™</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--dim)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh API'}
          </button>
          <ProfileBadge />
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 5vw 80px' }}>

        {/* System Status Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <p className="eyebrow" style={{ margin: '0 0 4px' }}>
              <span className="eyebrow-dot" /> 🦟 KKU COMMAND CENTER &bull; KOTHUK KUDUMBA UNIT
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--dim)', fontStyle: 'italic' }}>
              "Official Headquarters of Annoying Humans at 3 AM 🔊"
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)' }}>
            <span style={{ color: 'var(--mint)', background: 'oklch(0.79 0.17 154 / 15%)', padding: '4px 8px', border: '1px solid oklch(0.79 0.17 154 / 30%)', borderRadius: '4px' }}>
              🩸 Blood Supply: 98% Warm
            </span>
            &bull;
            <span style={{ color: 'oklch(0.85 0.15 80)', background: 'oklch(0.85 0.15 80 / 15%)', padding: '4px 8px', border: '1px solid oklch(0.85 0.15 80 / 30%)', borderRadius: '4px' }}>
              ⚡ Swatter Hazard: Low
            </span>
          </div>
        </div>

        {/* Backend Error Banner */}
        {error && (
          <div className="kku-error" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. 📊 KKU POPULATION COUNTER */}
        <div style={{ marginBottom: '24px' }}>
          <PopulationWidget data={population} />
        </div>

        {/* 2. 📢 DASHBOARD NOTIFICATION BOXES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}
        >
          <SocialNotifications notifications={notifications} />
        </div>

        {/* 3. 🔔 FLOATING LEFT-SIDE POP-UP NOTIFICATION BOX (Civilization Events & Migration Radar) */}
        <PopulationEvents events={events} migrationAlerts={migrationAlerts} />



        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dim)' }}>
          <span>© KKU / Kothuk Kudumba Unit</span>
          <span>Fictional Mosquito Civilization Engine</span>
          <a href="/dashboard#top" style={{ color: 'var(--mint)' }}>Back to Top ↑</a>
        </div>


      </div>
    </main>
  )
}
