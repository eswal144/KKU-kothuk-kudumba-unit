'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Globe,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Send,
  RefreshCw,
  Briefcase
} from 'lucide-react'
import { BiteVacancy } from './RealGeoMap'
import { API_BASE } from '@/lib/api/config'

// Dynamically import RealGeoMap to avoid SSR window/Leaflet issues
const RealGeoMap = dynamic(() => import('./RealGeoMap'), { ssr: false })

export default function KkuMapWidget() {
  const [vacancies, setVacancies] = useState<BiteVacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null)
  const [applying, setApplying] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [sirenEnabled, setSirenEnabled] = useState<boolean>(true)

  // Web Audio API Tactical Siren Synthesizer
  const playTacticalSirenBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'

      // Emergency ambulance/police siren wail (950Hz <-> 650Hz <-> 1050Hz)
      osc.frequency.setValueAtTime(950, now)
      osc.frequency.linearRampToValueAtTime(650, now + 0.25)
      osc.frequency.linearRampToValueAtTime(1050, now + 0.5)
      osc.frequency.linearRampToValueAtTime(700, now + 0.75)
      osc.frequency.linearRampToValueAtTime(1000, now + 1.0)

      gain.gain.setValueAtTime(0.18, now)
      gain.gain.setValueAtTime(0.18, now + 0.85)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 1.1)
      setTimeout(() => {
        try { ctx.close() } catch (_) {}
      }, 1200)
    } catch (e) {
      // Ignore autoplay restriction
    }
  }, [])

  // Fetch real vacancy data from backend SQLite API
  const fetchVacancies = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/vacancies`)
      if (!res.ok) throw new Error('Failed to load vacancies')
      const data: BiteVacancy[] = await res.json()
      if (Array.isArray(data)) {
        setVacancies(data)
        setLastUpdated(new Date().toLocaleTimeString())
        if (isInitial && data.length > 0) {
          setSelectedVacancyId(data[0].id)
        }

        // Check for urgent vacancies to sound tactical alert siren
        const hasUrgent = data.some(v => (v.demandLevel || '').toUpperCase() === 'URGENT')
        if (hasUrgent && sirenEnabled && !isInitial) {
          playTacticalSirenBeep()
        }
      }
    } catch (err) {
      console.error('Error loading KKU bite vacancies:', err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [sirenEnabled, playTacticalSirenBeep])

  // Initial fetch and ultra-fast dynamic 2.5-second polling loop
  // (Ensures vacancies filling within 5s and dynamic new places are reflected in real time)
  useEffect(() => {
    fetchVacancies(true)
    const interval = setInterval(() => {
      fetchVacancies(false)
    }, 2500)
    return () => clearInterval(interval)
  }, [fetchVacancies])

  // Clear notification toast after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Sorted job alerts (Requirement 12)
  // Priority: 1. URGENT, 2. HIGH DEMAND, 3. AVAILABLE, 4. FILLED, 5. OVERSATURATED
  // Within each category, sort by highest vacancies first
  const sortedJobAlerts = useMemo(() => {
    const getPriority = (v: BiteVacancy) => {
      const level = (v.demandLevel || '').toUpperCase()
      const status = (v.status || '').toUpperCase()
      if (level === 'URGENT' || status === 'URGENT') return 1
      if (level.includes('HIGH') || level === 'CRITICAL') return 2
      if (status === 'AVAILABLE' || v.vacancies > 0) return 3
      if (status === 'FILLED' || v.vacancies === 0) return 4
      if (status === 'OVERSATURATED') return 5
      return 3
    }

    return [...vacancies].sort((a, b) => {
      const prioA = getPriority(a)
      const prioB = getPriority(b)
      if (prioA !== prioB) return prioA - prioB
      // Within each category, highest number of vacancies first
      return b.vacancies - a.vacancies
    })
  }, [vacancies])

  // Currently selected vacancy object
  const selectedVacancy = useMemo(() => {
    return vacancies.find((v) => v.id === selectedVacancyId) || vacancies[0] || null
  }, [vacancies, selectedVacancyId])

  // Handle job application (Requirement 14 & 15)
  const handleApply = async (targetVacancy: BiteVacancy) => {
    if (!targetVacancy) return
    setApplying(true)
    setNotification(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kku_token') : null
      const res = await fetch(`${API_BASE}/jobs/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ vacancyId: targetVacancy.id })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setNotification({
          type: 'success',
          message: data.message || `💼 JOB APPLICATION ACCEPTED: You have been assigned to ${targetVacancy.locationName}.`
        })
      } else {
        setNotification({
          type: 'error',
          message: data.message || `❌ VACANCY FILLED: Position unavailable.`
        })
      }

      // Re-fetch backend data to synchronize true state immediately
      await fetchVacancies(false)
    } catch {
      setNotification({
        type: 'info',
        message: `Deployment flight vector confirmed for ${targetVacancy.locationName}.`
      })
      await fetchVacancies(false)
    } finally {
      setApplying(false)
    }
  }

  // Handle clicking "VIEW LOCATION" on a job alert card (Requirement 13)
  const handleViewLocation = (vacancyId: number) => {
    setSelectedVacancyId(vacancyId)
  }

  // Telemetry aggregates
  const totalVacancies = vacancies.reduce((sum, v) => sum + (v.vacancies || 0), 0)
  const totalMosquitoes = vacancies.reduce((sum, v) => sum + (v.currentMosquitoes || 0), 0)
  const totalHumans = vacancies.reduce((sum, v) => sum + (v.humansDetected || 0), 0)
  const topDemandSector = sortedJobAlerts.find((v) => v.vacancies > 0)?.locationName || 'Night Market Food Court'

  if (loading) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
        <p className="eyebrow" style={{ margin: 0 }}><span className="eyebrow-dot" /> Accessing KKU Real Geography Bite Vacancies...</p>
      </div>
    )
  }

  return (
    <div
      id="kku-map"
      style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '28px',
        position: 'relative',
        scrollMarginTop: '80px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        color: 'var(--foreground)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} style={{ color: 'var(--mint)' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.04em' }}>
              🗺️ KKU MOSQUITO BITE MARKETPLACE &bull; BITE VACANCIES
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--dim)' }}>
            Real-time government job board matching citizen mosquitoes with verified host sectors. Clean tactical markers &bull; Zero circular bubbles.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              const next = !sirenEnabled
              setSirenEnabled(next)
              if (next) playTacticalSirenBeep()
            }}
            title="Toggle Tactical Siren Warning Beep for Urgent Vacancies"
            style={{
              background: sirenEnabled ? 'rgba(239, 68, 68, 0.12)' : '#f3f4f6',
              border: `1px solid ${sirenEnabled ? '#ef4444' : 'var(--border)'}`,
              color: sirenEnabled ? '#ef4444' : 'var(--dim)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease'
            }}
          >
            {sirenEnabled ? '🚨 SIREN: ON 🔊' : '🚨 SIREN: MUTED 🔇'}
          </button>
          <button
            onClick={() => playTacticalSirenBeep()}
            title="Test Tactical Siren Sound"
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '9px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
            }}
          >
            🔊 TEST SIREN
          </button>
          <span style={{ fontSize: '10px', color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={11} style={{ animation: 'spin 12s linear infinite' }} /> Synced {lastUpdated || 'just now'}
          </span>
          <span style={{ fontSize: '9px', background: 'oklch(0.79 0.17 154 / 10%)', border: '1px solid var(--mint)', color: 'var(--mint)', padding: '4px 8px', borderRadius: '4px', fontWeight: 800, letterSpacing: '.06em' }}>
            ● REAL GEOGRAPHY ONLINE
          </span>
        </div>
      </div>

      {/* Dynamic Urgent Siren Alert Banner */}
      {vacancies.some(v => (v.demandLevel || '').toUpperCase() === 'URGENT') && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.14) 0%, rgba(245, 158, 11, 0.12) 100%)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🚨</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626', letterSpacing: '.04em' }}>
                URGENT OUTBREAK SIREN ACTIVE &bull; DYNAMIC MOBILIZATION IN SECTOR
              </div>
              <div style={{ fontSize: '10px', color: '#991b1b', marginTop: '2px' }}>
                Open positions filling dynamically within 5s to ✓ FILLED. Fresh urgent hotspots arriving continuously.
              </div>
            </div>
          </div>

          <button
            onClick={() => playTacticalSirenBeep()}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '.06em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔊 PLAY SIREN WAIL
          </button>
        </div>
      )}

      {/* Quick Market Summary Telemetry Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
          background: '#fbfdfc',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px 18px'
        }}
      >
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>🟢 OPEN BITE VACANCIES</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mint)' }}>{totalVacancies} Positions</div>
        </div>
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>🦟 ACTIVE MOSQUITO WORKFORCE</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>{totalMosquitoes} Mosquitoes</div>
        </div>
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>👤 HUMAN HOSTS DETECTED</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>{totalHumans} Hosts</div>
        </div>
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>🩸 TOP RECRUITMENT SECTOR</span>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#d97706', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topDemandSector}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: notification.type === 'success' ? 'oklch(0.79 0.17 154 / 12%)' : notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${notification.type === 'success' ? 'var(--mint)' : notification.type === 'error' ? '#fca5a5' : '#86efac'}`,
            color: notification.type === 'success' ? 'var(--mint)' : notification.type === 'error' ? '#dc2626' : '#15803d'
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Interactive Grid: Clean Map + KKU Job Alerts Side Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'stretch' }}>
        
        {/* MAP VIEWPORT (NO DEMAND CIRCLES, COMPACT MARKERS & POPUPS) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '540px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#050806'
          }}
        >
          <RealGeoMap
            vacancies={vacancies}
            selectedVacancyId={selectedVacancyId}
            onSelectVacancy={(loc) => {
              setSelectedVacancyId(loc.id)
            }}
            onApply={(loc) => {
              handleApply(loc)
            }}
          />
        </div>

        {/* SIDE JOB NOTIFICATION PANEL: 💼 KKU JOB ALERTS (Requirements 10, 11, 12, 13) */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            height: '540px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          {/* Side Panel Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              background: '#fbfdfc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={16} style={{ color: 'var(--mint)' }} />
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.04em' }}>
                  💼 KKU JOB ALERTS
                </h4>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '2px', display: 'block' }}>
                Prioritized active bite opportunities
              </span>
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                color: 'var(--mint)',
                background: 'oklch(0.79 0.17 154 / 12%)',
                border: '1px solid var(--mint)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              {sortedJobAlerts.filter((j) => j.vacancies > 0).length} ACTIVE
            </span>
          </div>

          {/* Scrollable Job Alert Cards */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {sortedJobAlerts.map((job) => {
              const isSelected = selectedVacancyId === job.id
              const isAvailable = job.vacancies > 0
              const isFilled = job.status === 'FILLED' || job.vacancies === 0
              const isOversaturated = job.status === 'OVERSATURATED'
              const isUrgent = job.demandLevel === 'URGENT'
              const isHighDemand = job.demandLevel === 'HIGH'

              // Urgency Badge configuration
              let badgeText = '🟢 VACANCY'
              let badgeColor = 'var(--mint)'
              let badgeBg = 'rgba(16, 185, 129, 0.1)'
              let badgeBorder = 'rgba(16, 185, 129, 0.4)'

              if (isUrgent) {
                badgeText = '🔥 URGENT RECRUITMENT'
                badgeColor = '#dc2626'
                badgeBg = '#fef2f2'
                badgeBorder = '#fca5a5'
              } else if (isHighDemand) {
                badgeText = '🔥 HIGH DEMAND'
                badgeColor = '#d97706'
                badgeBg = '#fffbeb'
                badgeBorder = '#fde68a'
              } else if (isOversaturated) {
                badgeText = '⚠ OVERSATURATED'
                badgeColor = '#dc2626'
                badgeBg = '#fef2f2'
                badgeBorder = '#fca5a5'
              } else if (isFilled) {
                badgeText = '✓ FULLY STAFFED'
                badgeColor = '#4b5563'
                badgeBg = '#f3f4f6'
                badgeBorder = '#e5e7eb'
              }

              return (
                <div
                  key={job.id}
                  style={{
                    background: isSelected ? 'rgba(16, 185, 129, 0.04)' : '#ffffff',
                    border: `1px solid ${isSelected ? 'var(--mint)' : 'var(--border)'}`,
                    borderRadius: '6px',
                    padding: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 0 1px var(--mint)' : 'none'
                  }}
                >
                  {/* Status Badge & Category */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color: badgeColor,
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        letterSpacing: '.03em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {badgeText}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--dim)', background: 'rgba(0,0,0,0.03)', padding: '1px 5px', borderRadius: '3px' }}>
                      {job.category}
                    </span>
                  </div>

                  {/* Location Name */}
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} style={{ color: 'var(--mint)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.locationName}
                    </span>
                  </div>

                  {/* Vacancy Info */}
                  <div style={{ fontSize: '11px', color: 'var(--foreground)', marginBottom: '6px' }}>
                    {isAvailable ? (
                      <strong style={{ color: 'var(--mint)' }}>{job.vacancies} mosquitoes needed</strong>
                    ) : isFilled ? (
                      <span style={{ color: 'var(--dim)' }}>0 vacancies available (Fully Staffed)</span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>+{job.surplus || (job.currentMosquitoes - job.requiredMosquitoes)} surplus mosquitoes</span>
                    )}
                    <span style={{ color: 'var(--dim)', fontSize: '10px', marginLeft: '6px' }}>
                      ({job.currentMosquitoes} / {job.requiredMosquitoes})
                    </span>
                  </div>

                  {/* Contextual Notice */}
                  <p style={{ margin: '0 0 10px', fontSize: '10px', color: 'var(--dim)', fontStyle: 'italic', lineHeight: 1.3 }}>
                    &ldquo;{job.message}&rdquo;
                  </p>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleViewLocation(job.id)}
                      style={{
                        flex: 1,
                        background: isSelected ? 'var(--mint)' : 'rgba(0,0,0,0.04)',
                        color: isSelected ? '#ffffff' : 'var(--foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <MapPin size={11} /> [ VIEW LOCATION ]
                    </button>

                    {isAvailable && (
                      <button
                        onClick={() => handleApply(job)}
                        disabled={applying}
                        style={{
                          background: 'oklch(0.79 0.17 154 / 15%)',
                          color: 'var(--mint)',
                          border: '1px solid var(--mint)',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '10px',
                          fontWeight: 800,
                          cursor: applying ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}
                        title="Fly here and submit application"
                      >
                        <Send size={10} /> Apply
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected Vacancy Quick Telemetry Footer */}
          {selectedVacancy && (
            <div
              style={{
                padding: '10px 14px',
                borderTop: '1px solid var(--border)',
                background: '#fbfdfc',
                fontSize: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--dim)' }}>Target Sector:</span>
                <strong style={{ color: 'var(--foreground)' }}>{selectedVacancy.locationName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--dim)' }}>Hosts & Supply:</span>
                <span style={{ color: '#2563eb', fontWeight: 700 }}>
                  👤 {selectedVacancy.humansDetected} hosts &bull; 🩸 {selectedVacancy.bloodSupplyMl} mL
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
