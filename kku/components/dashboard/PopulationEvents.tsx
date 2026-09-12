'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Activity, X, ChevronRight, ChevronLeft, BellRing, Navigation } from 'lucide-react'

interface PopulationEvent {
  id: number
  event_type: string
  icon: string
  description: string
  created_at?: string
}

interface MigrationAlert {
  id: number
  message: string
  level: string
  sector: string
  created_at?: string
}

interface StreamItem {
  id: string
  icon: string
  category: string
  description: string
  badge: string
}

export default function PopulationEvents({
  events = [],
  migrationAlerts = []
}: {
  events?: PopulationEvent[]
  migrationAlerts?: MigrationAlert[]
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animState, setAnimState] = useState<'visible' | 'exiting' | 'entering'>('visible')
  const [toastDismissed, setToastDismissed] = useState(false)

  // Merge Population Events & Migration Alerts into one live stream sequence
  const streamItems = useMemo<StreamItem[]>(() => {
    const list: StreamItem[] = []

    // 1. Map Population Events
    events.forEach((evt) => {
      list.push({
        id: `pop-${evt.id}`,
        icon: evt.icon || '🦟',
        category: 'CIVILIZATION EVENT',
        description: evt.description,
        badge: evt.event_type || 'REGISTRY'
      })
    })

    // 2. Map Migration Alerts
    migrationAlerts.forEach((mig) => {
      list.push({
        id: `mig-${mig.id}`,
        icon: '✈️',
        category: 'MIGRATION ALERT',
        description: mig.message,
        badge: mig.sector ? `SECTOR ${mig.sector}` : mig.level || 'FLIGHT PATH'
      })
    })

    return list
  }, [events, migrationAlerts])

  // Transition handler for "comes from down and goes to up"
  const triggerNext = useCallback(() => {
    if (streamItems.length === 0) return
    setAnimState('exiting') // Goes UP (-80px)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % streamItems.length)
      setAnimState('entering') // Set DOWN (+80px)
      setTimeout(() => {
        setAnimState('visible') // Slides UP into place (0px)
      }, 40)
    }, 300)
  }, [streamItems.length])

  const triggerPrev = useCallback(() => {
    if (streamItems.length === 0) return
    setAnimState('exiting') // Goes UP (-80px)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? streamItems.length - 1 : prev - 1))
      setAnimState('entering') // Set DOWN (+80px)
      setTimeout(() => {
        setAnimState('visible') // Slides UP into place (0px)
      }, 40)
    }, 300)
  }, [streamItems.length])

  // Auto-rotate pop-up every 5 seconds (comes from down, goes to up)
  useEffect(() => {
    if (streamItems.length === 0 || toastDismissed) return

    const timer = setInterval(() => {
      triggerNext()
    }, 5000)

    return () => clearInterval(timer)
  }, [streamItems.length, toastDismissed, triggerNext])

  const activeItem = streamItems.length > 0 ? streamItems[currentIndex % streamItems.length] : null

  // Compute vertical transform & opacity
  const getTransform = () => {
    if (animState === 'exiting') return 'translateY(-70px) scale(0.94)'
    if (animState === 'entering') return 'translateY(70px) scale(0.94)'
    return 'translateY(0) scale(1)'
  }

  const getOpacity = () => {
    if (animState === 'visible') return 1
    return 0
  }

  return (
    <>
      {/* FLOATING LEFT-SIDE POP-UP NOTIFICATION TOAST (Comes from down, goes to up) */}
      {activeItem && !toastDismissed && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            left: '28px',
            width: '350px',
            maxWidth: 'calc(100vw - 56px)',
            background: 'var(--panel)',
            border: activeItem.category === 'MIGRATION ALERT' ? '1px solid oklch(0.75 0.16 155)' : '1px solid var(--mint)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75), 0 0 24px oklch(0.79 0.17 154 / 20%)',
            backdropFilter: 'blur(12px)',
            zIndex: 999,
            padding: '14px 16px',
            transition: animState === 'entering' ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
            transform: getTransform(),
            opacity: getOpacity()
          }}
        >
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activeItem.category === 'MIGRATION ALERT' ? 'oklch(0.85 0.15 80)' : 'var(--mint)',
                  boxShadow: `0 0 8px ${activeItem.category === 'MIGRATION ALERT' ? 'oklch(0.85 0.15 80)' : 'var(--mint)'}`,
                  display: 'inline-block'
                }}
              />
              {activeItem.category === 'MIGRATION ALERT' ? (
                <Navigation size={13} style={{ color: 'oklch(0.85 0.15 80)' }} />
              ) : (
                <BellRing size={13} style={{ color: 'var(--mint)' }} />
              )}
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '.14em',
                  color: activeItem.category === 'MIGRATION ALERT' ? 'oklch(0.85 0.15 80)' : 'var(--mint)'
                }}
              >
                {activeItem.category}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '8px', color: 'var(--dim)', fontWeight: 600 }}>
                {currentIndex + 1} / {streamItems.length}
              </span>
              <button
                onClick={() => setToastDismissed(true)}
                aria-label="Close notification"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--dim)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Event Content */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '22px', lineHeight: 1, marginTop: '2px' }}>{activeItem.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px', lineHeight: 1.35 }}>
                {activeItem.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span
                  style={{
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '.1em',
                    fontWeight: 700,
                    color: activeItem.category === 'MIGRATION ALERT' ? 'oklch(0.85 0.15 80)' : 'var(--mint)',
                    background: activeItem.category === 'MIGRATION ALERT' ? 'oklch(0.85 0.15 80 / 15%)' : 'oklch(0.79 0.17 154 / 15%)',
                    padding: '2px 6px',
                    border: `1px solid ${activeItem.category === 'MIGRATION ALERT' ? 'oklch(0.85 0.15 80 / 40%)' : 'oklch(0.79 0.17 154 / 30%)'}`
                  }}
                >
                  {activeItem.badge}
                </span>
                <span style={{ fontSize: '8px', color: 'var(--dim)' }}>
                  Auto-updating &bull; Live Stream
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={triggerPrev}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--dim)',
                fontSize: '9px',
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ChevronLeft size={11} /> Prev
            </button>
            <span style={{ fontSize: '8px', color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              KKU Live Radar
            </span>
            <button
              onClick={triggerNext}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--dim)',
                fontSize: '9px',
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Next <ChevronRight size={11} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
