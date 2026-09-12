'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Droplets,
  ShieldAlert,
  HeartHandshake,
  Award,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Coins,
  HeartPulse
} from 'lucide-react'
import ProfileBadge from '@/components/profile-badge'

interface ReserveDetail {
  type: string
  current: number
  capacity: number
  percentage: number
  status: 'STABLE' | 'LOW' | 'WARNING' | 'CRITICAL' | 'EMPTY'
}

interface BankOverview {
  totalStored: number
  reserves: {
    emergency: number
    pension: number
    community: number
    veteran: number
  }
  reservesDetailed: Record<string, ReserveDetail>
  status: string
  activeDrives: Array<{
    id: number
    reserve_type: string
    target_amount_ml: number
    current_amount_ml: number
    status: string
    message: string
    started_at: string
  }>
  shortageAlerts: Array<{
    reserveType: string
    current: number
    expectedRequirement: number
    deficit: number
    status: string
    message: string
  }>
}

interface BankTransaction {
  id: number
  mosquito_code?: string
  transaction_type: string
  reserve_type: string
  amount_ml: number
  reason: string
  status: string
  created_at: string
}

interface TopDonor {
  id: number
  mosquito_code: string
  name: string
  total_donated_ml: number
  total_received_ml: number
  last_donation_at: string
}

interface MyDonationStatus {
  mosquitoId?: number
  mosquitoCode: string
  name: string
  availableDonation: number
  totalDonated: number
  totalReceived: number
  lastDonationAt?: string | null
}

const API_BASE = 'http://localhost:5000/api'

