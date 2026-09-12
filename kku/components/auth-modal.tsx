'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  initialTab?: 'register' | 'login'
  onClose: () => void
  onSuccess: () => void
}

const API_BASE_URL = 'http://localhost:5000/api/auth'

export default function AuthModal({ isOpen, initialTab = 'register', onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>(initialTab)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Sync activeTab when parent changes initialTab
  useEffect(() => {
    setActiveTab(initialTab)
    setError(null)
  }, [initialTab])

  // Complete Registration Form State (all 9 profile fields + auth)
  const [regForm, setRegForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    species: 'Aedes aegypti',
    age: '9',
    gender: 'Female',
    health_status: 'Active',
    blood_preference: 'O+',
    location: 'Bathroom',
    bite_count: '17',
    dengue_risk: 'HIGH',
    employment: 'Night Shift Biter'
  })

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  if (!isOpen) return null

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (regForm.password !== regForm.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.')
      }

      localStorage.setItem('kku_token', data.token)
      localStorage.setItem('kku_user', JSON.stringify(data.user))
      localStorage.setItem('kku_profile', JSON.stringify(data.profile))

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Network error connecting to KKU API.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.')
      }

      localStorage.setItem('kku_token', data.token)
      localStorage.setItem('kku_user', JSON.stringify(data.user))
      localStorage.setItem('kku_profile', JSON.stringify(data.profile))

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Network error connecting to KKU API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="kku-modal-backdrop" onClick={onClose}>
      <div className="kku-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="kku-modal-header">
          <span className="eyebrow" style={{ margin: 0 }}>
            <span className="eyebrow-dot" /> KKU Citizen Registration
          </span>
          <button className="kku-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="kku-modal-tabs">
          <button
            className={`kku-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setError(null); }}
          >
            Create KKU-ID & Profile
          </button>
          <button
            className={`kku-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(null); }}
          >
            Login to KKU
          </button>
        </div>

        {error && <div className="kku-error">{error}</div>}

        {activeTab === 'register' ? (
          <form className="kku-form" onSubmit={handleRegisterSubmit}>
            <div className="kku-form-group">
              <label>Account Email *</label>
              <input
                type="email"
                className="kku-input"
                required
                placeholder="buzzil@kku.org"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kku-form-group">
                <label>Password *</label>
                <input
                  type="password"
                  className="kku-input"
                  required
                  placeholder="••••••••"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                />
              </div>
              <div className="kku-form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  className="kku-input"
                  required
                  placeholder="••••••••"
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="kku-form-group">
              <label>Full Mosquito Name *</label>
              <input
                type="text"
                className="kku-input"
                required
                placeholder="e.g. Buzzil Kumar"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kku-form-group">
                <label>Species Classification *</label>
                <select
                  className="kku-select"
                  value={regForm.species}
                  onChange={(e) => setRegForm({ ...regForm, species: e.target.value })}
                >
                  <option value="Aedes aegypti">Aedes aegypti</option>
                  <option value="Anopheles stephensi">Anopheles stephensi</option>
                  <option value="Culex quinquefasciatus">Culex quinquefasciatus</option>
                  <option value="Mansonia uniformis">Mansonia uniformis</option>
                </select>
              </div>
              <div className="kku-form-group">
                <label>Age (Days) *</label>
                <input
                  type="number"
                  className="kku-input"
                  required
                  min="1"
                  max="90"
                  value={regForm.age}
                  onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kku-form-group">
                <label>Status *</label>
                <select
                  className="kku-select"
                  value={regForm.health_status}
                  onChange={(e) => setRegForm({ ...regForm, health_status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Vibrant & Active">Vibrant & Active</option>
                  <option value="On Patrol">On Patrol</option>
                </select>
              </div>
              <div className="kku-form-group">
                <label>Blood Group Preference *</label>
                <select
                  className="kku-select"
                  value={regForm.blood_preference}
                  onChange={(e) => setRegForm({ ...regForm, blood_preference: e.target.value })}
                >
                  <option value="O+">O+</option>
                  <option value="O Negative (Sweet & Warm)">O Negative (Sweet & Warm)</option>
                  <option value="AB+">AB+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kku-form-group">
                <label>Current Location *</label>
                <input
                  type="text"
                  className="kku-input"
                  required
                  placeholder="Bathroom"
                  value={regForm.location}
                  onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                />
              </div>
              <div className="kku-form-group">
                <label>Bites Completed *</label>
                <input
                  type="number"
                  className="kku-input"
                  required
                  min="0"
                  value={regForm.bite_count}
                  onChange={(e) => setRegForm({ ...regForm, bite_count: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kku-form-group">
                <label>Dengue Risk Level *</label>
                <select
                  className="kku-select"
                  value={regForm.dengue_risk}
                  onChange={(e) => setRegForm({ ...regForm, dengue_risk: e.target.value })}
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div className="kku-form-group">
                <label>Employment / Role</label>
                <input
                  type="text"
                  className="kku-input"
                  placeholder="Night Shift Biter"
                  value={regForm.employment}
                  onChange={(e) => setRegForm({ ...regForm, employment: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="kku-button" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
              {loading ? 'Registering Citizen...' : 'Issue Mosquito Passport & Enter'} <ArrowUpRight size={16} />
            </button>
          </form>
        ) : (
          <form className="kku-form" onSubmit={handleLoginSubmit}>
            <div className="kku-form-group">
              <label>Email / Username *</label>
              <input
                type="email"
                className="kku-input"
                required
                placeholder="buzzil@kku.org"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>

            <div className="kku-form-group">
              <label>Password *</label>
              <input
                type="password"
                className="kku-input"
                required
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>

            <button type="submit" className="kku-button" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }}>
              {loading ? 'Authenticating...' : 'Enter Ecosystem'} <ArrowUpRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
