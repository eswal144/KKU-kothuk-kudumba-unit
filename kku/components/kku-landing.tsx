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

      <section className="kku-hero" id="top" style={{ minHeight: 'calc(100vh - 78px)', padding: '40px 6vw 50px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', alignItems: 'center', gap: '50px', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-copy" style={{ maxWidth: '640px', zIndex: 2, marginTop: 0 }}>
          {/* Eyebrow badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '11px', fontWeight: 800, letterSpacing: '.2em', color: '#047857', textTransform: 'uppercase' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#047857', display: 'inline-block' }} />
            <span>LIVE SIMULATION ACTIVE &bull; GROQ AI</span>
          </div>

          {/* Main Headline */}
          <h1 style={{ fontSize: 'clamp(3.6rem, 6.6vw, 6.2rem)', fontWeight: 300, letterSpacing: '-.035em', lineHeight: 0.94, margin: '0 0 24px', color: '#1c1917' }}>
            The digital<br />
            home<br />
            <span style={{ color: '#047857', fontWeight: 800 }}>
              for every<br />
              mosquito.
            </span>
          </h1>

          {/* Sub-headline lede */}
          <p style={{ color: '#52525b', fontSize: '16px', lineHeight: 1.65, maxWidth: '480px', margin: '0 0 36px' }}>
            A connected ecosystem for the world&apos;s most misunderstood community. Identity, care, work, and a live AI-simulated civilization.
          </p>

          {/* Pill CTA Button */}
          <div style={{ marginBottom: '44px' }}>
            <button
              onClick={() => isLoggedIn ? router.push('/dashboard') : openAuth('register')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 34px',
                background: '#047857',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '.03em',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(4, 120, 87, 0.32)',
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
              <span style={{ fontSize: '18px' }}>&rarr;</span>
            </button>
          </div>

          {/* 3 Metric Columns with Left Dividers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px', flexWrap: 'wrap' }}>
            <div style={{ borderLeft: '2px solid #d1d5db', paddingLeft: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#047857', letterSpacing: '-.02em', lineHeight: 1 }}>
                1M+
              </div>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#71717a', marginTop: '6px' }}>
                SIMULATED
              </div>
            </div>

            <div style={{ borderLeft: '2px solid #d1d5db', paddingLeft: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#047857', letterSpacing: '-.02em', lineHeight: 1 }}>
                24/7
              </div>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#71717a', marginTop: '6px' }}>
                LIVE ECOSYSTEM
              </div>
            </div>

            <div style={{ borderLeft: '2px solid #d1d5db', paddingLeft: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#047857', letterSpacing: '-.02em', lineHeight: 1 }}>
                100%
              </div>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#71717a', marginTop: '6px' }}>
                AI POWERED
              </div>
            </div>
          </div>
        </div>

        {/* Hero Artwork with Large Radial Sage Disc, Orbit & Side Text */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', height: '100%' }}>
          {/* Soft Sage Disc Glow */}
          <div
            style={{
              position: 'absolute',
              width: '540px',
              height: '540px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.05) 60%, transparent 72%)',
              pointerEvents: 'none'
            }}
          />

          {/* Thin Orbit Ring */}
          <div
            style={{
              position: 'absolute',
              width: '560px',
              height: '560px',
              borderRadius: '50%',
              border: '1.5px solid rgba(4, 120, 87, 0.25)',
              pointerEvents: 'none'
            }}
          >
            {/* Orbit Accent Bead at top-right */}
            <span
              style={{
                position: 'absolute',
                top: '35px',
                right: '85px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#047857',
                boxShadow: '0 0 10px rgba(4, 120, 87, 0.6)'
              }}
            />
          </div>

          {/* Circular Frame for Clean Macro Photo */}
          <div
            style={{
              width: '480px',
              height: '480px',
              maxWidth: '44vw',
              maxHeight: '44vw',
              borderRadius: '50%',
              overflow: 'hidden',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 20px 45px rgba(4, 120, 87, 0.15)'
            }}
          >
            <img
              src="/kku-mosquito.png"
              alt="A mosquito suspended in the KKU system"
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.05) contrast(1.05)' }}
            />
          </div>

          {/* Right Floating Typography */}
          <div style={{ position: 'absolute', right: '-20px', top: '38%', textAlign: 'left', zIndex: 2 }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#52525b', lineHeight: 1.6 }}>
              SMALL<br />CREATURES.<br /><br />BIGGER<br />STORIES.
            </div>
            <div style={{ width: '22px', height: '1.5px', background: '#71717a', marginTop: '12px' }} />
          </div>
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

