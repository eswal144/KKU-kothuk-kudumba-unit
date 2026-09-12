'use client'

import { Clock, CheckCircle2, AlertCircle, FileText, Award } from 'lucide-react'
import { ActiveRecord, ActiveApplication } from './PensionOverview'

interface PensionHistoryProps {
  records: ActiveRecord[]
  currentApplication: ActiveApplication | null
}

export default function PensionHistory({ records = [], currentApplication }: PensionHistoryProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Official Pension Records Table */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span className="eyebrow" style={{ margin: 0, fontSize: '9px' }}>
              <span className="eyebrow-dot" /> OFFICIAL KKU ARCHIVES
            </span>
            <h3 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--foreground)' }}>
              Pension Grant Records & Payout Registry
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dim)' }}>
            Resource Type: Fictional Blood mL Reserve
          </span>
        </div>

        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--dim)', fontSize: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px dashed var(--border)' }}>
            No active or historical pension grant records found for this citizen.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--dim)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  <th style={{ padding: '10px 12px' }}>Grant ID</th>
                  <th style={{ padding: '10px 12px' }}>Category</th>
                  <th style={{ padding: '10px 12px' }}>Monthly Stipend</th>
                  <th style={{ padding: '10px 12px' }}>Start Date</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const isActive = r.status === 'ACTIVE'
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>#KKU-PEN-{r.id}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--foreground)' }}>
                          {r.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 800, color: 'var(--mint)' }}>
                        +{r.monthly_amount?.toFixed(1)} mL / month
                      </td>
                      <td style={{ padding: '12px', color: 'var(--dim)' }}>
                        {r.start_date?.split(' ')[0] || 'Present'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isActive ? 'oklch(0.79 0.17 154 / 15%)' : '#f3f4f6',
                            color: isActive ? 'var(--mint)' : 'var(--dim)',
                            border: `1px solid ${isActive ? 'var(--mint)' : 'var(--border)'}`
                          }}
                        >
                          {r.status}
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

      {/* 2. Application Status Log */}
      {currentApplication && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--mint)' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                Latest Application Docket: #{currentApplication.id}
              </h3>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '4px',
                background: currentApplication.status === 'APPROVED' ? 'oklch(0.79 0.17 154 / 15%)' : currentApplication.status === 'REJECTED' ? '#fef2f2' : '#fefce8',
                color: currentApplication.status === 'APPROVED' ? 'var(--mint)' : currentApplication.status === 'REJECTED' ? '#dc2626' : '#a16207',
                border: `1px solid ${currentApplication.status === 'APPROVED' ? 'var(--mint)' : currentApplication.status === 'REJECTED' ? '#fecaca' : '#fef08a'}`
              }}
            >
              {currentApplication.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: '#f9fafb', padding: '14px', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>Requested Category</span>
              <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>{currentApplication.category}</div>
            </div>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>Submitted On</span>
              <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{currentApplication.submitted_at}</div>
            </div>
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>Stipend Tier</span>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--mint)', marginTop: '2px' }}>{currentApplication.pension_amount?.toFixed(1)} mL/mo</div>
            </div>
          </div>

          <div style={{ marginTop: '14px', fontSize: '12px', lineHeight: '1.5' }}>
            <strong style={{ color: 'var(--dim)', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Fictional Board Review Notes:</strong>
            <p style={{ margin: 0, color: 'var(--foreground)' }}>
              {currentApplication.review_notes || 'Pending review in the next simulation cycle.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
