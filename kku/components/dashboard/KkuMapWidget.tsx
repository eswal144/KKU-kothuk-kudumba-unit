'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Globe,
  MapPin,
  Users,
  Dog,
  CheckCircle2,
  Send
} from 'lucide-react'
import { DemandLocation } from './RealGeoMap'

// Dynamically import RealGeoMap to avoid SSR window/Leaflet issues
const RealGeoMap = dynamic(() => import('./RealGeoMap'), { ssr: false })

export default function KkuMapWidget() {
  const [loading, setLoading] = useState(true)

  // Mosquito Demand Map Data
  const [demandLocations, setDemandLocations] = useState<DemandLocation[]>([
    {
      id: 1,
      name: 'College Hostel',
      category: 'Residential',
      currentMosquitoes: 17,
      humansDetected: 43,
      animalsDetected: 2,
      requiredMosquitoes: 50,
      vacancies: 33,
      surplus: 0,
      status: 'VACANCIES_AVAILABLE',
      demandLevel: 'HIGH',
      estimatedBloodmL: '239.0 mL',
      lat: 9.9662,
      lng: 76.2440
    },
    {
      id: 2,
      name: 'Public Library',
      category: 'Study Facility',
      currentMosquitoes: 94,
      humansDetected: 2,
      animalsDetected: 0,
      requiredMosquitoes: 15,
      vacancies: 0,
      surplus: 79,
      status: 'OVERSTAFFED',
      demandLevel: 'LOW',
      estimatedBloodmL: '10.0 mL',
      lat: 9.9680,
      lng: 76.2415
    },
    {
      id: 3,
      name: 'Night Market Food Court',
      category: 'Commercial',
      currentMosquitoes: 28,
      humansDetected: 120,
      animalsDetected: 8,
      requiredMosquitoes: 110,
      vacancies: 82,
      surplus: 0,
      status: 'VACANCIES_AVAILABLE',
      demandLevel: 'CRITICAL',
      estimatedBloodmL: '696.0 mL',
      lat: 9.9620,
      lng: 76.2430
    },
    {
      id: 4,
      name: 'Cattle Farm Barn',
      category: 'Agricultural',
      currentMosquitoes: 12,
      humansDetected: 3,
      animalsDetected: 25,
      requiredMosquitoes: 40,
      vacancies: 28,
      surplus: 0,
      status: 'VACANCIES_AVAILABLE',
      demandLevel: 'HIGH',
      estimatedBloodmL: '315.0 mL',
      lat: 9.9635,
      lng: 76.2410
    },
    {
      id: 5,
      name: 'Subway Station Corridor',
      category: 'Transit',
      currentMosquitoes: 60,
      humansDetected: 10,
      animalsDetected: 0,
      requiredMosquitoes: 20,
      vacancies: 0,
      surplus: 40,
      status: 'OVERSTAFFED',
      demandLevel: 'LOW',
      estimatedBloodmL: '50.0 mL',
      lat: 9.9650,
      lng: 76.2455
    }
  ])
  const [selectedDemandLoc, setSelectedDemandLoc] = useState<DemandLocation | null>(null)
  const [applying, setApplying] = useState(false)
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    // Fetch Demand Map Data
    fetch('http://localhost:5000/api/map/demand-data')
      .then((res) => res.json())
      .then((data) => {
        if (data.locations && data.locations.length > 0) {
          setDemandLocations(data.locations)
          setSelectedDemandLoc(data.locations[0])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedDemandLoc && demandLocations.length > 0) {
      setSelectedDemandLoc(demandLocations[0])
    }
  }, [demandLocations, selectedDemandLoc])

  const handleApplyForVacancy = async (locId: number) => {
    setApplying(true)
    setApplySuccessMsg(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kku_token') : null
      const res = await fetch('http://localhost:5000/api/map/demand/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ locationId: locId })
      })

      const data = await res.json()
      if (res.ok) {
        setApplySuccessMsg(data.message || 'Deployed to vacancy location!')
      } else {
        setApplySuccessMsg(`Flight Path Locked! You have deployed to ${selectedDemandLoc?.name}.`)
      }

      setDemandLocations((prev) =>
        prev.map((loc) => {
          if (loc.id === locId) {
            const newCurrent = loc.currentMosquitoes + 1
            const newVacancies = loc.requiredMosquitoes - newCurrent
            const updatedLoc: DemandLocation = {
              ...loc,
              currentMosquitoes: newCurrent,
              vacancies: newVacancies > 0 ? newVacancies : 0,
              surplus: newVacancies < 0 ? Math.abs(newVacancies) : 0,
              status: newVacancies <= 0 ? 'OVERSTAFFED' : 'VACANCIES_AVAILABLE'
            }
            if (selectedDemandLoc?.id === locId) {
              setSelectedDemandLoc(updatedLoc)
            }
            return updatedLoc
          }
          return loc
        })
      )
    } catch {
      setApplySuccessMsg(`Flight Path Locked! You have deployed to ${selectedDemandLoc?.name}.`)
      setDemandLocations((prev) =>
        prev.map((loc) => {
          if (loc.id === locId) {
            const newCurrent = loc.currentMosquitoes + 1
            const newVacancies = loc.requiredMosquitoes - newCurrent
            const updatedLoc: DemandLocation = {
              ...loc,
              currentMosquitoes: newCurrent,
              vacancies: newVacancies > 0 ? newVacancies : 0,
              surplus: newVacancies < 0 ? Math.abs(newVacancies) : 0,
              status: newVacancies <= 0 ? 'OVERSTAFFED' : 'VACANCIES_AVAILABLE'
            }
            if (selectedDemandLoc?.id === locId) {
              setSelectedDemandLoc(updatedLoc)
            }
            return updatedLoc
          }
          return loc
        })
      )
    } finally {
      setApplying(false)
    }
  }

  const totalVacancies = demandLocations.reduce((sum, l) => sum + l.vacancies, 0)
  const totalMosquitoes = demandLocations.reduce((sum, l) => sum + l.currentMosquitoes, 0)
  const totalHumans = demandLocations.reduce((sum, l) => sum + l.humansDetected, 0)

  if (loading) {
    return (
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <p className="eyebrow"><span className="eyebrow-dot" /> Loading Mosquito Demand & Job Vacancy Map...</p>
      </div>
    )
  }

  return (
    <div
      id="kku-map"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--mint)',
        padding: '24px',
        marginBottom: '28px',
        position: 'relative',
        scrollMarginTop: '80px'
      }}
    >
      {/* Map Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} style={{ color: 'var(--mint)' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '.04em' }}>
              🗺️ MOSQUITO DEMAND MAP &bull; BITE VACANCIES
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--dim)' }}>
            Real-time market view matching active mosquitoes to high-demand blood locations with open bite vacancies across the locality.
          </p>
        </div>
      </div>

      {/* Quick Market Summary Telemetry Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
          background: 'oklch(0.14 0.01 155)',
          border: '1px solid var(--border)',
          padding: '12px 16px'
        }}
      >
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>🟢 OPEN BITE VACANCIES</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mint)' }}>{totalVacancies} Vacancies</div>
        </div>
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>🦟 ACTIVE MOSQUITO WORKFORCE</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>{totalMosquitoes} Mosquitoes</div>
        </div>
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>👤 HUMAN HOSTS DETECTED</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6' }}>{totalHumans} Hosts</div>
        </div>
        <div>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>🩸 TOP DEMAND SECTOR</span>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Night Market Food Court
          </div>
        </div>
      </div>

      {/* Interactive Map Display Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        
        {/* MAP VIEWPORT */}
        <div style={{ position: 'relative', width: '100%', height: '480px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <RealGeoMap
            demandLocations={demandLocations}
            onSelectDemandLocation={(loc) => {
              setSelectedDemandLoc(loc)
              setApplySuccessMsg(null)
            }}
          />
        </div>

        {/* DEMAND LOCATION TELEMETRY SIDEBAR */}
        <div
          style={{
            background: 'oklch(0.16 0.01 155)',
            border: '1px solid var(--border)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            maxHeight: '480px',
            overflowY: 'auto'
          }}
        >
          <div>
            {selectedDemandLoc ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--mint)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> BITE VACANCY TELEMETRY
                  </span>
                  <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', color: 'var(--dim)' }}>
                    {selectedDemandLoc.category}
                  </span>
                </div>

                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>
                  📍 {selectedDemandLoc.name}
                </h4>

                {/* Vacancy Status Pill */}
                <div style={{ marginTop: '8px', marginBottom: '14px' }}>
                  {selectedDemandLoc.status === 'VACANCIES_AVAILABLE' ? (
                    <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#10b981', padding: '6px 10px', fontSize: '11px', fontWeight: 800 }}>
                      🟢 {selectedDemandLoc.vacancies} Mosquito Vacancies Available
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 10px', fontSize: '11px', fontWeight: 800 }}>
                      🔴 OVERSTAFFED ({selectedDemandLoc.surplus} Surplus Mosquitoes)
                    </div>
                  )}
                </div>

                {/* Telemetry Stats Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>🦟 Current Mosquitoes:</span>
                    <strong style={{ color: 'var(--foreground)' }}>{selectedDemandLoc.currentMosquitoes}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} /> Humans Detected:</span>
                    <strong style={{ color: '#3b82f6' }}>{selectedDemandLoc.humansDetected}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: '4px' }}><Dog size={12} /> Animals Detected:</span>
                    <strong style={{ color: 'var(--foreground)' }}>{selectedDemandLoc.animalsDetected}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--dim)' }}>📋 Target Requirement:</span>
                    <strong style={{ color: 'var(--foreground)' }}>{selectedDemandLoc.requiredMosquitoes} mosquitoes</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--dim)' }}>🩸 Est. Blood Supply:</span>
                    <strong style={{ color: 'var(--mint)' }}>{selectedDemandLoc.estimatedBloodmL}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--dim)' }}>🚨 Demand Level:</span>
                    <strong style={{ color: selectedDemandLoc.demandLevel === 'CRITICAL' ? '#ef4444' : selectedDemandLoc.demandLevel === 'HIGH' ? '#f59e0b' : 'var(--mint)' }}>
                      {selectedDemandLoc.demandLevel}
                    </strong>
                  </div>
                </div>

                {/* Apply Success Notification */}
                {applySuccessMsg && (
                  <div style={{ marginTop: '14px', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', padding: '10px', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{applySuccessMsg}</span>
                  </div>
                )}

                {/* Action Button: Fly Here & Apply */}
                <button
                  onClick={() => handleApplyForVacancy(selectedDemandLoc.id)}
                  disabled={applying || selectedDemandLoc.status === 'OVERSTAFFED'}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    background: selectedDemandLoc.status === 'OVERSTAFFED' ? 'rgba(255,255,255,0.05)' : 'var(--mint)',
                    color: selectedDemandLoc.status === 'OVERSTAFFED' ? 'var(--dim)' : '#000',
                    border: 'none',
                    padding: '10px 14px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: selectedDemandLoc.status === 'OVERSTAFFED' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all .2s'
                  }}
                >
                  <Send size={14} />
                  {applying ? 'Deploying Wing Vector...' : selectedDemandLoc.status === 'OVERSTAFFED' ? 'Location Overstaffed' : '🦟 Fly Here & Apply for Vacancy'}
                </button>
              </>
            ) : (
              <p style={{ fontSize: '11px', color: 'var(--dim)' }}>Click any location marker on the map to view bite vacancies.</p>
            )}
          </div>

          <div style={{ marginTop: '20px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            KKU MOSQUITO BITE MARKET &bull; CARTO REAL GEOGRAPHY
          </div>
        </div>

      </div>
    </div>
  )
}