export default function MosqBankPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [overview, setOverview] = useState<BankOverview | null>(null)
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [topDonors, setTopDonors] = useState<TopDonor[]>([])
  const [myStatus, setMyStatus] = useState<MyDonationStatus | null>(null)

  // Donation form state
  const [selectedAmount, setSelectedAmount] = useState<number>(1.0)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [targetReserve, setTargetReserve] = useState<'EMERGENCY' | 'COMMUNITY' | 'PENSION'>('EMERGENCY')
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false)
  const [donationToast, setDonationToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const donationSectionRef = useRef<HTMLDivElement>(null)

  // Fetch all bank telemetry
  const fetchBankData = useCallback(async (isInitial = false) => {
    const token = localStorage.getItem('kku_token')
    if (!token) {
      router.replace('/')
      return
    }

    try {
      if (!isInitial) setRefreshing(true)

      const [resOverview, resTx, resDonors, resMyStatus] = await Promise.all([
        fetch(`${API_BASE}/bank/overview`),
        fetch(`${API_BASE}/bank/transactions?limit=15`),
        fetch(`${API_BASE}/bank/top-donors?limit=6`),
        fetch(`${API_BASE}/bank/my-donation-status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (resMyStatus.status === 401) {
        localStorage.removeItem('kku_token')
        router.replace('/')
        return
      }

      if (resOverview.ok) setOverview(await resOverview.json())
      if (resTx.ok) {
        const txData = await resTx.json()
        setTransactions(txData.transactions || [])
      }
      if (resDonors.ok) {
        const dData = await resDonors.json()
        setTopDonors(dData.topDonors || [])
      }
      if (resMyStatus.ok) {
        setMyStatus(await resMyStatus.json())
      }
    } catch (err) {
      console.error('Failed to load bank data:', err)
    } finally {
      if (isInitial) setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  // Live polling loop every 2.0 seconds (strictly synchronized with MOSQ-HOSPITAL)
  useEffect(() => {
    fetchBankData(true)
    const interval = setInterval(() => {
      fetchBankData(false)
    }, 2000)

    return () => clearInterval(interval)
  }, [fetchBankData])

  // Handle blood donation
  const handleDonate = async () => {
    const token = localStorage.getItem('kku_token')
    if (!token) {
      router.replace('/')
      return
    }

    const amount = customAmount ? parseFloat(customAmount) : selectedAmount
    if (isNaN(amount) || amount <= 0) {
      setDonationToast({ type: 'error', message: 'Please select or enter a valid donation amount in mL.' })
      return
    }

    setIsSubmittingDonation(true)
    setDonationToast(null)

    try {
      const res = await fetch(`${API_BASE}/bank/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amountMl: amount, reserveType: targetReserve })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setDonationToast({
          type: 'success',
          message: data.message || `🩸 DONATION SUCCESSFUL: ${amount.toFixed(1)} mL added directly to ${targetReserve} Reserve.`
        })
        setCustomAmount('')
        fetchBankData(false)
      } else {
        setDonationToast({
          type: 'error',
          message: data.error || 'Failed to process blood donation.'
        })
      }
    } catch (err) {
      setDonationToast({
        type: 'error',
        message: 'Network error communicating with Mosq-Bank.'
      })
    } finally {
      setIsSubmittingDonation(false)
    }
  }

  const scrollToDonation = () => {
    donationSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase()
    if (s === 'STABLE') {
      return { label: '✅ STABLE', color: 'var(--mint)', bg: 'oklch(0.79 0.17 154 / 12%)', border: 'var(--mint)' }
    }
    if (s === 'LOW' || s === 'WARNING') {
      return { label: '⚠️ LOW', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
    }
    if (s === 'EMPTY') {
      return { label: '○ EMPTY', color: 'var(--dim)', bg: 'rgba(0,0,0,0.04)', border: 'var(--border)' }
    }
    return { label: '🚨 CRITICAL', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' }
  }

  if (loading) {
    return (
      <main className="kku-site" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--mint)', justifyContent: 'center' }}>
            <span className="eyebrow-dot" /> Accessing Central Blood Reserve Telemetry...
          </div>
        </div>
      </main>
    )
  }

  const reserves = overview?.reservesDetailed || {}

  return (
    <main className="kku-site" style={{ minHeight: '100vh' }}>
      {/* Universal Main Navbar */}
      <nav className="kku-nav" aria-label="MOSQ-BANK navigation" id="top">
        <a href="/dashboard" className="kku-mark" aria-label="KKU home">
          <span>KKU</span>
          <small>Kothuk Kudumba Unit</small>
        </a>
        <div className="kku-nav-links">
          <a href="/dashboard">Home</a>
          <a href="/bank" style={{ color: 'var(--mint)', fontWeight: 800 }}>🩸 MOSQ-BANK</a>
          <a href="/hospital">🏥 MOSQ-HOSPITAL</a>
          <a href="/bite-vacancies">Bite Vacancies</a>
          <a href="/pension">🏛️ MOSQ-PENSION</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href="/recharge">🧪 MOSQ-RECHARGE™</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ProfileBadge />
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '36px 5vw 80px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Droplets size={20} style={{ color: '#dc2626' }} />
              <span className="eyebrow" style={{ margin: 0 }}>
                <span className="eyebrow-dot" /> MOSQ-NET CENTRAL BLOOD STORAGE &bull; FICTIONAL RESOURCE ECONOMY
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.02em' }}>
              🩸 MOSQ-BANK
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--dim)', fontStyle: 'italic' }}>
              &ldquo;Saving blood for a rainy day.&rdquo; &bull; Fictional simulation mechanic for the KKU mosquito civilization.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '6px 12px', borderRadius: '4px', fontWeight: 800 }}>
              ⚠ FICTIONAL RESOURCE ECONOMY
            </span>

            <button
              onClick={() => fetchBankData(false)}
              disabled={refreshing}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Syncing...' : 'Sync Telemetry'}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                color: 'var(--dim)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} /> Back to Home
            </button>
          </div>
        </div>

        {/* Total Stored Hero Banner */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px 30px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: '0 2px 14px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)' }}>
              TOTAL MOSQ-NET BLOOD STORED
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '42px', fontWeight: 900, color: 'var(--foreground)', letterSpacing: '-.03em' }}>
                {overview?.totalStored?.toLocaleString() || '2,847'}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>
                mL
              </span>
              <span
                style={{
                  marginLeft: '10px',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  color: 'var(--mint)',
                  background: 'oklch(0.79 0.17 154 / 12%)',
                  border: '1px solid var(--mint)'
                }}
              >
                ● ALLOCATIONS ACTIVE
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--dim)' }}>
              Distributed across four specialized governmental reserves. Backed by citizen nightly collections.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={scrollToDonation}
              className="kku-button"
              style={{
                cursor: 'pointer',
                padding: '12px 20px',
                fontSize: '11px',
                borderRadius: '8px',
                gap: '8px',
                background: 'var(--mint)',
                color: '#ffffff'
              }}
            >
              <Droplets size={16} />
              <span>Donate to Community Reserve</span>
            </button>

            <a
              href="/hospital"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--foreground)',
                textDecoration: 'none'
              }}
            >
              <HeartPulse size={16} style={{ color: '#dc2626' }} />
              <span>Hospital ER Link &rarr;</span>
            </a>
          </div>
        </div>

        {/* 4 Reserve Blocks Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          {/* Reserve 1: Emergency */}
          {(() => {
            const r = reserves['EMERGENCY'] || { current: 1200, capacity: 2000, percentage: 60, status: 'LOW' }
            const badge = getStatusBadge(r.status)
            return (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🚑</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.04em' }}>EMERGENCY RESERVE</span>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: '2px 7px', borderRadius: '4px' }}>
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#dc2626', margin: '4px 0 2px' }}>
                    {r.current?.toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dim)' }}>mL</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--dim)' }}>
                    Cap: {r.capacity} mL &bull; MOSQ-HOSPITAL Critical ICU support
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, r.percentage)}%`, height: '100%', background: '#dc2626', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--dim)', marginTop: '4px' }}>
                    <span>Level: {r.percentage}%</span>
                    <span>Remaining: {(r.capacity - r.current).toFixed(1)} mL</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Reserve 2: Pension */}
          {(() => {
            const r = reserves['PENSION'] || { current: 847, capacity: 1500, percentage: 56, status: 'LOW' }
            const badge = getStatusBadge(r.status)
            return (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>👴</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.04em' }}>PENSION RESERVE</span>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: '2px 7px', borderRadius: '4px' }}>
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--foreground)', margin: '4px 0 2px' }}>
                    {r.current?.toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dim)' }}>mL</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--dim)' }}>
                    Cap: {r.capacity} mL &bull; MOSQ-PENSION monthly payouts
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, r.percentage)}%`, height: '100%', background: '#d97706', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--dim)', marginTop: '4px' }}>
                    <span>Level: {r.percentage}%</span>
                    <span>Remaining: {(r.capacity - r.current).toFixed(1)} mL</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Reserve 3: Community */}
          {(() => {
            const r = reserves['COMMUNITY'] || { current: 800, capacity: 1500, percentage: 53, status: 'LOW' }
            const badge = getStatusBadge(r.status)
            return (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🦟</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.04em' }}>COMMUNITY RESERVE</span>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: '2px 7px', borderRadius: '4px' }}>
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--mint)', margin: '4px 0 2px' }}>
                    {r.current?.toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dim)' }}>mL</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--dim)' }}>
                    Cap: {r.capacity} mL &bull; Citizen welfare & public donations
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, r.percentage)}%`, height: '100%', background: 'var(--mint)', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--dim)', marginTop: '4px' }}>
                    <span>Level: {r.percentage}%</span>
                    <span>Remaining: {(r.capacity - r.current).toFixed(1)} mL</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Reserve 4: Veteran */}
          {(() => {
            const r = reserves['VETERAN'] || { current: 0, capacity: 500, percentage: 0, status: 'EMPTY' }
            const badge = getStatusBadge(r.status)
            return (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🏅</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.04em' }}>VETERAN RESERVE</span>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: '2px 7px', borderRadius: '4px' }}>
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--foreground)', margin: '4px 0 2px' }}>
                    {r.current?.toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dim)' }}>mL</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--dim)' }}>
                    Cap: {r.capacity} mL &bull; Sector 04 swarm defense honors
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, r.percentage)}%`, height: '100%', background: badge.color, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--dim)', marginTop: '4px' }}>
                    <span>Level: {r.percentage}%</span>
                    <span>Remaining: {(r.capacity - r.current).toFixed(1)} mL</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Shortage Alert & Active Donation Drives Banner */}
        {overview?.activeDrives && overview.activeDrives.length > 0 && (
          <div
            style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={22} style={{ color: '#d97706' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400e', letterSpacing: '.04em' }}>
                  ⚠️ DONATION DRIVE ACTIVE &bull; {overview.activeDrives[0].reserve_type} RESERVE SHORTAGE
                </div>
                <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px' }}>
                  &ldquo;{overview.activeDrives[0].message}&rdquo; &bull; Target: {overview.activeDrives[0].target_amount_ml} mL (Current: {overview.activeDrives[0].current_amount_ml} mL)
                </div>
              </div>
            </div>

            <button
              onClick={scrollToDonation}
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)'
              }}
            >
              DONATE NOW
            </button>
          </div>
        )}

        {/* Main Grid: Donation Section + Top Donors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px', marginBottom: '24px' }}>
          
          {/* Section: Community Blood Donation */}
          <div
            ref={donationSectionRef}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span className="eyebrow" style={{ margin: 0, fontSize: '9px' }}>
                    <span className="eyebrow-dot" /> CIVIC ENGAGEMENT
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
                    ❤️ Community Blood Donation
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>
                    DONOR IDENTITY
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', background: '#0a100d', color: '#10b981', padding: '2px 8px', borderRadius: '4px', marginTop: '2px' }}>
                    {myStatus?.mosquitoCode || 'M0S-CITIZEN'}
                  </div>
                </div>
              </div>

              <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--dim)', lineHeight: '1.5' }}>
                Voluntary non-remunerated donation directly replenishes the KKU Community Reserve. Every droplet supports hospitalized larvae, maternity suites, and elder biters.
              </p>

              {/* Toast Feedback */}
              {donationToast && (
                <div
                  style={{
                    background: donationToast.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${donationToast.type === 'success' ? '#86efac' : '#fca5a5'}`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: donationToast.type === 'success' ? '#166534' : '#991b1b',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {donationToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{donationToast.message}</span>
                </div>
              )}

              {/* Target Reserve Destination Selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--foreground)', marginBottom: '8px' }}>
                  Choose Destination Reserve:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'EMERGENCY', label: '🚑 Emergency ICU', sub: 'MOSQ-HOSPITAL Synced', color: '#dc2626' },
                    { id: 'COMMUNITY', label: '🦟 Community', sub: 'Swarm Welfare', color: 'var(--mint)' },
                    { id: 'PENSION', label: '👴 Pension Fund', sub: 'Senior Biters', color: '#d97706' }
                  ].map((dest) => {
                    const isSelected = targetReserve === dest.id
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setTargetReserve(dest.id as any)}
                        style={{
                          textAlign: 'left',
                          background: isSelected ? 'rgba(0,0,0,0.03)' : '#fbfdfc',
                          border: `1.5px solid ${isSelected ? dest.color : 'var(--border)'}`,
                          borderRadius: '6px',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? dest.color : 'var(--foreground)' }}>
                          {dest.label}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--dim)', marginTop: '2px' }}>
                          {dest.sub}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Donation Amount Selector */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--foreground)' }}>
                    Select Contribution Volume:
                  </label>
                  <span style={{ fontSize: '10px', color: 'var(--dim)' }}>
                    Safe balance: {myStatus?.availableDonation || 1.5} mL
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  {[0.5, 1.0, 1.5, 2.0].map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt)
                          setCustomAmount('')
                        }}
                        style={{
                          flex: 1,
                          background: isSelected ? 'oklch(0.79 0.17 154 / 15%)' : '#fbfdfc',
                          color: isSelected ? 'var(--mint-dark)' : 'var(--foreground)',
                          border: `1.5px solid ${isSelected ? 'var(--mint)' : 'var(--border)'}`,
                          borderRadius: '6px',
                          padding: '10px 0',
                          fontSize: '13px',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {amt.toFixed(1)} mL
                      </button>
                    )
                  })}
                </div>

                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  placeholder="Or enter custom mL amount..."
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#fbfdfc',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '9px 12px',
                    fontSize: '12px',
                    color: 'var(--foreground)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Donor Lifetime Contribution Summary */}
              <div style={{ background: '#fbfdfc', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--dim)' }}>
                <span>Lifetime Blood Donated:</span>
                <strong style={{ color: 'var(--mint)', fontWeight: 800 }}>{myStatus?.totalDonated?.toFixed(1) || '0.0'} mL</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDonate}
              disabled={isSubmittingDonation}
              style={{
                width: '100%',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '13px 18px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '.06em',
                cursor: isSubmittingDonation ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Droplets size={16} />
              <span>{isSubmittingDonation ? 'Transfusing to Reserve...' : '🩸 DONATE BLOOD'}</span>
            </button>
          </div>

          {/* Section: Top Donors Leaderboard */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow" style={{ margin: 0, fontSize: '9px' }}>
                  <span className="eyebrow-dot" /> HALL OF BENEFACTORS
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
                  ❤️ Top Donors
                </h3>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--dim)' }}>
                SQLite Verified
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topDonors.map((donor, idx) => {
                const medals = ['🥇', '🥈', '🥉']
                const medal = idx < 3 ? medals[idx] : `#${idx + 1}`

                return (
                  <div
                    key={donor.id}
                    style={{
                      background: idx === 0 ? 'oklch(0.79 0.17 154 / 6%)' : '#fbfdfc',
                      border: `1px solid ${idx === 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>{medal}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 800, background: '#0a100d', color: '#10b981', padding: '1px 6px', borderRadius: '3px' }}>
                            {donor.mosquito_code}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--dim)', marginTop: '2px' }}>
                          {donor.name || 'Honorable Citizen'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--mint)' }}>
                        {donor.total_donated_ml?.toFixed(1)} mL
                      </span>
                      <div style={{ fontSize: '8px', color: 'var(--dim)', textTransform: 'uppercase' }}>
                        Contributed
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Section: Recent Bank Activity */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="eyebrow" style={{ margin: 0, fontSize: '9px' }}>
                <span className="eyebrow-dot" /> AUDIT TRAIL
              </span>
              <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
                📜 Recent Bank Activity
              </h3>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--mint)', fontWeight: 700 }}>
              ● LIVE SIMULATION FEED
            </span>
          </div>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--dim)', fontSize: '12px' }}>
              No transactions recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc', color: 'var(--dim)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    <th style={{ padding: '10px 12px' }}>Amount</th>
                    <th style={{ padding: '10px 12px' }}>Mosquito</th>
                    <th style={{ padding: '10px 12px' }}>Type</th>
                    <th style={{ padding: '10px 12px' }}>Reserve</th>
                    <th style={{ padding: '10px 12px' }}>Reason</th>
                    <th style={{ padding: '10px 12px' }}>Timestamp</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isPositive = tx.amount_ml > 0
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: isPositive ? 'var(--mint)' : '#dc2626' }}>
                          {isPositive ? `+${tx.amount_ml.toFixed(1)}` : tx.amount_ml.toFixed(1)} mL
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                          {tx.mosquito_code || 'MOSQ-NET'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '11px', color: 'var(--dim)' }}>
                          {tx.transaction_type}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px', color: 'var(--dim)', border: '1px solid var(--border)' }}>
                            {tx.reserve_type}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--foreground)' }}>
                          {tx.reason || 'Standard transaction'}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--dim)', fontSize: '10px' }}>
                          {tx.created_at?.split(' ')[1] || tx.created_at}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--mint)', background: 'oklch(0.79 0.17 154 / 12%)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--mint)' }}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dim)' }}>
          <span>© KKU / Kothuk Kudumba Unit &bull; Mosq-Bank Reserves Directorate</span>
          <span>Fictional Resource Economy &bull; Strictly Simulated Game Data</span>
          <a href="/bank#top" style={{ color: 'var(--mint)' }}>Back to Top ↑</a>
        </div>
      </div>
    </main>
  )
}
