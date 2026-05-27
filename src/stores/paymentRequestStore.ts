import { create } from 'zustand';
import { PaymentRequest } from '../types';

interface PaymentRequestState {
  requests: PaymentRequest[];
  isLoading: boolean;
  error: string | null;
  fetchRequests: () => Promise<void>;
  createRequest: (payload: {
    receiverIdentifier: string;
    amount: number;
    currency: string;
    note?: string;
    expiresAt?: string;
  }) => Promise<{ success: boolean; error?: string; request?: PaymentRequest }>;
  acceptRequest: (id: string, walletId?: string) => Promise<{ success: boolean; error?: string }>;
  declineRequest: (id: string) => Promise<{ success: boolean; error?: string }>;
  cancelRequest: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const usePaymentRequestStore = create<PaymentRequestState>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/payments/requests');
      if (!res.ok) throw new Error('Failed to pull payment requests');
      const data = await res.json();
      set({ requests: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Synchronization failed', isLoading: false });
    }
  },

  createRequest: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) {
        return { success: false, error: data.error || 'Server rejected creation of request' };
      }
      await get().fetchRequests();
      return { success: true, request: data.request };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Network transport failure' };
    }
  },

  acceptRequest: async (id, walletId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/payments/requests/${id}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId })
      });
      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to authorize checkout transfer.' };
      }
      await get().fetchRequests();
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Payment execution timeout' };
    }
  },

  declineRequest: async (id) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/payments/requests/${id}/decline`, {
        method: 'PATCH'
      });
      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) return { success: false, error: data.error || 'Failed to register declination.' };
      await get().fetchRequests();
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Declinary request transport failure' };
    }
  },

  cancelRequest: async (id) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/payments/requests/${id}/cancel`, {
        method: 'PATCH'
      });
      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) return { success: false, error: data.error || 'Cancellation request rejected' };
      await get().fetchRequests();
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Cancellation transport issue' };
    }
  }
}));
