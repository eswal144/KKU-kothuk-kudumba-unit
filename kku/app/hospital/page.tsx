'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  HeartPulse,
  Activity,
  Droplet,
  ArrowLeft,
  PlusCircle,
  Clock,
  Send,
  Radio,
  Sparkles,
  Baby
} from 'lucide-react'
import ProfileBadge from '@/components/profile-badge'

interface HospitalOverview {
  currentPatients: number
  critical: number
  injured: number
  recovering: number
  dischargedToday: number
}

interface HospitalPatient {
  id: number
  patient_code: string
  name: string
  condition: string
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL'
  biting_capability: number
  recovery_percentage: number
  status: 'HOSPITALIZED' | 'CRITICAL' | 'INJURED' | 'RECOVERING' | 'DISCHARGED' | 'DECEASED'
  admitted_at: string
  notes?: string
}

interface BloodReserve {
  currentMl: number
  capacityMl: number
  percentage: number
  status: 'STABLE' | 'LOW' | 'CRITICAL' | 'WARNING' | 'EMPTY'
  totalStored?: number
  totalCapacity?: number
  reserves?: {
    emergency: number
    pension: number
    community: number
    veteran: number
  }
}

interface HospitalEvent {
  id: number
  event_type: string
  icon: string
  title: string
  message: string
  patient_name?: string
  created_at: string
}

const API_BASE = 'http://localhost:5000/api'

