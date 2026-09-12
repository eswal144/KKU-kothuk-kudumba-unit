'use client'

import { Trophy, Award } from 'lucide-react'

interface LeaderboardEntry {
  id: number
  kku_id: string
  name: string
  bite_count: number
  blood_collected: number
  humans_escaped: number
  survival_days: number
}

export default function Leaderboard({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  return (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={16} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 700 }}>
            TOP BITERS LEADERBOARD
          </span>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--mint)', fontWeight: 600 }}>
          SWARM HALL OF FAME
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--dim)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.12em' }}>
              <th style={{ padding: '8px 6px' }}># RANK</th>
              <th style={{ padding: '8px 6px' }}>CITIZEN</th>
              <th style={{ padding: '8px 6px' }}>KKU-ID</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>BITES</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>BLOOD</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, index) => (
              <tr key={row.id || index} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 6px', fontWeight: 800, color: index === 0 ? 'var(--mint)' : 'var(--foreground)' }}>
                  {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `${index + 1}th`}
                </td>
                <td style={{ padding: '10px 6px', fontWeight: 700, color: 'var(--foreground)' }}>
                  {row.name}
                </td>
                <td style={{ padding: '10px 6px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--dim)' }}>
                  {row.kku_id}
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 800, color: 'var(--mint)' }}>
                  {row.bite_count}
                </td>
                <td style={{ padding: '10px 6px', textAlign: 'right', color: 'var(--foreground)' }}>
                  {row.blood_collected} mL
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
