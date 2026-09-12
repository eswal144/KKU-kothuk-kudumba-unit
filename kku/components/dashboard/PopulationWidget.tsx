'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, UserPlus, UserMinus, AlertCircle, RefreshCw, Plus, Minus } from 'lucide-react'
import PopulationOdometer from './PopulationOdometer'
import { API_BASE } from '@/lib/api/config'

interface PopulationOverview {
  totalPopulation: number
  newBirths: number
  deaths: number
  date?: string
}

export default function PopulationWidget({ initialData }: { initialData?: PopulationOverview | null }) {
  const [data, setData] = useState<PopulationOverview | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/population/overview`)
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`)
      }
      const json = await res.json()
      setData({
        totalPopulation: json.totalPopulation ?? json.total_population ?? 1284920,
        newBirths: json.newBirths ?? json.birthsToday ?? json.births_today ?? 384,
        deaths: json.deaths ?? json.deathsToday ?? json.deaths_today ?? 219,
        date: json.date
      })
      setError(null)
    } catch (err: any) {
      if (!data) {
        setError('Unable to load KKU population telemetry. Please check network connection.')
      }
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => {
    fetchOverview()

    // Auto Refresh every 2 seconds to catch 5-second ticks immediately
    const timer = setInterval(() => {
      fetchOverview()
    }, 2000)

    return () => clearInterval(timer)
  }, [fetchOverview])

  const handleRecordBirth = async () => {
    setUpdating(true)
    try {
      const res = await fetch(`${API_BASE}/population/birth`, { method: 'POST' })
      if (res.ok) {
        const json = await res.json()
        if (json.overview) {
          setData(json.overview)
        } else {
          fetchOverview()
        }
      } else {
        // Optimistic local update
        setData((prev) => prev ? {
          ...prev,
          totalPopulation: prev.totalPopulation + 1,
          newBirths: prev.newBirths + 1
        } : prev)
      }
    } catch {
      setData((prev) => prev ? {
        ...prev,
        totalPopulation: prev.totalPopulation + 1,
        newBirths: prev.newBirths + 1
      } : prev)
    } finally {
      setUpdating(false)
    }
  }

  const handleRecordDeath = async () => {
    setUpdating(true)
    try {
      const res = await fetch(`${API_BASE}/population/death`, { method: 'POST' })
      if (res.ok) {
        const json = await res.json()
        if (json.overview) {
          setData(json.overview)
        } else {
          fetchOverview()
        }
      } else {
        // Optimistic local update
        setData((prev) => prev ? {
          ...prev,
          totalPopulation: prev.totalPopulation - 1,
          deaths: prev.deaths + 1
        } : prev)
      }
    } catch {
      setData((prev) => prev ? {
        ...prev,
        totalPopulation: prev.totalPopulation - 1,
        deaths: prev.deaths + 1
      } : prev)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        color: 'var(--foreground)'
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} style={{ color: 'var(--mint)' }} />
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--foreground)', fontWeight: 800 }}>
            🦟 KKU POPULATION TELEMETRY
          </span>
        </div>
        <span
          style={{
            fontSize: '9px',
            color: 'var(--mint)',
            background: 'rgba(5, 150, 105, 0.1)',
            border: '1px solid var(--mint)',
            borderRadius: '4px',
            padding: '3px 10px',
            fontWeight: 800,
            letterSpacing: '.12em',
            textTransform: 'uppercase'
          }}
        >
          FICTIONAL SIMULATION DATA
        </span>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--dim)', fontSize: '12px' }}>
          <RefreshCw size={18} className="spin" style={{ marginBottom: '8px' }} />
          <p style={{ margin: 0 }}>Connecting to KKU Population Telemetry Stream...</p>
        </div>
      )}

      {/* Error State */}
      {error && !data && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', fontSize: '11px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Population Data View */}
      {data && (
        <>
          {/* ODOMETER DISPLAY CONTAINER */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px 0 24px' }}>
            <PopulationOdometer value={data.totalPopulation} />
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.16em', color: 'var(--dim)', fontWeight: 800, marginTop: '12px' }}>
              TOTAL POPULATION
            </span>
            <span style={{ fontSize: '10px', color: 'var(--mint)', fontStyle: 'italic', marginTop: '2px' }}>
              "Active Mosquitoes Currently Annoying Humans Near Beds & Water Tanks 🔊"
            </span>
          </div>

          {/* Secondary Stats Grid: NEW BIRTHS & DEATHS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 800, color: 'var(--mint)' }}>
                <UserPlus size={16} />
                +{data.newBirths.toLocaleString()}
              </div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                NEW BIRTHS
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>
                <UserMinus size={16} />
                -{data.deaths.toLocaleString()}
              </div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                DEATHS
              </span>
            </div>
          </div>

          {/* Interactive Simulation Trigger Controls */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', borderTop: '1px dashed var(--border)', paddingTop: '14px' }}>
            <button
              onClick={handleRecordBirth}
              disabled={updating}
              style={{
                flex: 1,
                background: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid var(--mint)',
                color: 'var(--mint)',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all .2s'
              }}
            >
              <Plus size={13} /> Record Birth
            </button>

            <button
              onClick={handleRecordDeath}
              disabled={updating}
              style={{
                flex: 1,
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all .2s'
              }}
            >
              <Minus size={13} /> Record Death
            </button>
          </div>
        </>
      )}
    </div>
  )
}
