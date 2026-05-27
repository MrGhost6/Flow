import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet as WalletIcon,
  TrendingUp,
  CreditCard as CardIcon,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Zap,
  Globe,
  Settings,
  Shield,
  Sliders,
  Briefcase,
  FileText,
  Users,
  Bell,
  CheckCircle2,
  Lock,
  Compass,
  DollarSign,
  Plus,
  RefreshCw,
  X,
  PlusCircle,
  AlertCircle,
  Download,
  QrCode,
  Coffee,
  Plane,
  Tv,
  Dumbbell
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import SplashAndOnboarding from './components/SplashAndOnboarding';
import CardManager from './components/CardManager';
import PaymentHub from './components/PaymentHub';
import AnalyticsHub from './components/AnalyticsHub';
import SupervisorHubPanel from './components/SupervisorHubPanel';
import SecurityCenter from './components/SecurityCenter';
import AdminPanel from './components/AdminPanel';
import { UserProfile, Wallet, Transaction, Invoice, FlowCard, AIMessage } from './types';
import { apiFetch } from './utils/api';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab ] = useState<'home' | 'analytics' | 'cards' | 'pay' | 'hub' | 'security' | 'admin'>('home');
  const [financeSegment, setFinanceSegment] = useState<'personal' | 'business'>('personal');

  // Multiwc persistence
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<FlowCard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string; read: boolean }[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);

  // Sync state with in-memory Express backend
  const syncLiveState = async () => {
    try {
      // Fetch Wallets
      const wRes = await apiFetch('/api/wallets');
      if (wRes.ok) {
        const walletsData = await wRes.json();
        if (walletsData && walletsData.length > 0) {
          setWallets(walletsData);
        }
      }

      // Fetch Transactions
      const txRes = await apiFetch('/api/transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      }

      // Fetch Cards
      const cRes = await apiFetch('/api/cards');
      if (cRes.ok) {
        const cData = await cRes.json();
        setCards(cData);
      }

      // Fetch Compliance user status
      const userRes = await apiFetch('/api/users/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData && profile) {
          setProfile((p) => p ? { ...p, status: userData.status, securityScore: userData.securityScore } as any : p);
        }
      }
    } catch (err) {
      console.warn('Realtime API sync disabled, running on client-side state hooks.', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      syncLiveState();
      const interval = setInterval(syncLiveState, 6000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  // Analytics states matching uploaded design
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [reserves, setReserves] = useState([
    { id: 'res-1', name: 'Tokyo Trip', current: 4500, target: 6000, progress: 75, meta: 'On track for July', color: '#00dfc6', icon: 'plane' },
    { id: 'res-2', name: 'Emergency', current: 3000, target: 10000, progress: 30, meta: 'Reserve cushion standard', color: '#a5c8ff', icon: 'home' }
  ]);
  const [subscriptions, setSubscriptions] = useState([
    { id: 'sub-1', name: 'Spotify Premium', price: 10.99, info: '$10.99 / mo', icon: 'music', unused: false, canceled: false },
    { id: 'sub-2', name: 'Netflix 4K', price: 22.99, info: '$22.99 / mo', icon: 'tv', unused: true, canceled: false }
  ]);

  // Interactive dialog controls
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  // Form Inputs
  const [sendAmount, setSendAmount] = useState('');
  const [sendCurrency, setSendCurrency] = useState('MAD');
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendCategory, setSendCategory] = useState<'Travel' | 'Dining' | 'Software' | 'Utilities'>('Dining');
  
  const [exFrom, setExFrom] = useState('USD');
  const [exTo, setExTo] = useState('MAD');
  const [exAmount, setExAmount] = useState('');

  // Business Invoice creator state
  const [invoiceClient, setInvoiceClient] = useState('');
  const [invoiceEmail, setInvoiceEmail] = useState('');
  const [invoiceHours, setInvoiceHours] = useState('40');
  const [invoiceRate, setInvoiceRate] = useState('45'); // €45 per hour standard
  const [invoiceCurrency, setInvoiceCurrency] = useState('EUR');

  // Flow AI Assistant State
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiHistory, setAiHistory] = useState<AIMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Trigger setup defaults on onboarding complete
  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);

    // Dynamic wallets based on selected profile currency
    const primaryCode = newProfile.primaryCurrency;
    const initialWallets: Wallet[] = [
      { id: 'w-1', currency: 'USD', symbol: '$', balance: 4418 },
      { id: 'w-2', currency: 'EUR', symbol: '€', balance: 2400 },
      { id: 'w-3', currency: 'MAD', symbol: 'DH', balance: 28500 },
    ];

    // Rearrange primary selection to top
    const reordered = [
      ...initialWallets.filter((w) => w.currency === primaryCode),
      ...initialWallets.filter((w) => w.currency !== primaryCode),
    ];
    setWallets(reordered);

    // Initial default transactions tailored for MENA / Morocco
    setTransactions([
      { id: "tx-1", date: "2026-05-23", description: "Upwork Global Payment", category: "Income", amount: 1850, type: "income", currency: "USD" },
      { id: "tx-2", date: "2026-05-22", description: "Vercel Pro Suite", category: "Software", amount: 20, type: "expense", currency: "USD" },
      { id: "tx-3", date: "2026-05-18", description: "Cafe Le Jet d'Eau Casablanca", category: "Dining", amount: 120, type: "expense", currency: "MAD" },
      { id: "tx-4", date: "2026-05-16", description: "Figma Professional Annual", category: "Software", amount: 144, type: "expense", currency: "USD" },
      { id: "tx-5", date: "2026-05-15", description: "Sidi Ali Mineral Water", category: "Dining", amount: 25, type: "expense", currency: "MAD" },
      { id: "tx-6", date: "2026-05-10", description: "Moroccan Tax Authority (Auto)", category: "Utilities", amount: 3500, type: "expense", currency: "MAD" },
      { id: "tx-7", date: "2026-05-09", description: "Remote Dev Contract - Eur Wallet", category: "Income", amount: 2400, type: "income", currency: "EUR" },
      { id: "tx-8", date: "2026-05-05", description: "Air Arabia Flight Casablanca", category: "Travel", amount: 1100, type: "expense", currency: "MAD" }
    ]);

    // Initial Cards
    setCards([
      {
        id: 'card-default-black',
        cardholderName: newProfile.name,
        cardNumber: '4210 8820 4450 1192',
        expiry: '09/29',
        cvc: '***',
        cardType: 'virtual',
        limit: 8500,
        spent: 184,
        currency: 'USD',
        isFrozen: false,
        selectedTemplate: 'aurora',
      },
      {
        id: 'card-default-amber',
        cardholderName: newProfile.name,
        cardNumber: '4920 1205 7765 9934',
        expiry: '12/28',
        cvc: '***',
        cardType: 'physical',
        limit: 15000,
        spent: 3500,
        currency: 'MAD',
        isFrozen: false,
        selectedTemplate: 'obsidian',
      }
    ]);

    // Pre-made Compliant Invoices
    setInvoices([
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2026-004',
        clientName: 'AeroSpace EU',
        clientEmail: 'billing@aerospace.io',
        issueDate: '2026-05-12',
        dueDate: '2026-06-12',
        items: [
          { id: 'item-1', description: 'Intelligent Fluid UX Consulting Model', quantity: 38, rate: 65 }
        ],
        status: 'pending',
        currency: 'EUR',
        taxRate: 0, // 0% Export VAT under Article 92-I-22 typical of Moroccan freelancers
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-2026-003',
        clientName: 'Stripe MENA Hub',
        clientEmail: 'inflow@stripe.com',
        issueDate: '2026-05-01',
        dueDate: '2026-05-15',
        items: [
          { id: 'item-2', description: 'Financial Clearing Routing Integration', quantity: 1, rate: 5200 }
        ],
        status: 'paid',
        currency: 'USD',
        taxRate: 0,
      }
    ]);

    // Pre-made alerts
    setNotifications([
      { id: 'nt-1', text: `FLOW Smart Routing saved you 340 MAD in interbank spreads on your last USD transfer!`, time: '2h ago', read: false },
      { id: 'nt-2', text: `FLOW AI detected a €2,400 incoming payment from Europe. Tap to lock exchange rates.`, time: '4h ago', read: false },
      { id: 'nt-3', text: `Security center verification completed for ${newProfile.name}.`, time: '1d ago', read: true },
    ]);

    // Initial Welcome Message
    setAiHistory([
      {
        id: 'welcome',
        sender: 'ai',
        text: `### ⚡ FLOW AI Operating System Active\n\nGreetings, **${newProfile.name}**. I have finished analyzing your financial posture under the **${newProfile.userType}** profile. Below is your tailored micro-report:\n\n* **Primary Capital Vault**: ${primaryCode} Ledger initialized.\n* **Cross-Border Route**: Interbank spreads are lowered to **0.1%** across MAD-EUR-USD tunnels.\n* **Action Item**: Need to draft tax-compliant global invoices? Use the **FLOW Invoices Engine** to auto-generate export credit papers with 0% VAT tags.\n\nAsk me anything about currency limits, Moroccan tax optimization, smart virtual cards, or upcoming cash flows!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ["Explain tax on foreign income in Morocco", "How does interbank FX routing work?", "Suggest cash flow strategies"]
      }
    ]);
  };

  // Scroll simulation for AI chat box
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiHistory, isAiTyping]);

  // Total balance computed in primary currency or USD equivalent (Simple aggregate conversion for preview)
  const computeTotalInUSD = () => {
    let sum = 0;
    wallets.forEach((w) => {
      if (w.currency === 'USD') sum += w.balance;
      else if (w.currency === 'EUR') sum += w.balance * 1.09;
      else if (w.currency === 'MAD') sum += w.balance * 0.10; // 1 MAD is ~0.10 USD
    });
    return sum;
  };

  const computeTotalInMAD = () => {
    return computeTotalInUSD() * 10.05; // 1 USD is ~10.05 MAD
  };

  // Send Money execution handler
  const handleSendMoneySubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(sendAmount);
    if (!amountNum || amountNum <= 0) return;

    try {
      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: sendRecipient || 'Global Instant Transfer',
          amount: amountNum,
          currency: sendCurrency,
          category: sendCategory,
          description: `Internal Transfer to ${sendRecipient || 'Global Instant Transfer'}`
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        await syncLiveState();
        setIsSendOpen(false);
        setSendAmount('');
        setSendRecipient('');

        const trackingAlert = {
          id: `nt-${Date.now()}`,
          text: `Transferred ${sendCurrency} ${amountNum} to ${sendRecipient || 'Global'}. Secured atomic record posted.`,
          time: 'Just now',
          read: false,
        };
        setNotifications([trackingAlert, ...notifications]);
        return;
      } else {
        alert(data.message || 'Transfer validation failed.');
        return;
      }
    } catch (err) {
      console.warn("Backend API offline. Running local client emulation...", err);
    }

    // Deduct from wallet if covers balance (Fallback)
    let walletFound = false;
    const updatedWallets = wallets.map((w) => {
      if (w.currency === sendCurrency && w.balance >= amountNum) {
        walletFound = true;
        return { ...w, balance: w.balance - amountNum };
      }
      return w;
    });

    if (!walletFound) {
      alert(`Insufficient funds in ${sendCurrency} wallet.`);
      return;
    }

    setWallets(updatedWallets);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: sendRecipient || 'Global Instant Transfer',
      category: sendCategory,
      amount: amountNum,
      type: 'expense',
      currency: sendCurrency,
    };

    setTransactions([newTx, ...transactions]);
    setIsSendOpen(false);
    setSendAmount('');
    setSendRecipient('');

    // Trigger AI notification warning or response
    const trackingAlert = {
      id: `nt-${Date.now()}`,
      text: `Transferred ${newTx.currency} ${newTx.amount} to ${newTx.description}. Local balance updated.`,
      time: 'Just now',
      read: false,
    };
    setNotifications([trackingAlert, ...notifications]);
  };

  // FX Exchange execution handler
  const handleExchangeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(exAmount);
    if (!amt || amt <= 0) return;

    try {
      const response = await fetch('/api/wallets/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency: exFrom,
          toCurrency: exTo,
          amount: amt
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        await syncLiveState();
        setIsExchangeOpen(false);
        setExAmount('');

        const instantAlert = {
          id: `nt-${Date.now()}`,
          text: `Exchange Complete: Live converted ${exFrom} ${amt} to ${exTo} ${data.receivedAmount.toFixed(2)} with 0.1% spread!`,
          time: 'Just now',
          read: false,
        };
        setNotifications([instantAlert, ...notifications]);
        return;
      } else {
        alert(data.message || 'Exchange validation failed.');
        return;
      }
    } catch (err) {
      console.warn("Express exchange API offline. Running local calculations...", err);
    }

    // Rates relative to USD
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      MAD: 10.05,
    };

    // Deduct from exFrom
    let sourceOk = false;
    const updatedWallets = wallets.map((w) => {
      if (w.currency === exFrom && w.balance >= amt) {
        sourceOk = true;
        return { ...w, balance: w.balance - amt };
      }
      return w;
    });

    if (!sourceOk) {
      alert(`Insufficient balance in ${exFrom} wallet to exchange.`);
      return;
    }

    // Convert and credit to exTo
    const amountInUSD = amt / rates[exFrom];
    const convertedAmt = amountInUSD * rates[exTo];

    const finalWallets = updatedWallets.map((w) => {
      if (w.currency === exTo) {
        return { ...w, balance: Number((w.balance + convertedAmt).toFixed(2)) };
      }
      return w;
    });

    setWallets(finalWallets);

    // Record bidirectional exchange transactions
    const extId = Date.now();
    const txFrom: Transaction = {
      id: `tx-ex-1-${extId}`,
      date: new Date().toISOString().split('T')[0],
      description: `Exchanged to ${exTo}`,
      category: 'Exchange',
      amount: amt,
      type: 'expense',
      currency: exFrom,
    };

    const txTo: Transaction = {
      id: `tx-ex-2-${extId}`,
      date: new Date().toISOString().split('T')[0],
      description: `Exchanged from ${exFrom}`,
      category: 'Exchange',
      amount: Number(convertedAmt.toFixed(2)),
      type: 'income',
      currency: exTo,
    };

    setTransactions([txFrom, txTo, ...transactions]);
    setIsExchangeOpen(false);
    setExAmount('');

    // Instant AI suggestion update
    const instantAlert = {
      id: `nt-${Date.now()}`,
      text: `Exchange Complete: Converted ${exFrom} ${amt} to ${exTo} ${convertedAmt.toFixed(2)} at optimal interbank rate (0.1% markup).`,
      time: 'Just now',
      read: false,
    };
    setNotifications([instantAlert, ...notifications]);
  };

  // Handler to add custom reserve goals dynamically
  const handleAddReserve = () => {
    const name = prompt("Enter goal name (e.g. Dream Workspace):", "New Reserve");
    if (!name) return;
    const targetVal = prompt("Enter target amount ($):", "2,000");
    if (!targetVal) return;
    const target = parseFloat(targetVal.replace(/[^0-9.]/g, "")) || 2000;
    
    const currentVal = prompt("Enter starting saved amount ($):", "200");
    const current = parseFloat(currentVal ? currentVal.replace(/[^0-9.]/g, "") : "0") || 0;
    
    const progress = Math.min(100, Math.round((current / target) * 100));
    const newRes = {
      id: `res-${Date.now()}`,
      name,
      current,
      target,
      progress,
      meta: "Custom goal started",
      color: reserves.length % 2 === 0 ? "#1E90FF" : "#00E0C7"
    };
    setReserves([...reserves, newRes]);
    
    const goalAlert = {
      id: `nt-${Date.now()}`,
      text: `Added new reserve target: "${name}" with target amount of $${target.toLocaleString()}.`,
      time: "Just now",
      read: false,
    };
    setNotifications([goalAlert, ...notifications]);
  };

  // Business invoice creator handler
  const handleCreateInvoice = (e: FormEvent) => {
    e.preventDefault();
    const hours = parseInt(invoiceHours) || 0;
    const rate = parseFloat(invoiceRate) || 0;
    if (!invoiceClient || hours <= 0 || rate <= 0) return;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-00${invoices.length + 5}`,
      clientName: invoiceClient,
      clientEmail: invoiceEmail || 'finance@client.com',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      items: [
        { id: `item-${Date.now()}`, description: 'Software Development & UX Consulting Services', quantity: hours, rate: rate }
      ],
      status: 'pending',
      currency: invoiceCurrency,
      taxRate: 0, // Moroccan tax export CGI exempt typically
    };

    setInvoices([newInvoice, ...invoices]);
    setIsNewInvoiceOpen(false);
    setInvoiceClient('');
    setInvoiceEmail('');

    // Dispatch system notification
    setNotifications([
      {
        id: `nt-${Date.now()}`,
        text: `Export Invoice ${newInvoice.invoiceNumber} successfully compiled & sent to ${newInvoice.clientName}. Tax exemption headers attached!`,
        time: 'Just now',
        read: false
      },
      ...notifications
    ]);
  };

  // AI Assistant Query Handler (Full-stack route API proxy)
  const handleSendAiMessage = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || userInput;
    if (!textToSend.trim()) return;

    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiHistory((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          userProfile: profile,
          transactions: transactions
        }),
      });

      const data = await response.json();

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: textToSend.toLowerCase().includes("invoice") 
          ? ["Create custom compliant invoice", "Guide me on entrepreneur limits"]
          : ["Show weekly metrics", "Analyze conversion rates", "Explore smart FX"]
      };

      setAiHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### ⚠️ Connection Offline\n\nI was unable to secure an encrypted tunnel with the remote FLOW AI Core module. Please try again in secondary mode.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiHistory((prev) => [...prev, errMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Recharts Premium Data (tailored neon visualizer mapping transaction history sums)
  const dailyChartData = [
    { day: 'Mon', inflow: 1200, outflow: 400 },
    { day: 'Tue', inflow: 900, outflow: 300 },
    { day: 'Wed', inflow: 2200, outflow: 850 },
    { day: 'Thu', inflow: 1400, outflow: 600 },
    { day: 'Fri', inflow: 3800, outflow: 410 },
    { day: 'Sat', inflow: 200, outflow: 1100 },
    { day: 'Sun', inflow: 400, outflow: 1500 },
  ];

  // Render Splash & Onboarding if Profile parameters have not been set
  if (!profile) {
    return <SplashAndOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#080D14] text-white font-sans overflow-x-hidden relative flex flex-col justify-between selection:bg-[#7B5CFF]/30">
      {/* Premium background gradient halos */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1E90FF] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#7B5CFF] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Initial loading skeleton */}
      {initialLoading && (
        <div className="fixed inset-0 z-50 bg-[#080D14] flex items-center justify-center">
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 animate-pulse" />
            <div className="h-4 w-48 mx-auto bg-white/5 rounded-full animate-pulse" />
            <div className="h-3 w-32 mx-auto bg-white/5 rounded-full animate-pulse" />
            <div className="flex gap-3 justify-center mt-8">
              <div className="h-24 w-24 bg-white/5 rounded-3xl animate-pulse" />
              <div className="h-24 w-24 bg-white/5 rounded-3xl animate-pulse" />
              <div className="h-24 w-24 bg-white/5 rounded-3xl animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* SideNavBar (Desktop Only) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 z-50 flex-col py-6 bg-[#0c121c]/90 backdrop-blur-2xl border-r border-white/5 shadow-2xl">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E90FF] to-[#7B5CFF] p-[1.5px] shrink-0">
            <div className="w-full h-full bg-[#131722] rounded-full flex items-center justify-center font-mono text-xs text-white font-bold uppercase select-none">
              {profile ? profile.name.charAt(0) : '?'}
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-tight leading-none truncate max-w-[140px]">{profile ? profile.name : 'User'}</h2>
            <p className="text-[9px] text-gray-400 font-mono tracking-wider mt-1 uppercase select-none">Flow Premium</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5">
          <button
            onClick={() => setActiveTab('hub')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
              activeTab === 'hub'
                ? 'bg-gradient-to-r from-[#1E90FF]/15 to-transparent text-[#00E0C7] border-l-4 border-[#00E0C7] font-semibold'
                : 'text-gray-400 hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            <Compass className="w-4.5 h-4.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-[#1E90FF]/15 to-transparent text-[#00E0C7] border-l-4 border-[#00E0C7] font-semibold'
                : 'text-gray-400 hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011-1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" style={{ fill: 'currentColor' }} />
            </svg>
            <span className="text-[11px] font-bold uppercase tracking-wider">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-[#1E90FF]/15 to-transparent text-[#00E0C7] border-l-4 border-[#00E0C7] font-semibold'
                : 'text-gray-400 hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            <TrendingUp className="w-4.5 h-4.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('pay')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
              activeTab === 'pay'
                ? 'bg-gradient-to-r from-[#1E90FF]/15 to-transparent text-[#00E0C7] border-l-4 border-[#00E0C7] font-semibold'
                : 'text-gray-400 hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Payments</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
              activeTab === 'cards'
                ? 'bg-gradient-to-r from-[#1E90FF]/15 to-transparent text-[#00E0C7] border-l-4 border-[#00E0C7] font-semibold'
                : 'text-gray-400 hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            <CardIcon className="w-4.5 h-4.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Cards</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-[#1E90FF]/15 to-transparent text-[#00E0C7] border-l-4 border-[#00E0C7] font-semibold'
                : 'text-gray-400 hover:bg-white/[0.02] hover:text-white'
            }`}
            id="nav-security"
          >
            <Shield className="w-4.5 h-4.5 text-rose-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">Security</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-red-500/15 to-transparent text-[#00E0C7] border-l-4 border-red-500 font-semibold'
                : 'text-gray-400 hover:bg-white/[0.02] hover:text-white'
            }`}
            id="nav-admin"
          >
            <Sliders className="w-4.5 h-4.5 text-red-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">Operations</span>
          </button>
        </nav>

        <div className="px-4 mt-auto space-y-4">
          <button
            onClick={() => setIsSendOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all flex justify-center items-center gap-1.5 shadow-[0_4px_15px_rgba(30,144,255,0.25)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Funds</span>
          </button>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('hub')}
              className="w-full flex items-center gap-3.5 text-gray-400 px-4 py-2.5 hover:text-white transition-colors text-left font-sans text-xs"
            >
              <Settings className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Settings</span>
            </button>
            <button
              onClick={() => setAiChatOpen(true)}
              className="w-full flex items-center gap-3.5 text-gray-400 px-4 py-2.5 hover:text-[#00E0C7] transition-colors text-left font-sans text-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Support</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content shell with desktop sidebar offsets */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">

      {/* FIXED FLOATING GLASS BUTTON FOR FLOW AI ASSISTANT */}
      <div className="fixed bottom-28 right-6 z-40">
        <button
          onClick={() => setAiChatOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1E90FF] to-[#7B5CFF] flex items-center justify-center text-white shadow-[0_4px_24px_rgba(123,92,255,0.4)] hover:scale-110 active:scale-95 transition-transform"
          id="btn-trigger-floating-ai"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </button>
      </div>

      {/* FLOATING CHAT SIDE PANEL */}
      <AnimatePresence>
        {aiChatOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-full bg-[#0c121c] border-l border-white/10 flex flex-col justify-between shadow-2xl relative"
              id="ai-assistant-drawer"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-white/[0.05] flex justify-between items-center bg-[#131722]/60 backdrop-blur-md">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-[#00E0C7]/10 border border-[#00E0C7]/20">
                    <Sparkles className="w-5 h-5 text-[#00E0C7] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono text-gray-400 leading-none">AI CORE MODULE</h3>
                    <h2 className="text-sm font-bold text-white tracking-wide">FLOW Intelligence Suite</h2>
                  </div>
                </div>
                <button
                  onClick={() => setAiChatOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Scroll History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm selection:bg-cyan-500/20">
                {aiHistory.map((m) => {
                  const isAi = m.sender === 'ai';
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 border text-[13px] leading-relaxed select-text ${
                          isAi
                            ? 'bg-[#131722] border-white/[0.05] text-gray-200'
                            : 'bg-[#7B5CFF] border-[#7b5cff]/30 text-white shadow-lg'
                        }`}
                      >
                        {/* Rendering Markdown headers smoothly */}
                        <div className="whitespace-pre-wrap">
                          {m.text.split('\n').map((line, idx) => {
                            if (line.startsWith('###')) {
                              return <h4 key={idx} className="font-bold text-sm text-white mt-2 mb-1 border-b border-white/5 pb-1">{line.replace('###', '')}</h4>;
                            }
                            if (line.startsWith('*')) {
                              return <p key={idx} className="text-gray-300 ml-2 py-0.5">{line}</p>;
                            }
                            return <p key={idx} className="mb-1">{line}</p>;
                          })}
                        </div>
                        <span className="block text-[9px] text-white/30 text-right mt-2 font-mono">{m.timestamp}</span>

                        {isAi && m.suggestions && (
                          <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-1.5">
                            {m.suggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => handleSendAiMessage(s)}
                                className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-gray-300 hover:text-white hover:border-[#00e0c7] transition-all"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#131722] border border-white/[0.05] rounded-2xl p-4 max-w-[85%] text-xs text-gray-400 flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-[#00E0C7] rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[#7B5CFF] rounded-full animate-bounce delay-150" />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300" />
                      <span className="font-mono text-[10px] uppercase ml-1">Evaluating live parameters...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Send Input */}
              <div className="p-3 border-t border-white/[0.05] bg-[#0c121c]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about exchange spreads, invoices..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                    className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7b5cff]"
                  />
                  <button
                    onClick={() => handleSendAiMessage()}
                    className="p-2.5 rounded-xl bg-[#00E0C7] text-black hover:brightness-110 active:scale-95 transition-transform"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRE-MAIN SCREEN SYSTEM NOTIFICATION POP BAR */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-3 z-30">
        <AnimatePresence>
          {notifications.filter((n) => !n.read).map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-1 p-3.5 bg-gradient-to-r from-[#131722]/80 to-[#7b5cff]/10 border border-[#7b5cff]/20 rounded-xl flex items-center justify-between backdrop-blur-md relative"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1 rounded-full bg-[#00e0c7]/10 border border-[#00e0c7]/20">
                  <AlertCircle className="w-4 h-4 text-[#00e0c7]" />
                </div>
                <p className="text-xs text-gray-200 select-all">{n.text}</p>
              </div>
              <button
                onClick={() => {
                  setNotifications(notifications.map((not) => not.id === n.id ? { ...not, read: true } : not));
                }}
                className="text-[10px] text-gray-400 hover:text-white uppercase font-mono tracking-widest pl-4 shrink-0"
              >
                Dismiss
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CORE TOP HEADER (Matches Elegant Dark Design EXACTLY) */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 md:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-30" id="platform-global-header">
        <div className="flex items-center gap-2">
          {/* Animated Wave F Logo */}
          <div className="w-10 h-10 bg-gradient-to-tr from-[#1E90FF] to-[#7B5CFF] rounded-xl flex items-center justify-center shadow-lg shadow-[#1e90ff]/10">
            <svg className="w-6 h-6 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M30 25C30 25 55 25 65 35C75 45 65 55 50 55C35 55 25 65 35 75C45 85 70 85 70 85"
                stroke="white"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tighter">FLOW</span>
            <span className="text-[9px] font-mono tracking-widest text-[#00E0C7] block uppercase">Financial OS</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Consumer Layer vs Business Layer Switch */}
          <div className="flex bg-[#131722] border border-white/5 rounded-full p-1.5 gap-2 text-xs font-medium">
            <button
              onClick={() => setFinanceSegment('personal')}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                financeSegment === 'personal'
                  ? 'bg-white/10 text-[#00E0C7] font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
              id="btn-switch-personal"
            >
              Consumer
            </button>
            <button
              onClick={() => setFinanceSegment('business')}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                financeSegment === 'business'
                  ? 'bg-white/10 text-[#7B5CFF] font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
              id="btn-switch-business"
            >
              Enterprise
            </button>
          </div>

          {/* Connected User Profile Indicator */}
          <div className="flex items-center space-x-2">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-white uppercase tracking-wider block font-medium leading-none">{profile.name}</span>
              <span className="text-[9px] text-[#00e0c7] uppercase font-mono block tracking-wider mt-0.5">{profile.userType}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 p-[1px]">
              <div className="w-full h-full rounded-full bg-[#131722] flex items-center justify-center uppercase font-mono text-sm text-white font-bold">
                {profile.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN SCREEN GRID SECTION */}
      <main className="w-full max-w-7xl mx-auto px-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 py-2 pb-36">
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <>
            {/* DESKTOP VIEW */}
            <div className="hidden md:grid lg:col-span-12 grid-cols-1 xl:grid-cols-12 gap-8 w-full animate-fade-in pb-12" id="home-view-tab">
            
            {/* Left Column (Canvas) - occupies 8 cols on xl screens */}
            <div className="xl:col-span-8 flex flex-col gap-6 w-full">
              
              {/* Hero / Total Balance Card */}
              <section className="bg-[#131722]/80 backdrop-blur-2xl ring-1 ring-white/5 shadow-2xl rounded-[32px] p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-[#1E90FF]/10 to-[#7B5CFF]/10 border border-white/5">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#1E90FF]/25 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#7B5CFF]/15 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-mono mb-2">Total Fluid Balance</p>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white select-all">
                      {computeTotalInMAD().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-[#00E0C7] text-xl font-mono ml-2">MAD</span>
                    </h1>
                    <p className="text-[#00E0C7] text-xs font-mono mt-4 flex items-center gap-1.5 animate-pulse">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+2.4% this week (optimal reserves)</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsExchangeOpen(true)}
                      className="bg-white/5 hover:bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-white text-xs font-bold font-mono tracking-wider uppercase border border-white/10 transition-all flex items-center gap-2 active:scale-98"
                    >
                      <RefreshCw className="w-4 h-4 text-[#00E0C7]" />
                      <span>Exchange</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Assets Section */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono mb-4">Assets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* MAD Card */}
                  <div className="bg-[#131722]/80 backdrop-blur-2xl rounded-[24px] border border-white/5 p-6 relative overflow-hidden group hover:scale-[1.02] hover:border-white/10 transition-all duration-300 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00E0C7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-center mb-6">
                      <span className="px-2.5 py-1 bg-[#1E90FF]/15 text-[#1E90FF] border border-[#1E90FF]/10 text-[9px] font-mono rounded-full font-bold uppercase tracking-wider">
                        MAD
                      </span>
                      <span className="text-gray-400 font-mono text-[9px] uppercase tracking-wider">Primary</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                      DH {(wallets.find(w => w.currency === 'MAD')?.balance || 35200).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-400 text-[10px] font-mono mt-1 uppercase tracking-widest">Moroccan Dirham</p>
                  </div>

                  {/* EUR Card */}
                  <div className="bg-[#131722]/80 backdrop-blur-2xl rounded-[24px] border border-white/5 p-6 relative group overflow-hidden hover:scale-[1.02] hover:border-white/10 transition-all duration-300 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7B5CFF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-center mb-6">
                      <span className="px-2.5 py-1 bg-[#7B5CFF]/15 text-[#7B5CFF] border border-[#7B5CFF]/10 text-[9px] font-mono rounded-full font-bold uppercase tracking-wider">
                        EUR
                      </span>
                      <span className="text-[8px] font-mono font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded uppercase">Inbound</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                      € {(wallets.find(w => w.currency === 'EUR')?.balance || 450).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-400 text-[10px] font-mono mt-1 uppercase tracking-widest">
                      ~ {((wallets.find(w => w.currency === 'EUR')?.balance || 450) * 10.92).toLocaleString('en-US', { maximumFractionDigits: 0 })} MAD eq
                    </p>
                  </div>

                  {/* USD Card */}
                  <div className="bg-[#131722]/80 backdrop-blur-2xl rounded-[24px] border border-white/5 p-6 relative group overflow-hidden hover:scale-[1.02] hover:border-white/10 transition-all duration-300 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1E90FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-center mb-6">
                      <span className="px-2.5 py-1 bg-[#1E90FF]/15 text-white border border-[#1E90FF]/10 text-[9px] font-mono rounded-full font-bold uppercase tracking-wider">
                        USD
                      </span>
                      <span className="text-[8px] font-mono font-semibold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded uppercase">Global</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                      $ {(wallets.find(w => w.currency === 'USD')?.balance || 240.5).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-400 text-[10px] font-mono mt-1 uppercase tracking-widest">
                      ~ {((wallets.find(w => w.currency === 'USD')?.balance || 240.5) * 10.05).toLocaleString('en-US', { maximumFractionDigits: 0 })} MAD eq
                    </p>
                  </div>
                </div>
              </section>

              {/* Chart Section */}
              <section className="bg-[#131722]/80 backdrop-blur-2xl rounded-[32px] border border-white/5 p-6 min-h-[320px] flex flex-col justify-between shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Flow History</h3>
                    <p className="text-[10px] text-gray-500 font-mono">Interbank liquidity trend in Moroccan Dirhams (MAD)</p>
                  </div>
                  <div className="flex gap-1.5 bg-white/5 rounded-xl p-1 border border-white/5 select-none animate-fade-in">
                    <button className="px-3 py-1.5 rounded-lg bg-[#1E90FF] text-white text-[10px] font-bold font-mono transition-all">1W</button>
                    <button className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white text-[10px] font-bold font-mono transition-all">1M</button>
                    <button className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white text-[10px] font-bold font-mono transition-all">3M</button>
                  </div>
                </div>
                
                {/* Embedded dynamic liquid chart matches screenshot styling */}
                <div className="h-48 w-full" id="history-chart-canvas">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#1E90FF" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#1E90FF" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00E0C7" />
                          <stop offset="50%" stopColor="#1E90FF" />
                          <stop offset="100%" stopColor="#7B5CFF" />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.15)" fontSize={10} fontFamily="monospace" />
                      <YAxis stroke="rgba(255,255,255,0.15)" fontSize={10} fontFamily="monospace" />
                      <Tooltip contentStyle={{ backgroundColor: '#0c121c', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', fontSize: 11, fontFamily: 'monospace' }} />
                      <Area type="monotone" dataKey="inflow" stroke="url(#lineGradient)" strokeWidth={3} fillOpacity={1} fill="url(#chartGradient)" name="Liquidity (MAD)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

            </div>

            {/* Right Column (Contextual & Actions) - occupies 4 cols on xl screens */}
            <aside className="xl:col-span-4 flex flex-col gap-6 w-full">
              
              {/* Quick Actions Bento Grid */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsSendOpen(true)}
                  className="bg-[#131722]/80 backdrop-blur-2xl p-6 rounded-[24px] border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] hover:scale-[1.02] hover:border-white/10 active:scale-98 transition-all group shadow-xl"
                  id="bento-action-send"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#1E90FF]/25 swap_icons transition-all shadow-[0_0_15px_rgba(30,144,255,0.1)]">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-white">Send</span>
                </button>

                <button
                  onClick={() => {
                    // Open billing details / receive simulation
                    const alertState = {
                      id: `nt-${Date.now()}`,
                      text: `Billing Information copied to clipboard. Account standard IBAN loaded.`,
                      time: 'Just now',
                      read: false,
                    };
                    setNotifications([alertState, ...notifications]);
                    alert("Receive Account: Flow clearing bank standard IBAN has been loaded to clipboard.");
                  }}
                  className="bg-[#131722]/80 backdrop-blur-2xl p-6 rounded-[24px] border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] hover:scale-[1.02] hover:border-white/10 active:scale-98 transition-all group shadow-xl"
                  id="bento-action-receive"
                >
                  <div className="w-12 h-12 rounded-full bg-[#00E0C7]/10 text-[#00E0C7] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#00E0C7]/25 transition-all shadow-[0_0_15px_rgba(0,224,199,0.1)]">
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-white">Receive</span>
                </button>

                <button
                  onClick={() => setIsExchangeOpen(true)}
                  className="bg-[#131722]/80 backdrop-blur-2xl p-6 rounded-[24px] border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] hover:scale-[1.02] hover:border-white/10 active:scale-98 transition-all group shadow-xl"
                  id="bento-action-swap"
                >
                  <div className="w-12 h-12 rounded-full bg-[#7B5CFF]/10 text-[#7B5CFF] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#7B5CFF]/25 transition-all shadow-[0_0_15px_rgba(123,92,255,0.1)]">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-white">Swap</span>
                </button>

                <button
                  onClick={() => {
                    const reqAmt = prompt("Enter requested billing amount (MAD):", "2,500");
                    if (reqAmt) {
                      const instantAlert = {
                        id: `nt-${Date.now()}`,
                        text: `Request QR Code Generated for ${reqAmt} MAD. Link copied to client workflow.`,
                        time: 'Just now',
                        read: false,
                      };
                      setNotifications([instantAlert, ...notifications]);
                      alert(`Billing invoice link created for ${reqAmt} MAD! Link sent to client.`);
                    }
                  }}
                  className="bg-[#131722]/80 backdrop-blur-2xl p-6 rounded-[24px] border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.04] hover:scale-[1.02] hover:border-white/10 active:scale-98 transition-all group shadow-xl"
                  id="bento-action-request"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-white">Request</span>
                </button>
              </div>

              {/* FLOW INTELLIGENCE / AI INSIGHT */}
              <div className="bg-[#131722]/80 backdrop-blur-2xl rounded-[24px] border border-white/5 p-6 relative overflow-hidden group hover:border-[#00E0C7]/20 transition-all duration-300 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E0C7]/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-[#00E0C7]/10 transition-all" />
                <div className="flex items-start gap-4 relative z-10 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-[#00E0C7]/15 text-[#00E0C7] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold font-mono text-[#00E0C7] uppercase tracking-widest mb-1.5">Flow Intelligence</h4>
                    <p className="text-xs text-gray-200 leading-relaxed font-sans">
                      You've saved <span className="text-[#00E0C7] font-semibold">1,200 MAD</span> more than last month. Keep the momentum.
                    </p>
                  </div>
                </div>
              </div>

              {/* RECENT TRANSACTIONS */}
              <div className="bg-[#131722]/80 backdrop-blur-2xl rounded-[32px] border border-white/5 p-6 flex flex-col justify-between shadow-2xl relative">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Recent</h3>
                    <button onClick={() => setActiveTab('analytics')} className="text-[#1E90FF] hover:underline text-[10px] font-bold font-mono uppercase tracking-widest">
                      View All
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                    {transactions.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex items-center gap-4 p-2.5 rounded-2xl hover:bg-white/[0.02] transition-colors cursor-pointer group">
                        <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:text-[#00E0C7] group-hover:border-white/15 transition-all text-gray-300">
                          {tx.category === 'Exchange' && <RefreshCw className="w-4.5 h-4.5" />}
                          {tx.category === 'Food & Drink' && <Coffee className="w-4.5 h-4.5" />}
                          {tx.category === 'Income' && <TrendingUp className="w-4.5 h-4.5 text-[#00E0C7]" />}
                          {tx.category === 'Travel' && <Plane className="w-4.5 h-4.5 text-[#7B5CFF]" />}
                          {!['Exchange', 'Food & Drink', 'Income', 'Travel'].includes(tx.category) && <Zap className="w-4.5 h-4.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-[#00E0C7] transition-colors">{tx.description}</p>
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5 truncate uppercase tracking-wider">{tx.category} • {tx.date}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-bold font-mono ${tx.type === 'income' ? 'text-[#00E0C7]' : 'text-white'}`}>
                            {tx.type === 'income' ? '+' : '-'}{tx.currency === 'MAD' ? 'DH' : tx.currency === 'EUR' ? '€' : '$'} {tx.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </aside>
          </div>

          {/* MOBILE VIEW */}
          <div className="block md:hidden lg:col-span-12 space-y-6 w-full animate-fade-in pb-12" id="home-view-tab-mobile">
            {/* Total Balance Card (Glassmorphism) */}
            <section className="glass-card rounded-xl p-6 glow-effect relative overflow-hidden" id="mobile-home-balance-card">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl mix-blend-screen"></div>
              <p className="text-label-sm font-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Total Liquid Assets</p>
              <div className="flex items-baseline gap-2 mb-4">
                <h1 className="text-display-lg-mobile font-display-lg-mobile text-white">
                  ${computeTotalInUSD().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-tertiary">
                <TrendingUp className="w-4 h-4 text-[#00dfc6]" />
                <span className="font-mono-data text-mono-data text-xs">+2.4% (${(computeTotalInUSD() * 0.024).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} today)</span>
              </div>
            </section>

            {/* Quick Actions Grid */}
            <section className="grid grid-cols-4 gap-4" id="mobile-home-quick-actions">
              <button 
                onClick={() => setIsSendOpen(true)} 
                className="flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-none"
              >
                <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                  <Send className="w-5 h-5 text-[#a5c8ff]" />
                </div>
                <span className="text-[11px] font-medium text-on-surface-variant">Send</span>
              </button>
              
              <button 
                onClick={() => {
                  const alertState = {
                    id: `nt-${Date.now()}`,
                    text: `Billing Information copied to clipboard. Account standard IBAN loaded.`,
                    time: 'Just now',
                    read: false,
                  };
                  setNotifications([alertState, ...notifications]);
                  alert("Receive Account: Flow clearing bank standard IBAN has been loaded to clipboard.");
                }} 
                className="flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-none"
              >
                <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                  <ArrowDownLeft className="w-5 h-5 text-[#00dfc6]" />
                </div>
                <span className="text-[11px] font-medium text-on-surface-variant">Receive</span>
              </button>
              
              <button 
                onClick={() => setIsExchangeOpen(true)} 
                className="flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-none"
              >
                <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                  <RefreshCw className="w-5 h-5 text-[#cabeff]" />
                </div>
                <span className="text-[11px] font-medium text-on-surface-variant">Swap</span>
              </button>
              
              <button 
                onClick={() => {
                  const reqAmt = prompt("Enter requested billing amount (MAD):", "2,500");
                  if (reqAmt) {
                    const instantAlert = {
                      id: `nt-${Date.now()}`,
                      text: `Request QR Code Generated for ${reqAmt} MAD. Link copied to client workflow.`,
                      time: 'Just now',
                      read: false,
                    };
                    setNotifications([instantAlert, ...notifications]);
                    alert(`Billing invoice link created for ${reqAmt} MAD! Link sent to client.`);
                  }
                }} 
                className="flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-none"
              >
                <div className="w-14 h-14 rounded-full glass-card flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                  <QrCode className="w-5 h-5 text-gray-200" />
                </div>
                <span className="text-[11px] font-medium text-on-surface-variant">Request</span>
              </button>
            </section>

            {/* Multi-Currency Assets (Horizontal Scroll) */}
            <section className="-mx-6 px-6" id="mobile-home-assets">
              <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Assets</h2>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                {wallets.map((w) => {
                  let cardBorder = 'border-l-[#a5c8ff]';
                  let fullName = 'US Dollar';
                  if (w.currency === 'EUR') {
                    cardBorder = 'border-l-[#cabeff]';
                    fullName = 'Euro';
                  } else if (w.currency === 'MAD') {
                    cardBorder = 'border-l-[#00dfc6]';
                    fullName = 'Moroccan Dirham';
                  }

                  return (
                    <div 
                      key={w.id} 
                      className={`glass-card rounded-xl p-5 min-w-[220px] snap-center shrink-0 border-l-2 ${cardBorder}`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center font-mono text-xs font-bold text-white">
                          {w.currency}
                        </div>
                        <button className="text-on-surface-variant hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                          <span className="material-symbols-outlined text-sm">more_horiz</span>
                        </button>
                      </div>
                      <p className="font-mono-data text-mono-data text-on-surface-variant mb-1 text-xs">{fullName}</p>
                      <p className="text-body-lg font-body-lg font-semibold text-on-surface font-mono">
                        {w.currency === 'MAD' ? 'DH ' : w.currency === 'EUR' ? '€ ' : '$ '}
                        {w.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Flow Intelligence Insight */}
            <section className="glass-card rounded-xl p-5 border border-secondary/30 relative overflow-hidden" id="mobile-home-intelligence">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#a5c8ff] via-[#cabeff] to-[#00dfc6]"></div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#4716cb]/20 flex items-center justify-center shrink-0 border border-[#cabeff]/15">
                  <Sparkles className="w-5 h-5 text-[#cabeff] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-body-md font-body-md font-semibold text-white mb-1">Flow Intelligence</h3>
                  <p className="text-label-sm font-label-sm text-on-surface-variant font-normal leading-relaxed">
                    Your subscription spending is up <span className="text-[#cabeff] font-semibold">15%</span> this month. Tap Analytics to audit active bills.
                  </p>
                </div>
              </div>
            </section>

            {/* Recent Transactions */}
            <section id="mobile-home-activity">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-headline-md font-headline-md text-on-surface">Activity</h2>
                <button 
                  onClick={() => setActiveTab('analytics')} 
                  className="text-label-sm font-label-sm text-[#a5c8ff] hover:text-white uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-none"
                >
                  See All
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {transactions.slice(0, 4).map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-variant/20 transition-colors bg-white/[0.01] border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 border border-white/5 text-gray-300">
                          {tx.category === 'Exchange' && <RefreshCw className="w-4.5 h-4.5" />}
                          {tx.category === 'Dining' && <Coffee className="w-4.5 h-4.5" />}
                          {tx.category === 'Income' && <TrendingUp className="w-4.5 h-4.5 text-[#00e0c7]" />}
                          {tx.category === 'Travel' && <Plane className="w-4.5 h-4.5 text-[#7B5CFF]" />}
                          {!['Exchange', 'Dining', 'Income', 'Travel'].includes(tx.category) && <Zap className="w-4.5 h-4.5" />}
                        </div>
                        <div>
                          <p className="text-body-md font-body-md font-medium text-white select-all">{tx.description}</p>
                          <p className="text-label-sm font-label-sm text-on-surface-variant font-normal font-mono text-xs">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-body-md font-body-md font-semibold font-mono ${isIncome ? 'text-[#00dfc6]' : 'text-white'}`}>
                          {isIncome ? '+' : '-'}{tx.currency === 'MAD' ? 'DH' : tx.currency === 'EUR' ? '€' : '$'} {tx.amount.toLocaleString()}
                        </p>
                        <p className="font-mono-data text-mono-data text-on-surface-variant text-xs mt-0.5">{tx.category}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}

      {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="lg:col-span-12 animate-fade-in font-sans" id="analytics-view-tab">
            <AnalyticsHub
              reserves={reserves}
              setReserves={setReserves}
              subscriptions={subscriptions}
              setSubscriptions={setSubscriptions}
              notifications={notifications}
              setNotifications={setNotifications}
            />
          </div>
        )}

        {/* TAB 3: CARDS */}
        {activeTab === 'cards' && (
          <div className="lg:col-span-12 animate-fade-in" id="cards-view-tab">
            <CardManager cards={cards} profile={profile} onUpdateCards={(updated) => setCards(updated)} />
          </div>
        )}

        {/* TAB 4: PAYMENTS/TRANSFER (SEND/RECEIVE/INVOICES) */}
        {activeTab === 'pay' && (
          <div className="lg:col-span-12 animate-fade-in font-sans" id="pay-view-tab">
            <PaymentHub
              onAddTransaction={(newTx) => setTransactions([newTx, ...transactions])}
              invoices={invoices}
              onAddInvoice={(newInv) => setInvoices([newInv, ...invoices])}
              notifications={notifications}
              setNotifications={(updated) => setNotifications(updated)}
            />
          </div>
        )}

        {/* TAB 4.5: SECURITY & FRAUD PROTECTION CENTER */}
        {activeTab === 'security' && (
          <div className="lg:col-span-12 animate-fade-in font-sans" id="security-view-tab">
            <SecurityCenter />
          </div>
        )}

        {/* TAB 4.8: CENTRAL OPERATIONAL & COMPLIANCE HUD PANEL */}
        {activeTab === 'admin' && (
          <div className="lg:col-span-12 animate-fade-in font-sans" id="admin-view-tab">
            <AdminPanel />
          </div>
        )}

        {/* TAB 5: CENTRAL HUB / OPTIONS (SETTINGS AND EXTRA FUNCTIONALITIES) */}
        {activeTab === 'hub' && (
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in w-full pb-12 animate-fade-in" id="hub-view-tab">
            
            {/* HERO / PRIMARY WALLET (Col span 8 on lg) */}
            <div className="lg:col-span-8 bg-[#131722]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-2xl">
              <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#1E90FF]/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#7B5CFF]/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
              
              <div className="relative z-10">
                <span className="text-xs text-gray-400 uppercase tracking-widest font-mono block mb-2">Total Balance</span>
                <div className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-sans sm:text-left select-all">
                  {wallets[0]?.currency === 'MAD' ? (
                    <>
                      <span className="text-2xl font-mono text-gray-400">DH </span>
                      {computeTotalInMAD().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-mono text-gray-400">$</span>
                      {computeTotalInUSD().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase block mt-2 select-none">
                  ⚡ LIQUID ASSETS CONSOL SERVICE
                </span>
              </div>

              <div className="flex gap-4 mt-8 relative z-10 w-full sm:w-auto">
                <button
                  onClick={() => setIsSendOpen(true)}
                  className="flex-1 bg-gradient-to-r from-[#1E90FF] to-[#7B5CFF] text-white px-6 py-3.5 rounded-2xl text-xs font-bold font-mono tracking-wider uppercase hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(30,144,255,0.25)] shrink-0 animate-fade-in"
                  id="btn-hub-add-funds"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Add Funds</span>
                </button>
                <button
                  onClick={() => setIsSendOpen(true)}
                  className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 px-6 py-3.5 rounded-2xl text-xs font-bold font-mono tracking-wider uppercase hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 shrink-0 animate-fade-in"
                  id="btn-hub-transfer"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* VIRTUAL CARD PREVIEW (Col span 4 on lg) */}
            <div className="lg:col-span-4 bg-[#131722]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-6 flex flex-col justify-between bg-gradient-to-b from-[#141C25]/40 to-[#0c141d]/40 relative min-h-[300px] shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-white/[0.02]">
                <div className="text-xs font-bold uppercase tracking-wider font-mono text-gray-400">Flow Card</div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00E0C7] animate-pulse" />
              </div>

              <div className="aspect-[1.586/1] w-full rounded-2xl bg-gradient-to-br from-[#7B5CFF] to-[#1E90FF] p-5 flex flex-col justify-between shadow-[0_12px_24px_rgba(30,144,255,0.25)] relative overflow-hidden select-none my-4">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div className="text-white text-xs font-bold tracking-widest font-mono uppercase">FLOW SPACE OS</div>
                  <span className="text-white font-extrabold tracking-tight text-xs font-sans italic">VISA</span>
                </div>
                <div>
                  <div className="text-sm font-mono tracking-widest text-white/95 mb-2 font-semibold">
                    {cards[0]?.cardNumber || '**** **** **** 4912'}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-white/70">
                    <div>
                      <div className="text-[7px] uppercase text-white/40 tracking-wider">Cardholder</div>
                      <div className="uppercase font-semibold truncate max-w-[120px]">{profile ? profile.name : 'Alex Chen'}</div>
                    </div>
                    <div>
                      <div className="text-[7px] uppercase text-white/40 tracking-wider">Expiry</div>
                      <div className="font-semibold">{cards[0]?.expiry || '12/28'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.02] flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-400 animate-fade-in">Freeze Card Shield</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={cards[0]?.isFrozen || false}
                    onChange={() => {
                      if (cards && cards[0]) {
                        setCards(cards.map(c => c.id === cards[0].id ? { ...c, isFrozen: !c.isFrozen } : c));
                        // Add interactive alert
                        const alertState = !cards[0].isFrozen ? 'Frozen' : 'Unfrozen';
                        const instantAlert = {
                          id: `nt-${Date.now()}`,
                          text: `Security Notification: Flow Visa Card ${cards[0].cardNumber.slice(-4)} has been ${alertState}.`,
                          time: 'Just now',
                          read: false,
                        };
                        setNotifications([instantAlert, ...notifications]);
                      }
                    }}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E0C7]"></div>
                </label>
              </div>
            </div>

            {/* CURRENCIES ACTIVE ACCOUNTS (Col span 6 on lg) */}
            <div className="lg:col-span-6 bg-[#131722]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-mono">Active Currency Accounts</h2>
                  <span className="px-2.5 py-1 bg-[#00E0C7]/15 text-[#00E0C7] border border-[#00E0C7]/20 rounded-full text-[9px] font-mono uppercase tracking-widest font-semibold">
                    Live Rates Connected
                  </span>
                </div>
                <div className="space-y-4">
                  {/* USD Account */}
                  <div 
                    onClick={() => {
                      setExFrom('USD');
                      setExTo(exTo === 'USD' ? 'MAD' : exTo);
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-lg border border-blue-500/20 overflow-hidden shrink-0 select-none">
                        🇺🇸
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#00E0C7] transition-colors">United States Dollar</div>
                        <div className="text-[10px] font-mono text-gray-400 uppercase">USD Account</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-bold font-mono text-white">
                        $ {(wallets.find(w => w.currency === 'USD')?.balance || 82450).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Vault Ledger · Active</span>
                    </div>
                  </div>

                  {/* EUR Account */}
                  <div 
                    onClick={() => {
                      setExFrom('EUR');
                      setExTo(exTo === 'EUR' ? 'MAD' : exTo);
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#7B5CFF]/10 flex items-center justify-center text-lg border border-[#7B5CFF]/20 overflow-hidden shrink-0 select-none">
                        🇪🇺
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#00E0C7] transition-colors">Euro Vault Ledger</div>
                        <div className="text-[10px] font-mono text-gray-400 uppercase">EUR Account</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-bold font-mono text-white">
                        € {(wallets.find(w => w.currency === 'EUR')?.balance || 35120).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Vault Ledger · Active</span>
                    </div>
                  </div>

                  {/* MAD Account */}
                  <div 
                    onClick={() => {
                      setExFrom('MAD');
                      setExTo(exTo === 'MAD' ? 'USD' : exTo);
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-lg border border-red-500/20 overflow-hidden shrink-0 select-none">
                        🇲🇦
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#00E0C7] transition-colors">Moroccan Dirham</div>
                        <div className="text-[10px] font-mono text-gray-400 uppercase">MAD Ledger · local</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-bold font-mono text-white">
                        DH {(wallets.find(w => w.currency === 'MAD')?.balance || 45200).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Vault Ledger · Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hard reset session box in the footer of list for absolute helper controls */}
              <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase animate-pulse">FLOW Operative Sandbox</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Reset current flow active profile session to recalibrate?")) {
                      setProfile(null);
                    }
                  }}
                  className="text-[9px] uppercase font-mono tracking-widest text-red-400 hover:text-red-300 font-bold underline transition-colors"
                >
                  Recalibrate User Profile
                </button>
              </div>
            </div>

            {/* QUICK EXCHANGE TOOL (Col span 6 on lg) */}
            <div className="lg:col-span-6 bg-[#131722]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-6 shadow-2xl relative flex flex-col justify-between">
              <form onSubmit={handleExchangeSubmit} className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-mono">Quick Currency Exchange</h2>
                  <span className="text-[9px] text-[#00E0C7] font-mono uppercase tracking-widest">Optimal Rate Clear</span>
                </div>

                {/* You Send Container */}
                <div className="bg-[#0c121c] rounded-2xl p-4 border border-white/5 relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#00E0C7]">You Send</span>
                    <span className="text-[10px] font-mono text-gray-400">
                      Balance: {exFrom} {(wallets.find(w => w.currency === exFrom)?.balance || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 gap-4">
                    <input 
                      aria-label="Amount to exchange"
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={exAmount}
                      onChange={(e) => setExAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-transparent text-xl sm:text-2xl font-bold font-mono text-white w-2/3 focus:outline-none focus:ring-0 focus:border-none p-0 border-none"
                    />
                    
                    <select
                      value={exFrom}
                      onChange={(e) => {
                        const nextFrom = e.target.value;
                        setExFrom(nextFrom);
                        if (nextFrom === exTo) {
                          setExTo(exFrom === 'MAD' ? 'USD' : 'MAD');
                        }
                      }}
                      className="bg-[#131722] border border-white/10 text-white px-3 py-1.5 rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#00E0C7]"
                    >
                      <option value="USD">🇺🇸 USD</option>
                      <option value="EUR">🇪🇺 EUR</option>
                      <option value="MAD">🇲🇦 MAD</option>
                    </select>
                  </div>
                </div>

                {/* Switch Swapper trigger */}
                <div className="relative flex justify-center py-2">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = exFrom;
                      setExFrom(exTo);
                      setExTo(temp);
                    }}
                    className="w-9 h-9 bg-[#1E90FF] text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg border-4 border-[#131722] relative z-10"
                    aria-label="Swap Currencies"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 -translate-y-1/2 z-0" />
                </div>

                {/* You Receive Container */}
                <div className="bg-[#0c121c] rounded-2xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#00E0C7]">You Receive (Estimated)</span>
                    <span className="text-[10px] font-mono text-gray-400">
                      Balance: {exTo} {(wallets.find(w => w.currency === exTo)?.balance || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 gap-4">
                    <input 
                      aria-label="Converted estimation"
                      type="text"
                      readOnly
                      value={
                        exAmount && !isNaN(parseFloat(exAmount))
                          ? (() => {
                              const amt = parseFloat(exAmount);
                              const rates: Record<string, number> = { USD: 1, EUR: 0.92, MAD: 10.05 };
                              const valInUSD = amt / rates[exFrom];
                              return (valInUSD * rates[exTo]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            })()
                          : '0.00'
                      }
                      className="bg-transparent text-xl sm:text-2xl font-bold font-mono text-[#00E0C7] w-2/3 focus:outline-none p-0 border-none select-all"
                    />

                    <select
                      value={exTo}
                      onChange={(e) => {
                        const nextTo = e.target.value;
                        setExTo(nextTo);
                        if (nextTo === exFrom) {
                          setExFrom(exFrom === 'MAD' ? 'USD' : 'MAD');
                        }
                      }}
                      className="bg-[#131722] border border-white/10 text-[#00E0C7] px-3 py-1.5 rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#00E0C7]"
                    >
                      <option value="USD">🇺🇸 USD</option>
                      <option value="EUR">🇪🇺 EUR</option>
                      <option value="MAD">🇲🇦 MAD</option>
                    </select>
                  </div>
                </div>

                {/* Bottom conversion details & actions */}
                <div className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-[10px] font-mono text-gray-400 tracking-wider">
                    {/* Display exact rate pairs info */}
                    {exFrom === 'EUR' && exTo === 'MAD' && <span>Rate: 1 EUR = 10.92 MAD · Inbound Spread 0.1%</span>}
                    {exFrom === 'MAD' && exTo === 'EUR' && <span>Rate: 1 MAD = 0.091 EUR · Outbound Spread 0.1%</span>}
                    {exFrom === 'USD' && exTo === 'MAD' && <span>Rate: 1 USD = 10.05 MAD · Inbound Spread 0.1%</span>}
                    {exFrom === 'MAD' && exTo === 'USD' && <span>Rate: 1 MAD = 0.10 USD · Outbound Spread 0.1%</span>}
                    {exFrom === 'EUR' && exTo === 'USD' && <span>Rate: 1 EUR = 1.09 USD · Inter-ledger Spread 0.1%</span>}
                    {exFrom === 'USD' && exTo === 'EUR' && <span>Rate: 1 USD = 0.92 EUR · Inter-ledger Spread 0.1%</span>}
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#00E0C7] hover:bg-[#00cfa7] text-black font-bold text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-semibold active:scale-98"
                    id="btn-trigger-exchange-direct"
                  >
                    Execute Conversion
                  </button>
                </div>

              </form>
            </div>

            {/* Live System Supervisor, Audits, Verification & Regulatory Panel */}
            <SupervisorHubPanel userProfile={profile} onRefreshStates={syncLiveState} />

          </div>
        )}
      </main>

      {/* CORE FOOTER NAVIGATION BAR (Matches Exact Aesthetic and Structure of Elegant Dark Design) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#080D14] via-[#080D14]/95 to-transparent pt-12 pb-6 px-4 md:px-6">
        <div className="max-w-4xl mx-auto bg-[#131722]/90 backdrop-blur-lg border border-white/10 rounded-full px-4 sm:px-8 py-3.5 flex justify-between items-center relative shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
          
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 relative py-1 px-3 rounded-full shrink-0 ${
              activeTab === 'home' 
                ? 'text-[#00E0C7] sm:bg-white/5 font-semibold scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
            id="nav-home"
          >
            <svg className="w-5.5 h-5.5 sm:w-5 sm:h-5 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011-1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-none">Home</span>
            {activeTab === 'home' && (
              <motion.div
                layoutId="activeTabDot"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#00E0C7]"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 relative py-1 px-3 rounded-full shrink-0 ${
              activeTab === 'analytics' 
                ? 'text-[#00E0C7] sm:bg-white/5 font-semibold scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
            id="nav-analytics"
          >
            <TrendingUp className="w-5.5 h-5.5 sm:w-5 sm:h-5 transition-transform duration-300" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-none">Analytics</span>
            {activeTab === 'analytics' && (
              <motion.div
                layoutId="activeTabDot"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#00E0C7]"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 relative py-1 px-3 rounded-full shrink-0 ${
              activeTab === 'cards' 
                ? 'text-[#00E0C7] sm:bg-white/5 font-semibold scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
            id="nav-cards"
          >
            <CardIcon className="w-5.5 h-5.5 sm:w-5 sm:h-5 transition-transform duration-300" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-none">Cards</span>
            {activeTab === 'cards' && (
              <motion.div
                layoutId="activeTabDot"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#00E0C7]"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pay')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 relative py-1 px-3 rounded-full shrink-0 ${
              activeTab === 'pay' 
                ? 'text-[#00E0C7] sm:bg-white/5 font-semibold scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
            id="nav-pay"
          >
            <FileText className="w-5.5 h-5.5 sm:w-5 sm:h-5 transition-transform duration-300" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-none">Pay</span>
            {activeTab === 'pay' && (
              <motion.div
                layoutId="activeTabDot"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#00E0C7]"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 relative py-1 px-3 rounded-full shrink-0 ${
              activeTab === 'security' 
                ? 'text-[#00E0C7] sm:bg-white/5 font-semibold scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
            id="nav-mobile-security"
          >
            <Shield className="w-5.5 h-5.5 sm:w-5 sm:h-5 transition-transform duration-300" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-none">Security</span>
            {activeTab === 'security' && (
              <motion.div
                layoutId="activeTabDot"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#00E0C7]"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 relative py-1 px-3 rounded-full shrink-0 ${
              activeTab === 'admin' 
                ? 'text-red-400 sm:bg-white/5 font-semibold scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
            id="nav-mobile-admin"
          >
            <Sliders className="w-5.5 h-5.5 sm:w-5 sm:h-5 transition-transform duration-300 text-red-400" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-none text-red-300">Ops</span>
            {activeTab === 'admin' && (
              <motion.div
                layoutId="activeTabDot"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-400"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('hub')}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 relative py-1 px-3 rounded-full shrink-0 ${
              activeTab === 'hub' 
                ? 'text-[#00E0C7] sm:bg-white/5 font-semibold scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
            id="nav-hub"
          >
            <Compass className="w-5.5 h-5.5 sm:w-5 sm:h-5 transition-transform duration-300" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-none">Hub</span>
            {activeTab === 'hub' && (
              <motion.div
                layoutId="activeTabDot"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#00E0C7]"
              />
            )}
          </button>

        </div>
      </nav>

      </div> {/* End Main Content shell with desktop sidebar offsets */}

      {/* DIALOGS AND OVERLAYS */}

      {/* DIALOG 1: SEND MONEY POPUP */}
      <AnimatePresence>
        {isSendOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0c121c] border border-white/10 max-w-md w-full rounded-3xl p-6 space-y-5 relative shadow-2xl"
              id="send-money-dialog"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
                <h4 className="text-sm font-medium flex items-center space-x-1.5 font-sans">
                  <Send className="w-4 h-4 text-[#1E90FF]" />
                  <span>Initiate Foreign Clearing Payment</span>
                </h4>
                <button onClick={() => setIsSendOpen(false)} className="text-gray-400 hover:text-white text-xs font-mono">close</button>
              </div>

              <form onSubmit={handleSendMoneySubmit} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-gray-400 block font-mono uppercase mb-1.5">Recipient Identity (IBAN or BIC)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wise SAS / Stripe HQ"
                    value={sendRecipient}
                    onChange={(e) => setSendRecipient(e.target.value)}
                    className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#1E90FF] text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 block font-mono uppercase mb-1.5">Billing Pool</label>
                    <select
                      value={sendCurrency}
                      onChange={(e) => setSendCurrency(e.target.value)}
                      className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#1E90FF]"
                    >
                      <option value="MAD">MAD (Dirham)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 block font-mono uppercase mb-1.5">Clearing size</label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block font-mono uppercase mb-1.5">Expense Category</label>
                  <select
                    value={sendCategory}
                    onChange={(e) => setSendCategory(e.target.value as any)}
                    className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none"
                  >
                    <option value="Dining">Dining & Subsistence</option>
                    <option value="Software">Software Licensing & Dev SaaS</option>
                    <option value="Travel">Geographic Travel</option>
                    <option value="Utilities">Tax auto-debits</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1E90FF] text-white font-semibold uppercase font-mono tracking-wider rounded-xl text-xs transition-transform hover:scale-[1.02]"
                >
                  DISPATCH TRANSACTION TARGET
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG 2: INTERBANK FX EXCHANGE OVERLAY */}
      <AnimatePresence>
        {isExchangeOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0c121c] border border-white/10 max-w-md w-full rounded-3xl p-6 space-y-5 relative shadow-2xl"
              id="exchange-money-dialog"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
                <h4 className="text-sm font-medium flex items-center space-x-1.5 font-sans">
                  <RefreshCw className="w-4 h-4 text-[#00E0C7]" />
                  <span>Optimal Liquidity Exchange</span>
                </h4>
                <button onClick={() => setIsExchangeOpen(false)} className="text-gray-400 hover:text-white text-xs font-mono">close</button>
              </div>

              <form onSubmit={handleExchangeSubmit} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-gray-400 block font-mono uppercase mb-1.5">Convert From</label>
                    <select
                      value={exFrom}
                      onChange={(e) => setExFrom(e.target.value)}
                      className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#00E0C7]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="MAD">MAD (Dirham)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 block font-mono uppercase mb-1.5">Convert To</label>
                    <select
                      value={exTo}
                      onChange={(e) => setExTo(e.target.value)}
                      className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#00E0C7]"
                    >
                      <option value="MAD">MAD (Dirham)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block font-mono uppercase mb-1.5">Amount to convert</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={exAmount}
                    onChange={(e) => setExAmount(e.target.value)}
                    className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none text-white font-mono"
                  />
                </div>

                {/* Simulated optimal spread display */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-[#00e0c7]/20 select-none text-[10px] space-y-1">
                  <p className="font-mono text-gray-400 uppercase">Interbank Pair Spread Status</p>
                  <p className="text-gray-200">FLOW markup: <span className="text-[#00e0c7] font-bold">0.1%</span> (Standard retail bank markup is 2.5%)</p>
                  <p className="text-gray-400">Yield difference: Approx 12 MAD saved per $100 converted.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#00E0C7] text-black font-semibold uppercase font-mono tracking-wider rounded-xl text-xs transition-transform hover:scale-[1.02]"
                >
                  EXECUTE SECURED EXCHANGE
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG 3: NEW EXEMPT COMPLIANT INVOICE OVERLAY */}
      <AnimatePresence>
        {isNewInvoiceOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0c121c] border border-white/10 max-w-md w-full rounded-3xl p-6 space-y-5 relative shadow-2xl"
              id="new-invoice-dialog"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
                <h4 className="text-sm font-medium flex items-center space-x-1.5 font-sans">
                  <FileText className="w-4 h-4 text-[#7B5CFF]" />
                  <span>Draft Compliant Global Invoice</span>
                </h4>
                <button onClick={() => setIsNewInvoiceOpen(false)} className="text-gray-400 hover:text-white text-xs font-mono">close</button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-gray-400 block font-mono uppercase mb-1.5">Recipient Legal entity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Inc (US/Europe)"
                    value={invoiceClient}
                    onChange={(e) => setInvoiceClient(e.target.value)}
                    className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#7b5cff] text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block font-mono uppercase mb-1.5">Recipient Financial Email</label>
                  <input
                    type="email"
                    placeholder="billing@acme.com"
                    value={invoiceEmail}
                    onChange={(e) => setInvoiceEmail(e.target.value)}
                    className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-gray-400 block font-mono uppercase mb-1">Clearing dev</label>
                    <select
                      value={invoiceCurrency}
                      onChange={(e) => setInvoiceCurrency(e.target.value)}
                      className="w-full bg-[#080d14] py-2 px-2 border border-white/10 rounded-xl focus:outline-none"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="MAD">MAD (DH)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 block font-mono uppercase mb-1">Quantity/Hours</label>
                    <input
                      type="number"
                      required
                      value={invoiceHours}
                      onChange={(e) => setInvoiceHours(e.target.value)}
                      className="w-full bg-[#080d14] py-2 px-2.5 border border-white/10 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block font-mono uppercase mb-1">Billing Rate</label>
                    <input
                      type="number"
                      required
                      value={invoiceRate}
                      onChange={(e) => setInvoiceRate(e.target.value)}
                      className="w-full bg-[#080d14] py-2 px-2.5 border border-white/10 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/5 border border-[#7b5cff]/20 text-[10px] text-gray-400 leading-relaxed font-mono">
                  <p className="uppercase text-[#7B5CFF] font-bold">ARTICLE 92 EXPORT STATUS STATUS</p>
                  Moroccan tax CGI codes auto-assign 0% VAT exemption status headers because services are rendered to a foreign client. No local VAT collection required.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#7B5CFF] text-white font-semibold uppercase font-mono tracking-wider rounded-xl text-xs transition-transform hover:scale-[1.02]"
                >
                  COMPILE & ISSUE BILLING DEED
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
