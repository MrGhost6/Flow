import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  FileCheck,
  Activity,
  TrendingUp,
  Terminal,
  AlertTriangle,
  CheckCircle,
  Lock,
  MessageSquare,
  RefreshCw,
  Sliders,
  Search,
  UserCheck,
  Send,
  Bell
} from 'lucide-react';
import {
  useAdminStore,
  useKycStore,
  useModerationStore,
  useFraudOpsStore,
  useSupportOpsStore,
  useAuditStore,
  useAdminAnalyticsStore,
  AdminRole,
  AdminUserDetail
} from '../stores/adminStore';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AdminPanel() {
  const {
    currentRole,
    setRole,
    metrics,
    activityChart,
    notifications,
    isLoading: adminLoading,
    fetchDashboard,
    fetchNotifications,
    markNotificationRead,
    triggerSystemWideFreeze
  } = useAdminStore();

  const {
    submissions,
    selectedSubmission,
    fetchSubmissions,
    selectSubmission,
    reviewSubmission
  } = useKycStore();

  const {
    users,
    selectedUser,
    fetchUsers,
    fetchUserDetail,
    setUserStatus,
    freezeUser,
    restrictUser,
    assignAdminRole
  } = useModerationStore();

  const {
    events,
    selectedEvent,
    fetchEvents,
    selectEvent,
    resolveEvent,
    escalateEvent
  } = useFraudOpsStore();

  const {
    tickets,
    selectedTicket,
    fetchTickets,
    fetchTicketDetail,
    updateTicketAttributes,
    sendAgentReply
  } = useSupportOpsStore();

  const { logs, fetchLogs } = useAuditStore();

  const {
    usersMetric,
    transactionsMetric,
    fraudMetric,
    supportMetric,
    fetchAnalytics
  } = useAdminAnalyticsStore();

  // Active sub-navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'users' | 'kyc' | 'surveillance' | 'fraud' | 'support' | 'audits' | 'analytics'>('dashboard');

  // Search filter and local states
  const [userQuery, setUserQuery] = useState('');
  const [txQuery, setTxQuery] = useState('');
  const [auditQuery, setAuditQuery] = useState('');
  const [auditCategory, setAuditCategory] = useState<string>('ALL');

  // Moderation overriding state
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  
  // KYC Remarks input
  const [kycRemarks, setKycRemarks] = useState('');
  
  // Support ticket agent response text
  const [agentText, setAgentText] = useState('');
  
  // System lockdown simulation feedback
  const [lockdownTriggered, setLockdownTriggered] = useState(false);

  // Notifications toggle list
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Syncing all stores on panel mount
  const refreshAllAdminWorkspaces = async () => {
    await Promise.all([
      fetchDashboard(),
      fetchNotifications(),
      fetchSubmissions(),
      fetchUsers(),
      fetchEvents(),
      fetchTickets(),
      fetchLogs(),
      fetchAnalytics()
    ]);
  };

  useEffect(() => {
    refreshAllAdminWorkspaces();
    // Fetch notifications interval loop
    const interval = setInterval(() => {
      fetchNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Filter lists based on states
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.userType.toLowerCase().includes(userQuery.toLowerCase())
  );

  const filteredAudits = logs.filter(l => {
    const matchesQuery = l.action.toLowerCase().includes(auditQuery.toLowerCase()) ||
                         l.details.toLowerCase().includes(auditQuery.toLowerCase()) ||
                         (l.userId && l.userId.toLowerCase().includes(auditQuery.toLowerCase()));
    const matchesCategory = auditCategory === 'ALL' || l.category === auditCategory;
    return matchesQuery && matchesCategory;
  });

  // Verify Role permissions dynamically to implement authentic operational UX
  const getRolePermissions = (role: AdminRole) => {
    if (role === 'super_admin') return { label: 'Universal Operator', color: 'text-violet-400 bg-violet-400/10 border-violet-500/30' };
    if (role === 'compliance_admin') return { label: 'Regulatory Officer', color: 'text-teal-400 bg-teal-400/10 border-teal-500/30' };
    if (role === 'risk_agent') return { label: 'Risk Specialist', color: 'text-rose-400 bg-rose-400/10 border-rose-500/30' };
    if (role === 'support_agent') return { label: 'Client Success', color: 'text-sky-400 bg-sky-400/10 border-sky-500/30' };
    if (role === 'finance_admin') return { label: 'Treasury Controller', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30' };
    return { label: 'Operations Specialist', color: 'text-amber-400 bg-amber-400/10 border-amber-500/30' };
  };

  const handleGlobalLockdownTrigger = async () => {
    if (window.confirm('CRITICAL ACTION: Trigger worldwide regulatory lockdown? This freezes all in-memory live ledgers and isolates payment routing pathways immediately.')) {
      const ok = await triggerSystemWideFreeze();
      if (ok) {
        setLockdownTriggered(true);
        toast.error('WORLDWIDE FINTECH LOCKDOWN ARMED. ALL ACCOUNTS SUSPENDED FROM RUNNING TRANSACTIONS.');
        await refreshAllAdminWorkspaces();
      }
    }
  };

  const handleKycReviewOutcome = async (status: 'approved' | 'rejected') => {
    if (!selectedSubmission) return;
    const ok = await reviewSubmission(selectedSubmission.id, status, kycRemarks);
    if (ok) {
      setKycRemarks('');
      selectSubmission(null);
      await fetchDashboard();
      await fetchUsers();
    } else {
      toast.error('Error recording regulatory decision.');
    }
  };

  const handleSendTicketReply = async () => {
    if (!selectedTicket || !agentText.trim()) return;
    const ok = await sendAgentReply(selectedTicket.id, agentText);
    if (ok) {
      setAgentText('');
      // Refresh local view
      await fetchTicketDetail(selectedTicket.id);
      await fetchTickets();
    }
  };

  const handleTriggerQuickFreeze = async (userId: string) => {
    const ok = await freezeUser(userId);
    if (ok) {
      if (selectedUser?.id === userId) {
        await fetchUserDetail(userId);
      }
      await fetchUsers();
      await fetchDashboard();
    }
  };

  const handleTriggerQuickRestrict = async (userId: string) => {
    const ok = await restrictUser(userId);
    if (ok) {
      if (selectedUser?.id === userId) {
        await fetchUserDetail(userId);
      }
      await fetchUsers();
    }
  };

  // Recharts custom label template
  const COLORS = ['#00dfc6', '#1E90FF', '#7B5CFF', '#FFA500'];

  return (
    <div className="w-full bg-[#080D14] text-gray-200 min-h-screen rounded-[24px] border border-white/5 overflow-hidden flex flex-col" id="operations-control-panel">
      
      {/* Header */}
      <header className="px-6 py-5 bg-[#0C121E]/90 border-b border-white/5 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight uppercase font-mono text-white">FLOW CONTROL CENTER</h1>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">ADMIN</span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Fintech Operating System Admin • Realtime Regulatory Core</p>
          </div>
        </div>

        {/* CONTROLS AREA WITH ROLE SWITCHER & NOTIFICATION BOX */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Realtime Admin Notification dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-[#00E0C7] hover:border-[#00E0C7]/30 transition-all relative"
              id="admin-notif-bell"
            >
              <Bell className="w-4 h-4" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-[#0C121E] rounded-full animate-ping" aria-hidden="true" />
              )}
            </button>

            {/* Notification Drawer Pop-up */}
            <AnimatePresence>
              {showNotificationsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-[#121824] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold font-mono text-white">ADMIN ALERTS FEED</span>
                    <span className="text-[10px] font-mono text-gray-400">{notifications.filter(n => !n.read).length} unread</span>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-gray-500 text-center font-mono py-6">All systems nominal. No open regulatory alerts.</p>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            notif.read ? 'bg-[#0A0F17]/40 border-white/5' : 'bg-white/[0.03] border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                              notif.severity === 'critical' ? 'bg-rose-500/20 text-rose-300' :
                              notif.severity === 'warning' ? 'bg-amber-500/20 text-amber-300' : 'bg-teal-500/20 text-teal-300'
                            }`}>
                              {notif.category}
                            </span>
                            {!notif.read && (
                              <button
                                onClick={() => markNotificationRead(notif.id)}
                                className="text-[9px] text-[#00E0C7] hover:underline font-mono"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-300 font-mono mt-1.5 leading-snug">{notif.text}</p>
                          <span className="text-[8px] text-gray-500 font-mono mt-1 block">Just now • Sim Trace</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACTIVE ROLE SELECTOR CONSOLE */}
          <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 px-3 py-1.5 max-w-[210px] md:max-w-[260px]">
            <Sliders className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={currentRole}
              onChange={(e) => {
                setRole(e.target.value as AdminRole);
                refreshAllAdminWorkspaces();
              }}
              className="bg-transparent border-none text-[10px] font-mono text-white focus:outline-none focus:ring-0 cursor-pointer uppercase pr-2 font-bold"
              id="admin-role-override-selector"
            >
              <option value="super_admin" className="bg-[#0C121E]">Role: Super Admin</option>
              <option value="compliance_admin" className="bg-[#0C121E]">Role: Compliance Officer</option>
              <option value="risk_agent" className="bg-[#0C121E]">Role: Risk Agent</option>
              <option value="support_agent" className="bg-[#0C121E]">Role: Support Agent</option>
              <option value="finance_admin" className="bg-[#0C121E]">Role: Treasury Admin</option>
              <option value="operations_admin" className="bg-[#0C121E]">Role: Operations Specials</option>
            </select>
          </div>
          
          {/* Quick Refresh All Stores */}
          <button
            onClick={refreshAllAdminWorkspaces}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-teal-400 active:rotate-90 transition-all font-mono"
            title="Refresh Operations State"
          >
            <RefreshCw className="w-4 h-4 animate-hover" />
          </button>
        </div>
      </header>

      {/* Sub-navigation */}
      <div className="bg-[#0A0F17] border-b border-white/5 px-6 py-1 overflow-x-auto flex gap-1 scrollbar-none z-40">
        
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider font-bold border-b-2 shrink-0 transition-all ${
            activeSubTab === 'dashboard' ? 'text-[#00E0C7] border-[#00E0C7]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
          Dashboard
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider font-bold border-b-2 shrink-0 transition-all ${
            activeSubTab === 'users' ? 'text-[#00E0C7] border-[#00E0C7]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
          Users Moderation
        </button>

        <button
          onClick={() => setActiveSubTab('kyc')}
          className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider font-bold border-b-2 shrink-0 transition-all ${
            activeSubTab === 'kyc' ? 'text-[#00E0C7] border-[#00E0C7]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
          Compliance Queue
        </button>

        <button
          onClick={() => setActiveSubTab('surveillance')}
          className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider font-bold border-b-2 shrink-0 transition-all ${
            activeSubTab === 'surveillance' ? 'text-[#00E0C7] border-[#00E0C7]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
          Surveillance
        </button>

        <button
          onClick={() => setActiveSubTab('fraud')}
          className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider font-bold border-b-2 shrink-0 transition-all relative ${
            activeSubTab === 'fraud' ? 'text-[#00E0C7] border-[#00E0C7]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
          Fraud Desk
          {events.some(e => e.status !== 'RESOLVED') && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 text-[8px] font-mono border border-rose-500/20">ALERT</span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('support')}
          className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider font-bold border-b-2 shrink-0 transition-all ${
            activeSubTab === 'support' ? 'text-[#00E0C7] border-[#00E0C7]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
          Support Ops
        </button>

        <button
          onClick={() => setActiveSubTab('audits')}
          className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider font-bold border-b-2 shrink-0 transition-all ${
            activeSubTab === 'audits' ? 'text-[#00E0C7] border-[#00E0C7]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
          Audit Explorer
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider font-bold border-b-2 shrink-0 transition-all ${
            activeSubTab === 'analytics' ? 'text-[#00E0C7] border-[#00E0C7]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 inline mr-1.5 align-middle" />
          Analytics
        </button>

      </div>

      {/* Selected view */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* DISPLAY ROLE WARNING TO INDICATE OPERATOR PRIV_RESTRICTION */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <div className="text-[10px] font-mono font-bold">
                Admin Privilege Active: <span className={`px-2 py-0.5 font-bold uppercase rounded border ${getRolePermissions(currentRole).color}`}>{getRolePermissions(currentRole).label}</span>
              </div>
            </div>
            <div className="text-[9px] font-mono text-gray-500">
              Clearance Authorization Grade: Level {currentRole === 'super_admin' ? '5' : '3'} Global Ingress
            </div>
          </div>

          {/* ==================================================== */}
          {/* 1. VIEW: DASHBOARD CONTROLS AND HIGH-LEVEL METRICS */}
          {/* ==================================================== */}
          {activeSubTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in" id="admin-subview-dashboard">
              
              {/* BENTO STAT GRIDS */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                
                <div className="col-span-12 lg:col-span-2 bg-[#0C121E]/60 border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Secured Volume Inflow</span>
                  <div className="mt-3">
                    <span className="text-xl sm:text-2xl font-bold font-mono text-white">${metrics?.totalVolumeUSD.toLocaleString() || '185,420'}</span>
                    <span className="text-[10px] text-teal-400 ml-1.5 font-mono">USD</span>
                  </div>
                  <div className="text-[9px] text-teal-400 font-mono flex items-center gap-1 mt-3">
                    <TrendingUp className="w-3 h-3" /> +15.4% week aggregate routing
                  </div>
                </div>

                <div className="col-span-1 bg-[#0C121E]/60 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Client Users</span>
                  <div className="mt-3">
                    <span className="text-xl sm:text-2xl font-bold font-mono text-white">{metrics?.activeUsers || '4'}</span>
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono mt-3">Active live ledgers</div>
                </div>

                <div className="col-span-1 bg-[#0C121E]/60 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Compliance Ratio</span>
                  <div className="mt-3">
                    <span className="text-xl sm:text-2xl font-bold font-mono text-[#00E0C7]">{metrics?.complianceRatio || '96.4'}%</span>
                  </div>
                  <div className="text-[9px] text-teal-400 font-mono mt-3">Nominal Health</div>
                </div>

                <div className="col-span-1 bg-[#0C121E]/60 border border-white/5 rounded-2xl p-5 flex flex-col justify-between border-rose-500/10">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Open Fraud Alerts</span>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className={`text-xl sm:text-2xl font-bold font-mono ${metrics && metrics.openFraudAlerts > 0 ? 'text-rose-400' : 'text-white'}`}>
                      {metrics?.openFraudAlerts ?? '2'}
                    </span>
                    {metrics && metrics.openFraudAlerts > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping align-middle" aria-label="Active fraud alerts" />}
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono mt-3">Requires Risk Action</div>
                </div>

                <div className="col-span-1 bg-[#0C121E]/60 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider text-amber-300">Awaiting KYC</span>
                  <div className="mt-3">
                    <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300">{metrics?.pendingKYC ?? '1'}</span>
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono mt-3">CNIE uploads pending</div>
                </div>

              </div>

              {/* RECHARTS HIGH-RESTIVITY LOG VOLUMES & OPERATOR EMERGENCY CONTROLS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Interactive Chart */}
                <div className="lg:col-span-8 bg-[#0C121E]/40 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Interactive System Secured Volumes</h3>
                      <p className="text-[10px] text-gray-500 font-mono">Daily volume aggregate routed over clearing pathways</p>
                    </div>
                    <span className="text-[9px] px-2.5 py-1 bg-teal-400/10 text-teal-300 rounded-full font-mono font-bold border border-teal-500/20">LIVE ROUTING DIRECTORY</span>
                  </div>

                  <div className="h-64 sm:h-72 w-full pr-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityChart.length > 0 ? activityChart : [
                        { date: "May 20", volumeSecured: 28400, activeSecs: 180 },
                        { date: "May 21", volumeSecured: 31200, activeSecs: 195 },
                        { date: "May 22", volumeSecured: 35000, activeSecs: 210 },
                        { date: "May 23", volumeSecured: 42100, activeSecs: 220 },
                        { date: "May 24", volumeSecured: 48500, activeSecs: 240 },
                        { date: "May 25", volumeSecured: 52400, activeSecs: 255 },
                        { date: "May 26", volumeSecured: 64180, activeSecs: 280 }
                      ]}>
                        <defs>
                          <linearGradient id="chartVol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00dfc6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#00dfc6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={9} fontStyle="italic" />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} fontStyle="italic" />
                        <Tooltip contentStyle={{ backgroundColor: '#0C121E', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="volumeSecured" name="Secured Volume ($)" stroke="#00dfc6" strokeWidth={2.5} fillOpacity={1} fill="url(#chartVol)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CRITICAL FINTECH EMERGENCY CONTROL STATION */}
                <div className="lg:col-span-4 bg-[#110B13]/30 border border-rose-500/10 rounded-3xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="w-4 h-4 text-rose-400" />
                      <h3 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-widest">REGULATORY CONTROL</h3>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                      Emergency override station granting absolute authority to operational admins. Forces immediate system lockdown, freezing all accounts from transactional outflows in order to arrest compliance anomalies or high-alert breaches.
                    </p>
                  </div>

                  <div className="my-6 space-y-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span>FLOW Clearing Node State:</span>
                      <span className="text-emerald-400 font-bold">ONLINE</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span>Ledger Database Integrity:</span>
                      <span className="text-emerald-400 font-bold">SECURED (100%)</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span>Sanctions Filter Version:</span>
                      <span className="text-gray-400">v11.9.42_MENA</span>
                    </div>
                  </div>

                  {currentRole === 'super_admin' ? (
                    <button
                      onClick={handleGlobalLockdownTrigger}
                      disabled={lockdownTriggered}
                      className={`w-full py-3 rounded-xl font-mono uppercase text-[10px] tracking-wider font-bold transition-all border ${
                        lockdownTriggered
                          ? 'bg-rose-500/50 text-white border-rose-500'
                          : 'bg-rose-500 border-transparent hover:bg-rose-400 text-black'
                      }`}
                    >
                      {lockdownTriggered ? '🔒 EMERGENCY LOCKED DOWN' : '🚨 ACTIVATE WORLDWIDE LOCKDOWN'}
                    </button>
                  ) : (
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center text-[9px] font-mono text-gray-500 uppercase">
                      Requires Super Admin credentials to initiate lockdown override
                    </div>
                  )}

                </div>

              </div>

              {/* RECENT SYSTEM AUDIT EVENTS */}
              <div className="bg-[#0C121E]/30 border border-white/5 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00E0C7]" />
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Immediate Administrative Audit Log</h3>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('audits')}
                    className="text-[9px] font-mono text-[#00E0C7] hover:underline"
                  >
                    View audit explorer ({logs.length} traces) →
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {logs.slice(0, 5).map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-left">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${
                          log.severity === 'CRITICAL' ? 'bg-rose-500' :
                          log.severity === 'WARNING' ? 'bg-amber-500' : 'bg-teal-400'
                        }`} aria-label={log.severity} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-gray-200">{log.action.replace(/_/g, " ")}</span>
                            <span className="text-[8px] font-mono text-gray-400 tracking-wider">[{log.category}]</span>
                          </div>
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5">{log.details}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[8px] font-mono text-gray-500 block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="text-[8px] font-mono text-[#00E0C7] block mt-0.5">{log.ipAddress}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* 2. VIEW: USERS MODERATION BOARD */}
          {/* ==================================================== */}
          {activeSubTab === 'users' && (
            <div className="space-y-6 animate-fade-in" id="admin-subview-users">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">FLOW Client Ledger Registry</h2>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Moderate accounts, override compliance flags, adjust status profiles</p>
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Search ledger by client name, email..."
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#00E0C7] focus:border-transparent text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Advanced Table Grid list */}
                <div className="lg:col-span-8 bg-[#0C121E]/30 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-white/5 bg-[#0C121E]/60 flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-white uppercase">Client Accounts Pool ({filteredUsers.length})</span>
                    <span className="text-[9px] text-gray-400 font-mono font-bold italic">Simulated in-memory DB</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[10.5px]" aria-label="Client accounts table">
                      <thead className="bg-[#0C121E]/50 border-b border-white/5 text-gray-400 tracking-wider">
                        <tr>
                          <th className="p-4 font-bold text-gray-400">CLIENT USER</th>
                          <th className="p-4 font-bold text-gray-400">TYPE</th>
                          <th className="p-4 font-bold text-gray-400 text-center">RISK STATUS</th>
                          <th className="p-4 font-bold text-gray-400 text-center">KYC REVIEW</th>
                          <th className="p-4 font-bold text-gray-400 text-center">ACCOUNT STATE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.map(u => (
                          <tr
                            key={u.id}
                            onClick={() => fetchUserDetail(u.id)}
                            className={`hover:bg-white/[0.02] cursor-pointer transition-all ${
                              selectedUser?.id === u.id ? 'bg-[#00E0C7]/5 border-l-2 border-[#00E0C7]' : ''
                            }`}
                          >
                            <td className="p-4 text-left">
                              <span className="font-bold text-white block">{u.name}</span>
                              <span className="text-[9px] text-gray-400 block mt-0.5">{u.email}</span>
                            </td>
                            <td className="p-4 uppercase text-gray-400 font-bold">{u.userType}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                u.riskScore > 50 ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                                u.riskScore > 20 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                              }`}>
                                {u.riskScore} / 100
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                                u.kycStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-300' :
                                u.kycStatus === 'under_review' ? 'bg-[#1E90FF]/10 text-[#1E90FF]' : 'bg-rose-500/10 text-rose-300'
                              }`}>
                                {u.kycStatus.replace(/_/, ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                                u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                u.status === 'restricted' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Split Context Details Moderation Drawer */}
                <div className="lg:col-span-4 bg-[#0C121E]/60 border border-white/5 rounded-3xl p-5 shadow-2xl">
                  {selectedUser ? (
                    <div className="space-y-5 text-left animate-fade-in">
                      
                      {/* Name block */}
                      <div className="border-b border-white/5 pb-4">
                        <span className="text-[8px] font-mono text-gray-400 block uppercase">Client Reference Code: {selectedUser.id}</span>
                        <h4 className="text-sm font-bold text-white mt-1 uppercase font-mono">{selectedUser.name}</h4>
                        <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">{selectedUser.email}</span>
                        <span className="text-[9px] font-mono text-gray-500 block mt-1">{selectedUser.country} · DOB: {selectedUser.dob}</span>
                      </div>

                      {/* Financial Vault balances summary */}
                      <div>
                        <span className="text-[8px] font-mono text-yellow-400 uppercase tracking-wider block mb-2">Vault multi-currency ledgers</span>
                        <div className="grid grid-cols-3 gap-2 bg-[#080D14] p-3 rounded-2xl border border-white/5 font-mono">
                          {selectedUser.wallets && selectedUser.wallets.map((w: any) => (
                            <div key={w.id} className="text-center">
                              <span className="text-[9px] text-gray-500 uppercase block">{w.currency}</span>
                              <span className="text-xs font-bold text-white block mt-1">${w.balance.toLocaleString()}</span>
                            </div>
                          ))}
                          {(!selectedUser.wallets || selectedUser.wallets.length === 0) && (
                            <div className="col-span-3 text-center text-[9px] text-gray-500 py-1 italic">No live balances initialized.</div>
                          )}
                        </div>
                      </div>

                      {/* Override compliance controls */}
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <span className="text-[8px] font-mono text-gray-400 uppercase tracking-wider block">Admin Force Overwrite</span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTriggerQuickFreeze(selectedUser.id)}
                            className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold border border-rose-500/20 rounded-xl text-[9px] font-mono uppercase transition-all"
                            title="Super locking limits outflows directly"
                          >
                            Freeze Ledger
                          </button>
                          
                          <button
                            onClick={() => handleTriggerQuickRestrict(selectedUser.id)}
                            className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold border border-amber-500/20 rounded-xl text-[9px] font-mono uppercase transition-all"
                            title="Restricts foreign wire outflows"
                          >
                            Restrict Account
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const ok = await setUserStatus(selectedUser.id, 'active');
                            }}
                            className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl text-[9px] font-mono font-bold uppercase transition-all"
                          >
                            Set Active (Nominal)
                          </button>
                        </div>
                      </div>

                      {/* Admin Operational Role assignment */}
                      {currentRole === 'super_admin' && (
                        <div className="pt-4 border-t border-white/5 space-y-2">
                          <span className="text-[8px] font-mono text-purple-400 uppercase tracking-wider block">In-House Staff Assignments</span>
                          <div className="flex items-center gap-2 bg-[#080D14] rounded-xl border border-white/5 p-2">
                            <Sliders className="w-3.5 h-3.5 text-gray-500" />
                            <select
                              value={selectedUser.role || ''}
                              onChange={async (e) => {
                                const roleVal = e.target.value ? e.target.value : null;
                                const ok = await assignAdminRole(selectedUser.id, roleVal);
                                if (ok) {
                                  toast.success(`Staff privileges updated successfully on user ${selectedUser.name}`);
                                }
                              }}
                              className="bg-transparent border-none text-[9px] font-mono text-white focus:outline-none focus:ring-0 cursor-pointer uppercase w-full font-bold"
                            >
                              <option value="" className="bg-[#121824]">Assign Role: Client Client</option>
                              <option value="super_admin" className="bg-[#121824]">Authorize Super Admin</option>
                              <option value="compliance_admin" className="bg-[#121824]">Authorize Compliance Agent</option>
                              <option value="risk_agent" className="bg-[#121824]">Authorize Risk Agent</option>
                              <option value="support_agent" className="bg-[#121824]">Authorize Support Agent</option>
                            </select>
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="py-24 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto stroke-1" />
                      <p className="text-[10px] font-mono text-gray-400 mt-2">Select a user profile from client registry to audit database fields.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* 3. VIEW: KYC COMPLIANCE QUEUE */}
          {/* ==================================================== */}
          {activeSubTab === 'kyc' && (
            <div className="space-y-6 animate-fade-in" id="admin-subview-kyc">
              
              <div>
                <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">KYC Verification Inbox (CNIE submissions)</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Biometric evaluation, document inspection, and sanctions checklist overriding</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Pending List */}
                <div className="lg:col-span-4 bg-[#0C121E]/40 border border-white/5 rounded-3xl overflow-hidden self-start">
                  <div className="p-4 border-b border-white/5 bg-[#0C121E]/60">
                    <span className="text-[10px] font-mono font-bold text-white uppercase">Verification Queue ({submissions.length})</span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {submissions.length === 0 ? (
                      <p className="p-8 text-[10px] font-mono text-gray-500 text-center italic">Compliance Queue is totally clear. Nice!</p>
                    ) : (
                      submissions.map(sub => (
                        <div
                          key={sub.id}
                          onClick={() => selectSubmission(sub)}
                          className={`p-4 text-left cursor-pointer transition-all ${
                            selectedSubmission?.id === sub.id ? 'bg-[#00E0C7]/5 border-l-2 border-[#00E0C7]' : 'hover:bg-white/[0.01]'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10.5px] font-bold text-white block">Doc Ref ID: {sub.id.toUpperCase()}</span>
                            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                              sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                              sub.status === 'under_review' ? 'bg-[#1E90FF]/15 text-[#1E90FF] border border-[#1E90FF]/25' : 'bg-rose-500/10 text-rose-300'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-400 block mt-1.5">User Code ID: {sub.userId}</span>
                          <span className="text-[9px] text-gray-500 block mt-0.5 font-mono">Uploaded: {new Date(sub.submittedAt).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Submissions interactive inspector workspace */}
                <div className="lg:col-span-8 bg-[#0C121E]/60 border border-white/5 rounded-3xl p-6 shadow-2xl min-h-[400px]">
                  {selectedSubmission ? (
                    <div className="space-y-6 text-left animate-fade-in">
                      
                      {/* Sub Header info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
                        <div>
                          <span className="text-[8px] font-mono text-[#00E0C7] uppercase">Biometric CNIE Inspection View</span>
                          <h3 className="text-sm font-bold text-white uppercase font-mono mt-1">Submission Code Key: {selectedSubmission.id.toUpperCase()}</h3>
                          <span className="text-[9px] text-gray-400 block mt-0.5">Linked Client User Reference: {selectedSubmission.userId}</span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[9px] text-gray-500 font-mono italic">Submitted Timestamp:</span>
                          <span className="text-[10px] font-mono text-gray-300 block font-bold">{new Date(selectedSubmission.submittedAt).toLocaleDateString()} at {new Date(selectedSubmission.submittedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {/* Split Column holding placeholder Document graphic vs metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Placeholder biometrics document display */}
                        <div className="bg-[#080D14] border border-white/10 rounded-2xl aspect-[1.5] w-full p-4 flex flex-col justify-between relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-teal-400 animate-pulse" />
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[8px] font-mono text-gray-500 block">KINGDOM OF MOROCCO</span>
                              <span className="text-[9px] font-mono font-bold text-white block">CARTE NATIONALE D'IDENTITE</span>
                            </div>
                            <Shield className="w-5 h-5 text-gray-500 opacity-60" />
                          </div>

                          <div className="flex gap-3 my-3">
                            <div className="w-12 h-14 bg-white/5 border border-white/10 rounded flex items-center justify-center text-gray-500 relative">
                              <UserCheck className="w-6 h-6 stroke-1 text-[#00E0C7]/40" />
                            </div>
                            <div className="space-y-1 text-left font-mono">
                              <span className="text-[9px] text-white block font-bold">SOVFIANE ALAMI</span>
                              <span className="text-[8px] text-gray-400 block">DOB: 18 NOV 2002</span>
                              <span className="text-[8px] text-gray-400 block">No: BK-912040</span>
                              <span className="text-[8px] text-[#00E0C7] block uppercase font-bold">CNIE Biometric Certified</span>
                            </div>
                          </div>

                          <div className="text-[7px] font-mono text-gray-600 tracking-widest leading-none">
                            I D M A R B K 9 1 2 0 4 0 5 &lt; &lt; &lt; &lt; &lt; &lt; &lt; &lt; &lt; &lt; &lt; &lt;
                          </div>
                        </div>

                        {/* checklist status */}
                        <div className="space-y-4">
                          <span className="text-[8px] font-mono text-yellow-500 uppercase tracking-wider block">Automatic Compliance Checklist</span>
                          
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center bg-[#080D14] p-2.5 rounded-xl border border-white/5">
                              <span className="text-[10px] font-mono text-gray-400">OCR Text Extraction:</span>
                              <span className="text-[9px] text-emerald-300 font-bold uppercase font-mono flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-400" /> SUCCEEDED (MATCH)
                              </span>
                            </div>

                            <div className="flex justify-between items-center bg-[#080D14] p-2.5 rounded-xl border border-white/5">
                              <span className="text-[10px] font-mono text-gray-400">MENA Sanctions Screening:</span>
                              <span className="text-[9px] text-emerald-300 font-bold uppercase font-mono flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-400" /> PASSED CLEAR
                              </span>
                            </div>

                            <div className="flex justify-between items-center bg-[#080D14] p-2.5 rounded-xl border border-white/5">
                              <span className="text-[10px] font-mono text-gray-400">PEP (Politically Exposed):</span>
                              <span className="text-[9px] text-emerald-300 font-bold uppercase font-mono flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-400" /> INDICATION: NULL
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* OFFICER EVALUATION FIELD */}
                      <div className="bg-[#080D14] p-5 rounded-2xl border border-white/5 text-left space-y-3">
                        <span className="text-[8px] font-mono text-gray-400 uppercase block">Compliance Remarks (Persisted in immutable audit log)</span>
                        <textarea
                          value={kycRemarks}
                          onChange={(e) => setKycRemarks(e.target.value)}
                          placeholder="Type regulatory findings or remarks here... e.g. Face ID matches legal database and document matches CNIE standards."
                          className="w-full bg-[#0C121E] border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#00E0C7] focus:border-transparent h-20"
                        />

                        {currentRole === 'super_admin' || currentRole === 'compliance_admin' ? (
                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => handleKycReviewOutcome('rejected')}
                              className="px-5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/25 rounded-xl text-xs font-bold uppercase font-mono transition-all"
                            >
                              Reject & Restrict Ledger
                            </button>
                            <button
                              onClick={() => handleKycReviewOutcome('approved')}
                              className="px-5 py-2.5 bg-emerald-500 text-black rounded-xl text-xs font-bold uppercase font-mono transition-all"
                            >
                              Approve Documents
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-white/[0.01] border border-dashed border-white/10 rounded-xl text-center text-[9px] font-mono text-gray-500 uppercase">
                            Your active agent role is restricted from recording regulatory KYC decisions
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="py-32 text-center text-gray-500">
                      <FileCheck className="w-10 h-10 mx-auto stroke-1" />
                      <p className="text-[11px] font-mono text-gray-400 mt-2">Select a submission from compliance verification queue to audit legal documents.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* 4. VIEW: TRANSACTION RISK SURVEILLANCE */}
          {/* ==================================================== */}
          {activeSubTab === 'surveillance' && (
            <div className="space-y-6 animate-fade-in" id="admin-subview-surveillance">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">FLOW Transaction Surveillance & Clearing Engine</h2>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Real-time surveillance tracing of all multi-currency entries logged in FLOW database</p>
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={txQuery}
                    onChange={(e) => setTxQuery(e.target.value)}
                    placeholder="Search surveillance log by reference, description..."
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#00E0C7] focus:border-transparent text-white"
                  />
                </div>
              </div>

              {/* Advanced Real-time surveillance table */}
              <div className="bg-[#0C121E]/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-4 bg-[#0C121E]/60 border-b border-white/5 flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold text-white uppercase">Ledger Clearing Monitor (Live Tracking)</span>
                  <span className="text-emerald-400 animate-pulse font-bold flex items-center gap-1">● RUNNING</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10.5px]" aria-label="Transit logs table">
                    <thead className="bg-[#0C121E]/50 border-b border-white/5 text-gray-400 uppercase tracking-widest text-[9.5px]">
                      <tr>
                        <th className="p-4">REFERENCE ID</th>
                        <th className="p-4">DATE</th>
                        <th className="p-4">CLIENT USER / RISK</th>
                        <th className="p-4">IN-APP DESCRIPTION</th>
                        <th className="p-4 text-center">CATEGORY</th>
                        <th className="p-4 text-right">LEDGER AMOUNT</th>
                        <th className="p-4 text-center">SURVEILLANCE FLAG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.slice(0, 10).map((log, index) => {
                        const amount = index === 0 ? 1850 : index === 1 ? 20 : index === 2 ? 120 : 144;
                        const currency = index === 2 ? 'MAD' : 'USD';
                        const isExp = index !== 0;
                        const ref = `REF-TX-${log.id.slice(-6)}`;
                        
                        return (
                          <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                            <td className="p-4 text-gray-300 font-bold tracking-wider">{ref}</td>
                            <td className="p-4 text-gray-400">{new Date(log.timestamp).toLocaleDateString()}</td>
                            <td className="p-4 text-left">
                              <span className="text-white font-bold block">Anas El Amrani</span>
                              <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-teal-400/10 text-teal-400 font-bold border border-teal-500/15">RISK SCORE: 12</span>
                            </td>
                            <td className="p-4 text-white font-bold">{log.details}</td>
                            <td className="p-4 text-center">
                              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/5 text-[9px] uppercase font-bold text-gray-300">
                                {log.category}
                              </span>
                            </td>
                            <td className={`p-4 text-right font-bold text-[11px] ${isExp ? 'text-gray-400' : 'text-emerald-400'}`}>
                              {isExp ? '-' : '+'}{amount.toLocaleString()} {currency}
                            </td>
                            <td className="p-4 text-center">
                              {index === 1 ? (
                                <span className="px-2 py-0.5 rounded font-bold uppercase text-[8px] bg-rose-500/10 text-rose-300 border border-rose-500/15 animate-pulse">FLAGGED SUSPICIOUS</span>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const reasonVal = prompt('Enter flag audit remarks:');
                                    if (reasonVal) {
                                      toast.success('Flag record successfully saved in operational repository.');
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 border border-white/5 hover:border-rose-500/25 rounded font-bold uppercase text-[8px] transition-all"
                                >
                                  Flag Suspect
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* 5. VIEW: SUSPICIOUS FRAUD OPERATIONS DESK */}
          {/* ==================================================== */}
          {activeSubTab === 'fraud' && (
            <div className="space-y-6 animate-fade-in" id="admin-subview-fraud">
              
              <div>
                <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">FLOW Fraud Operations Desk & Signals</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Surveillance signal processor detecting travel anomalies, card spiking, and velocity velocity locks</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Impossible Travel and decline sequence alerts */}
                <div className="lg:col-span-7 bg-[#0C121E]/30 border border-white/5 rounded-3xl overflow-hidden shadow-xl self-start">
                  <div className="p-4 bg-[#0C121E]/60 border-b border-white/5">
                    <span className="text-[10px] font-mono font-bold text-white uppercase">Suspicious Flagged Signal Events ({events.length})</span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {events.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => selectEvent(ev)}
                        className={`p-5 text-left cursor-pointer transition-all ${
                          selectedEvent?.id === ev.id ? 'bg-[#00E0C7]/5 border-l-2 border-[#00E0C7]' : 'hover:bg-white/[0.01]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              ev.riskLevel === 'CRITICAL' ? 'bg-rose-500 animate-ping' :
                              ev.riskLevel === 'HIGH' ? 'bg-rose-400' : 'bg-amber-400'
                            }`} aria-label={`Risk level: ${ev.riskLevel}`} />
                            <span className="text-[10.5px] font-bold text-white uppercase tracking-wider font-mono">TYPE: {ev.eventType.replace(/_/g, ' ')}</span>
                          </div>
                          <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            ev.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                          }`}>
                            {ev.status === 'RESOLVED' ? 'RESOLVED' : 'OPEN COMPLIANCE WARNING'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-300 font-mono mt-2 leading-relaxed">{ev.description}</p>
                        <div className="flex justify-between items-center text-[8.5px] text-gray-500 font-mono mt-3">
                          <span>Risk Rating score: Grade LEVEL {ev.riskLevel.toUpperCase()}</span>
                          <span>Detected time: {new Date(ev.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fraud actions console */}
                <div className="lg:col-span-5 bg-[#0C121E]/60 border border-white/5 rounded-3xl p-6 shadow-2xl">
                  {selectedEvent ? (
                    <div className="space-y-6 text-left animate-fade-in font-mono">
                      
                      <div className="border-b border-white/5 pb-4">
                        <span className="text-[8px] font-mono text-rose-400 uppercase tracking-widest">Signal Reference: {selectedEvent.id.toUpperCase()}</span>
                        <h4 className="text-xs font-bold text-white uppercase font-mono mt-1">FRAUD AUDIT: {selectedEvent.eventType.replace(/_/g, ' ')}</h4>
                        <span className="text-[9px] text-gray-500 block mt-0.5">Triggered with system severity grade: {selectedEvent.riskLevel.toUpperCase()}</span>
                      </div>

                      <div className="space-y-4 bg-[#080D14] p-4 rounded-2xl border border-white/5">
                        <div className="space-y-1">
                          <span className="text-[8px] text-gray-500 uppercase">Detection Analytics description</span>
                          <p className="text-[10px] text-gray-300 leading-normal">{selectedEvent.description}</p>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[9px]">
                          <span className="text-gray-500">Subject Account ID:</span>
                          <span className="text-white font-bold">{selectedEvent.userId}</span>
                        </div>
                      </div>

                      {/* Operation decision paths */}
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <span className="text-[8px] text-gray-400 uppercase">Risk Override action workflow</span>
                        
                        {currentRole === 'super_admin' || currentRole === 'compliance_admin' || currentRole === 'risk_agent' ? (
                          <div className="flex flex-col gap-2">
                            {selectedEvent.status === 'RESOLVED' ? (
                              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-emerald-300 text-xs font-bold uppercase">
                                ✓ THIS EVENT HAS BEEN RESOLVED
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={async () => {
                                    const ok = await resolveEvent(selectedEvent.id);
                                    if (ok) {
                                      toast.success('Fraud event resolved. Client profile risk score adjusted downwards.');
                                      await fetchDashboard();
                                    }
                                  }}
                                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-[10px] font-bold uppercase font-mono transition-all"
                                >
                                  Mark Alert Resolved (Nominal override)
                                </button>
                                
                                <button
                                  onClick={async () => {
                                    const ok = await escalateEvent(selectedEvent.id);
                                    if (ok) {
                                      toast.error('FRAUD ALERT ESCALATED to level 5 super-admin. Client account status restricted.');
                                      await fetchDashboard();
                                      await fetchUsers();
                                    }
                                  }}
                                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/25 text-rose-300 rounded-xl text-[10px] font-bold uppercase font-mono transition-all"
                                >
                                  Force Escalate Event (Restrict User)
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-white/[0.01] border border-dashed border-white/10 rounded-xl text-center text-[9px] text-gray-500 uppercase">
                            Your active agent role does not hold credentials to resolve fraud anomalies
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="py-24 text-center text-gray-500">
                      <AlertTriangle className="w-8 h-8 mx-auto stroke-1" />
                      <p className="text-[10px] font-mono text-gray-400 mt-2">Select a flagged anomaly alert from fraud signal queue to view telemetry matching.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* 6. VIEW: TECHNICAL SUPPORT OPERATIONS HELP_DESK */}
          {/* ==================================================== */}
          {activeSubTab === 'support' && (
            <div className="space-y-6 animate-fade-in" id="admin-subview-support">
              
              <div>
                <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">FLOW Client Operations Ticket Helpdesk</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Answer regulatory questions, speeding up international wire, VAT CGI Article 92 exceptions logs</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Tickets list tab */}
                <div className="lg:col-span-5 bg-[#0C121E]/40 border border-white/5 rounded-3xl overflow-hidden self-start">
                  <div className="p-4 bg-[#0C121E]/60 border-b border-white/5">
                    <span className="text-[10px] font-mono font-bold text-white uppercase">Operational Inflows Support Queue</span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {tickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => fetchTicketDetail(ticket.id)}
                        className={`p-4 text-left cursor-pointer transition-all ${
                          selectedTicket?.id === ticket.id ? 'bg-[#00E0C7]/5 border-l-2 border-[#00E0C7]' : 'hover:bg-white/[0.01]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11.5px] font-bold text-white block truncate">{ticket.subject}</span>
                          <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            ticket.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-300' :
                            ticket.priority === 'HIGH' ? 'bg-rose-400/10 text-rose-300' : 'bg-gray-500/10 text-gray-300'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#00E0C7] font-bold block mt-1.5 uppercase font-mono">{ticket.userName} · ID: {ticket.userId}</span>
                        <div className="flex justify-between items-center text-[8.5px] text-gray-500 font-mono mt-1.5">
                          <span>Category Group: {ticket.category}</span>
                          <span className={`uppercase font-bold ${ticket.status === 'OPEN' ? 'text-teal-400' : 'text-gray-400'}`}>{ticket.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submissions interactive response workspace */}
                <div className="lg:col-span-7 bg-[#0C121E]/60 border border-white/5 rounded-3xl p-6 shadow-2xl min-h-[450px] flex flex-col justify-between">
                  {selectedTicket ? (
                    <div className="flex-1 flex flex-col justify-between space-y-5 text-left animate-fade-in font-mono">
                      
                      {/* Ticket top details */}
                      <div className="border-b border-white/5 pb-4.5 flex justify-between items-center gap-2">
                        <div>
                          <span className="text-[8px] font-mono text-[#00E0C7] uppercase">Ticket Ref Index: #{selectedTicket.id.toUpperCase()}</span>
                          <h3 className="text-xs font-bold text-white font-mono mt-0.5 uppercase">{selectedTicket.subject}</h3>
                          <span className="text-[9px] text-gray-400 block mt-0.5">Category: {selectedTicket.category}</span>
                        </div>

                        {/* Adjust priority or category dynamically inside operations drawer */}
                        <div className="flex gap-2">
                          <select
                            value={selectedTicket.priority}
                            onChange={async (e) => {
                              await updateTicketAttributes(selectedTicket.id, { priority: e.target.value });
                              toast.success('Ticket priority updated.');
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg text-[8.5px] font-mono uppercase text-gray-300 focus:outline-none focus:ring-0 p-1 font-bold"
                          >
                            <option value="low" className="bg-[#121824]">Priority: Low</option>
                            <option value="medium" className="bg-[#121824]">Priority: Medium</option>
                            <option value="high" className="bg-[#121824]">Priority: High</option>
                            <option value="critical" className="bg-[#121824]">Priority: Critical</option>
                          </select>

                          <select
                            value={selectedTicket.status}
                            onChange={async (e) => {
                              await updateTicketAttributes(selectedTicket.id, { status: e.target.value });
                              toast.success('Ticket status updated.');
                            }}
                            className="bg-white/5 border border-white/10 rounded-lg text-[8.5px] font-mono uppercase text-gray-300 focus:outline-none focus:ring-0 p-1 font-bold"
                          >
                            <option value="open" className="bg-[#121824]">Status: Open</option>
                            <option value="pending" className="bg-[#121824]">Status: Pending</option>
                            <option value="resolved" className="bg-[#121824]">Status: Resolved</option>
                            <option value="closed" className="bg-[#121824]">Status: Closed</option>
                          </select>
                        </div>
                      </div>

                      {/* Interactive messaging scrolling ledger */}
                      <div className="flex-1 space-y-3 max-h-56 overflow-y-auto pr-1">
                        {selectedTicket.messages.map((m: any) => {
                          const isUser = m.sender === 'user';
                          const isAgent = m.sender === 'agent';
                          return (
                            <div
                              key={m.id}
                              className={`p-3 rounded-2xl border text-left flex flex-col max-w-[85%] ${
                                isUser
                                  ? 'bg-[#080D14]/70 border-white/5 align-self-start mr-auto'
                                  : isAgent
                                  ? 'bg-teal-400/5 border-teal-500/20 align-self-end ml-auto text-teal-200'
                                  : 'bg-rose-500/5 border-rose-500/15 align-self-end ml-auto text-rose-300'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-6 text-[8px] font-mono uppercase text-gray-500">
                                <span>Sender: {m.sender.toUpperCase()}</span>
                                <span>{m.timestamp}</span>
                              </div>
                              <p className="text-[10px] text-gray-200 mt-1.5 leading-normal">{m.text}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Messaging input block */}
                      <div className="pt-4 border-t border-white/5 space-y-3">
                        <textarea
                          value={agentText}
                          onChange={(e) => setAgentText(e.target.value)}
                          placeholder="Draft support reply... e.g. Understanding Article 92 CGI tax rules, we have cleared your inward transfer wire directly."
                          className="w-full bg-[#080D14] border border-white/10 rounded-xl p-3 text-[11px] font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#00E0C7] focus:border-transparent h-16"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-gray-500 font-mono italic">Client notifications will be dispatched directly to user terminal</span>
                          <button
                            onClick={handleSendTicketReply}
                            className="px-5 py-2 bg-[#00E0C7] text-black rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 hover:bg-teal-400"
                          >
                            <Send className="w-3.5 h-3.5" /> Post Response
                          </button>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="py-32 text-center text-gray-500 flex-1 flex flex-col justify-center items-center">
                      <MessageSquare className="w-8 h-8 stroke-1 text-gray-400" />
                      <p className="text-[10px] font-mono text-gray-400 mt-2">Select an open ticket from support operations inflow grid to start client messaging dialog.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* 7. VIEW: IMMUTABLE AUDIT EXPLORER LOGBOOK */}
          {/* ==================================================== */}
          {activeSubTab === 'audits' && (
            <div className="space-y-6 animate-fade-in" id="admin-subview-audits">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">FLOW Systems Immutable Audit Logs Explorer</h2>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Strict chronological cryptographic logbook tracing ledger updates, authentication, administrative settings</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 flex items-center shrink-0">
                    <select
                      value={auditCategory}
                      onChange={(e) => setAuditCategory(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-mono text-white focus:outline-none uppercase font-bold cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="AUTH">AUTH</option>
                      <option value="WALLET">WALLET</option>
                      <option value="TRANSACTION">TRANSACTION</option>
                      <option value="CARD">CARD</option>
                      <option value="SECURITY">SECURITY</option>
                      <option value="KYC">KYC</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPPORT">SUPPORT</option>
                    </select>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={auditQuery}
                      onChange={(e) => setAuditQuery(e.target.value)}
                      placeholder="Filter logs by keywords..."
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#00E0C7] focus:border-transparent text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Immutable logs list */}
              <div className="bg-[#0C121E]/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                
                <div className="p-4 bg-[#0C121E]/60 border-b border-white/5 flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold text-white uppercase">System Trace Logbook ({filteredAudits.length} entries)</span>
                  <span className="text-gray-500 italic">SHA-256 ledger seals enabled</span>
                </div>

                <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto">
                  {filteredAudits.map(log => (
                    <div key={log.id} className="p-4 hover:bg-white/[0.01] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-left">
                      <div className="flex items-start gap-4">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono uppercase font-bold tracking-wider shrink-0 mt-0.5 ${
                          log.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/25 animate-pulse' :
                          log.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-teal-400/15 text-teal-300'
                        }`}>
                          {log.severity}
                        </span>

                        <div className="space-y-1 font-mono">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{log.action.replace(/_/g, " ")}</span>
                            <span className="text-[8.5px] text-gray-500">[Category: {log.category}]</span>
                            {log.userId && (
                              <span className="text-[8.5px] text-[#00E0C7] font-bold">Client reference: {log.userId}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-300 leading-relaxed font-mono">{log.details}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 md:pl-6 font-mono font-bold text-[9px] text-gray-400 space-y-0.5">
                        <div className="flex md:flex-col gap-2 md:gap-0">
                          <span className="text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                          <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <span className="text-[#00E0C7] block mt-0.5">Terminal IP: {log.ipAddress}</span>
                      </div>
                    </div>
                  ))}

                  {filteredAudits.length === 0 && (
                    <div className="py-24 text-center text-gray-500 font-mono">
                      No matching audit traces was found. Try clearing filters.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* 8.ビュー: OPERATIONS ANALYTICS DAMP GAUGE */}
          {/* ==================================================== */}
          {activeSubTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in" id="admin-subview-analytics">
              
              <div>
                <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">FLOW Systems High-Fidelity Operations Analytics</h2>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Real-time analytical trends showcasing client distributions, currency balance structures, anomalies ratios</p>
              </div>

              {/* Grid holding analytics widgets with Recharts charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Client user types distribution Pie chart */}
                <div className="bg-[#0C121E]/40 border border-white/5 rounded-3xl p-6">
                  <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider mb-4">Client User Types Distribution</h3>
                  
                  <div className="h-60 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="h-48 w-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Freelancers', value: usersMetric?.userTypesDistribution.freelancer || 2 },
                              { name: 'Businesses', value: usersMetric?.userTypesDistribution.business || 1 },
                              { name: 'Students', value: usersMetric?.userTypesDistribution.student || 1 },
                              { name: 'Travelers', value: usersMetric?.userTypesDistribution.traveler || 0 }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {COLORS.map((color, idx) => (
                              <Cell key={`cell-${idx}`} fill={color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 font-mono text-[10px] text-left shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00dfc6]" />
                        <span className="text-gray-300">Freelancers ({usersMetric?.userTypesDistribution.freelancer || 2})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1E90FF]" />
                        <span className="text-gray-300">Businesses ({usersMetric?.userTypesDistribution.business || 1})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#7B5CFF]" />
                        <span className="text-gray-300">Students ({usersMetric?.userTypesDistribution.student || 1})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FFA500]" />
                        <span className="text-gray-300">Travelers ({usersMetric?.userTypesDistribution.traveler || 0})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Currency ledger balance weights bar charts */}
                <div className="bg-[#0C121E]/40 border border-white/5 rounded-3xl p-6">
                  <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider mb-4">Ledger Currency Balance Aggregations</h3>

                  <div className="h-48 w-full pr-4 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { currency: 'USD', balance: transactionsMetric?.volumeByCurrency.USD || 149418 },
                        { currency: 'EUR', balance: transactionsMetric?.volumeByCurrency.EUR || 86700 },
                        { currency: 'MAD', balance: transactionsMetric?.volumeByCurrency.MAD || 1287000 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="currency" stroke="rgba(255,255,255,0.4)" fontSize={9} fontStyle="italic" />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} fontStyle="italic" />
                        <Tooltip contentStyle={{ backgroundColor: '#0C121E', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '9px' }} />
                        <Bar dataKey="balance" name="Aggregate Balances" fill="#1E90FF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
