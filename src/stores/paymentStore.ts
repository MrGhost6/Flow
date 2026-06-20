import { create } from 'zustand';
import { useWalletStore } from './walletStore';
import { useTransactionStore } from './transactionStore';

interface ValidationState {
  valid: boolean;
  estimatedFee: number;
  recipientFound: boolean;
  recipientName: string;
  warnings: string[];
}

interface TransferFlow {
  recipient: string;
  amount: string;
  currency: string;
  category: string;
  description: string;
}

interface PaymentState {
  transferFlow: TransferFlow;
  validationState: ValidationState | null;
  confirmationState: 'idle' | 'review' | 'confirming' | 'success' | 'failure';
  isProcessing: boolean;
  errorMessage: string | null;
  successDetails: {
    transactionId: string;
    transactionReference: string;
    amount: string;
    currency: string;
    fee: string;
  } | null;

  setTransferDetails: (updates: Partial<TransferFlow>) => void;
  resetFlow: () => void;
  validateTransfer: () => Promise<boolean>;
  sendMoney: () => Promise<boolean>;
}

const initialFlow: TransferFlow = {
  recipient: '',
  amount: '',
  currency: 'MAD',
  category: 'transfer',
  description: ''
};

export const usePaymentStore = create<PaymentState>((set, get) => ({
  transferFlow: initialFlow,
  validationState: null,
  confirmationState: 'idle',
  isProcessing: false,
  errorMessage: null,
  successDetails: null,

  setTransferDetails: (updates) => {
    set(state => ({
      transferFlow: { ...state.transferFlow, ...updates }
    }));
  },

  resetFlow: () => {
    set({
      transferFlow: initialFlow,
      validationState: null,
      confirmationState: 'idle',
      isProcessing: false,
      errorMessage: null,
      successDetails: null,
    });
  },

  validateTransfer: async () => {
    const { transferFlow } = get();
    set({ isProcessing: true, errorMessage: null });
    try {
      const res = await fetch('/api/transactions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverIdentifier: transferFlow.recipient,
          amount: Number(transferFlow.amount),
          currency: transferFlow.currency
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Recipient validation failed.');
      }

      set({
        validationState: {
          valid: data.valid,
          estimatedFee: data.estimatedFee || 0,
          recipientFound: data.recipientFound,
          recipientName: data.recipientName || 'External Recipient',
          warnings: data.warnings || []
        },
        confirmationState: 'review',
        isProcessing: false
      });
      return true;
    } catch (err: any) {
      set({
        errorMessage: err.message || 'Verification failed. Double check coordinates.',
        isProcessing: false,
        confirmationState: 'idle'
      });
      return false;
    }
  },

  sendMoney: async () => {
    const { transferFlow } = get();
    set({ isProcessing: true, errorMessage: null, confirmationState: 'confirming' });
    try {
      const res = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverIdentifier: transferFlow.recipient,
          amount: Number(transferFlow.amount),
          currency: transferFlow.currency,
          description: transferFlow.description || `Split transfer via FLOW`,
          category: transferFlow.category || 'transfer'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transaction clearing rejected.');
      }

      set({
        successDetails: {
          transactionId: data.transactionId,
          transactionReference: data.transactionReference,
          amount: data.amount,
          currency: data.currency,
          fee: data.fee || '0.00'
        },
        confirmationState: 'success',
        isProcessing: false
      });

      // Instantly trigger live updates of local reactive state registers
      await useWalletStore.getState().refreshWallets();
      await useTransactionStore.getState().fetchTransactions();

      return true;
    } catch (err: any) {
      set({
        errorMessage: err.message || 'Deduction rejected by clearing desk.',
        confirmationState: 'failure',
        isProcessing: false
      });
      return false;
    }
  }
}));
