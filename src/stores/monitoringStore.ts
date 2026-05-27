import { create } from 'zustand';

export interface PerformanceMetrics {
  cpuPercentage: number;
  memoryUsageMB: number;
  apiLatencySeconds: number;
  httpRequestsTotal: number;
  failedRequestsTotal: number;
  redisMemoryLimitBytes: number;
  dbConnectionActive: number;
  jwtSignaturesGenerated: number;
  queueBackpressureSize: number;
  activeContainers: number;
  threatTriggersFired: number;
}

export interface InfraLog {
  id: string;
  timestamp: string;
  source: 'auth' | 'payments' | 'fraud' | 'admin' | 'infra' | 'queues';
  level: 'info' | 'warning' | 'error' | 'security';
  message: string;
}

export interface QueueJob {
  id: string;
  queue: 'notifications' | 'analytics' | 'fraud_scoring' | 'statement_generator' | 'emails';
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  payload: string;
  result?: string;
  error?: string;
  createdAt: string;
  processedAt?: string;
}

export interface QueueStats {
  jobs: QueueJob[];
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface DBBackup {
  id: string;
  timestamp: string;
  sizeMB: number;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'automated' | 'manual';
  rpoSeconds: number;
}

interface MonitoringState {
  metrics: PerformanceMetrics | null;
  prometheusRaw: string;
  logs: InfraLog[];
  queues: QueueStats | null;
  backups: DBBackup[];
  isFetchingMetrics: boolean;
  isFetchingLogs: boolean;
  isFetchingQueues: boolean;
  isFetchingBackups: boolean;
  error: string | null;
  
  fetchMetrics: () => Promise<void>;
  fetchLogs: (source?: string, level?: string) => Promise<void>;
  fetchQueues: () => Promise<void>;
  addQueueJob: (queue: string, type: string, payload?: any) => Promise<void>;
  fetchBackups: () => Promise<void>;
  triggerBackup: () => Promise<void>;
  triggerRestore: (backupId: string) => Promise<void>;
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
  metrics: null,
  prometheusRaw: '',
  logs: [],
  queues: null,
  backups: [],
  isFetchingMetrics: false,
  isFetchingLogs: false,
  isFetchingQueues: false,
  isFetchingBackups: false,
  error: null,

  fetchMetrics: async () => {
    set({ isFetchingMetrics: true });
    try {
      const res = await fetch('/api/metrics/performance');
      if (!res.ok) throw new Error('Failed to fetch APM telemetry');
      const data = await res.json();
      set({ 
        metrics: data.metrics, 
        prometheusRaw: data.prometheusRaw, 
        isFetchingMetrics: false, 
        error: null 
      });
    } catch (err: any) {
      set({ error: err.message || 'Error loading telemetry metrics', isFetchingMetrics: false });
    }
  },

  fetchLogs: async (source = 'all', level = 'all') => {
    set({ isFetchingLogs: true });
    try {
      const res = await fetch(`/api/logs/query?source=${source}&level=${level}`);
      if (!res.ok) throw new Error('Log query engine connection error');
      const data = await res.json();
      set({ logs: data.logs, isFetchingLogs: false, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error processing queries', isFetchingLogs: false });
    }
  },

  fetchQueues: async () => {
    set({ isFetchingQueues: true });
    try {
      const res = await fetch('/api/queues/status');
      if (!res.ok) throw new Error('Could not request worker queue counts');
      const data = await res.json();
      set({ queues: data, isFetchingQueues: false, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error requesting queue info', isFetchingQueues: false });
    }
  },

  addQueueJob: async (queue, type, payload = {}) => {
    try {
      const res = await fetch('/api/queues/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queue, type, payload }),
      });
      if (!res.ok) throw new Error('Fail to inject job into BullMQ simulation');
      
      // Update queue counts list immediately
      const statsRes = await fetch('/api/queues/status');
      const statsData = await statsRes.json();
      set({ queues: statsData, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error pushing job to Redis' });
    }
  },

  fetchBackups: async () => {
    set({ isFetchingBackups: true });
    try {
      const res = await fetch('/api/backups');
      if (!res.ok) throw new Error('Fail to read databases backup snapshots');
      const data = await res.json();
      set({ backups: data, isFetchingBackups: false, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error fetching backup status', isFetchingBackups: false });
    }
  },

  triggerBackup: async () => {
    try {
      const res = await fetch('/api/backups/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'manual' }),
      });
      if (!res.ok) throw new Error('Fails to execute RDS manual snapshot');
      
      const backupsRes = await fetch('/api/backups');
      const backupsData = await backupsRes.json();
      set({ backups: backupsData, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error during backup cycle' });
    }
  },

  triggerRestore: async (backupId) => {
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupId }),
      });
      if (!res.ok) throw new Error('Database point-in-time recovery rejected');
      
      const backupsRes = await fetch('/api/backups');
      const backupsData = await backupsRes.json();
      set({ backups: backupsData, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error launching point-in-time recovery' });
    }
  }
}));
