import { create } from 'zustand';
import { Subscription } from '../types';

interface SubscriptionState {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  cancelSubscription: (id: string) => Promise<Subscription | null>;
  reactivateSubscription: (id: string) => Promise<Subscription | null>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  isLoading: false,
  error: null,

  fetchSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/subscriptions');
      if (!res.ok) throw new Error('Could not fetch active subscriptions');
      const data = await res.json();
      set({ subscriptions: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed subscription load', isLoading: false });
    }
  },

  cancelSubscription: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (!res.ok) throw new Error('Could not cancel subscription routing');
      const updated = await res.json();
      set({
        subscriptions: get().subscriptions.map(s => s.id === id ? updated : s),
        isLoading: false
      });
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed subscription cancellation', isLoading: false });
      return null;
    }
  },

  reactivateSubscription: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      if (!res.ok) throw new Error('Could not reactivate subscription routing');
      const updated = await res.json();
      set({
        subscriptions: get().subscriptions.map(s => s.id === id ? updated : s),
        isLoading: false
      });
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed subscription reactivation', isLoading: false });
      return null;
    }
  }
}));
