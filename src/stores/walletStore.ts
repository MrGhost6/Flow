import { create } from 'zustand';
import { Wallet } from '../types';

export interface ExtendedWallet extends Wallet {
  availableBalance?: number;
  frozenBalance?: number;
  status?: 'active' | 'restricted' | 'frozen' | 'closed';
  dailyLimit?: number;
  monthlyLimit?: number;
  walletType?: 'personal' | 'business';
  limit: number;
  isFrozen: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletState {
  wallets: ExtendedWallet[];
  selectedWallet: ExtendedWallet | null;
  isLoading: boolean;
  error: string | null;
  fetchWallets: () => Promise<void>;
  refreshWallets: () => Promise<void>;
  selectWallet: (wallet: ExtendedWallet) => void;
  updateLimits: (walletId: string, dailyLimit: number, monthlyLimit: number) => Promise<ExtendedWallet | null>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  selectedWallet: null,
  isLoading: false,
  error: null,

  fetchWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/wallets');
      if (!res.ok) throw new Error('Could not fetch active wallets');
      const data: ExtendedWallet[] = await res.json();
      
      const currentSelected = get().selectedWallet;
      let nextSelected = currentSelected;
      if (data && data.length > 0) {
        nextSelected = currentSelected 
          ? (data.find(w => w.id === currentSelected.id) || data[0])
          : data[0];
      }

      set({ wallets: data, selectedWallet: nextSelected, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed memory synchronization', isLoading: false });
    }
  },

  refreshWallets: async () => {
    try {
      const res = await fetch('/api/wallets');
      if (res.ok) {
        const data: ExtendedWallet[] = await res.json();
        const currentSelected = get().selectedWallet;
        let nextSelected = currentSelected;
        if (data && data.length > 0) {
          nextSelected = currentSelected 
            ? (data.find(w => w.id === currentSelected.id) || data[0])
            : data[0];
        }
        set({ wallets: data, selectedWallet: nextSelected });
      }
    } catch (err) {
      console.error('Quiet wallet refresh failed', err);
    }
  },

  selectWallet: (wallet) => {
    set({ selectedWallet: wallet });
  },

  updateLimits: async (walletId, dailyLimit, monthlyLimit) => {
    try {
      const res = await fetch(`/api/wallets/${walletId}/limits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyLimit, monthlyLimit })
      });
      if (!res.ok) throw new Error('Failed limit adjustment request');
      const data = await res.json();
      if (data.status === 'success' && data.wallet) {
        // Refresh wallets list
        await get().fetchWallets();
        return data.wallet;
      }
      return null;
    } catch (err) {
      console.error('Error in limit updates', err);
      return null;
    }
  }
}));
