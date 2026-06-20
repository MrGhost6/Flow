import { create } from 'zustand';

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'critical';
  host?: string;
  type?: string;
  latencyMs?: number;
}

export interface SystemOverview {
  status: 'healthy' | 'degraded' | 'critical';
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    redis: ServiceStatus;
    queues: ServiceStatus;
  };
}

interface SystemHealthState {
  systemOverview: SystemOverview | null;
  isFetching: boolean;
  error: string | null;
  fetchHealth: () => Promise<void>;
  toggleServiceFault: (service: 'api' | 'database' | 'redis' | 'queues', status: 'healthy' | 'degraded' | 'critical') => Promise<void>;
}

export const useSystemHealthStore = create<SystemHealthState>((set) => ({
  systemOverview: null,
  isFetching: false,
  error: null,

  fetchHealth: async () => {
    set({ isFetching: true });
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Failed to fetch system health stats');
      const raw = await res.json();
      set({
        systemOverview: {
          status: raw.status === 'healthy' ? 'healthy' : 'degraded',
          version: raw.version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptimeSeconds: raw.uptime || 0,
          timestamp: raw.timestamp || new Date().toISOString(),
          services: {
            api: { status: raw.status === 'healthy' ? 'healthy' : 'degraded' },
            database: { status: 'degraded' },
            redis: { status: 'degraded' },
            queues: { status: 'degraded' }
          }
        },
        isFetching: false,
        error: null
      });
    } catch (err: any) {
      set({ error: err.message || 'Error loading health logs', isFetching: false });
    }
  },

  toggleServiceFault: async (service, status) => {
    try {
      const res = await fetch('/api/infra/toggle-fault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service, status }),
      });
      if (!res.ok) throw new Error('Failed to toggle fault state');
      
      // Re-trigger health polling to immediately render new state
      const healthRes = await fetch('/api/health');
      const data = await healthRes.json();
      set({ systemOverview: data, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error updating service status' });
    }
  }
}));
