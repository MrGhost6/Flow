import { create } from 'zustand';
import { Insight } from '../types';

interface InsightsState {
  insights: Insight[];
  isLoading: boolean;
  error: string | null;
  fetchInsights: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  dismissInsight: (id: string) => Promise<void>;
}

export const useInsightsStore = create<InsightsState>((set, get) => ({
  insights: [],
  isLoading: false,
  error: null,

  fetchInsights: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/insights');
      if (!res.ok) throw new Error('Could not pull AI insights log');
      const data = await res.json();
      set({ insights: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed insights fetch', isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await fetch(`/api/insights/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });
      if (!res.ok) throw new Error('Could not update insight status');
      set({
        insights: get().insights.map(i => i.id === id ? { ...i, isRead: true } : i)
      });
    } catch (err) {
      console.warn('Silent fallback: marking read failed', err);
    }
  },

  dismissInsight: async (id) => {
    try {
      const res = await fetch(`/api/insights/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Could not update index logs');
      set({
        insights: get().insights.filter(i => i.id !== id)
      });
    } catch (err) {
      // Local filter fallback
      set({
        insights: get().insights.filter(i => i.id !== id)
      });
    }
  }
}));
