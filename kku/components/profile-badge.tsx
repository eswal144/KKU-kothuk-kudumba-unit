'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UserRound, LogOut, ArrowUpRight, ChevronDown, ShieldCheck, X, Sparkles, Pencil, Save } from 'lucide-react'

const API_BASE = 'http://localhost:5000/api/auth'

interface ProfileData {
  id: number
  kku_id: string
  name: string
  species: string
  age: number
  gender: string
  location: string
  blood_preference: string
  bite_count: number
  blood_collected: number
  health_status: string
  employment: string
  social_status: string
  pension_status: string
  life_history: string
}

interface ProfileBadgeProps {
  onOpenAuth?: (tab: 'register' | 'login') => void
}

export default function ProfileBadge({ onOpenAuth }: ProfileBadgeProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const popoverRef = useRef<HTMLDivElement>(null)

  const loadProfile = async () => {
    const token = localStorage.getItem('kku_token')
    if (!token) {
      setIsLoggedIn(false)
      setLoading(false)
      return
    }

    setIsLoggedIn(true)
    
    // Check cached profile first
    const cached = localStorage.getItem('kku_profile')
    if (cached) {
      try {
        setProfile(JSON.parse(cached))
      } catch (e) {}
    }

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        localStorage.setItem('kku_profile', JSON.stringify(data.profile))
      } else {
        localStorage.removeItem('kku_token')
        localStorage.removeItem('kku_profile')
        setIsLoggedIn(false)
      }
    } catch (err) {
      // Keep cached profile if offline
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()

    const handleProfileUpdate = () => {
      const cached = localStorage.getItem('kku_profile')
      if (cached) {
        try {
          setProfile(JSON.parse(cached))
        } catch (e) {}
      }
    }

    window.addEventListener('kku_profile_updated', handleProfileUpdate)
    return () => window.removeEventListener('kku_profile_updated', handleProfileUpdate)
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const startEditing = () => {
    if (!profile) return
    setEditForm({
      name: profile.name,
      species: profile.species,
      gender: profile.gender,
      location: profile.location,
      blood_preference: profile.blood_preference,
      employment: profile.employment,
      life_history: profile.life_history
    })
    setEditing(true)
    setError(null)
  }

  const handleSave = async () => {
    const token = localStorage.getItem('kku_token')
    if (!token) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      setProfile(data.profile)
      localStorage.setItem('kku_profile', JSON.stringify(data.profile))
      window.dispatchEvent(new Event('kku_profile_updated'))
      setEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('kku_token')
    localStorage.removeItem('kku_user')
    localStorage.removeItem('kku_profile')
    setIsLoggedIn(false)
    setProfile(null)
    setIsOpen(false)
    setEditing(false)
    router.push('/')
    window.location.reload()
  }

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onOpenAuth ? onOpenAuth('login') : router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--dim)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '6px 12px'
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => onOpenAuth ? onOpenAuth('register') : router.push('/')}
          className="kku-nav-cta"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Enter KKU <ArrowUpRight size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="profile-wrapper" ref={popoverRef}>
      {/* Top Right Corner Profile Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (isOpen) setEditing(false)
        }}
        className="profile-trigger"
        aria-expanded={isOpen}
        aria-label="Mosquito Passport Menu"
      >
        <div className="profile-avatar">
          <UserRound size={16} />
        </div>
        <div className="profile-trigger-info">
          <span className="profile-trigger-name">{profile?.name || 'Citizen'}</span>
          <span className="profile-trigger-id">{profile?.kku_id || 'KKU-VERIFYING'}</span>
        </div>
        <ChevronDown size={14} style={{ color: 'var(--dim)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>

      {/* Mosquito Passport Popover Dropdown Card */}
      <div className={`profile-popover ${isOpen ? 'open' : ''}`}>
        {/* Passport Header */}
        <div className="profile-popover-header">
          <div>
            <span className="kku-id-badge" style={{ fontSize: '11px', padding: '4px 10px' }}>
              <ShieldCheck size={12} /> {profile?.kku_id || 'KKU-CITIZEN'}
            </span>
            <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', marginTop: '8px', marginBottom: 0 }}>
              Official Mosquito Passport
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!editing ? (
              <button
                onClick={startEditing}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--mint)',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '2px'
                }}
              >
                <Pencil size={12} /> Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Passport Body */}
        <div className="profile-popover-body">
          {error && <div className="kku-error" style={{ marginBottom: '12px', fontSize: '11px' }}>{error}</div>}

          {editing ? (
            /* EDIT FORM */
            <div className="profile-popover-form">
              <div className="kku-form-group">
                <label>Mosquito Name</label>
                <input
                  className="kku-input"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="profile-popover-form-row">
                <div className="kku-form-group">
                  <label>Species</label>
                  <select
                    className="kku-select"
                    value={editForm.species || ''}
                    onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                  >
                    <option value="Aedes aegypti">Aedes aegypti</option>
                    <option value="Anopheles stephensi">Anopheles stephensi</option>
                    <option value="Culex quinquefasciatus">Culex quinquefasciatus</option>
                    <option value="Mansonia uniformis">Mansonia uniformis</option>
                  </select>
                </div>
                <div className="kku-form-group">
                  <label>Gender / Role</label>
                  <select
                    className="kku-select"
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  >
                    <option value="Female">Female (Nectar & Blood)</option>
                    <option value="Male">Male (Pure Floral Nectar)</option>
                    <option value="Non-binary Mosquito">Non-binary Mosquito</option>
                  </select>
                </div>
              </div>

              <div className="profile-popover-form-row">
                <div className="kku-form-group">
                  <label>Location</label>
                  <input
                    className="kku-input"
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div className="kku-form-group">
                  <label>Blood Preference</label>
                  <select
                    className="kku-select"
                    value={editForm.blood_preference || ''}
                    onChange={(e) => setEditForm({ ...editForm, blood_preference: e.target.value })}
                  >
                    <option value="O Negative (Sweet & Warm)">O Negative (Sweet & Warm)</option>
                    <option value="AB Positive (Rich Nectar)">AB Positive (Rich Nectar)</option>
                    <option value="A Positive (Citrus Flare)">A Positive (Citrus Flare)</option>
                    <option value="B Positive (Classic Punch)">B Positive (Classic Punch)</option>
                  </select>
                </div>
              </div>

              <div className="kku-form-group">
                <label>Employment</label>
                <input
                  className="kku-input"
                  value={editForm.employment || ''}
                  onChange={(e) => setEditForm({ ...editForm, employment: e.target.value })}
                />
              </div>

              <div className="kku-form-group">
                <label>Life History</label>
                <textarea
                  className="kku-input"
                  rows={2}
                  value={editForm.life_history || ''}
                  onChange={(e) => setEditForm({ ...editForm, life_history: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={handleSave}
                  className="kku-button"
                  disabled={saving}
                  style={{ border: 'none', cursor: 'pointer', flex: 1, justifyContent: 'center', padding: '8px 12px', fontSize: '11px' }}
                >
                  {saving ? 'Saving...' : 'Save Profile'} <Save size={13} />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    color: 'var(--dim)',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    fontSize: '11px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, oklch(0.79 0.17 154 / 25%), oklch(0.14 0.01 155))',
                    border: '1px solid var(--mint)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--mint)',
                    flexShrink: 0
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
                    {profile?.name}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--dim)' }}>
                    {profile?.species} &bull; {profile?.gender}
                  </p>
                </div>
              </div>

              <div className="profile-popover-grid">
                <div className="profile-popover-field">
                  <strong>MOSQUITO ID</strong>
                  <span style={{ fontFamily: 'monospace', color: 'var(--mint)', fontWeight: 700 }}>{profile?.kku_id || 'M-QT-28491'}</span>
                </div>
                <div className="profile-popover-field">
                  <strong>Name</strong>
                  <span>{profile?.name}</span>
                </div>
                <div className="profile-popover-field">
                  <strong>Species</strong>
                  <span>{profile?.species}</span>
                </div>
                <div className="profile-popover-field">
                  <strong>Age</strong>
                  <span>{profile?.age} days</span>
                </div>
                <div className="profile-popover-field">
                  <strong>Status</strong>
                  <span style={{ color: 'var(--mint)' }}>{profile?.health_status || 'Active & Annoying'}</span>
                </div>
                <div className="profile-popover-field">
                  <strong>Blood Preference</strong>
                  <span>{profile?.blood_preference || 'O- (Sweet & Warm)'}</span>
                </div>
                <div className="profile-popover-field">
                  <strong>Hiding Spot</strong>
                  <span style={{ color: 'var(--mint)' }}>Behind Bedroom Curtain</span>
                </div>
                <div className="profile-popover-field">
                  <strong>Buzz Frequency</strong>
                  <span>600 Hz (3 AM Special)</span>
                </div>
                <div className="profile-popover-field">
                  <strong>Bites Completed</strong>
                  <span>{profile?.bite_count ?? 17} bites</span>
                </div>
                <div className="profile-popover-field">
                  <strong>Swatter Defense</strong>
                  <span style={{ color: 'var(--mint)', fontWeight: 700 }}>High Agility</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Passport Footer Actions */}
        {!editing && (
          <div className="profile-popover-footer">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/dashboard')
              }}
              className="popover-dash-btn"
            >
              Dashboard Hub <ArrowUpRight size={14} />
            </button>
            <button
              onClick={handleLogout}
              className="popover-logout-btn"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
