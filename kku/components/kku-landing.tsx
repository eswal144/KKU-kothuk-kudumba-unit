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
            <a href="#ecosystem" className="text-link">Explore Ecosystem <ArrowDownRight size={16} /></a>
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

