import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  X, 
  Music, 
  Film, 
  Plane, 
  Home, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Search,
  TrendingUp,
  Calendar,
  Trash2,
  Info,
  ShieldAlert,
  Award,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle,
  ChevronRight,
  Sparkle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { useAnalyticsStore } from '../stores/analyticsStore';
import { useBudgetStore } from '../stores/budgetStore';
import { useSavingsStore } from '../stores/savingsStore';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { useInsightsStore } from '../stores/insightsStore';
import { useFinancialSearchStore } from '../stores/financialSearchStore';

interface ReserveGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  progress: number;
  meta: string;
  color: string;
  icon?: string;
}

interface SubscriptionItem {
  id: string;
  name: string;
  price: number;
  info: string;
  icon: string;
  unused: boolean;
  canceled: boolean;
}

interface AnalyticsHubProps {
  reserves: ReserveGoal[];
  setReserves: (reserves: ReserveGoal[]) => void;
  subscriptions: SubscriptionItem[];
  setSubscriptions: (subscriptions: SubscriptionItem[]) => void;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
}

type SubHubTab = 'overview' | 'budgets' | 'subscriptions' | 'insights' | 'search' | 'reports';

export default function AnalyticsHub({
  reserves,
  setReserves,
  subscriptions,
  setSubscriptions,
  notifications,
  setNotifications,
}: AnalyticsHubProps) {
  
  const [subTab, setSubTab] = useState<SubHubTab>('overview');

  // Load Zustand stores
  const { overview, trends, categories, timeframe, fetchAnalytics } = useAnalyticsStore();
  const { budgets, fetchBudgets, createBudget, updateBudget, deleteBudget } = useBudgetStore();
  const { goals, fetchSavingsGoals, createSavingsGoal, contribute, updateSavingsGoal } = useSavingsStore();
  const { subscriptions: storeSubs, fetchSubscriptions, cancelSubscription } = useSubscriptionStore();
  const { insights, fetchInsights, markAsRead, dismissInsight } = useInsightsStore();
  const { query, searchResult, history, isLoading: isSearchLoading, search, setQuery, clearResult } = useFinancialSearchStore();

  // Monthly Report state
  const [mReport, setMReport] = useState<any>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // Budgets creation states
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [addBudgetCategory, setAddBudgetCategory] = useState('Dining');
  const [addBudgetLimit, setAddBudgetLimit] = useState('');
  const [addBudgetCurrency, setAddBudgetCurrency] = useState('MAD');

  // Savings goal creation states
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');
  const [newGoalIcon, setNewGoalIcon] = useState('plane');
  const [newGoalColor, setNewGoalColor] = useState('#00dfc6');
  const [newGoalType, setNewGoalType] = useState<any>('travel');

  // Sync stores on load
  useEffect(() => {
    fetchAnalytics(timeframe);
    fetchBudgets();
    fetchSavingsGoals();
    fetchSubscriptions();
    fetchInsights();
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setIsReportLoading(true);
    try {
      const res = await fetch('/api/analytics/monthly-report');
      if (res.ok) {
        const data = await res.json();
        setMReport(data);
      }
    } catch {
      // safe fallback
    } finally {
      setIsReportLoading(false);
    }
  };

  // Sync local props back to state hooks when they mutate for maximum resilience
  const notifyAndAlert = (text: string, type = 'INFO') => {
    const freshAlert = {
      id: `nt-${Date.now()}`,
      text,
      time: 'Just now',
      read: false
    };
    setNotifications([freshAlert, ...notifications]);
  };

  // Handle budget creation submit
  const handleAddNewBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(addBudgetLimit);
    if (isNaN(limit) || limit <= 0) return;

    const res = await createBudget(addBudgetCategory, limit, addBudgetCurrency);
    if (res) {
      notifyAndAlert(`Configured limit threshold cap of ${limit} ${addBudgetCurrency} on ${addBudgetCategory}`);
      setAddBudgetLimit('');
      setShowAddBudgetModal(false);
    }
  };

  // Handle savings goal creation submit
  const handleAddNewGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(newGoalTarget) || 5000;
    const currentVal = parseFloat(newGoalCurrent) || 0;

    const res = await createSavingsGoal(
      newGoalName || 'Tokyo Trip',
      targetVal,
      'MAD',
      new Date(Date.now() + 180 * 24 * 3600000).toISOString().split('T')[0],
      newGoalType
    );

    if (res) {
      // Sync local prop state too
      const computedProgress = Math.min(Math.round((currentVal / targetVal) * 100), 100);
      const newG: ReserveGoal = {
        id: res.id,
        name: res.title,
        current: currentVal,
        target: targetVal,
        progress: computedProgress,
        meta: 'Saved parameters from store',
        color: newGoalColor,
        icon: newGoalIcon
      };
      setReserves([...reserves, newG]);
      notifyAndAlert(`Savings pool created: "${res.title}" with target of ${targetVal} MAD.`);
      
      // If starter balance is present, contribute
      if (currentVal > 0) {
        await contribute(res.id, currentVal);
        fetchSavingsGoals();
      }

      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalCurrent('');
      setShowAddGoalModal(false);
    }
  };

  // Handle Savings Contribution
  const handleSavingsContribution = async (goalId: string, name: string) => {
    const qty = prompt(`Deduct balance from your wallet to deposit into ${name} (MAD):`, "500");
    if (!qty) return;
    const parsed = parseFloat(qty);
    if (!isNaN(parsed) && parsed > 0) {
      const res = await contribute(goalId, parsed);
      if (res) {
        // synchronize parent reserve arrays
        setReserves(reserves.map(r => r.id === goalId ? { ...r, current: res.currentAmount, progress: Math.min(Math.round((res.currentAmount / res.targetAmount) * 100), 100) } : r));
        notifyAndAlert(`Allocated deposit of ${parsed.toLocaleString()} MAD into your ${name} target savings reserve.`);
        fetchSavingsGoals();
      } else {
        notifyAndAlert("Unable to process savings contribution: Insufficient wallet balances.", 'ERROR');
      }
    }
  };

  // Terminate subscription routing
  const handleTerminateSub = async (subId: string, name: string) => {
    const res = await cancelSubscription(subId);
    if (res) {
      // maintain local legacy compatibility state
      setSubscriptions(subscriptions.map(s => s.id === subId ? { ...s, canceled: true } : s));
      notifyAndAlert(`Discharged automated subscription routing with merchant: '${name}'. Saving score perfect.`, "WARNING");
      fetchSubscriptions();
    }
  };

  // Format subscription price
  const getSubSum = () => {
    return storeSubs
      .filter(s => s.status === 'active')
      .reduce((sum, curr) => sum + curr.amount, 0);
  };

  return (
    <div className="w-full animate-fade-in font-sans pb-12" id="analytics-optimized-hub">
      
      {/* 1. Header with custom functional sub tabs */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[32px] md:text-[48px] font-bold leading-[40px] md:leading-[56px] tracking-[-0.02em] flex items-center gap-2">
            Finance OS Center
            <Sparkle className="w-5 h-5 text-primary animate-pulse" />
          </h1>
          <p className="text-[#8a919f] max-w-2xl">
            Predictive balance tracking, category budgets, savings goals, and AI analysis.
          </p>
        </div>

        {/* Dynamic Navigation Ranges */}
        <div className="inline-flex bg-surface-container p-1 rounded-2xl border border-outline-variant/20 self-start md:self-auto scrollbar-none overflow-x-auto max-w-full">
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'budgets', label: 'Budgets & Goals' },
            { id: 'subscriptions', label: 'Subscriptions' },
            { id: 'insights', label: 'AI Insights' },
            { id: 'search', label: 'Smart Search' },
            { id: 'reports', label: 'Reports' }
          ] as { id: SubHubTab, label: string }[]).map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-surface-variant text-on-background shadow-sm border border-outline-variant/10'
                    : 'text-on-surface-variant hover:text-on-background'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* SUB-TAB PANELS */}
      <AnimatePresence mode="wait">
        
        {/* PANEL 1: OVERVIEW */}
        {subTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Visual metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 relative overflow-hidden group">
                <p className="text-xs text-on-surface-variant">Monthly Spending Outflow</p>
                <p className="text-2xl font-bold font-mono text-[#ff5c5c] mt-1">
                  ${overview?.totalSpent || '0.00'}
                </p>
                <div className="absolute right-3 bottom-3 opacity-10 group-hover:opacity-25 transition-opacity">
                  <TrendingUp className="w-12 h-12 text-[#ff5c5c] rotate-180" />
                </div>
              </div>
              <div className="glass-card p-5 relative overflow-hidden group">
                <p className="text-xs text-on-surface-variant">Incoming Capital (Inflow)</p>
                <p className="text-2xl font-bold font-mono text-[#00dfc6] mt-1">
                  ${overview?.totalReceived || '0.00'}
                </p>
                <div className="absolute right-3 bottom-3 opacity-10 group-hover:opacity-25 transition-opacity">
                  <TrendingUp className="w-12 h-12 text-[#00dfc6]" />
                </div>
              </div>
              <div className="glass-card p-5 relative overflow-hidden group">
                <p className="text-xs text-on-surface-variant">Monthly Safe Net Flow</p>
                <p className="text-2xl font-bold font-mono text-primary mt-1">
                  ${overview?.netCashflow || '0.00'}
                </p>
                <div className="absolute right-3 bottom-3 opacity-10 group-hover:opacity-25 transition-opacity">
                  <Award className="w-12 h-12 text-primary" />
                </div>
              </div>
              <div className="glass-card p-5 relative overflow-hidden group">
                <p className="text-xs text-on-surface-variant">Liquidity Savings Coefficient</p>
                <p className="text-2xl font-bold font-mono text-tertiary mt-1">
                  {overview?.savingsRate || '30%'}
                </p>
                <div className="absolute right-3 bottom-3 opacity-10 group-hover:opacity-25 transition-opacity">
                  <Sparkles className="w-12 h-12 text-tertiary" />
                </div>
              </div>
            </div>

            {/* Timeline Bar Chart & Categories Pie layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Cashflow Recharts area */}
              <div className="md:col-span-8 glass-card p-6 min-h-[350px] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Cash Flow Velocity</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">Time series visual of revenue and outflows</p>
                  </div>

                  {/* Range select dropdown toggle */}
                  <select 
                    value={timeframe} 
                    onChange={(e) => fetchAnalytics(e.target.value)}
                    className="bg-[#182029] border border-outline-variant/30 py-1.5 px-3 rounded-xl font-mono text-xs text-white focus:outline-none"
                  >
                    <option value="1_month">Last 30 Days (1M)</option>
                    <option value="3_months">Last 90 Days (3M)</option>
                    <option value="1_year">Last Year (1Y)</option>
                    <option value="ALL">All Time History</option>
                  </select>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends} barGap={4}>
                      <defs>
                        <linearGradient id="gInflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00dfc6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#00dfc6" stopOpacity={0.15} />
                        </linearGradient>
                        <linearGradient id="gOutflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff5c5c" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#ff5c5c" stopOpacity={0.15} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#5d7290" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                      <YAxis stroke="#5d7290" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0c121c', borderColor: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px', fontSize: '11px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="Income" fill="url(#gInflow)" radius={[4, 4, 0, 0]} name="Inflow Capital" />
                      <Bar dataKey="Expenses" fill="url(#gOutflow)" radius={[4, 4, 0, 0]} name="Outflow Expenditures" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Piechart Breakdown */}
              <div className="md:col-span-4 glass-card p-6 flex flex-col justify-between min-h-[350px]">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Dynamic Cost Slices</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Proportional spending category ratios</p>
                </div>

                <div className="relative w-full h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories.filter(c => c.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categories.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0c121c', borderColor: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '10px', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                    <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-widest leading-none">Top Category</span>
                    <span className="text-sm font-extrabold text-[#00dfc6] mt-1 max-w-[100px] truncate text-center">
                      {overview?.topCategory || 'Dining'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pr-1">
                  {categories.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-on-surface-variant truncate max-w-[80px]">{item.name}</span>
                      <span className="text-white font-bold ml-auto">${item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* PANEL 2: BUDGETS & SAVINGS GOALS */}
        {subTab === 'budgets' && (
          <motion.div 
            key="budgets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Category Budgets list (Mottled styling with overspending trigger alerts) */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Category Spending Thresholds</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Budget boundaries parsed versus active ledger</p>
                </div>
                <button 
                  onClick={() => setShowAddBudgetModal(true)}
                  className="px-3.5 py-1.5 bg-[#142629] border border-outline-variant/30 rounded-xl text-xs text-[#00dfc6] hover:bg-surface-variant transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1 font-mono hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD BUDGET</span>
                </button>
              </div>

              <div className="space-y-4">
                {budgets.map((b) => {
                  const percent = Math.min(Math.round((b.spentAmount / b.limitAmount) * 100), 200);
                  const isOver = percent >= 100;
                  const isWarning = percent >= 75 && percent < 100;
                  
                  return (
                    <div key={b.id} className="glass-card p-5 space-y-3 relative overflow-hidden">
                      
                      {/* Overspending banner alert overlay if threshold breached */}
                      {isOver && (
                        <div className="absolute right-0 top-0 bg-[#ff4a4a] text-black text-[9px] font-mono font-extrabold uppercase py-1 px-3 rounded-bl-xl tracking-wider select-none flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Breached 100%</span>
                        </div>
                      )}
                      {isWarning && (
                        <div className="absolute right-0 top-0 bg-[#ffd23f] text-black text-[9px] font-mono font-extrabold uppercase py-1 px-3 rounded-bl-xl tracking-wider select-none flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Threshold Alert {percent}%</span>
                        </div>
                      )}

                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white tracking-tight">{b.category}</h4>
                          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                            Spent: {b.spentAmount} {b.currency} / Limit: {b.limitAmount} {b.currency}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold font-mono-data ${isOver ? 'text-[#ff4a4a]' : isWarning ? 'text-[#ffd23f]' : 'text-primary'}`}>
                            {percent}%
                          </span>
                          <button 
                            onClick={async () => {
                              if (window.confirm("Permanently deactivate this target spending threshold?")) {
                                const ok = await deleteBudget(b.id);
                                if (ok) {
                                  notifyAndAlert(`Removed threshold protection on ${b.category}`);
                                  fetchBudgets();
                                }
                              }
                            }}
                            className="text-on-surface-variant hover:text-error hover:bg-error/15 p-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Threshold Progress slider bar */}
                      <div className="h-2 bg-surface-variant/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            isOver ? 'bg-[#ff4a4a]' : isWarning ? 'bg-[#ffd23f]' : 'bg-[#00dfc6]'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {budgets.length === 0 && (
                  <div className="p-12 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/30 rounded-3xl font-mono">
                    No category budgets assigned. Setup a target range constraint above.
                  </div>
                )}
              </div>
            </div>

            {/* Savings goals / Reserves pools column with deposit/milestone completions */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Savings Target Pools</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Automated asset allocation containers</p>
                </div>
                <button 
                  onClick={() => setShowAddGoalModal(true)}
                  className="px-3 py-1.5 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-primary hover:text-white hover:bg-surface-variant transition-all cursor-pointer flex items-center gap-1 font-mono"
                >
                  <Plus className="w-3 h-3" />
                  <span>NEW POOL</span>
                </button>
              </div>

              <div className="space-y-4">
                {goals.map((g) => {
                  const percent = Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100);
                  const isCompleted = g.status === 'completed';
                  
                  return (
                    <div 
                      key={g.id} 
                      onClick={() => !isCompleted && handleSavingsContribution(g.id, g.title)}
                      className={`glass-card p-5 flex items-center justify-between hover:scale-[1.01] hover:bg-white/[0.04] transition-all cursor-pointer group relative ${
                        isCompleted ? 'border-[#00dfc6]/40' : ''
                      }`}
                    >
                      {isCompleted && (
                        <div className="absolute right-3 top-2 flex items-center gap-1 text-[#00dfc6] text-[9.5px] font-mono font-bold leading-none select-none">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>COMPLETED</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-full border border-outline-variant/20 flex items-center justify-center relative shrink-0">
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                            <path className="transition-all duration-1000 ease-out" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={g.color || '#2792ff'} strokeWidth="2.5" strokeDasharray={`${percent}, 100`} />
                          </svg>
                          {g.goalType === 'travel' ? (
                            <Plane className="w-4 h-4 text-white" style={{ color: g.color }} />
                          ) : (
                            <Home className="w-4 h-4 text-white" style={{ color: g.color }} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate max-w-[140px]">{g.title}</h4>
                          <p className="text-[10px] text-on-surface-variant font-mono mt-1">
                            {g.currentAmount.toLocaleString()} / {g.targetAmount.toLocaleString()} MAD
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold font-mono" style={{ color: g.color }}>
                          {percent}%
                        </span>
                        {!isCompleted && (
                          <p className="text-[9px] text-[#00dfc6] font-mono mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            Deposit &rarr;
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {goals.length === 0 && (
                  <div className="p-8 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/20 rounded-2xl font-mono">
                    No active savings containers. Click NEW POOL to build future liquid reserves.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* PANEL 3: SUBSCRIPTIONS AUDIT TRACKER */}
        {subTab === 'subscriptions' && (
          <motion.div 
            key="subscriptions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-10 gap-6"
          >
            {/* Active recurring billings list */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Active Recurrences</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Recurring card-routings parsed and tracked by FLOW AI</p>
                </div>
                <div className="bg-secondary-container/25 text-[#cabeff] border border-secondary/35 px-2.5 py-1 rounded-xl text-[10px] font-bold py-1.5 tracking-wider flex items-center gap-1 font-mono select-none">
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  <span>AUDITING ACTIVATED</span>
                </div>
              </div>

              <div className="divide-y divide-outline-variant/15 glass-card p-6 space-y-4 divide-y">
                {storeSubs.filter(s => s.status === 'active').map((sub) => {
                  return (
                    <div key={sub.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface-bright flex items-center justify-center relative shrink-0">
                          {sub.merchantName.toLowerCase().includes('spotify') ? <Music className="w-5 h-5 text-on-surface-variant" /> : <Film className="w-5 h-5 text-on-surface-variant" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{sub.merchantName}</h4>
                          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                            ${sub.amount.toFixed(2)} / {sub.renewalFrequency}
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleTerminateSub(sub.id, sub.merchantName)}
                        className="text-[10px] font-bold text-error bg-error/10 hover:bg-error/25 py-1.5 px-3 rounded-xl font-mono tracking-wider transition-all cursor-pointer"
                      >
                        TERMINATE
                      </button>
                    </div>
                  );
                })}

                {storeSubs.filter(s => s.status === 'active').length === 0 && (
                  <div className="py-8 text-center text-xs text-on-surface-variant font-mono">
                    All recurring automations terminated. Your monthly budget overhead is pristine!
                  </div>
                )}
              </div>
            </div>

            {/* Price overview summary & Future reminders sidebar Calendar */}
            <div className="md:col-span-4 space-y-4">
              <div className="glass-card p-6 flex flex-col justify-between h-[160px] relative overflow-hidden group">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Monthly Outflow Overhead</h3>
                  <p className="text-3xl font-bold font-mono text-[#cabeff] mt-2">
                    ${getSubSum().toFixed(2)}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-mono mt-1">Equivalent across Vercel & Spotify subscriptions</p>
                </div>
                <div className="absolute right-3 bottom-1.5 opacity-5 group-hover:opacity-15 transition-opacity">
                  <DollarSign className="w-24 h-24 text-[#cabeff]" />
                </div>
              </div>

              {/* Renewal reminders Calendar */}
              <div className="glass-card p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#cabeff]" />
                  <span>Autopay Calendar Reminders</span>
                </h4>

                <div className="space-y-3">
                  {storeSubs.filter(s => s.status === 'active').map((sub) => {
                    const renDate = new Date(sub.nextRenewalDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    return (
                      <div key={sub.id} className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                        <span className="text-on-surface-variant font-mono">{sub.merchantName}</span>
                        <span className="text-white font-mono font-semibold">Renews {renDate}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PANEL 4: SMART INSIGHTS FEED */}
        {subTab === 'insights' && (
          <motion.div 
            key="insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 max-w-2xl mx-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Advisory Intelligence Feed</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Non-intrusive smart capital recommendations</p>
              </div>
            </div>

            <div className="space-y-4">
              {insights.map((ins) => {
                const isHigh = ins.priority === 'high';
                const isMedium = ins.priority === 'medium';
                
                return (
                  <div 
                    key={ins.id} 
                    className={`glass-card p-5 relative overflow-hidden flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:border-white/10 ${
                      ins.isRead ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Interactive alert status icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isHigh ? 'bg-[#ff4a4a]/15 text-[#ff4a4a]' : isMedium ? 'bg-[#ffd23f]/15 text-[#ffd23f]' : 'bg-primary/15 text-primary'
                      }`}>
                        {isHigh ? <ShieldAlert className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{ins.title}</h4>
                          <span className={`text-[8.5px] font-mono font-bold leading-none py-0.5 px-2 rounded uppercase tracking-wider ${
                            isHigh ? 'bg-[#ff4a4a] text-black' : isMedium ? 'bg-[#ffd23f] text-black' : 'bg-surface-variant text-white'
                          }`}>
                            {ins.priority}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed select-text">{ins.message}</p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 max-w-sm shrink-0">
                      {!ins.isRead && (
                        <button 
                          onClick={() => markAsRead(ins.id)}
                          className="text-[9px] font-bold font-mono tracking-wider uppercase text-primary bg-primary/10 hover:bg-primary/20 py-1.5 px-3 rounded-lg cursor-pointer"
                        >
                          DISSOLVE
                        </button>
                      )}
                      <button 
                        onClick={() => dismissInsight(ins.id)}
                        className="text-[9px] font-bold font-mono tracking-wider uppercase text-on-surface-variant hover:text-white py-1.5 px-3 rounded-lg cursor-pointer ml-auto md:ml-0"
                      >
                        DISMISS
                      </button>
                    </div>
                  </div>
                );
              })}

              {insights.length === 0 && (
                <div className="p-12 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/20 rounded-3xl font-mono">
                  No active advisory alerts detected. Your portfolio is optimally configured.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PANEL 5: PREMIUM INTELLIGENT SEARCH */}
        {subTab === 'search' && (
          <motion.div 
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Flow AI Semantic Search</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Query assets, invoices, categories, or transaction histories instantly using natural language.</p>
            </div>

            {/* Query Search Bar block */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder='Ask: "How much did I spend on food this month?" or "Show Spotify"'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && search(query)}
                  className="w-full bg-[#0c141d]/80 border border-outline-variant/30 py-3.5 pl-11 pr-4 rounded-2xl text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <button
                onClick={() => search(query)}
                className="px-6 bg-primary text-black font-semibold text-xs rounded-2xl hover:brightness-110 transition-all cursor-pointer shadow-md select-none flex items-center gap-1.5"
              >
                {isSearchLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SOLVE</span>
                  </>
                )}
              </button>
            </div>

            {/* Search Suggestions list */}
            <div className="flex flex-wrap items-center gap-2 select-none">
              <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider pr-1">Try Asking:</span>
              {[
                "How much on food Casablanca?",
                "Show subscriptions active",
                "Figma & Software expenditures",
                "Total USD incomes"
              ].map((sug) => (
                <button
                  key={sug}
                  onClick={() => {
                    setQuery(sug);
                    search(sug);
                  }}
                  className="bg-[#182029] hover:bg-surface-variant text-[10px] font-mono text-gray-400 hover:text-white px-3 py-1.5 rounded-xl border border-white/5 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Smart result layout panel */}
            <AnimatePresence>
              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="glass-card p-6 space-y-6"
                >
                  <div className="flex justify-between items-start pb-4 border-b border-white/5">
                    <div>
                      <p className="text-xs text-on-surface-variant font-mono uppercase tracking-wider">Semantic Parse Outcome</p>
                      <h4 className="text-sm font-bold text-white mt-1 select-all">&ldquo;{searchResult.query}&rdquo;</h4>
                    </div>

                    <button 
                      onClick={clearResult}
                      className="text-gray-400 hover:text-white font-mono text-[10px] uppercase border border-white/10 px-2 py-1 rounded"
                    >
                      RESET
                    </button>
                  </div>

                  {/* Summary Metric box */}
                  <div className="bg-[#142629]/40 border border-[#00dfc6]/10 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-on-surface-variant font-mono">Total Cumulative Spending Matching Query</p>
                      <p className="text-3xl font-bold font-mono text-[#00dfc6] mt-2">
                        {searchResult.result.amount} {searchResult.result.currency}
                      </p>
                    </div>

                    <div className="bg-[#182029] border border-white/5 px-4 py-3 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">Transactions</p>
                      <p className="text-xl font-bold font-mono text-white mt-1">{searchResult.result.transactionCount}</p>
                    </div>
                  </div>

                  {/* Search results filtered transaction log list */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-gray-400">Ledger Match Matches:</p>
                    
                    <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2.5">
                      {searchResult.result.matchingTransactions.map((tx: any) => (
                        <div key={tx.id} className="bg-white/[0.02] hover:bg-white/[0.04] p-3 rounded-xl border border-white/5 flex items-center justify-between transition-colors">
                          <div>
                            <p className="text-xs font-bold text-white">{tx.description}</p>
                            <p className="text-[9.5px] text-on-surface-variant font-mono mt-1">{tx.date} &bull; {tx.category}</p>
                          </div>

                          <span className={`text-xs font-mono font-bold font-mono-data ${tx.type === 'income' ? 'text-[#00dfc6]' : 'text-white'}`}>
                            {tx.type === 'income' ? '+' : '-'} {tx.amount} {tx.currency}
                          </span>
                        </div>
                      ))}

                      {searchResult.result.matchingTransactions.length === 0 && (
                        <p className="text-center py-6 text-xs text-on-surface-variant font-mono">No specific ledger matching records found.</p>
                      )}
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* PANEL 6: COMPLIANT MONTHLY REPORTS */}
        {subTab === 'reports' && (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 max-w-2xl mx-auto"
          >
            <div className="glass-card p-6 relative overflow-hidden space-y-6">
              <div className="absolute top-4 right-4 text-on-surface-variant/30 font-mono text-[9px] select-none text-right">
                <p>FLOW REPORTING PROTOCOL</p>
                <p className="mt-0.5">SECURE DATA LEDGER</p>
              </div>

              <div>
                <span className="bg-primary/10 text-primary border border-primary/25 text-[9px] font-bold uppercase tracking-wider font-mono px-3 py-1 rounded-full inline-block mb-3 select-none">
                  AUTOMATED AUDIT EXPORT
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">Financial Overview Report</h3>
                <p className="text-xs text-on-surface-variant mt-1">Detailed portfolio optimization aggregates under active central banking rules</p>
              </div>

              {isReportLoading ? (
                <div className="py-12 text-center text-xs text-on-surface-variant font-mono">
                  Compiling structural invoice ratios...
                </div>
              ) : mReport ? (
                <div className="space-y-6">
                  
                  {/* Summary Text narrative */}
                  <div className="text-xs text-on-surface-variant leading-relaxed select-text border-l-2 border-[#00dfc6]/40 pl-4 py-1 italic">
                    &ldquo;{mReport.summaryText || 'Report loaded successfully.'}&rdquo;
                  </div>

                  {/* Core aggregates numbers */}
                  <div className="grid grid-cols-3 gap-4 font-mono select-none">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400 uppercase">Inflow USD</p>
                      <p className="text-base font-bold text-[#00dfc6] mt-1">${mReport.inflowAggregateUSD?.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400 uppercase">Outflow USD</p>
                      <p className="text-base font-bold text-[#ff5c5c] mt-1">${mReport.outflowAggregateUSD?.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400 uppercase">Savings Coeff</p>
                      <p className="text-base font-bold text-primary mt-1">{mReport.efficientSavingsCoefficient}x</p>
                    </div>
                  </div>

                  {/* Central banking check mark disclaimer */}
                  <div className="bg-[#182029]/60 border border-white/5 p-4 rounded-xl flex items-center gap-3.5 text-[10.5px] text-on-surface-variant font-mono">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    <div>
                      <p className="text-white font-bold uppercase tracking-wider leading-none">Security Compliance Validated</p>
                      <p className="mt-1">{mReport.complianceStatement}</p>
                    </div>
                  </div>

                </div>
              ) : (
                <p className="text-center font-mono py-12 text-xs text-on-surface-variant">Unable to construct monthly exports. Retry shortly.</p>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* MODAL OVERLAY: ADD BUDGET MODAL */}
      <AnimatePresence>
        {showAddBudgetModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="add-budget-dialog-wrapper">
            <div className="absolute inset-0" role="button" tabIndex={0} onClick={() => setShowAddBudgetModal(false)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAddBudgetModal(false) }} aria-label="Close modal" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c141d] border border-outline-variant/30 max-w-sm w-full rounded-3xl p-6 space-y-4 relative z-10"
            >
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#00E0C7]">New Budget Limit</h4>
                <button onClick={() => setShowAddBudgetModal(false)} className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer">CLOSE</button>
              </div>

              <form className="space-y-4 text-xs" onSubmit={handleAddNewBudget}>
                
                <div className="space-y-1">
                  <label htmlFor="budget-category-select" className="text-gray-400 font-mono font-bold uppercase tracking-wider block">Spending Category</label>
                  <select
                    value={addBudgetCategory}
                    onChange={(e) => setAddBudgetCategory(e.target.value)}
                    className="w-full bg-[#182029] py-2.5 px-3 border border-outline-variant/20 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                    id="budget-category-select"
                  >
                    <option value="Dining">Dining (Cafes, Restaurants)</option>
                    <option value="Software">Software (SaaS, Clouds)</option>
                    <option value="Travel">Travel (Flights, Hotels)</option>
                    <option value="Utilities">Utilities (Taxes, Bills)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="budget-limit-input" className="text-gray-400 font-mono font-bold uppercase tracking-wider block">Budget Cap Limit</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3000"
                      value={addBudgetLimit}
                      onChange={(e) => setAddBudgetLimit(e.target.value)}
                      className="w-full bg-[#182029] py-2.5 px-3 border border-outline-variant/20 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                      id="budget-limit-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="budget-currency-select" className="text-gray-400 font-mono font-bold uppercase tracking-wider block">Wallet Currency</label>
                    <select
                      value={addBudgetCurrency}
                      onChange={(e) => setAddBudgetCurrency(e.target.value)}
                      className="w-full bg-[#182029] py-2.5 px-3 border border-outline-variant/20 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                      id="budget-currency-select"
                    >
                      <option value="MAD">MAD (Dirham)</option>
                      <option value="USD">USD (Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#00dfc6] text-black font-mono font-bold uppercase tracking-widest text-[11px] rounded-xl hover:brightness-110 transition-all mt-4 cursor-pointer"
                >
                  Configure Limit
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL OVERLAY: ADD SAVINGS GOAL GOAL */}
      <AnimatePresence>
        {showAddGoalModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="add-goal-dialog-wrapper">
            <div className="absolute inset-0" role="button" tabIndex={0} onClick={() => setShowAddGoalModal(false)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAddGoalModal(false) }} aria-label="Close modal" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c141d] border border-outline-variant/30 max-w-sm w-full rounded-3xl p-6 space-y-4 relative z-10"
            >
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#00E0C7]">New Savings Pool</h4>
                <button onClick={() => setShowAddGoalModal(false)} className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer">CLOSE</button>
              </div>

              <form className="space-y-4 text-xs" onSubmit={handleAddNewGoalSubmit}>
                
                <div className="space-y-1">
                  <label htmlFor="goal-name-input" className="text-gray-400 font-mono font-bold uppercase tracking-wider block">Goal Designation Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Travel, Emergency Fund"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="w-full bg-[#182029] py-2.5 px-3 border border-outline-variant/20 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                    id="goal-name-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="goal-target-input" className="text-gray-400 font-mono font-bold uppercase tracking-wider block">Target Pool Amount (MAD)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 6000"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      className="w-full bg-[#182029] py-2.5 px-3 border border-outline-variant/20 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                      id="goal-target-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="goal-current-input" className="text-gray-400 font-mono font-bold uppercase tracking-wider block">Starter Balance (MAD)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1500"
                      value={newGoalCurrent}
                      onChange={(e) => setNewGoalCurrent(e.target.value)}
                      className="w-full bg-[#182029] py-2.5 px-3 border border-outline-variant/20 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                      id="goal-current-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="goal-category-select" className="text-gray-400 font-mono font-bold uppercase tracking-wider block">Goal Category</label>
                    <select
                      value={newGoalType}
                      onChange={(e) => setNewGoalType(e.target.value as any)}
                      className="w-full bg-[#182029] py-2.5 px-3 border border-outline-variant/20 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-[#00e0c7]"
                      id="goal-category-select"
                    >
                      <option value="travel">Travel</option>
                      <option value="emergency_fund">Emergency Fund</option>
                      <option value="rent">Rent</option>
                      <option value="electronics">Electronics</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="education">Education</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="goal-icon-select" className="text-gray-400 font-mono font-bold uppercase tracking-wider block">Visual Icon & Palette</label>
                    <select
                      value={newGoalIcon}
                      onChange={(e) => {
                        setNewGoalIcon(e.target.value);
                        setNewGoalColor(e.target.value === 'plane' ? '#00dfc6' : '#a5c8ff');
                      }}
                      className="w-full bg-[#182029] py-2.5 px-3 border border-outline-variant/20 rounded-xl font-mono text-white text-xs focus:outline-none"
                      id="goal-icon-select"
                    >
                      <option value="plane">Plane Accent Teal</option>
                      <option value="home">Home Accent Platinum</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#00dfc6] text-black font-mono font-bold uppercase tracking-widest text-[11px] rounded-xl hover:brightness-110 transition-all mt-4 cursor-pointer"
                >
                  Create Savings goal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
