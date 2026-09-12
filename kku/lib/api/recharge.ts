import { API_BASE } from './config'

export interface RechargeStatus {
  kkuId: string
  category: 'ADULT' | 'CHILD'
  currentSalivaNl: number
  maximumSalivaNl: number
  percentage: number
  canRecharge: boolean
  isLow: boolean
  lastRechargedAt?: string
}

export interface RechargeResponse {
  success: boolean
  message: string
  restoredNl?: number
  category?: 'ADULT' | 'CHILD'
  status: RechargeStatus
}

export interface RechargeHistoryItem {
  id: number
  event_type: string
  icon: string
  description: string
  created_at?: string
}

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kku_token') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

/**
 * Fetch recharge status for authenticated mosquito
 */
export async function fetchRechargeStatus(): Promise<RechargeStatus> {
  const res = await fetch(`${API_BASE}/recharge/status`, {
    headers: getAuthHeaders()
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED')
    }
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Failed to fetch recharge status.')
  }

  return res.json()
}

/**
 * Post recharge request for authenticated mosquito (Supports ADULT / CHILD category selection)
 */
export async function postRecharge(category?: 'ADULT' | 'CHILD'): Promise<RechargeResponse> {
  const res = await fetch(`${API_BASE}/recharge`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ category })
  })

  const data = await res.json()

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED')
    }
    return {
      success: false,
      message: data.message || data.error || 'Recharge failed.',
      status: data.status
    }
  }

  return data
}

/**
 * Fetch recharge history notifications
 */
export async function fetchRechargeHistory(): Promise<RechargeHistoryItem[]> {
  const res = await fetch(`${API_BASE}/recharge/history`, {
    headers: getAuthHeaders()
  })

  if (!res.ok) {
    return []
  }

  const data = await res.json()
  return data.history || []
}
