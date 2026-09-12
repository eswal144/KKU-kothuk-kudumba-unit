export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const AUTH_BASE = `${API_BASE}/auth`;
