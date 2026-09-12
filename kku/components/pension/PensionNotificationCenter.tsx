'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Bell, X } from 'lucide-react'

export interface PensionNotification {
  id: string
  title: string
  message: string
  category?: string
  citizenName?: string
  amount?: number
  timestamp?: string
}

interface PensionNotificationCenterProps {
  notifications: PensionNotification[]
  onDismiss?: (id: string) => void
}

export default function PensionNotificationCenter({
  notifications = [],
  onDismiss
}: PensionNotificationCenterProps) {
  const [activeItem, setActiveItem] = useState<PensionNotification | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (notifications.length > 0) {
      // Pick the latest notification to present
      const latest = notifications[notifications.length - 1]
      setActiveItem(latest)
      setIsExiting(false)

      // Animate: enters -> settles for 4.5s -> flies upward and disappears
      const exitTimer = setTimeout(() => {
        setIsExiting(true)
      }, 5500)

      const clearTimer = setTimeout(() => {
        setActiveItem(null)
        setIsExiting(false)
        if (onDismiss) onDismiss(latest.id)
      }, 6200)

      return () => {
        clearTimeout(exitTimer)
        clearTimeout(clearTimer)
      }
    }
  }, [notifications, onDismiss])

  if (!activeItem) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 9999,
        pointerEvents: 'auto',
        maxWidth: '420px',
        width: 'calc(100vw - 60px)'
      }}
    >
      <div
        style={{
          background: 'rgba(11, 19, 15, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.2)',
          color: '#f3f4f6',
          animation: isExiting ? 'kkuFlyUpExit 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'kkuFlyUpEnter 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏛️</span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--mint)' }}>
              {activeItem.title || 'KKU PENSION BULLETIN'}
            </span>
          </div>
          <button
            onClick={() => setActiveItem(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <X size={14} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.45', color: '#e5e7eb' }}>
          {activeItem.message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={10} style={{ color: 'var(--mint)' }} /> Groq Civilization AI Announcement
          </span>
          <span>{activeItem.timestamp || 'Official Decree'}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes kkuFlyUpEnter {
          0% {
            transform: translateY(70px) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes kkuFlyUpExit {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-70px) scale(0.9);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
