'use client'

import { useState, useEffect } from 'react'
import { X, Send, AlertTriangle, CheckCircle2, FileText, ShieldCheck } from 'lucide-react'
import { CitizenInfo } from './PensionOverview'
import { EligibilityData } from './PensionEligibility'
import { API_BASE } from '@/lib/api/config'

interface PensionApplicationProps {
  isOpen: boolean
  onClose: () => void
  citizen: CitizenInfo | null
  eligibility: EligibilityData | null
  initialCategory?: string
  onApplicationSuccess: () => void
}

const CATEGORY_NAMES: Record<string, string> = {
  PERMANENT_INJURY: '🦽 Permanent Injury Pension',
  WAR_INJURY: '⚔️ War Injury Pension',
  RETIREMENT: '👴 Retirement Pension',
  TEMPORARY_DISABILITY: '🩹 Temporary Disability Pension',
  VETERAN: '🏅 Veteran Mosquito Pension'
}

export default function PensionApplication({
  isOpen,
  onClose,
  citizen,
  eligibility,
  initialCategory = 'VETERAN',
  onApplicationSuccess
}: PensionApplicationProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [reason, setReason] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory)
    }
  }, [initialCategory])

  // Automatically populate default reason based on selected category and telemetry
  useEffect(() => {
    if (!eligibility || !citizen) return

    const categoryKey = selectedCategory as keyof typeof eligibility.categories
    const isEligible = eligibility.categories[categoryKey]

    if (selectedCategory === 'PERMANENT_INJURY') {
      setReason(isEligible
        ? `Application under clinical disability criteria. Patient medical trauma on file in MOSQ-HOSPITAL. Unable to maintain daily flight duties.`
        : `Requesting disability assessment due to wing wear and reduced flight velocity.`
      )
    } else if (selectedCategory === 'WAR_INJURY') {
      setReason(isEligible
        ? `Injuries sustained during KKU Sector 04 Human Defense and Electric Swatter engagement while on official night swarm patrol.`
        : `Participated in Sector 04 swarm deployment.`
      )
    } else if (selectedCategory === 'RETIREMENT') {
      setReason(isEligible
        ? `Reconciliation of service tenure. Citizen age (${citizen.age} days) meets official KKU retirement threshold (${eligibility.retirementAge} days). Applying for civilian honorable discharge.`
        : `Citizen age (${citizen.age} days) requesting early retirement review.`
      )
    } else if (selectedCategory === 'TEMPORARY_DISABILITY') {
      setReason(isEligible
        ? `Currently receiving acute medical treatment at MOSQ-HOSPITAL. Requesting convalescent subsistence stipend until discharge.`
        : `Temporary fatigue following extensive field biting shifts.`
      )
    } else if (selectedCategory === 'VETERAN') {
      setReason(isEligible
        ? `Distinguished service record verified: ${citizen.serviceDays} operational days with ${citizen.lifetimeBloodCollection} mL lifetime blood contribution to the swarm.`
        : `Applying on grounds of general service tenure.`
      )
    }
  }, [selectedCategory, eligibility, citizen])

  if (!isOpen) return null

  const isEligibleForSelected = eligibility ? eligibility.categories[selectedCategory as keyof typeof eligibility.categories] : false
  const estimatedAmount = eligibility ? eligibility.calculatedAmounts[selectedCategory as keyof typeof eligibility.calculatedAmounts] : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEligibleForSelected) {
      setErrorMessage('Citizen does not meet the strict backend criteria for this pension category.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const token = localStorage.getItem('kku_token')
      const res = await fetch(`${API_BASE}/pension/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: selectedCategory,
          reason: reason.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit pension application.')
      }

      setSuccessMessage('Pension application filed successfully! Simulation review underway.')
      setTimeout(() => {
        onApplicationSuccess()
        onClose()
      }, 1500)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with KKU Government API.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          color: 'var(--foreground)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px' }}>🏛️</span>
              <span className="eyebrow" style={{ margin: 0, fontSize: '9px' }}>
                <span className="eyebrow-dot" /> FORM P-102 &bull; OFFICIAL SUBMISSION
              </span>
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800 }}>
              Apply for MOSQ-PENSION
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Category Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--dim)', marginBottom: '8px' }}>
              Select Pension Category:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(CATEGORY_NAMES).map(([key, name]) => {
                const isCatEligible = eligibility?.categories[key as keyof typeof eligibility.categories] || false
                const isChecked = selectedCategory === key

                return (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${isChecked ? 'var(--mint)' : 'var(--border)'}`,
                      background: isChecked ? 'oklch(0.79 0.17 154 / 8%)' : '#f9fafb',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="radio"
                        name="category"
                        value={key}
                        checked={isChecked}
                        onChange={() => setSelectedCategory(key)}
                        style={{ accentColor: 'var(--mint)' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: isChecked ? 800 : 600 }}>
                        {name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isCatEligible ? '#ecfdf5' : '#f3f4f6',
                        color: isCatEligible ? '#059669' : '#9ca3af',
                        border: `1px solid ${isCatEligible ? '#a7f3d0' : '#e5e7eb'}`
                      }}
                    >
                      {isCatEligible ? 'QUALIFIED' : 'NOT ELIGIBLE'}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Supporting Telemetry Evidence Checklist */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={12} style={{ color: 'var(--mint)' }} /> Certified KKU Supporting Evidence
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px', fontSize: '11px' }}>
              <div>
                <span style={{ color: 'var(--dim)' }}>Service Period:</span> <strong>{citizen?.serviceDays || 0} days</strong>
              </div>
              <div>
                <span style={{ color: 'var(--dim)' }}>Lifetime Blood:</span> <strong>{citizen?.lifetimeBloodCollection || 0} mL</strong>
              </div>
              <div>
                <span style={{ color: 'var(--dim)' }}>Employment:</span> <strong>{citizen?.employment || 'Active'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--dim)' }}>Est. Benefit:</span> <strong style={{ color: 'var(--mint)' }}>{estimatedAmount.toFixed(1)} mL/mo</strong>
              </div>
            </div>
          </div>

          {/* Justification Reason */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--dim)', marginBottom: '6px' }}>
              Reason for Claim (Auto-populated from system):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'vertical',
                background: '#ffffff',
                color: 'var(--foreground)'
              }}
            />
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                padding: '10px 18px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--dim)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isEligibleForSelected}
              style={{
                background: isEligibleForSelected ? 'var(--mint)' : '#e5e7eb',
                color: isEligibleForSelected ? '#062419' : '#9ca3af',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: isEligibleForSelected && !submitting ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Send size={13} />
              {submitting ? 'Submitting Application...' : isEligibleForSelected ? 'Submit Application' : 'Category Not Eligible'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
