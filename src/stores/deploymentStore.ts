import { create } from 'zustand';

export interface LiveDeployment {
  id: string;
  version: string;
  environment: 'staging' | 'production';
  status: 'running' | 'rolling' | 'completed' | 'failed' | 'rolled_back';
  triggeredBy: string;
  commitHash: string;
  liveNodes: number;
  targetNodes: number;
  timestamp: string;
  logs: string[];
}

interface DeploymentState {
  deployments: LiveDeployment[];
  isDeploying: boolean;
  isFetching: boolean;
  error: string | null;
  fetchDeployments: () => Promise<void>;
  triggerDeployment: (version: string, environment?: 'staging' | 'production') => Promise<void>;
  triggerRollback: () => Promise<void>;
}

export const useDeploymentStore = create<DeploymentState>((set, get) => ({
  deployments: [],
  isDeploying: false,
  isFetching: false,
  error: null,

  fetchDeployments: async () => {
    set({ isFetching: true });
    try {
      const res = await fetch('/api/deployments');
      if (!res.ok) throw new Error('Failed to retrieve deployment registry');
      const data = await res.json();
      set({ deployments: data, isFetching: false, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error loading deployments', isFetching: false });
    }
  },

  triggerDeployment: async (version, environment = 'production') => {
    set({ isDeploying: true });
    try {
      const res = await fetch('/api/deployments/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version, environment }),
      });
      if (!res.ok) throw new Error('Deployment trigger failed on cluster orchestration');
      
      const data = await res.json();
      
      // Immediately read deployments to update view
      const registryRes = await fetch('/api/deployments');
      const registryData = await registryRes.json();
      set({ deployments: registryData, isDeploying: false, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error launching rolling update', isDeploying: false });
    }
  },

  triggerRollback: async () => {
    set({ isDeploying: true });
    try {
      const res = await fetch('/api/deployments/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Rollback pipeline trigger failed');
      
      const data = await res.json();
      
      const registryRes = await fetch('/api/deployments');
      const registryData = await registryRes.json();
      set({ deployments: registryData, isDeploying: false, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error triggering emergency rollback', isDeploying: false });
    }
  }
}));
