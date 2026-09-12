'use client'

import { Shield, Award, Clock, Droplets, Briefcase, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'

export interface CitizenInfo {
  kkuId: string
  name: string
  age: number
  employment: string
  serviceDays: number
  lifetimeBloodCollection: number
  isVeteran: boolean
  retirementStatus: string
}

export interface ActiveApplication {
  id: number
  category: string
  reason: string
  status: string
  pension_amount: number
  submitted_at: string
  approved_at?: string | null
  review_notes?: string | null
}

export interface ActiveRecord {
  id: number
  category: string
  monthly_amount: number
  start_date: string
  end_date?: string | null
  status: string
}

interface PensionOverviewProps {
  citizen: CitizenInfo | null
  pensionStatus: string
  monthlyBenefit: number
  activeRecord: ActiveRecord | null
  activeApplication: ActiveApplication | null
  onOpenApplyModal: () => void
}

export default function PensionOverview({
  citizen,
  pensionStatus,
  monthlyBenefit,
  activeRecord,
  activeApplication,
  onOpenApplyModal
}: PensionOverviewProps) {
  if (!citizen) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
        <p className="eyebrow"><span className="eyebrow-dot" /> Loading Citizen Pension Record...</p>
      </div>
    )
  }

  const isApproved = pensionStatus === 'APPROVED' || (activeRecord && activeRecord.status === 'ACTIVE')
  const isPending = pensionStatus === 'PENDING' || (activeApplication && activeApplication.status === 'PENDING')
  const isRetirementEligible = citizen.retirementStatus === 'RETIREMENT ELIGIBLE'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
      {/* Top Warning Banner */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '8px',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#b45309', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          <span>🏛️</span>
          <span>FICTIONAL KKU GOVERNMENT SIMULATION</span>
          <span style={{ color: 'var(--dim)', fontWeight: 400 }}>&bull; Citizen Retirement & Disability Services</span>
        </div>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.1em', background: '#ffffff', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#b45309', fontWeight: 700 }}>
          CIVILIZATION PROTOCOL v4.2
        </span>
      </div>

      {/* Primary Dashboard Grid: Citizen Service Record & Status Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Citizen Service Record */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="eyebrow" style={{ margin: 0, fontSize: '9px' }}>
                  <span className="eyebrow-dot" /> OFFICIAL KKU SERVICE RECORD
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--foreground)' }}>
                  {citizen.name}
                </h2>
                <div style={{ display: 'inline-block', marginTop: '4px', background: 'oklch(0.79 0.17 154 / 10%)', border: '1px solid var(--mint)', color: 'var(--mint)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '.08em' }}>
                  ID: {citizen.kkuId}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>CITIZEN AGE</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
                  {citizen.age} <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dim)' }}>days</span>
                </div>
              </div>
            </div>

            {/* Metrics List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> SERVICE PERIOD
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
                  {citizen.serviceDays} days
                </div>
              </div>

              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Droplets size={11} /> LIFETIME BLOOD
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                  {citizen.lifetimeBloodCollection} mL
                </div>
              </div>

              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={11} /> CURRENT EMPLOYMENT
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', marginTop: '2px' }}>
                  {citizen.employment}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={11} /> VETERAN STATUS
                </span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: citizen.isVeteran ? 'var(--mint)' : 'var(--dim)', marginTop: '2px' }}>
                  {citizen.isVeteran ? '🏅 QUALIFIED VETERAN' : 'STANDARD CITIZEN'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '10px 14px', borderRadius: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase' }}>Retirement Status</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: isRetirementEligible ? '#059669' : 'var(--dim)',
                background: isRetirementEligible ? '#ecfdf5' : '#f3f4f6',
                padding: '4px 10px',
                borderRadius: '4px',
                border: `1px solid ${isRetirementEligible ? '#a7f3d0' : 'var(--border)'}`
              }}
            >
              {isRetirementEligible ? '👴 RETIREMENT ELIGIBLE' : 'NOT ELIGIBLE (<25 days)'}
            </span>
          </div>
        </div>

        {/* Card 2: Pension Status & Monthly Fictional Benefit */}
        <div
          style={{
            background: isApproved ? 'linear-gradient(135deg, #062419 0%, #0a3625 100%)' : '#ffffff',
            border: isApproved ? '1px solid var(--mint)' : '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            color: isApproved ? '#ffffff' : 'var(--foreground)',
            boxShadow: isApproved ? '0 10px 30px rgba(16, 185, 129, 0.15)' : '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span
                style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                  fontWeight: 800,
                  color: isApproved ? 'var(--mint)' : 'var(--dim)'
                }}
              >
                🏛️ PENSION STATUS
              </span>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  letterSpacing: '.06em',
                  background: isApproved ? 'rgba(16, 185, 129, 0.25)' : isPending ? 'rgba(245, 158, 11, 0.2)' : '#f3f4f6',
                  color: isApproved ? '#34d399' : isPending ? '#d97706' : 'var(--dim)',
                  border: `1px solid ${isApproved ? '#10b981' : isPending ? '#f59e0b' : 'var(--border)'}`
                }}
              >
                {pensionStatus}
              </span>
            </div>

            {/* Monthly Benefit Big Display */}
            <div style={{ margin: '16px 0' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: isApproved ? '#9ca3af' : 'var(--dim)', fontWeight: 700, letterSpacing: '.05em' }}>
                APPROVED MONTHLY STIPEND
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '38px', fontWeight: 900, color: isApproved ? '#34d399' : 'var(--foreground)', letterSpacing: '-.02em' }}>
                  {monthlyBenefit > 0 ? monthlyBenefit.toFixed(1) : '0.0'}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: isApproved ? '#a7f3d0' : 'var(--dim)' }}>
                  mL / month
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: isApproved ? '#9ca3af' : 'var(--dim)' }}>
                Fictional simulation resource automatically deposited into citizen KKU-BANK reserve.
              </p>
            </div>

            {/* Active Record or Application Summary */}
            {activeRecord && (
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                  <span>ACTIVE CATEGORY</span>
                  <span style={{ color: '#34d399', fontWeight: 800 }}>{activeRecord.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                  <span>START DATE</span>
                  <span>{activeRecord.start_date?.split(' ')[0]}</span>
                </div>
              </div>
            )}

            {activeApplication && !activeRecord && (
              <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '12px 14px', marginTop: '12px', color: '#854d0e' }}>
                <div style={{ fontSize: '10px', fontWeight: 800 }}>APPLICATION UNDER SIMULATION REVIEW</div>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>Category: <strong>{activeApplication.category}</strong></div>
                <div style={{ fontSize: '10px', color: '#a16207', marginTop: '4px' }}>
                  Notes: {activeApplication.review_notes || 'Pending committee evaluation.'}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={onOpenApplyModal}
              style={{
                width: '100%',
                background: isApproved ? 'var(--mint)' : 'var(--foreground)',
                color: isApproved ? '#062419' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={15} />
              {isApproved ? 'Apply For Category Upgrade' : isPending ? 'View Pending Application' : 'Submit Pension Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
