'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Shield, Building2, FileText, CheckCircle2 } from 'lucide-react'
import ProfileBadge from '@/components/profile-badge'
import PensionOverview, { CitizenInfo, ActiveRecord, ActiveApplication } from '@/components/pension/PensionOverview'
import PensionEligibility, { EligibilityData } from '@/components/pension/PensionEligibility'
import PensionApplication from '@/components/pension/PensionApplication'
import PensionHistory from '@/components/pension/PensionHistory'
import PensionNotificationCenter, { PensionNotification } from '@/components/pension/PensionNotificationCenter'

const API_BASE = 'http://localhost:5000/api'

export default function PensionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [citizen, setCitizen] = useState<CitizenInfo | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null)
  const [pensionStatus, setPensionStatus] = useState<string>('NOT_APPLIED')
  const [monthlyBenefit, setMonthlyBenefit] = useState<number>(0)
  const [activeRecord, setActiveRecord] = useState<ActiveRecord | null>(null)
  const [activeApplication, setActiveApplication] = useState<ActiveApplication | null>(null)
  const [records, setRecords] = useState<ActiveRecord[]>([])
  
  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState('VETERAN')

  // Notification queue
  const [notifications, setNotifications] = useState<PensionNotification[]>([])

  // Fetch all pension data for currently authenticated mosquito
  const fetchPensionData = useCallback(async (isInitial = false) => {
    const token = localStorage.getItem('kku_token')
    if (!token) {
      router.replace('/')
      return
    }

    try {
      if (!isInitial) setRefreshing(true)

      // 1. Fetch Pension Status & Eligibility
      const statusRes = await fetch(`${API_BASE}/pension/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (statusRes.status === 401) {
        localStorage.removeItem('kku_token')
        router.replace('/')
        return
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setCitizen(statusData.citizen)
        setEligibility(statusData.eligibility)
        setPensionStatus(statusData.pensionStatus)
        setMonthlyBenefit(statusData.monthlyBenefit || 0)
        setActiveRecord(statusData.activeRecord)
        setActiveApplication(statusData.activeApplication)
      }

      // 2. Fetch Pension Records
      const recordsRes = await fetch(`${API_BASE}/pension/records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json()
        setRecords(recordsData.records || [])
      }

      // 3. Fetch latest application docket
      const appRes = await fetch(`${API_BASE}/pension/application`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (appRes.ok) {
        const appData = await appRes.json()
        if (appData.application) {
          setActiveApplication(appData.application)
        }
      }

    } catch (err) {
      console.error('Error fetching KKU Pension data:', err)
    } finally {
      if (isInitial) setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  // Authentication check & initial load
  useEffect(() => {
    const token = localStorage.getItem('kku_token')
    if (!token) {
      router.replace('/')
      return
    }
    fetchPensionData(true)

    // Periodic simulation poll (every 10 seconds)
    const interval = setInterval(() => {
      fetchPensionData(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchPensionData, router])

  const handleOpenApplyModal = (catKey?: string) => {
    if (catKey) setSelectedCategoryForModal(catKey)
    setIsApplyModalOpen(true)
  }

  const handleApplicationSuccess = () => {
    fetchPensionData(false)
    setNotifications(prev => [
      ...prev,
      {
        id: 'notif-' + Date.now(),
        title: 'APPLICATION TRANSMITTED',
        message: 'Your official claim docket has been registered with the KKU Pension Oversight Board.',
        timestamp: 'Just now'
      }
    ])
  }

  if (loading) {
    return (
      <main className="kku-site" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> Loading Official KKU Pension Telemetry...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="kku-site" style={{ minHeight: '100vh' }}>
      {/* Universal KKU Top Navigation Bar */}
      <nav className="kku-nav" aria-label="Pension navigation" id="top">
        <a href="/dashboard" className="kku-mark" aria-label="KKU home">
          <span>KKU</span>
          <small>Kothuk Kudumba Unit</small>
        </a>
        <div className="kku-nav-links">
          <a href="/dashboard">Home</a>
          <a href="/bank">🩸 MOSQ-BANK</a>
          <a href="/hospital">🏥 MOSQ-HOSPITAL</a>
          <a href="/bite-vacancies">Bite Vacancies</a>
          <a href="/pension" style={{ color: 'var(--mint)', fontWeight: 800 }}>🏛️ MOSQ-PENSION</a>
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
              <Building2 size={20} style={{ color: 'var(--mint)' }} />
              <span className="eyebrow" style={{ margin: 0 }}>
                <span className="eyebrow-dot" /> KKU RETIREMENT & DISABILITY SERVICES &bull; FICTIONAL GOVERNMENT SIMULATION
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.02em' }}>
              🏛️ MOSQ-PENSION
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--dim)' }}>
              Autonomous governmental pension, disability insurance, and veteran benefit administration for citizen mosquitoes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchPensionData(false)}
              disabled={refreshing}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Syncing...' : 'Sync Records'}
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
                padding: '6px 14px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>

            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--mint)', background: 'oklch(0.79 0.17 154 / 10%)', border: '1px solid var(--mint)', padding: '6px 12px', borderRadius: '4px', fontWeight: 800 }}>
              ● SIMULATION ACTIVE
            </span>
          </div>
        </div>

        {/* 1. Personal Pension Dashboard & Service Record */}
        <PensionOverview
          citizen={citizen}
          pensionStatus={pensionStatus}
          monthlyBenefit={monthlyBenefit}
          activeRecord={activeRecord}
          activeApplication={activeApplication}
          onOpenApplyModal={() => handleOpenApplyModal()}
        />

        {/* 2. 5 Official Pension Categories & Eligibility Verification */}
        <PensionEligibility
          eligibility={eligibility}
          onSelectCategoryToApply={(catKey) => handleOpenApplyModal(catKey)}
        />

        {/* 3. Official Records Registry & Application Docket */}
        <PensionHistory
          records={records}
          currentApplication={activeApplication}
        />

        {/* Footer Note */}
        <div style={{ marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dim)' }}>
          <span>© KKU / Kothuk Kudumba Unit &bull; Department of Mosquito Pension Affairs</span>
          <span>Fictional Civilization Engine &bull; Strictly Simulated Fictional Data</span>
          <a href="/pension#top" style={{ color: 'var(--mint)' }}>Back to Top ↑</a>
        </div>
      </div>

      {/* Application Modal */}
      <PensionApplication
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        citizen={citizen}
        eligibility={eligibility}
        initialCategory={selectedCategoryForModal}
        onApplicationSuccess={handleApplicationSuccess}
      />

      {/* Floating Animated Pension Bulletins */}
      <PensionNotificationCenter
        notifications={notifications}
        onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />
    </main>
  )
}
