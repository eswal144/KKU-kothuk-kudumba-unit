'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, HeartPulse, Network, Radio, ShieldCheck, Sparkles, UserRound, WalletCards } from 'lucide-react'
import AuthModal from './auth-modal'
import ProfileBadge from './profile-badge'
import Leaderboard from './dashboard/Leaderboard'
import { fetchPopulationOverview, fetchCivilizationEvents, PopulationOverview, KKUEvent } from '@/lib/api/simulation'

const services = [
  { name: 'KKU-ID', description: 'A recognized identity for every wing.', icon: UserRound },
  { name: 'KKU-JOBS', description: 'Find meaningful work in the ecosystem.', icon: BriefcaseBusiness },
  { name: 'KKU-BANK', description: 'Store, send, and grow your nectar.', icon: WalletCards },
  { name: 'KKU-CARE', description: 'Collective care for every community.', icon: HeartPulse },
  { name: 'KKU-PENSION', description: 'A softer landing for later seasons.', icon: ShieldCheck },
  { name: 'KKU-SOCIAL', description: 'Stay close to the people who matter.', icon: Network },
  { name: 'KKU-LIFE', description: 'One place for everything that comes next.', icon: Sparkles },
]

export default function KkuLanding() {
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Simulation State
  const [popStats, setPopStats] = useState<PopulationOverview>({
    totalPopulation: 1284925,
    newBirths: 392,
    deaths: 222,
    date: new Date().toISOString().split('T')[0]
  })
  const [events, setEvents] = useState<KKUEvent[]>([])
  const [latestFlyEvent, setLatestFlyEvent] = useState<KKUEvent | null>(null)
  const [animStage, setAnimStage] = useState<'hidden' | 'flying-in' | 'settled' | 'flying-out'>('hidden')
  const lastEventIdRef = useRef<number | null>(null)

  // Check login state
  useEffect(() => {
    const token = localStorage.getItem('kku_token')
    if (token) {
      setIsLoggedIn(true)
      router.replace('/dashboard')
    }
  }, [router])

  // Poll Simulation Population & Civilization Events
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const overview = await fetchPopulationOverview()
        if (isMounted) setPopStats(overview)

        const recentEvents = await fetchCivilizationEvents(12)
        if (isMounted && recentEvents.length > 0) {
          setEvents(recentEvents)
          const newest = recentEvents[0]
          if (lastEventIdRef.current !== newest.id) {
            triggerFlyAnimation(newest)
            lastEventIdRef.current = newest.id
          }
        }
      } catch (err) {
        console.warn('Simulation polling notice:', err)
      }
    }

    loadData()
    const interval = setInterval(loadData, 2000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Trigger Flying Mosquito Notification Sequence
  const triggerFlyAnimation = (event: KKUEvent) => {
    setLatestFlyEvent(event)
    setAnimStage('flying-in')

    const sTimer = setTimeout(() => setAnimStage('settled'), 500)
    const oTimer = setTimeout(() => setAnimStage('flying-out'), 4500) // Settled for exactly 4.0s (500ms to 4500ms)
    const hTimer = setTimeout(() => setAnimStage('hidden'), 5100)

    return () => {
      clearTimeout(sTimer)
      clearTimeout(oTimer)
      clearTimeout(hTimer)
    }
  }

  const handleAuthSuccess = () => {
    router.push('/dashboard')
  }

  const openAuth = (tab: 'register' | 'login') => {
    setAuthTab(tab)
    setIsAuthModalOpen(true)
  }

  const getTransform = () => {
    switch (animStage) {
      case 'flying-in':
        return 'translateY(140px) scale(0.92)'
      case 'settled':
        return 'translateY(0) scale(1)'
      case 'flying-out':
        return 'translateY(-140px) scale(0.92)'
      case 'hidden':
      default:
        return 'translateY(160px) opacity(0)'
    }
  }

  return (
    <main className="kku-site">
      <nav className="kku-nav" aria-label="Primary navigation">
        <a href="#top" className="kku-mark" aria-label="KKU home">
          <span>KKU</span>
          <small>Kothuk Kudumba Unit</small>
        </a>
        <div className="kku-nav-links">
          <a href="#concept">Our concept</a>
          <a href="#ecosystem">Ecosystem</a>
          <a href="/leaderboard" style={{ color: 'var(--mint)', fontWeight: 700 }}>🏆 Leaderboard</a>
          <a href="/bite-vacancies">🗺️ Bite Vacancies</a>
          <a href="#live-activity">Live Simulation</a>
          <a href="#join">Join KKU</a>
        </div>

        <ProfileBadge onOpenAuth={openAuth} />
      </nav>

      <section className="kku-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> LIVE SIMULATION ACTIVE • GROQ AI</p>
          <h1>The digital home<br /><em>for every mosquito.</em></h1>
          <p className="hero-lede">A connected ecosystem for the world&apos;s most misunderstood community. Identity, care, work, and a live AI-simulated civilization.</p>
          <div className="hero-actions">
            {isLoggedIn ? (
              <a href="/dashboard" className="kku-button" style={{ textDecoration: 'none' }}>
                Open Dashboard <ArrowUpRight size={16} />
              </a>
            ) : (
              <button
                onClick={() => openAuth('register')}
                className="kku-button"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                Enter KKU <ArrowUpRight size={16} />
              </button>
            )}
            <a href="#live-activity" className="text-link">Live Activity Feed <ArrowDownRight size={16} /></a>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <img src="/kku-mosquito.png" alt="A mosquito suspended in the KKU system" />
          <p className="art-caption">A new kind of<br />social infrastructure</p>
          <span className="art-coordinate">10° 19&apos; 48.2&quot; N / 76° 16&apos; 48.1&quot; E</span>
        </div>
        <div className="hero-bottom">
          <span>Scroll to explore</span>
          <span className="line" />
          <span>01 — 06</span>
        </div>
      </section>

      <section className="intro-section reveal" id="concept">
        <p className="section-kicker">What is KKU?</p>
        <div>
          <h2>Not a network.<br /><span>A <em>neighborhood.</em></span></h2>
          <p className="intro-body">KKU is a digital civilization built around the extraordinary lives of mosquitoes. A single, quiet system designed to make every night feel a little more possible.</p>
        </div>
      </section>

      <section className="ecosystem-section" id="ecosystem">
        <div className="section-heading reveal">
          <p className="section-kicker">The KKU ecosystem</p>
          <h2>Everything you need.<br /><em>Nothing you don&apos;t.</em></h2>
          <p>Eight essential systems. One shared pulse.</p>
        </div>
        <div className="service-grid">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <button
                className="service-card reveal"
                onClick={() => isLoggedIn ? router.push('/dashboard') : openAuth('register')}
                key={service.name}
                style={{ textAlign: 'left', cursor: 'pointer', background: 'transparent' }}
              >
                <span className="service-index">0{index + 1}</span>
                <Icon className="service-icon" size={22} strokeWidth={1.3} />
                <div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
                <ArrowUpRight className="service-arrow" size={17} />
              </button>
            )
          })}
        </div>
      </section>

      {/* SYSTEM SNAPSHOT & LIVE SIMULATION METRICS */}
      <section className="snapshot-section" id="live-activity">
        <div className="section-heading reveal">
          <p className="section-kicker">System snapshot & Live AI Simulation</p>
          <h2>Growing quietly.<br /><em>Everywhere at once.</em></h2>
        </div>
        <div className="stats-grid">
          <div className="stat reveal">
            <strong>{popStats.totalPopulation.toLocaleString()}</strong>
            <span>TOTAL POPULATION</span>
          </div>
          <div className="stat reveal">
            <strong>+{popStats.newBirths}</strong>
            <span>NEW BIRTHS TODAY</span>
          </div>
          <div className="stat reveal">
            <strong>-{popStats.deaths}</strong>
            <span>DEATHS TODAY</span>
          </div>
          <div className="stat reveal">
            <strong>LIVE</strong>
            <span>GROQ AI ENGINE</span>
          </div>
        </div>

        {/* FLYING MOSQUITO NOTIFICATION STAGE */}
        <div
          style={{
            marginTop: '36px',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            padding: '24px',
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} style={{ color: 'var(--mint)' }} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', fontWeight: 800 }}>
                KKU LIVE CIVILIZATION DISPATCH
              </span>
            </div>
            <span style={{ fontSize: '9px', color: 'var(--mint)', fontWeight: 700, letterSpacing: '.1em' }}>
              ⚡ GROQ AI SIMULATION ACTIVE
            </span>
          </div>

          <div
            style={{
              height: '90px',
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}
          >
            {latestFlyEvent && animStage !== 'hidden' ? (
              <div
                style={{
                  position: 'absolute',
                  width: '92%',
                  background: '#fdfbf7',
                  border: '1px solid var(--mint)',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s ease',
                  transform: getTransform(),
                  opacity: animStage === 'settled' ? 1 : 0.85
                }}
              >
                <span style={{ fontSize: '24px' }}>🦟</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--mint)', display: 'block' }}>
                    {latestFlyEvent.title || '📢 KKU NOTIFICATION'}
                  </span>
                  <p style={{ fontSize: '12px', color: 'var(--foreground)', margin: '2px 0 0', fontWeight: 600 }}>
                    {latestFlyEvent.message}
                  </p>
                </div>
                <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '4px' }}>
                  FLYING DISPATCH
                </span>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--dim)', fontSize: '11px' }}>
                <span style={{ fontSize: '18px', display: 'block', marginBottom: '4px' }}>📡</span>
                <p style={{ margin: 0, fontSize: '10px', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Listening for continuous mosquito civilization dispatches...
                </p>
              </div>
            )}
          </div>

          {/* LIVE ACTIVITY FEED LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', fontWeight: 700 }}>
              RECENT CIVILIZATION DISPATCHES
            </span>
            {events.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'var(--dim)', margin: 0 }}>Connecting to simulation events feed...</p>
            ) : (
              events.slice(0, 5).map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--mint)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      {evt.title || evt.event_type}
                    </span>
                    <span style={{ color: 'var(--foreground)' }}>{evt.message}</span>
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--dim)', textTransform: 'uppercase' }}>
                    {evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 🏆 LIVE MOSQUITO LEADERBOARD (UPDATES EVERY 20s) */}
        <div style={{ marginTop: '36px' }}>
          <Leaderboard />
        </div>
      </section>

      <section className="join-section" id="join">
        <div className="join-glow" />
        <p className="section-kicker">Your place in the system</p>
        <h2>Every mosquito<br /><em>deserves a place.</em></h2>
        {isLoggedIn ? (
          <a href="/dashboard" className="kku-button" style={{ textDecoration: 'none' }}>
            Open Dashboard <ArrowUpRight size={16} />
          </a>
        ) : (
          <>
            <button
              onClick={() => openAuth('register')}
              className="kku-button"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              Create KKU-ID <ArrowUpRight size={16} />
            </button>
            <p className="login-copy">
              Already registered?{' '}
              <button
                onClick={() => openAuth('login')}
                style={{ background: 'none', border: 'none', color: 'var(--mint)', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}
              >
                Login to KKU <ArrowUpRight size={13} />
              </button>
            </p>
          </>
        )}
        <footer>
          <span>© KKU / Kothuk Kudumba Unit</span>
          <span>Built for the night shift</span>
          <a href="#top">Back to top ↑</a>
        </footer>
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authTab}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  )
}

