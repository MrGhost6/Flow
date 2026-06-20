import { create } from 'zustand';
import { Budget } from '../types';

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  createBudget: (category: string, limitAmount: number, currency: string) => Promise<Budget | null>;
  updateBudget: (id: string, limitAmount: number) => Promise<Budget | null>;
  deleteBudget: (id: string) => Promise<boolean>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  isLoading: false,
  error: null,

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/budgets');
      if (!res.ok) throw new Error('Could not load budgets');
      const data = await res.json();
      set({ budgets: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed budgets fetch', isLoading: false });
    }
  },

  createBudget: async (category, limitAmount, currency) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: category, amount: limitAmount, period: 'MONTHLY', currency })
      });
      if (!res.ok) throw new Error('Could not create budget limit');
      const newB = await res.json();
      set({ budgets: [...get().budgets, newB], isLoading: false });
      return newB;
    } catch (err: any) {
      set({ error: err.message || 'Failed budget creation', isLoading: false });
      return null;
    }
  },

  updateBudget: async (id, limitAmount) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: limitAmount })
      });
      if (!res.ok) throw new Error('Could not update budget limit');
      const updatedB = await res.json();
      set({
        budgets: get().budgets.map(b => b.id === id ? updatedB : b),
        isLoading: false
      });
      return updatedB;
    } catch (err: any) {
      set({ error: err.message || 'Failed budget update', isLoading: false });
      return null;
    }
  },

  deleteBudget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Could not delete budget');
      set({
        budgets: get().budgets.filter(b => b.id !== id),
        isLoading: false
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed budget deletion', isLoading: false });
      return false;
    }
  }
}));
