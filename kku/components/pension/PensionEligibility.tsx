'use client'

import { CheckCircle2, XCircle, ChevronRight, ShieldAlert, HeartCrack, Swords, UserCheck, Stethoscope } from 'lucide-react'

export interface EligibilityData {
  eligible: boolean
  categories: {
    PERMANENT_INJURY: boolean
    WAR_INJURY: boolean
    RETIREMENT: boolean
    TEMPORARY_DISABILITY: boolean
    VETERAN: boolean
  }
  reasons: {
    PERMANENT_INJURY: string
    WAR_INJURY: string
    RETIREMENT: string
    TEMPORARY_DISABILITY: string
    VETERAN: string
  }
  calculatedAmounts: {
    PERMANENT_INJURY: number
    WAR_INJURY: number
    RETIREMENT: number
    TEMPORARY_DISABILITY: number
    VETERAN: number
  }
  retirementAge: number
}

interface PensionEligibilityProps {
  eligibility: EligibilityData | null
  onSelectCategoryToApply: (categoryKey: string) => void
}

export default function PensionEligibility({
  eligibility,
  onSelectCategoryToApply
}: PensionEligibilityProps) {
  if (!eligibility) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
        <p className="eyebrow"><span className="eyebrow-dot" /> Calculating Official KKU Government Eligibility...</p>
      </div>
    )
  }

  const categoryConfigs = [
    {
      key: 'PERMANENT_INJURY',
      icon: '🦽',
      title: 'PERMANENT INJURY PENSION',
      desc: 'For citizens with permanent clinical injuries preventing flight or blood collection duties. Evaluated directly from MOSQ-HOSPITAL telemetry.',
      badgeEligible: 'ELIGIBLE',
      eligible: eligibility.categories.PERMANENT_INJURY,
      reason: eligibility.reasons.PERMANENT_INJURY,
      amount: eligibility.calculatedAmounts.PERMANENT_INJURY
    },
    {
      key: 'WAR_INJURY',
      icon: '⚔️',
      title: 'WAR INJURY PENSION',
      desc: 'For mosquito defenders injured during official KKU Sector 04 swarm defense operations or electric swatter engagements.',
      badgeEligible: 'ELIGIBLE',
      eligible: eligibility.categories.WAR_INJURY,
      reason: eligibility.reasons.WAR_INJURY,
      amount: eligibility.calculatedAmounts.WAR_INJURY
    },
    {
      key: 'RETIREMENT',
      icon: '👴',
      title: 'RETIREMENT PENSION',
      desc: `For elder mosquitoes reaching the official KKU retirement age (${eligibility.retirementAge || 25} days) after faithful civilian service.`,
      badgeEligible: 'ELIGIBLE',
      eligible: eligibility.categories.RETIREMENT,
      reason: eligibility.reasons.RETIREMENT,
      amount: eligibility.calculatedAmounts.RETIREMENT
    },
    {
      key: 'TEMPORARY_DISABILITY',
      icon: '🩹',
      title: 'TEMPORARY DISABILITY PENSION',
      desc: 'Convalescent support for citizens currently hospitalized or recovering in MOSQ-HOSPITAL. Automatically concludes upon medical discharge.',
      badgeEligible: 'ELIGIBLE',
      eligible: eligibility.categories.TEMPORARY_DISABILITY,
      reason: eligibility.reasons.TEMPORARY_DISABILITY,
      amount: eligibility.calculatedAmounts.TEMPORARY_DISABILITY
    },
    {
      key: 'VETERAN',
      icon: '🏅',
      title: 'VETERAN MOSQUITO PENSION',
      desc: 'For citizens with distinguished service records exceeding 20 operational days in active field deployment.',
      badgeEligible: 'ELIGIBLE',
      eligible: eligibility.categories.VETERAN,
      reason: eligibility.reasons.VETERAN,
      amount: eligibility.calculatedAmounts.VETERAN
    }
  ]

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <span className="eyebrow" style={{ margin: 0, fontSize: '9px' }}>
            <span className="eyebrow-dot" /> BACKEND ELIGIBILITY ENGINE
          </span>
          <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
            Pension Category Evaluations
          </h3>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--dim)' }}>
          Authority: KKU Civil Welfare &bull; Deterministic Citizen Evaluation
        </span>
      </div>

      {/* Grid of 5 Category Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
        {categoryConfigs.map((cat) => {
          return (
            <div
              key={cat.key}
              style={{
                background: '#ffffff',
                border: `1px solid ${cat.eligible ? 'var(--mint)' : 'var(--border)'}`,
                borderRadius: '10px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: cat.eligible ? '0 4px 20px rgba(16, 185, 129, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                position: 'relative'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px' }}>{cat.icon}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.02em' }}>
                        {cat.title}
                      </h4>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      letterSpacing: '.06em',
                      background: cat.eligible ? 'oklch(0.79 0.17 154 / 15%)' : '#f3f4f6',
                      color: cat.eligible ? 'var(--mint)' : 'var(--dim)',
                      border: `1px solid ${cat.eligible ? 'var(--mint)' : 'var(--border)'}`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat.eligible ? '✓ ELIGIBLE' : '✕ NOT ELIGIBLE'}
                  </span>
                </div>

                <p style={{ margin: '0 0 12px', fontSize: '11px', lineHeight: '1.4', color: 'var(--dim)' }}>
                  {cat.desc}
                </p>

                {/* Justification note */}
                <div
                  style={{
                    background: cat.eligible ? '#f0fdf4' : '#f9fafb',
                    border: `1px solid ${cat.eligible ? '#bbf7d0' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '10px',
                    color: cat.eligible ? '#15803d' : '#6b7280',
                    lineHeight: '1.4',
                    marginBottom: '12px'
                  }}
                >
                  <strong>Telemetry Verification:</strong> {cat.reason}
                </div>
              </div>

              {/* Bottom footer: Prospective Benefit & Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>
                    BENEFIT ESTIMATE
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: cat.eligible ? 'var(--mint)' : 'var(--dim)' }}>
                    {cat.amount?.toFixed(1) || '0.0'} mL<span style={{ fontSize: '10px', fontWeight: 500 }}>/mo</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCategoryToApply(cat.key)}
                  disabled={!cat.eligible}
                  style={{
                    background: cat.eligible ? 'var(--foreground)' : '#e5e7eb',
                    color: cat.eligible ? '#ffffff' : '#9ca3af',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: cat.eligible ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Apply</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
