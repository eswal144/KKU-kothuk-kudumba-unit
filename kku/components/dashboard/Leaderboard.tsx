'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Trophy, RefreshCw, Zap } from 'lucide-react'

export interface LeaderboardEntry {
  id: number
  kku_id: string
  name: string
  bite_count: number
  blood_collected: number
  humans_escaped: number
  survival_days: number
}

interface LeaderboardProps {
  leaderboard?: LeaderboardEntry[]
  onRefresh?: () => void
}

export default function Leaderboard({ leaderboard: initialLeaderboard = [], onRefresh }: LeaderboardProps) {
  const [data, setData] = useState<LeaderboardEntry[]>(initialLeaderboard)
  const [countdown, setCountdown] = useState<number>(20)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const prevDataRef = useRef<Record<number, number>>({})

  // Fetch updated leaderboard from API
  const refreshLeaderboard = useCallback(async () => {
    setIsUpdating(true)
    try {
      const res = await fetch('http://localhost:5000/api/leaderboard')
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json.leaderboard)) {
          setData(json.leaderboard)
          setLastUpdated(new Date().toLocaleTimeString())
          onRefresh?.()
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
    } finally {
      setTimeout(() => setIsUpdating(false), 800)
    }
  }, [onRefresh])

  // Sync when parent prop changes
  useEffect(() => {
    if (initialLeaderboard && initialLeaderboard.length > 0) {
      setData(initialLeaderboard)
    }
  }, [initialLeaderboard])

  // 20-second automatic refresh loop & 1-second countdown ticker
  useEffect(() => {
    // Initial fetch if empty
    if (data.length === 0) {
      refreshLeaderboard()
    }

    // 1-second interval for countdown timer
    const ticker = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshLeaderboard()
          return 20
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(ticker)
  }, [refreshLeaderboard, data.length])

  // Store previous bite counts to detect changes
  useEffect(() => {
    const map: Record<number, number> = {}
    data.forEach((item) => {
      map[item.id] = item.bite_count
    })
    prevDataRef.current = map
  }, [data])

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        position: 'relative'
      }}
    >
      {/* Header with 20s Live indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} style={{ color: 'var(--mint)' }} />
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 800 }}>
              🦟 TOP MOSQUITO BITERS OF THE MONTH
            </span>
            <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '2px' }}>
              Swarm Operatives Hall of Fame &bull; Ranked by Verified Monthly Bites
            </div>
          </div>
        </div>

        {/* Live Status & 20s Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              fontSize: '10px',
              color: 'var(--dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(0,0,0,0.03)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)'
            }}
          >
            <Zap size={11} style={{ color: '#f59e0b' }} />
            <span>Next shift in: <strong>{countdown}s</strong></span>
          </div>

          <div
            style={{
              fontSize: '9px',
              color: 'var(--mint)',
              fontWeight: 800,
              background: 'oklch(0.79 0.17 154 / 10%)',
              padding: '4px 8px',
              border: '1px solid var(--mint)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <RefreshCw size={10} style={{ animation: isUpdating ? 'spin 0.6s linear infinite' : 'none' }} />
            <span>● UPDATES EVERY 20s</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--dim)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em' }}>
              <th style={{ padding: '10px 8px' }}># RANK</th>
              <th style={{ padding: '10px 8px' }}>MOSQUITO</th>
              <th style={{ padding: '10px 8px' }}>KKU-ID</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>BITES THIS MONTH</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>BLOOD SUCKED (MONTH)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const isFirst = index === 0
              const isSecond = index === 1
              const isThird = index === 2

              return (
                <tr
                  key={row.id || index}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isFirst ? 'oklch(0.79 0.17 154 / 3%)' : 'transparent',
                    transition: 'background 0.3s ease'
                  }}
                >
                  {/* Rank */}
                  <td style={{ padding: '12px 8px', fontWeight: 800, color: isFirst ? 'var(--mint)' : isSecond ? '#d97706' : isThird ? '#ca8a04' : 'var(--foreground)' }}>
                    {isFirst ? '🥇 1st' : isSecond ? '🥈 2nd' : isThird ? '🥉 3rd' : `${index + 1}th`}
                  </td>

                  {/* Mosquito Name (NEVER CITIZEN) */}
                  <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--foreground)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>🦟</span>
                      <div>
                        <span style={{ display: 'block', fontSize: '13px' }}>{row.name}</span>
                        <span style={{ fontSize: '9px', color: 'var(--dim)', fontWeight: 500 }}>
                          Field Operative &bull; {row.survival_days || 14}d Active
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* KKU-ID */}
                  <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--dim)' }}>
                    {row.kku_id}
                  </td>

                  {/* Bites This Month */}
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, color: 'var(--mint)', fontSize: '13px' }}>
                    {row.bite_count} bites
                  </td>

                  {/* Blood Sucked (Month) */}
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                    🩸 {row.blood_collected} mL
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--dim)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
        <span>KKU OFFICIAL MOSQUITO REPUTATION REGISTRY &bull; LIVE FEED</span>
        <span>Last Synced: {lastUpdated || 'Initial load'}</span>
      </div>
    </div>
  )
}
