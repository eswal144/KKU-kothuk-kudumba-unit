'use client'

import { WalletCards, Shield, Info } from 'lucide-react'

interface BankData {
  resourceBalance: number
  communityStatus: string
  emergencyReserve: string
}

export default function BankWidget({ data }: { data: BankData | null }) {
  if (!data) return null

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        padding: '24px',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WalletCards size={16} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700 }}>
            KKU-BANK
          </span>
        </div>
        <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Info size={10} /> SIMULATION DATA
        </span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: '2px' }}>
          BLOOD RESOURCE BALANCE
        </span>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--mint)' }}>
          {data.resourceBalance} <small style={{ fontSize: '12px', color: 'var(--foreground)', fontWeight: 600 }}>mL</small>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', marginBottom: '2px' }}>COMMUNITY STATUS</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>{data.communityStatus}</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', marginBottom: '2px' }}>EMERGENCY RESERVE</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} /> {data.emergencyReserve}
          </span>
        </div>
      </div>
    </div>
  )
}