export default function HospitalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<HospitalOverview | null>(null)
  const [patients, setPatients] = useState<HospitalPatient[]>([])
  const [bloodReserve, setBloodReserve] = useState<BloodReserve | null>(null)
  const [events, setEvents] = useState<HospitalEvent[]>([])
  const [lastSync, setLastSync] = useState<string>('')

  // 3-At-A-Time Continuous Rotating Notification Carousel State
  const [batchIndex, setBatchIndex] = useState(0)
  const [batchStage, setBatchStage] = useState<'enter' | 'settled' | 'exit'>('settled')

  // Voluntary Admission Modal State
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false)
  const [admitCondition, setAdmitCondition] = useState('Maternity Leave')
  const [admitSeverity, setAdmitSeverity] = useState('MILD')
  const [admitNotes, setAdmitNotes] = useState('')
  const [admitSubmitting, setAdmitSubmitting] = useState(false)
  const [admitToast, setAdmitToast] = useState<string | null>(null)

  // Emergency ICU Blood Donation Modal State (Synchronized with MOSQ-BANK)
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false)
  const [donateAmount, setDonateAmount] = useState<number>(1.0)
  const [donateSubmitting, setDonateSubmitting] = useState(false)
  const [donateToast, setDonateToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch hospital data from SQLite API
  const fetchHospitalData = async (isInitial = false) => {
    try {
      const [resOverview, resPatients, resBlood, resEvents] = await Promise.all([
        fetch(`${API_BASE}/hospital/overview`),
        fetch(`${API_BASE}/hospital/patients`),
        fetch(`${API_BASE}/hospital/blood-reserve`),
        fetch(`${API_BASE}/hospital/events?limit=30`)
      ])

      if (resOverview.ok) setOverview(await resOverview.json())
      if (resPatients.ok) {
        const pData = await resPatients.json()
        setPatients((pData.patients || []).slice(0, 5)) // Strictly 5 active hospital patients
      }
      if (resBlood.ok) setBloodReserve(await resBlood.json())
      if (resEvents.ok) {
        const eData = await resEvents.json()
        setEvents(eData.events || [])
      }
      setLastSync(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Failed to load hospital data:', err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  // Initial fetch and 2.0s live polling loop (strictly synchronized with MOSQ-BANK)
  useEffect(() => {
    fetchHospitalData(true)
    const interval = setInterval(() => {
      fetchHospitalData(false)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Continuous 3-At-A-Time Notification Rotator (Loops every 4.5 seconds)
  useEffect(() => {
    if (events.length === 0) return

    const timer = setInterval(() => {
      setBatchStage('exit')

      setTimeout(() => {
        setBatchIndex((prev) => (prev + 3 >= events.length ? 0 : prev + 3))
        setBatchStage('enter')

        setTimeout(() => {
          setBatchStage('settled')
        }, 150)
      }, 400)
    }, 4500)

    return () => clearInterval(timer)
  }, [events.length])

  // Current batch of 3 notifications
  const currentBatch = useMemo(() => {
    if (events.length === 0) return []
    const batch: HospitalEvent[] = []
    for (let i = 0; i < 3; i++) {
      const idx = (batchIndex + i) % events.length
      if (events[idx]) batch.push(events[idx])
    }
    return batch
  }, [events, batchIndex])

  // Handle citizen voluntary check-up / maternity admission
  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdmitSubmitting(true)
    setAdmitToast(null)

    try {
      const token = localStorage.getItem('kku_token')
      const res = await fetch(`${API_BASE}/hospital/admit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          condition: admitCondition,
          severity: admitSeverity,
          notes: admitNotes || 'Admitted to ward for clinical care.'
        })
      })

      const data = await res.json()
      if (res.ok) {
        setAdmitToast(data.message || 'Medical admission confirmed.')
        setIsAdmitModalOpen(false)
        setAdmitNotes('')
        fetchHospitalData(false)
      } else {
        setAdmitToast(data.error || 'Admission could not be processed.')
      }
    } catch {
      setAdmitToast('Network error while requesting hospital admission.')
    } finally {
      setAdmitSubmitting(false)
    }
  }

  // Handle emergency blood donation directly to MOSQ-BANK Emergency Reserve
  const handleDonateBlood = async (amount: number) => {
    const token = localStorage.getItem('kku_token')
    if (!token) {
      router.push('/')
      return
    }

    setDonateSubmitting(true)
    setDonateToast(null)

    try {
      const res = await fetch(`${API_BASE}/hospital/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amountMl: amount })
      })

      const data = await res.json()
      if (res.ok) {
        setDonateToast({
          type: 'success',
          message: data.message || `Transfused ${amount.toFixed(1)} mL directly into MOSQ-BANK Emergency Reserve!`
        })
        setIsDonateModalOpen(false)
        fetchHospitalData(false)
      } else {
        setDonateToast({
          type: 'error',
          message: data.error || 'Emergency donation could not be processed.'
        })
      }
    } catch {
      setDonateToast({
        type: 'error',
        message: 'Network error during emergency blood donation.'
      })
    } finally {
      setDonateSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="kku-site" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> Accessing MOSQ-HOSPITAL Healthcare Center...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="kku-site" style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="kku-nav" aria-label="Hospital navigation" id="top">
        <a href="/dashboard" className="kku-mark" aria-label="KKU home">
          <img src="/kku-logo.png" alt="KKM - Kothuk Kodumba Unit" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
        </a>
        <div className="kku-nav-links">
          <a href="/dashboard">Home</a>
          <a href="/hospital" style={{ color: 'var(--mint)', fontWeight: 800 }}>🏥 MOSQ-HOSPITAL</a>
          <a href="/bite-vacancies">Bite Vacancies</a>
          <a href="/bank">🩸 MOSQ-BANK</a>
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

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <HeartPulse size={20} style={{ color: 'var(--mint)' }} />
              <span className="eyebrow" style={{ margin: 0 }}>
                <span className="eyebrow-dot" /> KKU CITIZEN HEALTHCARE CENTER &bull; CLINICAL & MATERNITY WING
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.02em' }}>
              🏥 MOSQ-HOSPITAL
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--dim)' }}>
              Official Swarm Healthcare &bull; Emergency trauma, ICU proboscis care, and Maternity Leave egg-laying support.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '5px 10px', borderRadius: '4px', fontWeight: 800 }}>
              ⚠ FICTIONAL SIMULATION
            </span>

            <button
              onClick={() => setIsAdmitModalOpen(true)}
              style={{
                background: 'var(--mint)',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)'
              }}
            >
              <PlusCircle size={14} /> Request Admission / Maternity Leave
            </button>

            <button
              onClick={() => router.push('/dashboard')}
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
              <ArrowLeft size={13} /> Dashboard
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {admitToast && (
          <div style={{ background: 'oklch(0.79 0.17 154 / 12%)', border: '1px solid var(--mint)', color: 'var(--mint)', padding: '10px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '12px', fontWeight: 700 }}>
            {admitToast}
          </div>
        )}

        {/* Command Center Telemetry Banner (Reflects Live Active Patients) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '16px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
          }}
        >
          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 800, letterSpacing: '.06em' }}>
              🏥 5 ACTIVE PATIENTS
            </span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--foreground)', marginTop: '2px' }}>
              {overview?.currentPatients || patients.length}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--dim)' }}>Live hospitalized pool</span>
          </div>

          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#dc2626', fontWeight: 800, letterSpacing: '.06em' }}>
              🚨 CRITICAL CASES
            </span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626', marginTop: '2px' }}>
              {overview?.critical || 0}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--dim)' }}>ICU emergency state</span>
          </div>

          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#d97706', fontWeight: 800, letterSpacing: '.06em' }}>
              ⚠️ INJURED CASES
            </span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', marginTop: '2px' }}>
              {overview?.injured || 0}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--dim)' }}>Trauma care</span>
          </div>

          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#2563eb', fontWeight: 800, letterSpacing: '.06em' }}>
              🍼 RECOVERING & MATERNITY
            </span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
              {overview?.recovering || 0}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--dim)' }}>Maternity leave & rest</span>
          </div>

          <div>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--mint)', fontWeight: 800, letterSpacing: '.06em' }}>
              ✅ DISCHARGED TODAY
            </span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--mint)', marginTop: '2px' }}>
              {overview?.dischargedToday || 0}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--dim)' }}>Cleared for flight</span>
          </div>
        </div>

        {/* 3-AT-A-TIME CONTINUOUS ROTATING NOTIFICATIONS CAROUSEL (Requirement: 3 at a time, then next 3, and continue) */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={14} style={{ color: 'var(--mint)' }} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', fontWeight: 800 }}>
                ⚡ LIVE HOSPITAL DISPATCH &bull; 3-EVENT ROTATION
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Batch Indicator Dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {Array.from({ length: Math.min(6, Math.max(1, Math.ceil(events.length / 3))) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setBatchStage('exit')
                      setTimeout(() => {
                        setBatchIndex(i * 3)
                        setBatchStage('enter')
                        setTimeout(() => setBatchStage('settled'), 150)
                      }, 200)
                    }}
                    style={{
                      width: Math.floor(batchIndex / 3) === i ? '16px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: Math.floor(batchIndex / 3) === i ? 'var(--mint)' : '#d1d5db',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    aria-label={`Go to notification batch ${i + 1}`}
                  />
                ))}
              </div>

              <span style={{ fontSize: '9px', color: 'var(--mint)', background: 'oklch(0.79 0.17 154 / 10%)', border: '1px solid var(--mint)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                BATCH {Math.floor(batchIndex / 3) + 1} OF {Math.max(1, Math.ceil(events.length / 3))} &bull; 3 AT A TIME (AUTOLOOP 4.5s)
              </span>

              {/* Manual navigation controls */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => {
                    setBatchStage('exit')
                    setTimeout(() => {
                      setBatchIndex((prev) => (prev - 3 < 0 ? Math.max(0, (Math.ceil(events.length / 3) - 1) * 3) : prev - 3))
                      setBatchStage('enter')
                      setTimeout(() => setBatchStage('settled'), 150)
                    }, 200)
                  }}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '2px 7px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: 'var(--foreground)'
                  }}
                  title="Previous 3 notifications"
                >
                  ◀ Prev 3
                </button>
                <button
                  onClick={() => {
                    setBatchStage('exit')
                    setTimeout(() => {
                      setBatchIndex((prev) => (prev + 3 >= events.length ? 0 : prev + 3))
                      setBatchStage('enter')
                      setTimeout(() => setBatchStage('settled'), 150)
                    }, 200)
                  }}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '2px 7px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: 'var(--foreground)'
                  }}
                  title="Next 3 notifications"
                >
                  Next 3 ▶
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '12px',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: batchStage === 'exit' ? 0 : 1,
              transform: batchStage === 'exit' ? 'translateY(-10px) scale(0.98)' : batchStage === 'enter' ? 'translateY(10px) scale(0.98)' : 'translateY(0) scale(1)'
            }}
          >
            {currentBatch.map((evt, idx) => {
              const isMaternity = evt.title.includes('MATERNITY') || evt.message.includes('Maternity') || evt.message.includes('eggs') || evt.message.includes('larvae') || evt.icon === '🍼'
              const isCritical = evt.event_type === 'CRITICAL' || evt.title.includes('CRITICAL') || evt.title.includes('WORSENED') || evt.icon === '🚨' || evt.icon === '⚡'
              const isInjured = evt.event_type === 'INJURED' || evt.title.includes('INJURED') || evt.icon === '🩹'
              const isDischarge = evt.event_type === 'DISCHARGE' || evt.title.includes('DISCHARGED')

              let cardBorder = 'var(--border)'
              let badgeColor = '#d97706'
              let badgeBg = '#fffbeb'

              if (isMaternity) {
                cardBorder = '#f472b6'
                badgeColor = '#db2777'
                badgeBg = '#fdf2f8'
              } else if (isCritical) {
                cardBorder = '#fca5a5'
                badgeColor = '#dc2626'
                badgeBg = '#fef2f2'
              } else if (isInjured) {
                cardBorder = '#fde68a'
                badgeColor = '#d97706'
                badgeBg = '#fffbeb'
              } else if (isDischarge) {
                cardBorder = 'var(--mint)'
                badgeColor = 'var(--mint)'
                badgeBg = 'oklch(0.79 0.17 154 / 10%)'
              }

              return (
                <div
                  key={evt.id + '-' + idx}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '8px',
                    padding: '12px 14px',
                    boxShadow: isCritical ? '0 4px 14px rgba(220, 38, 38, 0.08)' : isMaternity ? '0 4px 14px rgba(219, 39, 119, 0.08)' : '0 4px 14px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '84px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color: badgeColor,
                        background: badgeBg,
                        border: `1px solid ${badgeColor}33`,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {evt.icon} {evt.title}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--dim)' }}>
                      {evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live'}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>
                    {evt.message}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2-Column Clinical Layout: Exactly 5 Active Patients (Left) + Blood Reserve & Activity (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT: ONLY 5 ACTIVE HOSPITAL PATIENTS (Requirement 1 & 2) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} style={{ color: 'var(--mint)' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--foreground)' }}>
                  🏥 ONLY 5 ACTIVE HOSPITAL PATIENTS (LIVE TELEMETRY)
                </h3>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--mint)', background: 'oklch(0.79 0.17 154 / 10%)', border: '1px solid var(--mint)', padding: '3px 8px', borderRadius: '4px', fontWeight: 800 }}>
                ● STRICT 5-PATIENT POOL (AUTO-UPDATING)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {patients.slice(0, 5).map((pt) => {
                const isCritical = pt.status === 'CRITICAL'
                const isMaternity = pt.condition.toLowerCase().includes('maternity') || pt.condition.toLowerCase().includes('egg') || pt.condition.toLowerCase().includes('paternity')
                const isInjured = pt.status === 'INJURED' || pt.status === 'HOSPITALIZED'
                const isRecovering = pt.status === 'RECOVERING'

                let statusLabel = pt.status
                let statusBg = 'rgba(59, 130, 246, 0.1)'
                let statusColor = '#2563eb'
                let statusBorder = 'rgba(59, 130, 246, 0.3)'
                let cardBorder = 'var(--border)'

                if (isMaternity) {
                  statusLabel = 'MATERNITY LEAVE 🍼'
                  statusBg = '#fdf2f8'
                  statusColor = '#db2777'
                  statusBorder = '#fbcfe8'
                  cardBorder = '#f472b6'
                } else if (isCritical) {
                  statusLabel = 'CRITICAL ⚠️'
                  statusBg = '#fef2f2'
                  statusColor = '#dc2626'
                  statusBorder = '#fca5a5'
                  cardBorder = '#ef4444'
                } else if (isInjured) {
                  statusLabel = 'INJURED 🩹'
                  statusBg = '#fffbeb'
                  statusColor = '#d97706'
                  statusBorder = '#fde68a'
                  cardBorder = '#fde68a'
                } else if (isRecovering) {
                  statusLabel = 'RECOVERING 🌱'
                  statusBg = 'oklch(0.79 0.17 154 / 10%)'
                  statusColor = 'var(--mint)'
                  statusBorder = 'rgba(16, 185, 129, 0.3)'
                  cardBorder = 'rgba(16, 185, 129, 0.3)'
                }

                return (
                  <div
                    key={pt.id}
                    style={{
                      background: '#ffffff',
                      border: `1.5px solid ${cardBorder}`,
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: isCritical ? '0 4px 18px rgba(220, 38, 38, 0.12)' : isMaternity ? '0 4px 18px rgba(219, 39, 119, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Top row: Patient Code & Status Pill */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12px', background: '#0a100d', color: isMaternity ? '#f472b6' : '#10b981', padding: '2px 7px', borderRadius: '4px' }}>
                          {pt.patient_code}
                        </span>
                        <strong style={{ fontSize: '14px', color: 'var(--foreground)' }}>
                          {isMaternity ? '🍼' : isCritical ? '⚠️' : '🦟'} {pt.name}
                        </strong>
                      </div>

                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: statusColor,
                          background: statusBg,
                          border: `1px solid ${statusBorder}`,
                          padding: '3px 9px',
                          borderRadius: '4px',
                          letterSpacing: '.04em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {/* Condition & Severity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '12px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>
                        Condition: <strong style={{ color: isMaternity ? '#db2777' : isCritical ? '#dc2626' : 'inherit' }}>{pt.condition}</strong>
                      </span>
                      <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.04)', padding: '1px 6px', borderRadius: '3px', color: 'var(--dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Severity: {pt.severity}
                      </span>
                    </div>

                    {/* Recovery Progress Bar */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--dim)' }}>
                          {isMaternity ? 'Maternity Rest & Egg Maturation:' : 'Clinical Recovery / Healing:'}
                        </span>
                        <strong style={{ color: isMaternity ? '#db2777' : pt.recovery_percentage > 70 ? 'var(--mint)' : isCritical ? '#dc2626' : '#d97706' }}>
                          {pt.recovery_percentage}%
                        </strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pt.recovery_percentage}%`,
                            height: '100%',
                            background: isMaternity ? 'linear-gradient(90deg, #f472b6, #db2777)' : pt.recovery_percentage > 70 ? 'var(--mint)' : isCritical ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                            transition: 'width 0.5s ease',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>

                    {/* Biting Capability Meter */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                        <span style={{ color: 'var(--dim)' }}>Field Biting Capability:</span>
                        <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{pt.biting_capability}%</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pt.biting_capability}%`,
                            height: '100%',
                            background: '#3b82f6',
                            transition: 'width 0.5s ease'
                          }}
                        />
                      </div>
                    </div>

                    {/* Clinical Notes */}
                    {pt.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--dim)', fontStyle: 'italic', background: '#fbfdfc', padding: '7px 10px', borderRadius: '4px', border: '1px solid var(--border)', marginBottom: '8px', lineHeight: 1.35 }}>
                        &ldquo;{pt.notes}&rdquo;
                      </div>
                    )}

                    <div style={{ fontSize: '9px', color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> Admitted: {new Date(pt.admitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} &bull; Attending: Dr. Proboscis
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT: BLOOD STORAGE TANK & FULL RECENT ACTIVITY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* BLOOD STORAGE TANK - MOSQ-BANK SYNCHRONIZED */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplet size={16} style={{ color: '#dc2626' }} />
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.04em' }}>
                      🩸 MOSQ-NET BLOOD STORAGE
                    </h4>
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--dim)', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--mint)' }} />
                    LIVE 100% SYNCHRONIZED WITH /BANK
                  </div>
                </div>

                {bloodReserve && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: bloodReserve.status === 'CRITICAL' ? '#dc2626' : bloodReserve.status === 'LOW' ? '#d97706' : 'var(--mint)',
                      background: bloodReserve.status === 'CRITICAL' ? '#fef2f2' : bloodReserve.status === 'LOW' ? '#fffbeb' : 'oklch(0.79 0.17 154 / 12%)',
                      border: `1px solid ${bloodReserve.status === 'CRITICAL' ? '#fca5a5' : bloodReserve.status === 'LOW' ? '#fde68a' : 'var(--mint)'}`
                    }}
                  >
                    {bloodReserve.status === 'CRITICAL' ? '🚨 CRITICAL' : bloodReserve.status === 'LOW' ? '⚠️ LOW' : '✅ STABLE'}
                  </span>
                )}
              </div>

              {/* Total Mosq-Net Blood Stored Banner (Matching /bank) */}
              <div style={{ background: '#f8faf9', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', fontWeight: 800 }}>
                  TOTAL MOSQ-NET BLOOD STORED
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--foreground)', letterSpacing: '-.02em' }}>
                    {bloodReserve?.totalStored?.toLocaleString() || '2,814.8'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#dc2626' }}>mL</span>
                  <span style={{ fontSize: '10px', color: 'var(--dim)', marginLeft: 'auto' }}>
                    Across 4 Reserves
                  </span>
                </div>
              </div>

              {/* Stylized Visual Tank for ICU Emergency Allocation */}
              <div
                style={{
                  background: '#050806',
                  borderRadius: '10px',
                  border: '2px solid #1c2a23',
                  padding: '16px',
                  color: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', color: '#8b9891', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                    🚑 ICU EMERGENCY RESERVE
                  </span>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#f87171', textShadow: '0 0 16px rgba(248,113,113,0.4)', marginTop: '2px' }}>
                    {bloodReserve?.currentMl.toFixed(1)} <span style={{ fontSize: '15px' }}>mL</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    / {bloodReserve?.capacityMl || 2000} mL Maximum Capacity ({bloodReserve?.percentage || 56}%)
                  </span>
                </div>

                <div
                  style={{
                    height: '95px',
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.8)'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${bloodReserve?.percentage || 56}%`,
                      background: 'linear-gradient(180deg, #ef4444 0%, #991b1b 100%)',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
                      transition: 'height 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.4)',
                        filter: 'blur(1px)'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(4px)',
                      padding: '3px 9px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}
                  >
                    {bloodReserve?.percentage}% ICU LEVEL
                  </div>
                </div>

                {/* 3 Specialized Reserves Synchronized Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase' }}>🚑 ICU</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171' }}>{bloodReserve?.currentMl.toFixed(1)} mL</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase' }}>👴 PENSION</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>{bloodReserve?.reserves?.pension?.toFixed(1) || '847.0'} mL</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase' }}>🦟 COMM</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>{bloodReserve?.reserves?.community?.toFixed(1) || '845.7'} mL</div>
                  </div>
                </div>

                {/* Quick ICU Blood Transfusion Action */}
                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>
                    ⚡ QUICK EMERGENCY DONATION TO ICU:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    {[0.5, 1.0, 2.0].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleDonateBlood(amt)}
                        disabled={donateSubmitting}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#fca5a5',
                          borderRadius: '4px',
                          padding: '5px 4px',
                          fontSize: '10px',
                          fontWeight: 800,
                          cursor: donateSubmitting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        +{amt.toFixed(1)} mL
                      </button>
                    ))}
                  </div>

                  {donateToast && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textAlign: 'center',
                        background: donateToast.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: donateToast.type === 'success' ? '#6ee7b7' : '#fca5a5',
                        border: `1px solid ${donateToast.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                      }}
                    >
                      {donateToast.message}
                    </div>
                  )}
                </div>

                <a
                  href="/bank"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '12px',
                    background: '#10b981',
                    color: '#070a08',
                    fontWeight: 800,
                    fontSize: '11px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    letterSpacing: '.04em',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  🩸 VIEW MOSQ-BANK FULL VAULT &rarr;
                </a>
              </div>
            </div>

            {/* FULL RECENT ACTIVITY LOG */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '18px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} style={{ color: 'var(--mint)' }} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.04em' }}>
                    🏥 RECENT DISPATCHES
                  </h4>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--mint)', fontWeight: 700 }}>● RADAR FEED</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                {events.slice(0, 10).map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      padding: '8px 10px',
                      background: '#fbfdfc',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: evt.title.includes('MATERNITY') ? '#db2777' : evt.event_type === 'CRITICAL' ? '#dc2626' : evt.event_type === 'DISCHARGE' ? 'var(--mint)' : '#d97706' }}>
                        {evt.icon} {evt.title}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--dim)' }}>
                        {evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--foreground)', lineHeight: 1.35, fontSize: '11px' }}>
                      {evt.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Voluntary Admission Modal (includes Maternity Leave) */}
        {isAdmitModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HeartPulse size={18} style={{ color: 'var(--mint)' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--foreground)' }}>
                    🏥 Citizen Medical & Maternity Admission
                  </h3>
                </div>
                <button
                  onClick={() => setIsAdmitModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '16px', color: 'var(--dim)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdmit}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
                    Primary Ailment / Condition:
                  </label>
                  <select
                    value={admitCondition}
                    onChange={(e) => setAdmitCondition(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}
                  >
                    <option value="Maternity Leave">🍼 Maternity Leave (Post-3,000 egg deposit)</option>
                    <option value="Egg Delivery Exhaustion">🪺 Egg Delivery Exhaustion (Abdomen strain)</option>
                    <option value="Paternity Buzz Syndrome">🦟 Paternity Buzz Syndrome (Puddle defense)</option>
                    <option value="Nectar Hangover">🥭 Nectar Hangover (Fermented mango sap)</option>
                    <option value="Ceiling Fan Turbulence">🌀 Ceiling Fan Turbulence (High velocity rotor strike)</option>
                    <option value="Electric Swatter Singe">⚡ Electric Swatter Singe (ICU blue racket trauma)</option>
                    <option value="Tangled in Mosquito Net">🕸️ Tangled in Mosquito Net (Mesh entrapment)</option>
                    <option value="Citronella Cough Syndrome">🌿 Citronella Cough Syndrome (Coil smoke irritation)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
                    Severity:
                  </label>
                  <select
                    value={admitSeverity}
                    onChange={(e) => setAdmitSeverity(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}
                  >
                    <option value="MILD">MILD (Nectar rest & larvae monitoring)</option>
                    <option value="MODERATE">MODERATE (Wing splint & recovery)</option>
                    <option value="SEVERE">SEVERE (Intensive observation)</option>
                    <option value="CRITICAL">CRITICAL (ICU emergency)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
                    Clinical Notes / Circumstances:
                  </label>
                  <textarea
                    value={admitNotes}
                    onChange={(e) => setAdmitNotes(e.target.value)}
                    placeholder="e.g. Completed laying 3,200 eggs in bathroom water bucket, requesting wing rest..."
                    rows={3}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAdmitModalOpen(false)}
                    style={{ flex: 1, padding: '9px', background: 'rgba(0,0,0,0.04)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={admitSubmitting}
                    style={{ flex: 2, padding: '9px', background: 'var(--mint)', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: admitSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Send size={13} /> {admitSubmitting ? 'Admitting...' : 'Confirm Hospital Admission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '40px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dim)' }}>
          <span>© KKU / Kothuk Kudumba Unit</span>
          <span>MOSQ-HOSPITAL &bull; Fictional Healthcare Engine</span>
          <a href="/hospital#top" style={{ color: 'var(--mint)' }}>Back to Top ↑</a>
        </div>

      </div>
    </main>
  )
}
