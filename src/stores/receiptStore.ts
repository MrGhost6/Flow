import { create } from 'zustand';
import { ExtendedTransaction } from './transactionStore';

interface ReceiptData {
  company: string;
  license: string;
  address: string;
  clearingAgent: string;
  transaction: ExtendedTransaction;
  verifiedStamp: boolean;
  issuedAt: string;
}

interface ReceiptState {
  receipt: ReceiptData | null;
  isLoading: boolean;
  error: string | null;
  fetchReceipt: (txId: string) => Promise<ReceiptData | null>;
  clearReceipt: () => void;
}

export const useReceiptStore = create<ReceiptState>((set) => ({
  receipt: null,
  isLoading: false,
  error: null,

  fetchReceipt: async (txId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/transactions/${txId}/receipt`);
      if (!res.ok) throw new Error('Receipt registry lookup failed');
      const data: ReceiptData = await res.json();
      set({ receipt: data, isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  clearReceipt: () => {
    set({ receipt: null });
  }
}));
