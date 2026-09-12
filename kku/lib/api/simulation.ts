const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface PopulationOverview {
  totalPopulation: number;
  newBirths: number;
  deaths: number;
  date: string;
}

export interface KKUEvent {
  id: number;
  event_type: string;
  title: string;
  message: string;
  citizen_id?: string;
  metadata?: string;
  is_read: number;
  created_at: string;
}

export interface SimulationStatus {
  running: boolean;
  lastRun: string;
  nextRun: string;
  provider: string;
  intervalMs: number;
}

export async function fetchPopulationOverview(): Promise<PopulationOverview> {
  const res = await fetch(`${API_BASE_URL}/population/overview`);
  if (!res.ok) throw new Error('Failed to fetch population overview');
  return res.json();
}

export async function fetchCivilizationEvents(limit: number = 20): Promise<KKUEvent[]> {
  const res = await fetch(`${API_BASE_URL}/events?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch civilization events');
  return res.json();
}

export async function fetchSimulationStatus(): Promise<SimulationStatus> {
  const res = await fetch(`${API_BASE_URL}/simulation/status`);
  if (!res.ok) throw new Error('Failed to fetch simulation status');
  return res.json();
}

export async function triggerSimulationTick(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to trigger manual simulation tick');
  return res.json();
}
