import { create } from 'zustand';
import { SplitBill } from '../types';

interface SplitBillState {
  bills: SplitBill[];
  isLoading: boolean;
  error: string | null;
  
  fetchBills: () => Promise<void>;
  createSplitBill: (payload: {
    title: string;
    totalAmount: number;
    currency: string;
    participants: { userIdentifier: string; amountDue?: number }[];
  }) => Promise<{ success: boolean; error?: string; splitBill?: SplitBill }>;
  paySplitShare: (id: string, walletId?: string) => Promise<{ success: boolean; error?: string }>;
}

export const useSplitBillStore = create<SplitBillState>((set, get) => ({
  bills: [],
  isLoading: false,
  error: null,

  fetchBills: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/payments/split-bills');
      if (!res.ok) throw new Error('Could not synchronize shared bill sheets');
      const data = await res.json();
      set({ bills: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Split bill sync issue', isLoading: false });
    }
  },

  createSplitBill: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/payments/split-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to dispatch group split bill' };
      }
      await get().fetchBills();
      return { success: true, splitBill: data.splitBill };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Split bill transmission error' };
    }
  },

  paySplitShare: async (id, walletId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/payments/split-bills/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId })
      });
      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) {
        return { success: false, error: data.error || 'Split bill settlement failed.' };
      }
      await get().fetchBills();
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Settlement transport issue' };
    }
  }
}));
