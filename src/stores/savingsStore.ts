import { create } from 'zustand';
import { SavingsGoal, SavingsGoalType } from '../types';

interface SavingsState {
  goals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;
  fetchSavingsGoals: () => Promise<void>;
  createSavingsGoal: (title: string, targetAmount: number, currency: string, targetDate: string, goalType: SavingsGoalType) => Promise<SavingsGoal | null>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<SavingsGoal | null>;
  contribute: (id: string, amount: number) => Promise<SavingsGoal | null>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchSavingsGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/savings/goals');
      if (!res.ok) throw new Error('Failed to load savings goals');
      const data = await res.json();
      set({ goals: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed savings details pool', isLoading: false });
    }
  },

  createSavingsGoal: async (title, targetAmount, currency, targetDate, goalType) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/savings/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, targetAmount, currency, targetDate, goalType })
      });
      if (!res.ok) throw new Error('Failed to create savings goal');
      const data = await res.json();
      set({ goals: [...get().goals, data], isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to initialize savings rule', isLoading: false });
      return null;
    }
  },

  updateSavingsGoal: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/savings/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to modify savings goal');
      const updated = await res.json();
      set({
        goals: get().goals.map(g => g.id === id ? updated : g),
        isLoading: false
      });
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed savings adjustment', isLoading: false });
      return null;
    }
  },

  contribute: async (id, amount) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/savings/goals/${id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to deposit contribution');
      }
      const updated = await res.json();
      set({
        goals: get().goals.map(g => g.id === id ? updated : g),
        isLoading: false
      });
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed deposit transfer', isLoading: false });
      return null;
    }
  }
}));
