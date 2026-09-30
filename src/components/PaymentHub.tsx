import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  CheckCircle,
  Send,
  X,
  FileText,
  AlertCircle,
  Briefcase,
  Shield,
  Info,
  Lock,
  RefreshCw,
  Download,
  Share2,
  QrCode,
  Users,
  HandCoins,
  CheckSquare
} from 'lucide-react';
import { Transaction, Wallet, Invoice, UserProfile } from '../types';
import { useWalletStore, ExtendedWallet } from '../stores/walletStore';
import { useTransactionStore, ExtendedTransaction } from '../stores/transactionStore';
import { usePaymentStore } from '../stores/paymentStore';
import { useReceiptStore } from '../stores/receiptStore';
import { usePaymentRequestStore } from '../stores/paymentRequestStore';
import { useQRPaymentStore } from '../stores/qrPaymentStore';
import { useSplitBillStore } from '../stores/splitBillStore';
import { toast } from 'react-toastify';
import { useNotificationStore } from '../stores/notificationStore';

interface PaymentHubProps {
  invoices: Invoice[];
  onAddInvoice: (newInv: Invoice) => void;
  notifications: any[];
  setNotifications: (notif: any[]) => void;
}

interface QuickContact {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function PaymentHub({
  invoices,
  onAddInvoice,
  notifications,
  setNotifications,
}: PaymentHubProps) {
  // Navigation tabs: 'overview' | 'requests' | 'qr' | 'splits' | 'invoices' | 'audits'
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'requests' | 'qr' | 'splits' | 'invoices' | 'audits'>('overview');

  // Zustand hooks integration
  const { wallets, selectedWallet, fetchWallets, selectWallet, updateLimits, isLoading: loadingWallets } = useWalletStore();
  const { transactions, fetchTransactions, searchTransactions, filters, setFilters } = useTransactionStore();
  const { transferFlow, validationState, confirmationState, isProcessing: sendingMoney, errorMessage, successDetails, setTransferDetails, resetFlow, validateTransfer, sendMoney } = usePaymentStore();
  const { receipt, fetchReceipt, clearReceipt, isLoading: loadingReceipt } = useReceiptStore();

  const { requests: payRequests, isLoading: loadingRequests, fetchRequests, createRequest, acceptRequest, declineRequest, cancelRequest } = usePaymentRequestStore();
  const { currentQR, qrPayloadString, scannedQR, isLoading: loadingQR, generateQR, validateQR, payQR, clearScanState } = useQRPaymentStore();
  const { bills: splitBills, isLoading: loadingSplits, fetchBills, createSplitBill, paySplitShare } = useSplitBillStore();
  const { fetchNotifications } = useNotificationStore();

  const [p2pUser, setP2pUser] = useState('');
  const [p2pAmount, setP2pAmount] = useState('');
  const [p2pCurrency, setP2pCurrency] = useState('MAD');
  const [p2pNote, setP2pNote] = useState('');
  const [p2pOverlaySuccess, setP2pOverlaySuccess] = useState<string | null>(null);
  const [p2pError, setP2pError] = useState<string | null>(null);

  const [qrAmountInput, setQrAmountInput] = useState('');
  const [qrCurrencyInput, setQrCurrencyInput] = useState('MAD');
  const [qrActiveView, setQrActiveView] = useState<'create' | 'scan'>('scan');
  const [scanInputValue, setScanInputValue] = useState('');
  const [qrSuccessMessage, setQrSuccessMessage] = useState<string | null>(null);
  const [qrErrorMessage, setQrErrorMessage] = useState<string | null>(null);

  const [splitTitleInput, setSplitTitleInput] = useState('');
  const [splitTotalInput, setSplitTotalInput] = useState('');
  const [splitCurrencyInput, setSplitCurrencyInput] = useState('MAD');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [splitSuccessMessage, setSplitSuccessMessage] = useState<string | null>(null);
  const [splitErrorMessage, setSplitErrorMessage] = useState<string | null>(null);

  // Selected single transaction detail trigger state
  const [selectedTx, setSelectedTx] = useState<ExtendedTransaction | null>(null);
  
  // Local UI limits form control state
  const [selectedWalletForLimits, setSelectedWalletForLimits] = useState<ExtendedWallet | null>(null);
  const [customDailyLimit, setCustomDailyLimit] = useState<string>('');
  const [customMonthlyLimit, setCustomMonthlyLimit] = useState<string>('');
  const [isUpdatingLimits, setIsUpdatingLimits] = useState(false);
  const [limitsMessage, setLimitsMessage] = useState<string | null>(null);

  // New transfer manual input trigger flag
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  // Preflight validation security verification PIN state during confirmation
  const [verificationPin, setVerificationPin] = useState('');
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // List of pre-loaded audit records fetched dynamically
  const [localAudits, setLocalAudits] = useState<any[]>([]);
  const [isLoadingAudits, setIsLoadingAudits] = useState(false);

  // Quick select contacts
  const placeholderAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='20' fill='%23131722'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='%2300E0C7' font-size='16' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E";
  const contacts: QuickContact[] = [
    {
      id: 'sc-1',
      name: 'Yassine Benjelloun',
      email: 'yassine@benjellouncorp.ma',
      role: 'Business Partner (MENA)',
      avatar: placeholderAvatar,
    },
    {
      id: 'sc-2',
      name: 'Sarah J.',
      email: 'sarah.j@workspace.io',
      role: 'Lead UX Architect',
      avatar: placeholderAvatar,
    },
    {
      id: 'sc-3',
      name: 'Ahmed El Fassi',
      email: 'ahmed@commercemaroc.ma',
      role: 'Logistics Lead',
      avatar: placeholderAvatar,
    }
  ];

  // Invoice creator dialog
  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);
  const [invClient, setInvClient] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invHours, setInvHours] = useState('40');
  const [invRate, setInvRate] = useState('45');
  const [invCurrency, setInvCurrency] = useState('EUR');

  // Trigger state sync with backend on mount
  useEffect(() => {
    fetchWallets();
    fetchTransactions();
    fetchAudits();
    fetchRequests();
    fetchBills();
    fetchNotifications();
  }, []);

  const fetchAudits = async () => {
    setIsLoadingAudits(true);
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        setLocalAudits(data);
      }
    } catch (err) {
      console.error('Audit trace fetch aborted', err);
    } finally {
      setIsLoadingAudits(false);
    }
  };

  // Pull matching visual settings trigger for currency symbol
  const getSymbolByCode = (cur: string) => {
    switch(cur.toUpperCase()){
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'MAD': return 'DH';
      default: return cur;
    }
  };

  // Pre-flight validator triggers
  const executePreFlightCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFlow.recipient) return;
    const ok = await validateTransfer();
    if (ok) {
      // Advance to validation result review step
      setPinError(null);
      setVerificationPin('');
      setShowPinScreen(false);
    }
  };

  // Secure PIN verification submit
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationPin !== '1337') {
      setPinError('Invalid safety PIN signature.');
      return;
    }
    
    setPinError(null);
    const ok = await sendMoney();
    if (ok) {
      // Clear variables on success
      await fetchWallets();
      await fetchAudits();
      setShowPinScreen(false);
      
      // Inject alert notification
      const symbol = getSymbolByCode(transferFlow.currency);
      const newAlert = {
        id: `nt-cl-${Date.now()}`,
        text: `Successfully transferred ${symbol}${transferFlow.amount} to Ahmed. Balance engine updated.`,
        time: 'Just now',
        read: false
      };
      setNotifications([newAlert, ...notifications]);
    }
  };

  // Trigger limits modifications
  const handleLimitChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletForLimits) return;
    
    setIsUpdatingLimits(true);
    setLimitsMessage(null);
    
    const dailyNum = parseFloat(customDailyLimit) || 0;
    const monthlyNum = parseFloat(customMonthlyLimit) || 0;

    const modified = await updateLimits(selectedWalletForLimits.id, dailyNum, monthlyNum);
    setIsUpdatingLimits(false);
    
    if (modified) {
      setLimitsMessage('Vault transaction cap rules updated and sealed.');
      await fetchWallets();
      await fetchAudits();
      setTimeout(() => {
        setSelectedWalletForLimits(null);
        setLimitsMessage(null);
      }, 2000);
    } else {
      setLimitsMessage('Failed to adjust limits.');
    }
  };

  // Open transaction detail and pre-fetch receipt
  const handleSelectTransaction = async (tx: ExtendedTransaction) => {
    setSelectedTx(tx);
    await fetchReceipt(tx.id);
  };

  // Compliant export invoice creator handler
  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invClient.trim()) return;
    
    const hoursNum = parseFloat(invHours) || 40;
    const rateNum = parseFloat(invRate) || 45;
    const uniqueId = `inv-${Date.now()}`;
    const formattedNum = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;

    const newInvoice: Invoice = {
      id: uniqueId,
      invoiceNumber: formattedNum,
      clientName: invClient,
      clientEmail: invEmail || `${invClient.toLowerCase().replace(/[^a-z0-9]/g, "")}@workspace.io`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [
        { id: `item-idx-${Date.now()}`, description: 'Intelligent Software System Integration & Consulting', quantity: hoursNum, rate: rateNum }
      ],
      status: 'pending',
      currency: invCurrency,
      taxRate: 0, // Article 92-I-22 Moroccan Tax Exemption
    };

    onAddInvoice(newInvoice);
    
    const invoiceAlert = {
      id: `nt-inv-${Date.now()}`,
      text: `Compliant Export Invoice ${formattedNum} generated successfully ($0.00 VAT).`,
      time: 'Just now',
      read: false,
    };
    setNotifications([invoiceAlert, ...notifications]);

    // Reset Form
    setInvClient('');
    setInvEmail('');
    setInvHours('40');
    setInvRate('45');
    setShowInvoiceCreator(false);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in" id="payment-hub-view">
      
      {/* Transaction Hub Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <p className="text-[#00E0C7] font-bold tracking-[0.2em] uppercase text-[10px] mb-1.5 font-mono">Financial Core</p>
          <h1 className="text-[32px] md:text-[48px] font-bold leading-[40px] md:leading-[56px] tracking-[-0.02em] mb-1">Wallets & Transfers</h1>
          <p className="text-[#8a919f] max-w-2xl">Real-time balances, pre-flight internal transfers, and compliance audit trail logs.</p>
        </div>

        {/* Global Nav Tunnels */}
        <div className="flex flex-wrap gap-1.5 bg-white/[0.02] border border-white/5 p-1 rounded-full select-none justify-start shrink-0">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-5 py-2 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer border-none bg-transparent ${
              activeSubTab === 'overview'
                ? 'bg-white/10 text-[#00E0C7] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveSubTab('requests');
              fetchRequests();
            }}
            className={`px-5 py-2 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer border-none bg-transparent flex items-center gap-1 ${
              activeSubTab === 'requests'
                ? 'bg-white/10 text-[#00E0C7] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            P2P Requests
            {payRequests.filter(r => r.status === 'PENDING' && r.receiver_user_id === 'u-1').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse block" aria-label="Pending requests" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveSubTab('qr');
            }}
            className={`px-5 py-2 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer border-none bg-transparent ${
              activeSubTab === 'qr'
                ? 'bg-white/10 text-[#00E0C7] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            QR Checkout
          </button>
          <button
            onClick={() => {
              setActiveSubTab('splits');
              fetchBills();
            }}
            className={`px-5 py-2 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer border-none bg-transparent ${
              activeSubTab === 'splits'
                ? 'bg-white/10 text-[#00E0C7] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Split Bills
          </button>
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`px-5 py-2 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer border-none bg-transparent ${
              activeSubTab === 'invoices'
                ? 'bg-white/10 text-[#00E0C7] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('audits');
              fetchAudits();
            }}
            className={`px-5 py-2 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer border-none bg-transparent ${
              activeSubTab === 'audits'
                ? 'bg-white/10 text-[#00E0C7] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Audits & Safety
          </button>
        </div>
      </header>

      {/* SUBTAB 1: OVERVIEW (WALLETS + SEND MONEY WIZARD + FILTERED HISTORY) */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="overview-zone">
          
          {/* LEFT AREA: WALLETS SUMMARY (col-span-8) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Multi-Currency Balances Row */}
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Active Multi-Currency Accounts</span>
                <button 
                  onClick={() => { fetchWallets(); fetchTransactions(); }}
                  className="p-1.5 hover:bg-white/5 rounded-full text-[#00E0C7] transition-all"
                  title="Force ledger recalculation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="wallets-widget-grid">
                {wallets.length === 0 ? (
                  // Skels
                  [1,2,3].map(n => (
                    <div key={n} className="bg-[#182029]/60 h-36 rounded-3xl border border-white/5 animate-pulse" />
                  ))
                ) : (
                  wallets.map((w) => {
                    const isRestrict = w.status === 'restricted';
                    const isFroz = w.status === 'frozen' || w.isFrozen;
                    const walletSymbol = getSymbolByCode(w.currency);

                    return (
                      <div 
                        key={w.id}
                        onClick={() => selectWallet(w)}
                        className={`p-5 rounded-3xl cursor-pointer transition-all duration-300 select-none relative overflow-hidden group border ${
                          selectedWallet?.id === w.id 
                            ? 'bg-gradient-to-br from-[#192435] to-[#0d1624] border-[#00E0C7]/40 shadow-xl shadow-black/40 ring-1 ring-[#00E0C7]/10' 
                            : 'bg-[#182029]/60 hover:bg-[#131722] border-white/5 hover:border-white/10'
                        }`}
                      >
                        {/* Status Label Pill */}
                        <div className="absolute top-4 right-4 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isFroz ? 'bg-red-500' : isRestrict ? 'bg-amber-500' : 'bg-emerald-400 animate-pulse'
                          }`} />
                          <span className="text-[9px] font-mono font-bold uppercase text-gray-400 group-hover:text-white">
                            {w.status || 'active'}
                          </span>
                        </div>

                        {/* Currency Code */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-white/5 border border-white/5 rounded-2xl group-hover:bg-[#00E0C7]/10 group-hover:border-[#00E0C7]/20 transition-all text-white group-hover:text-[#00E0C7]">
                            <span className="font-mono text-xs font-bold">{w.currency}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Available Balance</p>
                          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white group-hover:text-[#00E0C7] transition-all">
                            {walletSymbol}{(w.availableBalance ?? w.balance).toLocaleString()}
                          </div>
                        </div>

                        {/* Limits Info */}
                        <div className="mt-4 pt-3 border-t border-white/[0.04] flex justify-between items-center text-[9px] font-mono text-gray-500">
                          <span>Hold: {walletSymbol}{w.frozenBalance ?? 0}</span>
                          <span className="text-right">Daily limit: {walletSymbol}{(w.dailyLimit ?? w.limit).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Selected Wallet Limits / Activity Rules Drawer */}
            {selectedWallet && (
              <section className="p-6 bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 hover:border-[#8a919f]/20 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all duration-300 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#00E0C7]" />
                      <span>Ledger Safety Policies: {selectedWallet.currency} Wallet</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mt-1">Status: {selectedWallet.status || 'active'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedWalletForLimits(selectedWallet);
                      setCustomDailyLimit((selectedWallet.dailyLimit ?? selectedWallet.limit).toString());
                      setCustomMonthlyLimit((selectedWallet.monthlyLimit ?? 300000).toString());
                    }}
                    className="py-1.5 px-3.5 bg-white/5 hover:bg-[#00E0C7]/10 text-[#00E0C7] hover:text-white border border-white/5 hover:border-[#00E0C7]/20 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Adjust Transaction Limits
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-center">
                  <div className="bg-[#182029]/30 p-3.5 rounded-2xl border border-white/5 block text-center">
                    <span className="text-gray-500 font-mono text-[10px] uppercase block mb-1">Status Access</span>
                    <span className={`inline-block px-2.5 py-1 text-[9px] font-bold font-mono uppercase tracking-wider rounded-full ${
                      selectedWallet.status === 'frozen' ? 'bg-red-400/10 text-red-400' : 'bg-emerald-400/10 text-emerald-400'
                    }`}>
                      {selectedWallet.status === 'frozen' ? 'frozen hold' : 'active clearing'}
                    </span>
                  </div>
                  <div className="bg-[#182029]/30 p-3.5 rounded-2xl border border-white/5 block text-center">
                    <span className="text-gray-500 font-mono text-[10px] uppercase block mb-1">Daily Cap Left</span>
                    <span className="font-mono text-sm font-bold text-white">
                      {getSymbolByCode(selectedWallet.currency)}{(selectedWallet.dailyLimit ?? selectedWallet.limit).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#182029]/30 p-3.5 rounded-2xl border border-white/5 block text-center">
                    <span className="text-gray-500 font-mono text-[10px] uppercase block mb-1">Monthly Ceiling</span>
                    <span className="font-mono text-sm font-bold text-white">
                      {getSymbolByCode(selectedWallet.currency)}{(selectedWallet.monthlyLimit ?? 300000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* TRANSACTIONS HISTORY TABLE LIST */}
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 hover:border-[#8a919f]/20 transition-all duration-300 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white leading-none">Global Ledger History</h2>
                  <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mt-1">Transaction audit logs</p>
                </div>

                {/* Filter / Search parameters toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Real-time search */}
                  <div className="flex items-center bg-[#0c121c] border border-white/5 hover:border-white/10 rounded-full px-3.5 py-1.5 transition-all focus-within:border-[#00E0C7] w-full sm:w-auto">
                    <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                    <input
                      type="text"
                      value={filters.query}
                      onChange={(e) => searchTransactions(e.target.value)}
                      placeholder="Search transfers..."
                      className="bg-transparent border-none outline-none text-white text-xs placeholder-gray-500 w-full sm:w-32 focus:ring-0 p-0"
                    />
                    {filters.query && (
                      <button onClick={() => searchTransactions('')} className="text-gray-500 hover:text-white ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center bg-[#0c121c] border border-white/5 hover:border-white/10 rounded-full px-3 py-1 text-xs text-gray-400 relative">
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ category: e.target.value })}
                      className="bg-transparent border-none outline-none text-white text-xs cursor-pointer focus:ring-0 p-0 pr-4 appearance-none leading-none font-mono uppercase tracking-wider"
                    >
                      <option value="All Categories" className="bg-[#131722] text-white">All Categories</option>
                      <option value="transfer" className="bg-[#131722] text-white">Transfers</option>
                      <option value="Income" className="bg-[#131722] text-white">Incomes</option>
                      <option value="Utilities" className="bg-[#131722] text-white">Utilities</option>
                      <option value="Dining" className="bg-[#131722] text-white">Dining</option>
                      <option value="Software" className="bg-[#131722] text-white">Software</option>
                      <option value="Travel" className="bg-[#131722] text-white">Travel</option>
                      <option value="Exchange" className="bg-[#131722] text-white">Exchanges</option>
                    </select>
                  </div>

                  {/* Timeframe Filter */}
                  <div className="flex items-center bg-[#0c121c] border border-white/5 hover:border-white/10 rounded-full px-3 py-1 text-xs text-gray-400 relative">
                    <select
                      value={filters.timeframe}
                      onChange={(e) => setFilters({ timeframe: e.target.value })}
                      className="bg-transparent border-none outline-none text-white text-xs cursor-pointer focus:ring-0 p-0 pr-4 appearance-none leading-none font-mono uppercase tracking-wider"
                    >
                      <option value="all_time" className="bg-[#131722]">All Time</option>
                      <option value="today" className="bg-[#131722]">Today</option>
                      <option value="this_week" className="bg-[#131722]">This Week</option>
                      <option value="this_month" className="bg-[#131722]">This Month</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Transaction list render */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse" aria-label="Transaction history">
                  <thead>
                    <tr className="bg-white/[0.01] border-b border-white/5 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Recipient / Sender</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Clearing Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-gray-400 font-mono">
                          No transactions found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => {
                        const isExp = tx.type === 'EXPENSE';
                        const isPend = tx.status === 'PENDING';
                        const isProc = tx.status === 'PROCESSING';
                        const isFail = tx.status === 'FAILED';
                        const sym = getSymbolByCode(tx.currency);

                        return (
                          <tr 
                            key={tx.id}
                            onClick={() => handleSelectTransaction(tx)}
                            className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                          >
                            {/* Counterparty avatar & description */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 text-[#00E0C7] flex items-center justify-center font-bold text-xs shrink-0">
                                  {tx.description.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white group-hover:text-[#00E0C7] transition-colors truncate max-w-[150px]">
                                    {tx.description}
                                  </p>
                                  <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                                    Ref: {tx.reference || tx.id.slice(-8)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category block */}
                            <td className="px-6 py-4">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-gray-400">
                                {tx.category}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                              {tx.date}
                            </td>

                            {/* Status label tag */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isFail ? 'bg-red-500' : isPend ? 'bg-amber-400 animate-pulse' : isProc ? 'bg-blue-400 animate-pulse' : 'bg-[#00E0C7]'
                                }`} aria-hidden="true" />
                                <span className={`text-[9px] font-mono font-bold uppercase ${
                                  isFail ? 'text-red-400' : isPend ? 'text-amber-400' : isProc ? 'text-blue-400' : 'text-[#00E0C7]'
                                }`}>
                                  {tx.status}
                                </span>
                              </div>
                            </td>

                            {/* Amount currency tag */}
                            <td className="px-6 py-4 text-right font-mono text-xs font-bold">
                              <span className={isExp ? 'text-white' : 'text-[#00E0C7]'}>
                                {isExp ? '-' : '+'}{sym}{tx.amount.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* RIGHT AREA: WIZARD & RECEIPT SYSTEM IN ACTION (col-span-4) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Direct Send Money Panel */}
            <section className="bg-gradient-to-tr from-[#131722]/80 to-[#192435]/50 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300 shadow-xl space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#00E0C7]" />
                  <span>Send Money Wizard</span>
                </h3>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mt-1">Direct internal FLOW clearings</p>
              </div>

              {/* Direct links contacts horizontal selector */}
              <div className="space-y-2">
                <p className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block">Quick Select Recipient</p>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none select-none">
                  {contacts.map((contact) => (
                    <div 
                      key={contact.id}
                      onClick={() => setTransferDetails({ recipient: contact.email })}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTransferDetails({ recipient: contact.email }) }}
                      role="button"
                      tabIndex={0}
                      className={`flex-shrink-0 flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#00E0C7] focus-visible:outline-none ${
                        transferFlow.recipient === contact.email
                          ? 'bg-[#00E0C7]/10 border-[#00E0C7]/40 font-bold'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <img className="w-6 h-6 rounded-full object-cover" src={contact.avatar} alt={contact.name} />
                      <div className="text-left text-[10px]">
                        <p className="text-white leading-none font-bold">{contact.name.split(' ')[0]}</p>
                        <p className="text-gray-400 text-[8px] leading-tight font-mono truncate max-w-[50px]">{contact.role.split(' ')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation backed Send form */}
              <form onSubmit={executePreFlightCheck} className="space-y-4 text-xs">
                
                {/* Recipient Input */}
                <div className="space-y-1.5">
                  <label htmlFor="transfer-recipient-input" className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block">Recipient email / phone</label>
                  <input
                    type="text"
                    required
                    value={transferFlow.recipient}
                    onChange={(e) => setTransferDetails({ recipient: e.target.value })}
                    placeholder="e.g. yassine@benjellouncorp.ma"
                    className="w-full bg-[#0c121c] py-3 px-4 border border-white/5 focus:border-[#00E0C7] hover:border-white/10 rounded-2xl text-white outline-none focus:ring-0 text-xs font-mono transition-colors"
                    id="transfer-recipient-input"
                  />
                </div>

                {/* Amount and select currency */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8 space-y-1.5">
                    <label htmlFor="transfer-amount-input" className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block">Amount</label>
                    <input
                      type="number"
                      required
                      value={transferFlow.amount}
                      onChange={(e) => setTransferDetails({ amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-[#0c121c] py-3 px-4 border border-white/5 focus:border-[#00E0C7] hover:border-white/10 rounded-2xl text-white outline-none text-xs font-mono transition-colors"
                      id="transfer-amount-input"
                    />
                  </div>
                  <div className="col-span-4 space-y-1.5">
                    <label htmlFor="transfer-currency-select" className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block">Currency</label>
                    <select
                      value={transferFlow.currency}
                      onChange={(e) => setTransferDetails({ currency: e.target.value })}
                      className="w-full bg-[#0c121c] py-3 px-2 border border-white/5 hover:border-white/10 rounded-2xl text-white outline-none text-xs font-mono transition-colors focus:border-[#00E0C7]"
                      id="transfer-currency-select"
                    >
                      <option value="MAD">MAD (DH)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                {/* Display pre-validation warnings or error messages */}
                {errorMessage && (
                  <div role="alert" className="p-3 bg-red-400/5 border border-red-500/25 rounded-2xl text-[10px] text-red-400 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Preflight button trigger */}
                <button
                  type="submit"
                  disabled={sendingMoney}
                  className="w-full py-3.5 bg-[#00E0C7] hover:bg-[#00E0C7]/90 text-black font-semibold uppercase font-mono text-[10px] tracking-widest rounded-2xl transition-all cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {sendingMoney ? 'Running compliance check...' : 'VERIFY & INITIATE CLEAR'}
                </button>
              </form>
            </section>

            {/* Global Compliance SEPA / Wires instructions card */}
            <section className="bg-[#182029]/60 rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Shield className="w-5 h-5 shrink-0" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest">Compliant SEPA Vault Router</h4>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Receive directly straight into your Moroccan Multi-Currency vault with your personal clearing IBAN below. Matches standard CGI Article regulations.
              </p>
              
              <div className="bg-[#0c121c] p-3 rounded-2xl border border-white/5 font-mono text-[9px] space-y-2 select-all hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center text-gray-500">
                  <span className="uppercase font-bold">SEPA IBAN</span> 
                  <span className="text-white font-semibold">FR76 1950 0084 1255 9400</span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span className="uppercase font-bold">SWIFT BIC</span> 
                  <span className="text-white font-semibold">FLOWFR2X</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* SUBTAB: P2P REQUESTS AND PEER EXCHANGE CENTER */}
      {activeSubTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="requests-zone">
          {/* Create a request form (lg:col-span-5) */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300">
              <span className="text-[9px] font-mono font-bold text-[#00E0C7] tracking-widest block mb-2 uppercase">Request Money</span>
              <h3 className="text-xl font-bold text-white mb-1">P2P Peer Request</h3>
              <p className="text-xs text-gray-400 mb-5">Instantly request funds from other registered FLOW platform users inside Morocco and MENA.</p>

              {p2pError && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{p2pError}</span>
                </div>
              )}

              {p2pOverlaySuccess && (
                <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{p2pOverlaySuccess}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setP2pError(null);
                setP2pOverlaySuccess(null);
                if (!p2pUser.trim() || !p2pAmount || Number(p2pAmount) <= 0) {
                  setP2pError("A target recipient identifiers and amount are required.");
                  return;
                }
                const res = await createRequest({
                  receiverIdentifier: p2pUser,
                  amount: Number(p2pAmount),
                  currency: p2pCurrency,
                  note: p2pNote || "FLOW split request"
                });
                if (res.success) {
                  setP2pOverlaySuccess(`Dispatched request for ${p2pCurrency} ${p2pAmount} to ${p2pUser}.`);
                  setP2pUser('');
                  setP2pAmount('');
                  setP2pNote('');
                } else {
                  setP2pError(res.error || "P2P request transmission refused.");
                }
              }} className="space-y-4">
                
                {/* Popular Moroccan Contacts suggestions */}
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block mb-2">Moroccan Users Quick Select</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      type="button"
                      onClick={() => setP2pUser("yassine@benjellouncorp.ma")}
                      className="p-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-[#00E0C7]/10 hover:border-[#00E0C7]/20 text-left transition-all group cursor-pointer"
                    >
                      <p className="text-[10px] text-white font-bold group-hover:text-[#00E0C7] truncate">Yassine B.</p>
                      <p className="text-[9px] text-gray-500 truncate">Casablanca</p>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setP2pUser("kenza@tazi.design")}
                      className="p-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-[#00E0C7]/10 hover:border-[#00E0C7]/20 text-left transition-all group cursor-pointer"
                    >
                      <p className="text-[10px] text-white font-bold group-hover:text-[#00E0C7] truncate">Kenza Tazi</p>
                      <p className="text-[9px] text-gray-500 truncate">Design Lead</p>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setP2pUser("soufiane@alami.co")}
                      className="p-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-[#00E0C7]/10 hover:border-[#00E0C7]/20 text-left transition-all group cursor-pointer"
                    >
                      <p className="text-[10px] text-white font-bold group-hover:text-[#00E0C7] truncate">Soufiane A.</p>
                      <p className="text-[9px] text-gray-500 truncate">Freelancer</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="p2p-recipient-input" className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Recipient identifier</label>
                  <input 
                    type="text" 
                    placeholder="E.g., kenza@tazi.design or phone"
                    value={p2pUser}
                    onChange={(e) => setP2pUser(e.target.value)}
                    className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none transition-all placeholder:text-gray-600 font-mono"
                    id="p2p-recipient-input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label htmlFor="p2p-amount-input" className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Request Amount</label>
                    <input 
                      type="number" 
                      placeholder="Amount" 
                      value={p2pAmount}
                      onChange={(e) => setP2pAmount(e.target.value)}
                      className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none transition-all font-mono"
                      id="p2p-amount-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="p2p-currency-select" className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Currency</label>
                    <select 
                      value={p2pCurrency}
                      onChange={(e) => setP2pCurrency(e.target.value)}
                      className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none transition-all font-mono"
                      id="p2p-currency-select"
                    >
                      <option value="MAD">MAD (DH)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="p2p-notes-input" className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Notes / Purpose</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Creative design consult bill"
                    value={p2pNote}
                    onChange={(e) => setP2pNote(e.target.value)}
                    className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none transition-all placeholder:text-gray-600"
                    id="p2p-notes-input"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loadingRequests}
                  className="w-full py-3.5 bg-gradient-to-r from-[#00E0C7] to-[#00b9a3] hover:from-[#00ffd2] hover:to-[#00ffd2] text-black font-extrabold text-[11px] font-mono uppercase tracking-wider rounded-xl transition-all hover:scale-100 flex items-center justify-center gap-2 cursor-pointer border-none shadow-lg shadow-[#00E0C7]/10 disabled:opacity-50"
                >
                  <HandCoins className="w-4 h-4" />
                  <span>{loadingRequests ? 'Syncing Ledger...' : 'Dispatch P2P Request'}</span>
                </button>
              </form>
            </section>
          </div>

          {/* Requests lists (col-span-7) */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            
            {/* INCOMING REQUESTS requiring approval */}
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300">
              <span className="text-[9px] font-mono font-bold text-[#FF8552] tracking-widest block mb-2 uppercase">Action Required</span>
              <h3 className="text-xl font-bold text-white mb-1">Incoming Requests received</h3>
              <p className="text-xs text-gray-400 mb-5">Unsettled money requests sent to you by partners or services.</p>

              {loadingRequests ? (
                <div className="py-8 text-center text-xs text-gray-500 animate-pulse">Synchronizing request pipelines...</div>
              ) : payRequests.filter(r => r.receiver_user_id === 'u-1').length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 border border-dashed border-white/5 rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-emerald-500/80 mx-auto mb-3" />
                  <p className="font-medium text-white">Your payment list is clean.</p>
                  <p className="text-[10px] text-gray-500 mt-1">No incoming peer requests on hold.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payRequests.filter(r => r.receiver_user_id === 'u-1').map((req) => {
                    const symb = getSymbolByCode(req.currency);
                    return (
                      <div key={req.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.04] transition-all">
                        <div className="space-y-1 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{req.requesterName || "Yassine B."}</span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                              req.status === 'PENDING' ? 'bg-amber-400/10 text-amber-400' :
                              req.status === 'PAID' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-500'
                            }`}>{req.status}</span>
                          </div>
                          <p className="text-xs text-gray-300 italic">“{req.note}”</p>
                          <p className="text-[9px] text-gray-500 font-mono">Dispatched: {new Date(req.created_at).toLocaleString()}</p>
                        </div>
                        
                        <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-center">
                          <div className="text-right font-mono">
                            <p className="text-sm font-extrabold text-[#00E0C7]">{symb}{req.amount.toLocaleString()}</p>
                            <span className="text-[9px] text-gray-500">Free internal processing</span>
                          </div>
                          
                          {req.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  const ans = await acceptRequest(req.id);
                                  if (ans.success) {
                                    fetchWallets();
                                    fetchTransactions();
                                    setP2pOverlaySuccess("Capital successfully paid. Central ledger sealed.");
                                  } else {
                                    setP2pError(ans.error || "Acceptance transfer rejected.");
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none"
                              >
                                Pay
                              </button>
                              <button
                                onClick={async () => {
                                  if(window.confirm("Are you sure you want to decline this request?")) {
                                    const ans = await declineRequest(req.id);
                                    if(ans.success) setP2pOverlaySuccess("Declined payment request.");
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer border border-red-500/20"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* OUTGOING REQUESTS sent by you */}
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300">
              <span className="text-[9px] font-mono font-bold text-gray-400 tracking-widest block mb-2 uppercase">Outbound ledger</span>
              <h3 className="text-xl font-bold text-white mb-1">Outgoing requests history</h3>
              <p className="text-xs text-gray-400 mb-5">Incoming transfers you have queried, tracking payment validations from clients.</p>

              {loadingRequests ? (
                <div className="py-8 text-center text-xs text-gray-500 animate-pulse">Syncing...</div>
              ) : payRequests.filter(r => r.requester_user_id === 'u-1').length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-600 font-mono">No outgoing requests dispatched.</p>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {payRequests.filter(r => r.requester_user_id === 'u-1').map((req) => {
                    const symb = getSymbolByCode(req.currency);
                    return (
                      <div key={req.id} className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/[0.02]">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>To: {req.receiverName || "Yassine B."}</span>
                            <span className={`text-[8px] tracking-widest font-mono uppercase px-1.5 py-0.5 rounded ${
                              req.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                              req.status === 'CANCELLED' ? 'bg-gray-500/10 text-gray-400' : 'bg-amber-500/10 text-amber-400 animate-pulse'
                            }`}>{req.status}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 truncate max-w-xs">{req.note}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold font-mono text-white">{symb}{req.amount}</span>
                          {req.status === 'PENDING' && (
                            <button
                              onClick={async () => {
                                const ans = await cancelRequest(req.id);
                                if (ans.success) setP2pOverlaySuccess("Cancelled request.");
                              }}
                              className="p-1 text-red-400 hover:text-red-300 font-mono text-[9px] uppercase font-bold cursor-pointer"
                              title="Delete requested node"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* SUBTAB: QR PAYMENTS AND INSTANT MERCHANT STORES CLEARING */}
      {activeSubTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="qr-zone">
          <div className="col-span-12 lg:col-span-5 space-y-6">
            
            {/* Left selector menu */}
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300">
              <span className="text-[9px] font-mono font-bold text-[#00E0C7] tracking-widest block mb-1 uppercase">Instant QR Service</span>
              <h3 className="text-xl font-bold text-white mb-4">QR Payment Engine</h3>
              
              <div className="grid grid-cols-2 gap-2 bg-white/[0.02] border border-white/5 p-1 rounded-xl mb-6">
                <button
                  onClick={() => { setQrActiveView('scan'); clearScanState(); }}
                  className={`py-2 px-3 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer border-none ${
                    qrActiveView === 'scan' ? 'bg-[#00E0C7]/15 text-[#00E0C7]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Scan Merchant QR
                </button>
                <button
                  onClick={() => { setQrActiveView('create'); clearScanState(); }}
                  className={`py-2 px-3 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer border-none ${
                    qrActiveView === 'create' ? 'bg-[#00E0C7]/15 text-[#00E0C7]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  My Collection QR
                </button>
              </div>

              {qrErrorMessage && (
                <div role="alert" className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{qrErrorMessage}</span>
                </div>
              )}

              {qrSuccessMessage && (
                <div role="alert" className="p-4 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{qrSuccessMessage}</span>
                </div>
              )}

              {qrActiveView === 'scan' ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400">Instantly checkout by pasting the encrypted FLOW pay token string, or choose a simulation template below to verify merchant ledgers.</p>
                  
                  {/* Demo targets */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block mb-2 tracking-widest">Simulation Templates (Morocco)</span>
                    <div className="space-y-2">
                      <button
                        onClick={() => setScanInputValue("flow:pay:u-2:qr_cabestan_9921_mad_1350")}
                        className="w-full text-left p-2.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-all font-mono text-xs flex justify-between cursor-pointer"
                      >
                        <span className="text-white font-bold">Le Cabestan Casablanca</span>
                        <span className="text-[#00E0C7]">1,350 MAD</span>
                      </button>
                      <button
                        onClick={() => setScanInputValue("flow:pay:u-4:qr_sbux_agdal_mad_45")}
                        className="w-full text-left p-2.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-all font-mono text-xs flex justify-between cursor-pointer"
                      >
                        <span className="text-white font-bold">Starbucks - Rabat Agdal</span>
                        <span className="text-[#00E0C7]">45 MAD</span>
                      </button>
                      <button
                        onClick={() => setScanInputValue("flow:pay:u-3:qr_freelance_consult_eur_250")}
                        className="w-full text-left p-2.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-all font-mono text-xs flex justify-between cursor-pointer"
                      >
                        <span className="text-white font-bold">Kenza Design Studio</span>
                        <span className="text-[#00E0C7]">250 EUR</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="scan-token-input" className="text-[10px] font-mono font-bold text-gray-400 tracking-widest uppercase block">Scanned Token Hash</label>
                    <input
                      type="text"
                      placeholder="Paste flow:pay:... token hash here"
                      value={scanInputValue}
                      onChange={(e) => setScanInputValue(e.target.value)}
                      className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none transition-all font-mono"
                      id="scan-token-input"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      setQrErrorMessage(null);
                      setQrSuccessMessage(null);
                      if (!scanInputValue.trim()) return;
                      const ans = await validateQR(scanInputValue);
                      if (!ans.success) setQrErrorMessage(ans.error || "Token signature verification failed.");
                    }}
                    disabled={loadingQR}
                    className="w-full py-3 bg-[#00E0C7] hover:bg-[#00cfa7] text-black font-extrabold text-[11px] font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {loadingQR ? "Verifying Keys..." : "Scan & Verify Payload"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400">Generate a secure payment request QR. Customers scanning this token can make instant off-ledger clearings to your wallet.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="qr-currency-select" className="text-[10px] font-mono font-bold text-gray-400 uppercase max-w-xs block mb-1">Currency</label>
                      <select
                        value={qrCurrencyInput}
                        onChange={(e) => setQrCurrencyInput(e.target.value)}
                        className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none transition-all font-mono"
                        id="qr-currency-select"
                      >
                        <option value="MAD">MAD (DH)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="qr-amount-input" className="text-[10px] font-mono font-bold text-gray-400 uppercase max-w-xs block mb-1">Set Amount</label>
                      <input
                        type="number"
                        placeholder="E.g., 20"
                        value={qrAmountInput}
                        onChange={(e) => setQrAmountInput(e.target.value)}
                        className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none transition-all font-mono"
                        id="qr-amount-input"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setQrErrorMessage(null);
                      setQrSuccessMessage(null);
                      if (!qrAmountInput) return;
                      const ans = await generateQR({
                        amount: Number(qrAmountInput),
                        currency: qrCurrencyInput
                      });
                      if (ans.success) setQrSuccessMessage("Dynamically generated client payout ticket.");
                    }}
                    className="w-full py-3 bg-[#00E0C7] hover:bg-[#00cfa7] text-black font-extrabold text-[11px] font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Generate Sealed QR
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className="col-span-12 lg:col-span-7">
            {/* Right Display area (displays scanned info or display QR) */}
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300 h-full flex flex-col justify-center min-h-[400px]">
              {qrActiveView === 'scan' ? (
                // SCANNED INFO REVIEW PANELS
                scannedQR ? (
                  <div className="space-y-6 max-w-md mx-auto w-full">
                    <div className="text-center">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 inline-block rounded-full mb-3">
                        <Shield className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold text-white leading-tight">Verified QR Payload</h4>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">SHA256 Cryptographic Signature: Verified</p>
                    </div>

                    <div className="bg-[#182029] p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between border-b border-white/5 pb-2.5">
                        <span className="text-[#00E0C7] font-mono text-[10px] uppercase">Merchant Credential</span>
                        <span className="text-xs text-white font-bold">{scannedQR.creatorName}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2.5">
                        <span className="text-[#00E0C7] font-mono text-[10px] uppercase">Clearing Amount</span>
                        <span className="text-sm text-white font-mono font-bold">{getSymbolByCode(scannedQR.currency)} {scannedQR.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2.5">
                        <span className="text-[#00E0C7] font-mono text-[10px] uppercase">Transaction Cost</span>
                        <span className="text-xs font-mono text-emerald-400">0.00 % (No surcharge)</span>
                      </div>
                      <div className="flex flex-col gap-1 pt-1">
                        <span className="text-gray-500 font-mono text-[9px] uppercase">Decryption Hash</span>
                        <span className="text-[10px] font-mono text-gray-400 break-all select-all bg-black/40 p-1.5 rounded-lg border border-white/5">{scannedQR.qr_token}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          setQrSuccessMessage(null);
                          setQrErrorMessage(null);
                          const currentSelectedWalletInStore = wallets.find(w => w.currency === scannedQR.currency) || wallets[0];
                          const ans = await payQR(scannedQR.qr_token, currentSelectedWalletInStore?.id);
                          if (ans.success) {
                            fetchWallets();
                            fetchTransactions();
                            setQrSuccessMessage(`Secured clearing complete! Transferred ${getSymbolByCode(scannedQR.currency)} ${scannedQR.amount} instantly.`);
                            setScanInputValue('');
                          } else {
                            setQrErrorMessage(ans.error || "Off-ledger clearing was declined by issuing node.");
                          }
                        }}
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none"
                      >
                        Confirm Secure Payout
                      </button>
                      <button
                        onClick={() => clearScanState()}
                        className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 max-w-sm mx-auto">
                    <div className="w-16 h-16 border-2 border-dashed border-[#00E0C7]/40 rounded-full flex items-center justify-center text-gray-500 mx-auto animate-pulse">
                      <QrCode className="w-8 h-8 text-[#00E0C7]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-md">Scanning Pipeline Standby</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">Choose a transaction blueprint simulation template or enter an active key on the left panel to trigger ledger checkout.</p>
                    </div>
                  </div>
                )
              ) : (
                // GENERATED QR REVIEW PANELS
                qrPayloadString ? (
                  <div className="text-center space-y-6 max-w-sm mx-auto">
                    <div>
                      <h4 className="text-lg font-extrabold text-white">Your Dynamic QR Token</h4>
                      <p className="text-xs text-gray-400 font-mono mt-1">Status: Active & Sealed</p>
                    </div>

                    {/* QR Mock graphic with custom bounding frame layout */}
                    <div className="relative p-6 bg-white inline-block rounded-3xl mx-auto shadow-2xl">
                      <div className="absolute inset-0 border-4 border-[#00E0C7] rounded-3xl animate-pulse pointer-events-none scale-100" />
                      <div className="w-44 h-44 bg-gradient-to-br from-[#10141d] to-black rounded-xl p-3 flex flex-col items-center justify-center flex-wrap shrink-0">
                        {/* High-tech tech vector code mimic */}
                        <div className="grid grid-cols-4 gap-2.5 w-full h-full max-w-[130px] max-h-[130px]" role="img" aria-label="Dynamic QR payment token">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} aria-hidden="true" className={`rounded ${
                              (i * 3 + 7) % 5 === 0 || i === 0 || i === 3 || i === 12 ? 'bg-[#00E0C7]' : 'bg-white/10'
                            }`} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#182029] p-4 rounded-xl border border-white/5 font-mono text-left max-w-xs mx-auto">
                      <span className="text-gray-500 text-[8px] uppercase font-bold block mb-1">Encoded Token payload</span>
                      <p className="text-[10px] text-[#00E0C7] break-all break-words shrink">{qrPayloadString}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-[#00E0C7] font-bold font-mono">Expiration countdown: 14 mins left</p>
                      <p className="text-[9px] text-gray-500 font-mono">FLOW dynamic nodes swap authorization keys every 15 minutes.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 max-w-xs mx-auto">
                    <QrCode className="w-12 h-12 text-gray-600 mx-auto" />
                    <h4 className="font-bold text-gray-400 text-sm">Sealed Token Offline</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Input collect amount and currency on the left form panel to mint digital tokens instantly.</p>
                  </div>
                )
              )}
            </section>
          </div>
        </div>
      )}

      {/* SUBTAB: COLLABORATIVE SPLIT BILLS PANEL */}
      {activeSubTab === 'splits' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="splits-zone">
          {/* Split check creation form (lg:col-span-5) */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300">
              <span className="text-[9px] font-mono font-bold text-[#00E0C7] tracking-widest block mb-1 uppercase text-left">Peer Distribution</span>
              <h3 className="text-xl font-bold text-white mb-1">Group Bill Splitting</h3>
              <p className="text-xs text-gray-400 mb-5">Distribute bills equally or with bespoke shares securely across a selected ring of contacts.</p>

              {splitErrorMessage && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{splitErrorMessage}</span>
                </div>
              )}

              {splitSuccessMessage && (
                <div className="p-4 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  <span>{splitSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setSplitErrorMessage(null);
                setSplitSuccessMessage(null);

                if (!splitTitleInput.trim() || !splitTotalInput) {
                  setSplitErrorMessage("Provide split title and total bill expense.");
                  return;
                }
                if (selectedParticipants.length === 0) {
                  setSplitErrorMessage("Must select at least one participant friend.");
                  return;
                }

                const result = await createSplitBill({
                  title: splitTitleInput,
                  totalAmount: Number(splitTotalInput),
                  currency: splitCurrencyInput,
                  participants: selectedParticipants.map(email => ({ userIdentifier: email }))
                });

                if (result.success) {
                  setSplitSuccessMessage(`Successfully shared split bill ledger: "${splitTitleInput}".`);
                  setSplitTitleInput('');
                  setSplitTotalInput('');
                  setSelectedParticipants([]);
                } else {
                  setSplitErrorMessage(result.error || "Check distribution failed.");
                }
              }} className="space-y-4">
                <div>
                  <label htmlFor="split-title-input" className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1.5">Split Bill Title</label>
                  <input
                    type="text"
                    placeholder="E.g., Casablanca Surf Dinner"
                    value={splitTitleInput}
                    onChange={(e) => setSplitTitleInput(e.target.value)}
                    className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none transition-all"
                    id="split-title-input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label htmlFor="split-total-input" className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1.5">Gross Bill Total</label>
                    <input
                      type="number"
                      placeholder="Total check amount"
                      value={splitTotalInput}
                      onChange={(e) => setSplitTotalInput(e.target.value)}
                      className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none font-mono"
                      id="split-total-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="split-currency-select" className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1.5">Cur</label>
                    <select
                      value={splitCurrencyInput}
                      onChange={(e) => setSplitCurrencyInput(e.target.value)}
                      className="w-full bg-[#182029]/80 border border-white/5 focus:border-[#00E0C7]/30 p-3 rounded-xl text-xs text-white outline-none font-mono"
                      id="split-currency-select"
                    >
                      <option value="MAD">MAD (DH)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                {/* Multiselect members checklist */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider block mb-2 uppercase select-none">Select peer partners ({selectedParticipants.length})</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {[
                      { id: 'u-2', name: 'Yassine Benjelloun', email: 'yassine@benjellouncorp.ma', avatar: 'YB' },
                      { id: 'u-3', name: 'Kenza Tazi', email: 'kenza@tazi.design', avatar: 'KT' },
                      { id: 'u-4', name: 'Soufiane Alami', email: 'soufiane@alami.co', avatar: 'SA' }
                    ].map(friend => {
                      const active = selectedParticipants.includes(friend.email);
                      return (
                        <div
                          key={friend.id}
                          onClick={() => {
                            if (active) {
                              setSelectedParticipants(selectedParticipants.filter(e => e !== friend.email));
                            } else {
                              setSelectedParticipants([...selectedParticipants, friend.email]);
                            }
                          }}
                          className={`p-2.5 border rounded-xl flex items-center justify-between cursor-pointer select-none transition-all ${
                            active 
                              ? 'bg-[#00E0C7]/10 border-[#00E0C7]/30 text-white' 
                              : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] text-gray-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-bold leading-none">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[9px] font-bold text-[#00E0C7]">
                              {friend.avatar}
                            </div>
                            <div>
                              <p className="text-xs transition-colors">{friend.name}</p>
                              <span className="text-[9px] font-mono text-gray-500 font-medium block mt-0.5">{friend.email}</span>
                            </div>
                          </div>
                          
                          <div className={`w-5 h-5 rounded border flex items-center justify-center font-bold text-[10px] ${
                            active ? 'bg-[#00E0C7] border-none text-black' : 'border-white/20 text-transparent'
                          }`}>
                            ✓
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time distribution previews */}
                {selectedParticipants.length > 0 && splitTotalInput && (
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl font-mono text-[10px] space-y-1">
                    <span className="text-gray-500 uppercase font-bold tracking-wider block">Real-time split Preview:</span>
                    <p className="text-gray-300">Each peer member contributes: {getSymbolByCode(splitCurrencyInput)} {(Number(splitTotalInput) / (selectedParticipants.length + 1)).toFixed(2)}</p>
                    <p className="text-[9px] text-[#00E0C7]">Includes your own equal share distribution.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingSplits}
                  className="w-full py-3.5 bg-gradient-to-r from-[#00E0C7] to-[#00b9a3] hover:from-[#00ffd2] hover:to-[#00ffd2] text-black font-extrabold text-[11px] font-mono uppercase tracking-wider rounded-xl transition-all hover:scale-100 flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-lg shadow-[#00E0C7]/15 disabled:opacity-50"
                >
                  <Users className="w-5 h-5" />
                  <span>{loadingSplits ? "Splitting Ledger..." : "Split Bill with Friends"}</span>
                </button>
              </form>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-6">
            
            {/* Active splits dashboards */}
            <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300">
              <span className="text-[9px] font-mono font-bold text-[#00E0C7] tracking-widest block mb-2 uppercase">Progress tracker</span>
              <h3 className="text-xl font-bold text-white mb-1">Active split boards</h3>
              <p className="text-xs text-gray-400 mb-5">Collaborative bill distributions created on the FLOW platform.</p>

              {loadingSplits ? (
                <div className="py-8 text-center text-xs text-gray-500 animate-pulse font-mono">Loading shared ledger boards...</div>
              ) : splitBills.length === 0 ? (
                <p className="py-12 text-center text-xs text-gray-600 font-mono border border-dashed border-white/5 rounded-2xl">No collaborative splits online.</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {splitBills.map(bill => {
                    const symb = getSymbolByCode(bill.currency);
                    
                    // Count participants progress
                    const totalSharesCount = bill.participants.length;
                    const paidSharesCount = bill.participants.filter(p => p.status === 'paid').length;
                    const progressPercent = Math.round((paidSharesCount / totalSharesCount) * 100);

                    // Find current user share status
                    const myShare = bill.participants.find(p => p.user_id === 'u-1');
                    const hasMySharePending = myShare && myShare.status === 'pending';

                    return (
                      <div key={bill.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3.5 hover:bg-white/[0.03] transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wide leading-tight">{bill.title}</h4>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <span>Created by: {bill.creatorName || "You"}</span>
                              <span>•</span>
                              <span>{new Date(bill.created_at).toLocaleDateString()}</span>
                            </p>
                          </div>
                          
                          <div className="text-right font-mono">
                            <p className="text-sm font-extrabold text-[#00E0C7]">{symb}{bill.total_amount.toLocaleString()}</p>
                            <span className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">Total Bill Expense</span>
                          </div>
                        </div>

                        {/* Progress Bar styled in luxury glassmorphism */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-gray-400 font-bold uppercase select-none">
                            <span>Ledger Progress</span>
                            <span>{progressPercent}% Complete ({paidSharesCount}/{totalSharesCount} cleared)</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#00E0C7] to-emerald-400 rounded-full transition-all duration-500" 
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* List of participant details checkmarks */}
                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.03]">
                          <span className="text-[8px] font-mono text-gray-500 uppercase font-bold block mb-1.5 leading-none">Status Breakdown</span>
                          <div className="flex flex-wrap gap-2">
                            {/* Creator */}
                            <div className="px-2.5 py-1 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1 font-mono uppercase">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              <span>{bill.creatorName ? `${bill.creatorName.split(' ')[0]} (Host)` : 'You (Host)'}</span>
                              <span className="text-[8px] text-emerald-500/80">paid</span>
                            </div>

                            {/* Uniquely populated friends */}
                            {bill.participants.map(part => (
                              <div
                                key={part.id}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1 font-mono uppercase ${
                                  part.status === 'paid' 
                                    ? 'bg-emerald-400/10 text-emerald-400' 
                                    : 'bg-amber-400/10 text-amber-400 animate-pulse'
                                }`}
                              >
                                <span className={`w-1 h-1 rounded-full ${part.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                <span className="truncate max-w-[100px]">{part.userName ? part.userName.split(' ')[0] : 'Contributor'}</span>
                                <span className="text-[8px]">{part.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quick pay triggers */}
                        {hasMySharePending && (
                          <div className="pt-1.5 flex justify-between items-center bg-white/[0.01] p-3 rounded-xl border border-white/5">
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-mono text-gray-500 uppercase font-bold">My distribution share is pending</p>
                              <p className="text-xs text-white font-mono font-bold">{symb}{myShare.amount_due.toFixed(2)} due</p>
                            </div>

                            <button
                              onClick={async () => {
                                setSplitErrorMessage(null);
                                setSplitSuccessMessage(null);
                                const currentSelectedWalletInStore = wallets.find(w => w.currency === bill.currency) || wallets[0];
                                const result = await paySplitShare(bill.id, currentSelectedWalletInStore?.id);
                                if (result.success) {
                                  fetchWallets();
                                  fetchTransactions();
                                  setSplitSuccessMessage(`Successfully paid your share of ${symb}${myShare.amount_due} for ${bill.title}.`);
                                } else {
                                  setSplitErrorMessage(result.error || "Failed to settle share.");
                                }
                              }}
                              className="px-4 py-2 bg-[#00E0C7] hover:bg-[#00cfa7] text-black font-extrabold text-[10px] font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none"
                            >
                              Settle Share
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* SUBTAB 2: INVOICES (LEGALLY IMMUTABLE VAT ZERO EXEMPTIONS COMPLIANCE SCREEN) */}
      {activeSubTab === 'invoices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="invoices-zone">
          <section className="lg:col-span-8 bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 sm:p-8 hover:border-white/10 transition-all duration-300 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white leading-none">Export Invoices Registry</h3>
                <p className="text-xs text-gray-400 mt-1 uppercase font-mono tracking-wider">CGI 92-I-22 Compliant 0% export VAT sheets</p>
              </div>
              <button
                onClick={() => setShowInvoiceCreator(true)}
                className="px-4 py-2 bg-[#00E0C7] hover:bg-[#00cfa7] text-black font-bold text-[10px] font-mono uppercase tracking-wider rounded-xl transition-all hover:scale-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Export Invoice</span>
              </button>
            </div>

            <div className="space-y-4">
              {invoices.map((inv) => {
                const total = inv.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
                const isPaid = inv.status === 'paid';
                return (
                  <div 
                    key={inv.id} 
                    className="p-5 rounded-2xl bg-[#182029]/30 hover:bg-[#182029]/50 border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-gray-400 group-hover:text-[#00E0C7] group-hover:bg-[#00E0C7]/5 transition-colors shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-[#00dfc6] transition-colors truncate">
                          {inv.clientName}
                        </h4>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex flex-wrap gap-x-2.5 gap-y-1">
                          <span>{inv.invoiceNumber}</span>
                          <span className="text-gray-600">·</span>
                          <span>Due: {inv.dueDate}</span>
                          <span className="text-gray-600">·</span>
                          <span className="text-emerald-400 font-bold uppercase font-mono">Export VAT exemption CGI 92-I-22</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t border-white/5 md:border-t-0 pt-3 md:pt-0">
                      <div className="text-left md:text-right font-mono">
                        <span className="text-[10px] text-gray-500 uppercase block">Total invoice</span>
                        <span className="text-sm font-bold text-white">
                          {getSymbolByCode(inv.currency)}{total.toLocaleString()}
                        </span>
                      </div>
                      
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider ${
                        isPaid 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                          : 'bg-amber-400/10 text-amber-400 border border-amber-400/15'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Business sidebars */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 hover:border-white/10 transition-all duration-300 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Briefcase className="w-5 h-5 shrink-0 text-[#7B5CFF]" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#7B5CFF]">Moroccan Exporter Guard</h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                By legal provision of **Article 92-I-22 from the Moroccan CGI Code**, software, engineering development, design, or remote consulting exported out of Morocco are assigned a **0% VAT exemption status**. Generated automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: IMMUTABLE GENERAL AUDIT SYSTEM RECORDS */}
      {activeSubTab === 'audits' && (
        <div className="grid grid-cols-1 gap-6 text-xs" id="audits-zone">
          <section className="bg-[#182029]/60 backdrop-blur-2xl rounded-3xl border border-[#8a919f]/10 p-6 sm:p-8 hover:border-white/10 transition-all duration-300 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                <span>Central Financial Compliance Audit Registry (Realtime)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 uppercase font-mono tracking-wider">PCI-DSS regulatory logging index</p>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse" aria-label="Compliance audit trail">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-5 py-3.5">Severity</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Event Action Method</th>
                    <th className="px-5 py-3.5">Event Details Record</th>
                    <th className="px-5 py-3.5">Access IP</th>
                    <th className="px-5 py-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {isLoadingAudits ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 font-mono">Pulling audit ledger lines...</td>
                    </tr>
                  ) : localAudits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 font-mono">No audits recorded in this session.</td>
                    </tr>
                  ) : (
                    localAudits.map((log) => {
                      const isHigh = log.severity === 'CRITICAL';
                      const isWarn = log.severity === 'WARNING';
                      return (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-5 py-4 shrink-0 font-bold select-none">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wide ${
                              isHigh ? 'bg-red-500/10 text-red-400' : isWarn ? 'bg-amber-400/10 text-amber-400' : 'bg-blue-400/10 text-blue-300'
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-[10px] uppercase text-gray-400">{log.category}</td>
                          <td className="px-5 py-4 font-semibold text-white font-mono">{log.action}</td>
                          <td className="px-5 py-4 text-gray-300 max-w-[320px] truncate" title={log.details}>{log.details}</td>
                          <td className="px-5 py-4 font-mono text-[10px] text-gray-500">{log.ipAddress}</td>
                          <td className="px-5 py-4 text-right text-gray-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ========================================== */}
      {/* Overlays and modals */}
      {/* ========================================== */}

      {/* 1. LIMIT ADJUSTER DIALOG */}
      {selectedWalletForLimits && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0c121c] border border-white/10 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl relative"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold font-mono text-[#00E0C7] uppercase tracking-wider">Adjust Ledger limits</h3>
              <button 
                onClick={() => setSelectedWalletForLimits(null)} 
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLimitChangeSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#00E0C7]" />
                <p className="text-[10px] text-gray-400 leading-normal">
                  You are adjusting compliance limit rules for the **{selectedWalletForLimits.currency}** account ledger. This action is registered to audit trials.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="daily-limit-input" className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block">Daily Clearing Limit ({selectedWalletForLimits.currency})</label>
                <input
                  type="number"
                  required
                  value={customDailyLimit}
                  onChange={(e) => setCustomDailyLimit(e.target.value)}
                  className="w-full bg-[#131722] py-3 px-4 border border-white/5 focus:border-[#00E0C7] rounded-xl text-white outline-none font-mono text-xs"
                  id="daily-limit-input"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="monthly-ceiling-input" className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block">Monthly Clearing Ceiling ({selectedWalletForLimits.currency})</label>
                <input
                  type="number"
                  required
                  value={customMonthlyLimit}
                  onChange={(e) => setCustomMonthlyLimit(e.target.value)}
                  className="w-full bg-[#131722] py-3 px-4 border border-white/5 focus:border-[#00E0C7] rounded-xl text-white outline-none font-mono text-xs"
                  id="monthly-ceiling-input"
                />
              </div>

              {limitsMessage && (
                <div className="p-2.5 bg-[#00E0C7]/10 border border-[#00E0C7]/30 text-[#00E0C7] rounded-xl text-center text-[10px] font-mono uppercase">
                  {limitsMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingLimits}
                className="w-full py-3.5 bg-[#00E0C7] text-black font-semibold font-mono text-[10px] tracking-widest uppercase rounded-2xl cursor-pointer"
              >
                {isUpdatingLimits ? 'Signing Policy Rule...' : 'SEAL COMPLIANCE POLICY'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. SEND MONEY CONFIRMATION & PREFLIGHT MODAL */}
      {confirmationState !== 'idle' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0c121c] border border-white/10 max-w-md w-full rounded-3xl p-6 space-y-5 shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-xs font-mono font-bold text-[#00E0C7] uppercase tracking-wider">
                {confirmationState === 'review' && '🔒 Compliance Review'}
                {confirmationState === 'confirming' && '⚡ Dispatching Clear...'}
                {confirmationState === 'success' && '✅ Transfer Settled'}
                {confirmationState === 'failure' && '❌ Clearing Rejected'}
              </h3>
              {confirmationState !== 'confirming' && (
                <button onClick={resetFlow} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* REVIEW STATE */}
            {confirmationState === 'review' && validationState && (
              <div className="space-y-4 text-xs select-none">
                
                {/* Warnings list if any */}
                {validationState.warnings.length > 0 && (
                  <div className="space-y-1.5">
                    {validationState.warnings.map((warn, i) => (
                      <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-400 rounded-2xl text-[10px] flex items-start gap-2 leading-relaxed">
                        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sender/Receiver summaries */}
                <div className="bg-[#131722] p-4 rounded-3xl border border-white/5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Destination</span>
                    <span className="text-white font-bold">{validationState.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Identifier</span>
                    <span className="text-gray-400 font-mono">{transferFlow.recipient}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                    <span className="text-gray-500">Clearing Amount</span>
                    <span className="text-[#00E0C7] font-mono font-bold text-sm">
                      {getSymbolByCode(transferFlow.currency)}{parseFloat(transferFlow.amount || '0').toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Clearing Fee</span>
                    <span className="font-mono text-emerald-400 underline">Free FLOW-to-FLOW</span>
                  </div>
                </div>

                {/* Validation submit or code verification trigger */}
                {!showPinScreen ? (
                  <button
                    onClick={() => setShowPinScreen(true)}
                    className="w-full py-3.5 bg-[#00E0C7] text-black font-semibold font-mono text-[10px] tracking-widest uppercase rounded-2xl cursor-pointer"
                  >
                    AUTHORIZE DISPATCH
                  </button>
                ) : (
                  <form onSubmit={handlePinSubmit} className="space-y-3">
                    <p className="text-gray-500 text-[10px] font-mono text-center">ENTER 4-DIGIT SECURITY COMPLIANCE PIN PIN: 1337</p>
                    <input
                      type="password"
                      required
                      value={verificationPin}
                      onChange={(e) => setVerificationPin(e.target.value)}
                      maxLength={4}
                      placeholder="••••"
                      className="w-24 mx-auto text-center tracking-[1em] font-mono text-xl py-2 bg-[#131722] border border-white/5 rounded-xl block focus:border-[#00E0C7] text-white"
                    />
                    {pinError && <p className="text-red-400 font-mono text-[9px] text-center">{pinError}</p>}
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#00E0C7] text-black font-bold font-mono text-[10px] tracking-widest uppercase rounded-2xl cursor-pointer"
                    >
                      CONFIRM TRANSIT
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* SENDING / PROCESS IN FLIGHT */}
            {confirmationState === 'confirming' && (
              <div className="py-8 text-center space-y-4">
                <RefreshCw className="w-10 h-10 text-[#00E0C7] animate-spin mx-auto" />
                <p className="text-xs text-gray-300 font-mono uppercase tracking-wider">Settling funds across central ledger desks...</p>
              </div>
            )}

            {/* SUCCESS INTERACTIVES */}
            {confirmationState === 'success' && successDetails && (
              <div className="py-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-[#00E0C7] flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-[#00E0C7]" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-white">Clearing Approved</p>
                  <p className="text-xs text-gray-400 font-mono">{successDetails.transactionReference}</p>
                </div>
                <div className="text-2xl font-bold text-white font-mono py-2">
                  {getSymbolByCode(successDetails.currency)}{parseInt(successDetails.amount).toLocaleString()}
                </div>
                <p className="text-[10px] text-gray-400 px-6 leading-relaxed">
                  Balances have been adjusted atomically. Receipt node added dynamically to safety compliance records.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const rootId = successDetails.transactionId;
                      resetFlow();
                      fetchReceipt(rootId);
                      setSelectedTx(transactions.find(t=>t.id === rootId) || null);
                    }}
                    className="flex-1 py-3 border border-white/5 hover:bg-white/5 rounded-xl text-white font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    View Official Receipt
                  </button>
                  <button
                    onClick={resetFlow}
                    className="flex-1 py-3 bg-white text-black font-semibold font-mono text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Close Portal
                  </button>
                </div>
              </div>
            )}

            {/* FAILURE */}
            {confirmationState === 'failure' && (
              <div className="py-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div role="alert">
                  <p className="text-sm font-bold text-white">Clearing Rejected</p>
                  <p className="text-xs text-red-400 font-mono mt-2 p-2 bg-red-500/5 border border-red-500/10 rounded-xl leading-normal">
                    {errorMessage}
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal px-4">
                  Account balances were rolled-back safely. No double spending or partial deductions occurred.
                </p>
                <button
                  onClick={resetFlow}
                  className="w-full py-3 bg-white text-black font-semibold font-mono text-[10px] tracking-wider uppercase rounded-2xl cursor-pointer"
                >
                  Return to Hub
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* 3. DETAILED TRANSACTION RECEIPT COMPLIANCE OVERLAY */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0c121c] border border-white/10 max-w-sm w-full rounded-3xl p-6 space-y-5 shadow-2xl relative select-none text-xs"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="font-mono text-[9px] uppercase font-bold text-[#00E0C7]">FLOW Official Clearing Receipt</span>
              <button 
                onClick={() => { setSelectedTx(null); clearReceipt(); }} 
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="space-y-4">
              {/* Branding and stamp */}
              <div className="text-center space-y-1">
                <h1 className="text-lg font-bold tracking-[0.15em] text-white font-mono uppercase">FLOW</h1>
                <p className="text-[8px] text-gray-500 uppercase font-mono tracking-wider">CASABLANCA Compliance Office</p>
              </div>

              {receipt ? (
                <div className="space-y-4">
                  {/* Amount Circle */}
                  <div className="p-4 bg-white/5 border border-white/5 rounded-3xl text-center space-y-1">
                    <span className="text-gray-400 text-[10px] uppercase font-mono tracking-wider">cleared holding amount</span>
                    <h2 className={`text-2xl font-bold font-mono ${
                      receipt.transaction.type === 'EXPENSE' ? 'text-white' : 'text-[#00E0C7]'
                    }`}>
                      {receipt.transaction.type === 'EXPENSE' ? '-' : '+'}{getSymbolByCode(receipt.transaction.currency)}{receipt.transaction.amount.toLocaleString()}
                    </h2>
                    <span className="inline-block px-2 py-0.5 bg-[#00E0C7]/10 text-[#00E0C7] border border-[#00E0C7]/15 rounded font-mono text-[8px] uppercase tracking-wide">
                      {receipt.transaction.status}
                    </span>
                  </div>

                  {/* Complete data grid */}
                  <div className="text-[10px] bg-[#131722] p-4 rounded-2xl border border-white/5 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500 uppercase font-mono">Reference</span>
                      <span className="text-white font-mono tracking-wider">{receipt.transaction.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 uppercase font-mono">Partner name</span>
                      <span className="text-white">{receipt.transaction.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 uppercase font-mono">Date</span>
                      <span className="text-white font-mono">{receipt.transaction.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 uppercase font-mono">Clearing Agent</span>
                      <span className="text-white text-right">{receipt.clearingAgent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 uppercase font-mono">License</span>
                      <span className="text-white text-right font-mono text-[9px]">{receipt.license}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                      <span className="text-gray-500 uppercase font-mono">Export Code status</span>
                      <span className="text-emerald-400 uppercase font-bold font-mono text-[8px]">Article 92 CGI Exempted</span>
                    </div>
                  </div>

                  <p className="text-[8px] text-gray-500 text-center leading-normal">
                    This document is legally binding, sealed electronically at {new Date(receipt.issuedAt).toLocaleDateString()}, and certified under PCI-DS compliance standards.
                  </p>

                  {/* Actions export/share placeholders */}
                  <div className="flex gap-2 text-center text-[10px]">
                    <button
                      onClick={() => toast.info('Official Ledger PDF stamp requested. Sending copy straight to anas@flow.io')}
                      className="flex-1 py-2.5 bg-white text-black font-semibold font-mono uppercase text-[9px] tracking-wider rounded-xl hover:scale-100 flex items-center justify-center gap-1 cursor-pointer border-none"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export PDF</span>
                    </button>
                    <button
                      onClick={() => toast.success('Secure URL dispatch token generated: share-link copied to clip.')}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold font-mono uppercase text-[9px] tracking-wider rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share stamp</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-[#00E0C7] animate-spin mx-auto" />
                  <p className="text-[10px] text-gray-500 font-mono">Retrieving secure receipt nodes...</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. DRAFT INVOICE CREATOR OVERLAY */}
      {showInvoiceCreator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0c121c] border border-white/10 max-w-sm w-full rounded-3xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#00E0C7]">Export Invoice Draft</h4>
              <button onClick={() => setShowInvoiceCreator(false)} className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer bg-transparent border-none">CLOSE</button>
            </div>

            <form className="space-y-4 text-xs" onSubmit={handleCreateInvoiceSubmit}>
              <div className="space-y-1">
                <label htmlFor="inv-client-input" className="text-gray-500 font-mono font-bold uppercase tracking-wider block">Enterprise Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AeroSpace EU"
                  value={invClient}
                  onChange={(e) => setInvClient(e.target.value)}
                  className="w-full bg-[#131722] py-2 px-3 border border-white/5 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                  id="inv-client-input"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="inv-email-input" className="text-gray-500 font-mono font-bold uppercase tracking-wider block">Client Billing Email</label>
                <input
                  type="email"
                  placeholder="e.g. billing@aerospace.io"
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                  className="w-full bg-[#131722] py-2 px-3 border border-white/5 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                  id="inv-email-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="inv-hours-input" className="text-gray-500 font-mono font-bold uppercase tracking-wider block">Hours Allocated</label>
                  <input
                    type="number"
                    placeholder="40"
                    value={invHours}
                    onChange={(e) => setInvHours(e.target.value)}
                    className="w-full bg-[#131722] py-2 px-3 border border-white/5 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                    id="inv-hours-input"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="inv-rate-input" className="text-gray-500 font-mono font-bold uppercase tracking-wider block">Hourly Rate (€)</label>
                  <input
                    type="number"
                    placeholder="45"
                    value={invRate}
                    onChange={(e) => setInvRate(e.target.value)}
                    className="w-full bg-[#131722] py-2 px-3 border border-white/5 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                    id="inv-rate-input"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="inv-currency-select" className="text-gray-500 font-mono font-bold uppercase tracking-wider block">Clearing Ledger Currency</label>
                <select
                  value={invCurrency}
                  onChange={(e) => setInvCurrency(e.target.value)}
                  className="w-full bg-[#131722] py-2 px-3 border border-white/5 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                  id="inv-currency-select"
                >
                  <option value="EUR">EURO (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="MAD">MAD (DH)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#00E0C7] text-black font-mono font-bold uppercase tracking-widest text-[11px] rounded-xl hover:scale-100 transition-transform mt-4 cursor-pointer"
              >
                GENERATE EXPORT LEDGER
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
