'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Radio, AlertCircle, Zap, ShieldCheck } from 'lucide-react'
import ProfileBadge from '@/components/profile-badge'
import SalivaMeter from '@/components/recharge/SalivaMeter'
import RechargeButton from '@/components/recharge/RechargeButton'
import RechargeNotificationCenter from '@/components/recharge/RechargeNotificationCenter'
import {
  fetchRechargeStatus,
  postRecharge,
  fetchRechargeHistory,
  RechargeStatus,
  RechargeHistoryItem
} from '@/lib/api/recharge'
import { API_BASE } from '@/lib/api/config'

export default function RechargePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recharging, setRecharging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  // Status & History State
  const [status, setStatus] = useState<RechargeStatus | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'ADULT' | 'CHILD'>('ADULT')
  const [history, setHistory] = useState<RechargeHistoryItem[]>([])
  const [latestEvent, setLatestEvent] = useState<RechargeHistoryItem | null>(null)

  const loadRechargeData = useCallback(async (isManual = false) => {
    const token = localStorage.getItem('kku_token')
    if (!token) {
      router.replace('/')
      return
    }

    if (isManual) setRefreshing(true)
    setError(null)

    try {
      const [resStatus, resHistory] = await Promise.all([
        fetchRechargeStatus(),
        fetchRechargeHistory()
      ])

      setStatus(resStatus)
      setSelectedCategory(resStatus.category || 'ADULT')
      setHistory(resHistory)
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') {
        localStorage.removeItem('kku_token')
        router.replace('/')
        return
      }
      setError('Could not connect to KKU Backend API server on http://localhost:5000.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    loadRechargeData()

    // Auto Refresh every 3 seconds to reflect live saliva decay
    const timer = setInterval(() => {
      loadRechargeData()
    }, 3000)

    return () => clearInterval(timer)
  }, [loadRechargeData])

  const handleRecharge = async () => {
    if (!status || recharging) return

    setRecharging(true)
    setSuccessMsg(null)
    setErrMsg(null)

    try {
      const res = await postRecharge(selectedCategory)

      if (res.success) {
        setStatus(res.status)
        setSuccessMsg(res.message || 'poyi kadicho! 🦟🩸')

        const maxCap = selectedCategory === 'ADULT' ? 6.8 : 4.6
        const newEvt: RechargeHistoryItem = {
          id: Date.now(),
          event_type: 'SALIVA_RECHARGE',
          icon: '🧪',
          description: `${res.status.kkuId} (${selectedCategory}) recharged ${maxCap} nL — poyi kadicho! 🦟🩸`,
          created_at: new Date().toISOString()
        }

        setLatestEvent(newEvt)
        setHistory((prev) => [newEvt, ...prev])
      } else {
        setErrMsg(res.message || 'Saliva reserve already at maximum capacity.')
      }
    } catch (err: any) {
      setErrMsg(err.message || 'Recharge failed. Please try again.')
    } finally {
      setRecharging(false)
    }
  }

  if (loading) {
    return (
      <main className="kku-site" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> Connecting to MOSQ-RECHARGE™ Center...</div>
          <p style={{ color: 'var(--dim)', fontSize: '13px', marginTop: '12px' }}>Reading SQLite3 Saliva Reserve database</p>
        </div>
      </main>
    )
  }

  return (
    <main className="kku-site" style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="kku-nav" aria-label="Recharge navigation" id="top">
        <a href="/dashboard" className="kku-mark" aria-label="KKU home">
          <img src="/kku-logo.png" alt="KKM - Kothuk Kodumba Unit" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
        </a>
        <div className="kku-nav-links">
          <a href="/dashboard">Home</a>
          <a href="/bank">🩸 MOSQ-BANK</a>
          <a href="/hospital">🏥 MOSQ-HOSPITAL</a>
          <a href="/bite-vacancies">Bite Vacancies</a>
          <a href="/pension">🏛️ MOSQ-PENSION</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href="/recharge" style={{ color: 'var(--mint)', fontWeight: 800 }}>🧪 MOSQ-RECHARGE™</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => loadRechargeData(true)}
            disabled={refreshing}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              color: 'var(--dim)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '6px',
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

      {/* Main Container with generous spacing matching dashboard */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 5vw 80px' }}>

        {/* System Status Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>
              <span className="eyebrow-dot" /> KKU SERVICE &bull; MOSQ-RECHARGE™
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', fontWeight: 600 }}>
            <Radio size={12} style={{ color: 'var(--mint)' }} />
            <span>SQLite Saliva DB Active</span>
            &bull;
            <span>JWT Authenticated</span>
          </div>
        </div>

        {/* Header Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-.05em', color: 'var(--foreground)' }}>
            🧪 MOSQ-RECHARGE™
          </h1>
          <p style={{ color: 'var(--dim)', fontSize: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 700 }}>
            SALIVA RECHARGING CENTER &bull; CITIZEN HYDRO-STATION
          </p>
        </div>

        {/* Citizen Profile Card */}
        {status && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                LOGGED-IN CITIZEN
              </span>
              <strong style={{ fontSize: '17px', fontFamily: 'monospace', color: 'var(--mint)', fontWeight: 800 }}>
                {status.kkuId}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                CITIZEN CLASSIFICATION
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                  color: 'var(--mint)',
                  background: 'rgba(5, 150, 105, 0.1)',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--mint)',
                  display: 'inline-block'
                }}
              >
                {status.category}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                MAX RESERVE CAPACITY
              </span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
                {status.maximumSalivaNl.toFixed(1)} nL
              </span>
            </div>
          </div>
        )}

        {/* Backend Error Banner */}
        {error && (
          <div className="kku-error" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Saliva Meter Gauge Component */}
        {status && (
          <SalivaMeter
            currentSalivaNl={status.currentSalivaNl}
            maximumSalivaNl={status.maximumSalivaNl}
            percentage={status.percentage}
            isLow={status.isLow}
            category={status.category}
            isRecharging={recharging}
          />
        )}

        {/* Recharge Action Button Component */}
        {status && (
          <RechargeButton
            canRecharge={status.canRecharge || selectedCategory !== status.category}
            isRecharging={recharging}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => setSelectedCategory(cat)}
            onRecharge={handleRecharge}
            successMessage={successMsg}
            errorMessage={errMsg}
            maxCapacityNl={selectedCategory === 'ADULT' ? 6.8 : 4.6}
          />
        )}

        {/* Recharge Notification Center Component (Flying Mosquito Animation) */}
        <RechargeNotificationCenter
          latestRechargeEvent={latestEvent}
          history={history}
        />

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '48px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 600 }}>
          <span>© KKU / Kothuk Kudumba Unit</span>
          <span>Fictional Mosquito Simulation Mechanic</span>
          <a href="/recharge#top" style={{ color: 'var(--mint)', fontWeight: 700 }}>Back to Top ↑</a>
        </div>

      </div>
    </main>
  )
}

