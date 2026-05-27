import { create } from 'zustand';
import { QRPayment } from '../types';

interface QRValidationResult {
  valid: boolean;
  id: string;
  creator_user_id: string;
  creatorName: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'MAD';
  qr_token: string;
  status: string;
}

interface QRPaymentState {
  currentQR: QRPayment | null;
  qrPayloadString: string | null;
  scannedQR: QRValidationResult | null;
  isLoading: boolean;
  error: string | null;
  
  generateQR: (payload: { walletId?: string; amount: number; currency: string }) => Promise<{ success: boolean; error?: string; payload?: string }>;
  validateQR: (token: string) => Promise<{ success: boolean; error?: string; result?: QRValidationResult }>;
  payQR: (token: string, senderWalletId?: string) => Promise<{ success: boolean; error?: string }>;
  clearScanState: () => void;
}

export const useQRPaymentStore = create<QRPaymentState>((set, get) => ({
  currentQR: null,
  qrPayloadString: null,
  scannedQR: null,
  isLoading: false,
  error: null,

  generateQR: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/payments/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to generate dynamic QR checkout payload' };
      }
      set({ currentQR: data.qr, qrPayloadString: data.qrPayload });
      return { success: true, payload: data.qrPayload };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Network transport failure generating QR' };
    }
  },

  validateQR: async (token) => {
    set({ isLoading: true, error: null, scannedQR: null });
    try {
      const res = await fetch('/api/payments/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token })
      });
      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) {
        return { success: false, error: data.error || 'Scanned signature was rejected by host.' };
      }
      set({ scannedQR: data });
      return { success: true, result: data };
    } catch (err: any) {
      set({ isLoading: false, scannedQR: null });
      return { success: false, error: err.message || 'Signature validation server error' };
    }
  },

  payQR: async (token, senderWalletId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/payments/qr/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token, senderWalletId })
      });
      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) {
        return { success: false, error: data.error || 'Transaction refused during settlement.' };
      }
      set({ scannedQR: null });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Payment server timeout' };
    }
  },

  clearScanState: () => {
    set({ scannedQR: null, error: null });
  }
}));
