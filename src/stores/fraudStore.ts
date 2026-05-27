import { create } from 'zustand';
import { FraudEvent } from '../types';

interface FraudState {
  fraudEvents: FraudEvent[];
  isLoading: boolean;
  error: string | null;
  fetchFraudEvents: (isAdmin?: boolean) => Promise<void>;
  resolveFraudEvent: (id: string) => Promise<boolean>;
}

export const useFraudStore = create<FraudState>((set, get) => ({
  fraudEvents: [],
  isLoading: false,
  error: null,

  fetchFraudEvents: async (isAdmin = false) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = isAdmin ? '/api/admin/security/fraud-events' : '/api/security/fraud-events';
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Could not download active risk anomalies or audit logs.');
      const data = await res.json();
      set({ fraudEvents: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed load for risk signals', isLoading: false });
    }
  },

  resolveFraudEvent: async (id: string) => {
    try {
      const res = await fetch(`/api/security/fraud-events/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        set({
          fraudEvents: get().fraudEvents.map(e => e.id === id ? { ...e, resolved: true } : e)
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}));
