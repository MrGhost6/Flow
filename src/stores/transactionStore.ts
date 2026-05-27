import { create } from 'zustand';
import { Transaction } from '../types';

export interface ExtendedTransaction extends Transaction {
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'reversed';
  reference: string;
  transaction_reference?: string;
  sender_wallet_id?: string;
  receiver_wallet_id?: string;
  fee?: number;
  exchange_rate?: number;
  transaction_type?: string;
  createdAt?: string;
}

interface TransactionFilters {
  category: string;
  status: string;
  timeframe: string;
  query: string;
}

interface TransactionState {
  transactions: ExtendedTransaction[];
  selectedTransactionDetail: ExtendedTransaction | null;
  filters: TransactionFilters;
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  searchTransactions: (query: string) => Promise<void>;
  filterTransactions: (customFilters?: Partial<TransactionFilters>) => Promise<void>;
  fetchTransactionDetails: (id: string) => Promise<ExtendedTransaction | null>;
  setFilters: (updated: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: TransactionFilters = {
  category: 'All Categories',
  status: 'All',
  timeframe: 'all_time',
  query: ''
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  selectedTransactionDetail: null,
  filters: defaultFilters,
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error('Could not pull clear logs');
      const data: ExtendedTransaction[] = await res.json();
      set({ transactions: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed transactions load', isLoading: false });
    }
  },

  searchTransactions: async (query: string) => {
    set({ isLoading: true, error: null });
    // Update local filter query
    set(state => ({ filters: { ...state.filters, query } }));
    try {
      const res = await fetch(`/api/transactions/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data: ExtendedTransaction[] = await res.json();
      set({ transactions: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  filterTransactions: async (customFilters) => {
    set({ isLoading: true, error: null });
    if (customFilters) {
      set(state => ({ filters: { ...state.filters, ...customFilters } }));
    }
    const currentFilters = get().filters;
    try {
      const params = new URLSearchParams();
      if (currentFilters.category && currentFilters.category !== 'All Categories') {
        params.append('category', currentFilters.category);
      }
      if (currentFilters.status && currentFilters.status !== 'All') {
        params.append('status', currentFilters.status);
      }
      if (currentFilters.timeframe && currentFilters.timeframe !== 'all_time') {
        params.append('timeframe', currentFilters.timeframe);
      }

      const res = await fetch(`/api/transactions/filter?${params.toString()}`);
      if (!res.ok) throw new Error('Filtering failed');
      const data: ExtendedTransaction[] = await res.json();
      set({ transactions: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchTransactionDetails: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/transactions/${id}`);
      if (!res.ok) throw new Error('Transaction detail node could not be loaded');
      const data: ExtendedTransaction = await res.json();
      set({ selectedTransactionDetail: data, isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  setFilters: (updated) => {
    set(state => ({ filters: { ...state.filters, ...updated } }));
    get().filterTransactions();
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    get().fetchTransactions();
  }
}));
