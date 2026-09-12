'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, HeartPulse, Network, ShieldCheck, Sparkles, UserRound, WalletCards } from 'lucide-react'
import AuthModal from './auth-modal'
import ProfileBadge from './profile-badge'

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

  // Check login state
  useEffect(() => {
    const token = localStorage.getItem('kku_token')
    if (token) {
      setIsLoggedIn(true)
      router.replace('/dashboard')
    }
  }, [router])

  const handleAuthSuccess = () => {
    router.push('/dashboard')
  }

  const openAuth = (tab: 'register' | 'login') => {
    setAuthTab(tab)
    setIsAuthModalOpen(true)
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
          <a href="/leaderboard">🏆 Leaderboard</a>
          <a href="#join">Join KKU</a>
        </div>

        <ProfileBadge onOpenAuth={openAuth} />
      </nav>

      <section className="kku-hero" id="top" style={{ minHeight: 'calc(100svh - 78px)', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-copy" style={{ maxWidth: '600px', zIndex: 2 }}>
          {/* Eyebrow badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px', fontSize: '10px', fontWeight: 800, letterSpacing: '.18em', color: '#047857', textTransform: 'uppercase' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#047857', display: 'inline-block' }} />
            <span>LIVE SIMULATION ACTIVE &bull; GROQ AI</span>
          </div>

          {/* Main Headline */}
          <h1 style={{ fontSize: 'clamp(3.4rem, 6.4vw, 5.8rem)', fontWeight: 300, letterSpacing: '-.03em', lineHeight: 0.96, margin: '0 0 24px', color: '#1c1917' }}>
            The digital<br />
            home<br />
            <span style={{ color: '#047857', fontWeight: 800 }}>
              for every<br />
              mosquito.
            </span>
          </h1>

          {/* Sub-headline lede */}
          <p style={{ color: '#52525b', fontSize: '15px', lineHeight: 1.6, maxWidth: '440px', margin: '0 0 32px' }}>
            A connected ecosystem for the world&apos;s most misunderstood community. Identity, care, work, and a live AI-simulated civilization.
          </p>

          {/* Pill CTA Button */}
          <div style={{ marginBottom: '40px' }}>
            <button
              onClick={() => isLoggedIn ? router.push('/dashboard') : openAuth('register')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 28px',
                background: '#047857',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '.03em',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(4, 120, 87, 0.28)',
                transition: 'all .25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.background = '#065f46'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = '#047857'
              }}
            >
              <span>Explore the Simulation</span>
              <span style={{ fontSize: '15px' }}>&rarr;</span>
            </button>
          </div>

          {/* 3 Metric Columns with Left Dividers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            <div style={{ borderLeft: '1.5px solid #d1d5db', paddingLeft: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857', letterSpacing: '-.02em', lineHeight: 1 }}>
                1M+
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#71717a', marginTop: '4px' }}>
                SIMULATED
              </div>
            </div>

            <div style={{ borderLeft: '1.5px solid #d1d5db', paddingLeft: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857', letterSpacing: '-.02em', lineHeight: 1 }}>
                24/7
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#71717a', marginTop: '4px' }}>
                LIVE ECOSYSTEM
              </div>
            </div>

            <div style={{ borderLeft: '1.5px solid #d1d5db', paddingLeft: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857', letterSpacing: '-.02em', lineHeight: 1 }}>
                100%
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#71717a', marginTop: '4px' }}>
                AI POWERED
              </div>
            </div>
          </div>
        </div>

        {/* Hero Artwork with Radial Sage Disc, Orbit & Side Text */}
        <div className="hero-art" style={{ position: 'absolute', right: '4vw', top: '50%', transform: 'translateY(-50%)', width: 'min(48vw, 620px)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Soft Sage Disc Glow */}
          <div
            style={{
              position: 'absolute',
              width: '85%',
              height: '85%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(5, 150, 105, 0.18) 0%, rgba(5, 150, 105, 0.04) 65%, transparent 75%)',
              pointerEvents: 'none'
            }}
          />

          {/* Thin Orbit Ring */}
          <div
            style={{
              position: 'absolute',
              width: '88%',
              height: '88%',
              borderRadius: '50%',
              border: '1px solid rgba(4, 120, 87, 0.25)',
              pointerEvents: 'none'
            }}
          >
            {/* Orbit Accent Bead at top-right */}
            <span
              style={{
                position: 'absolute',
                top: '14%',
                right: '14%',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#047857',
                boxShadow: '0 0 10px rgba(4, 120, 87, 0.5)'
              }}
            />
          </div>

          {/* High-res Mosquito image */}
          <img
            src="/kku-mosquito.png"
            alt="A mosquito suspended in the KKU system"
            style={{ width: '92%', height: 'auto', position: 'relative', zIndex: 1, filter: 'saturate(1.05) contrast(1.05)' }}
          />

          {/* Right Floating Typography */}
          <div style={{ position: 'absolute', right: '-10px', top: '36%', textAlign: 'left', zIndex: 2 }}>
            <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#52525b', lineHeight: 1.6 }}>
              SMALL<br />CREATURES.<br /><br />BIGGER<br />STORIES.
            </div>
            <div style={{ width: '18px', height: '1.5px', background: '#71717a', marginTop: '10px' }} />
          </div>
        </div>

        {/* Hero Bottom Bar */}
        <div className="hero-bottom">
          <span>Scroll to explore</span>
          <span className="line" />
          <span>01 — 04</span>
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
          <p>Seven essential systems. One shared pulse.</p>
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

