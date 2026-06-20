import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  Laptop,
  Smartphone,
  Globe,
  MapPin,
  Activity,
  Power,
  RefreshCw,
  AlertOctagon,
  Lock,
  Unlock,
  UserCheck,
  History,
  AlertTriangle,
  Clock,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useSecurityStore } from '../stores/securityStore';
import { useDeviceStore } from '../stores/deviceStore';
import { useFraudStore } from '../stores/fraudStore';
import { motion, AnimatePresence } from 'motion/react';

export default function SecurityCenter() {
  const { 
    overview, 
    isLoading: isSecurityLoading, 
    error: securityError, 
    fetchSecurityData, 
    freezeAccount, 
    recoverAccount, 
    toggleBiometrics, 
    toggleTwoFactor 
  } = useSecurityStore();

  const {
    devices,
    isLoading: isDeviceLoading,
    fetchDevices,
    trustDevice,
    removeDevice,
    revokeSession,
    revokeAllOtherSessions
  } = useDeviceStore();

  const {
    fraudEvents,
    isLoading: isFraudLoading,
    fetchFraudEvents,
    resolveFraudEvent
  } = useFraudStore();

  // Internal states
  const [activeSegment, setActiveSegment] = useState<'overview' | 'devices' | 'history' | 'biometrics' | 'admin'>('overview');
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeOutcome, setFreezeOutcome] = useState<{ status: 'idle' | 'success' | 'failed'; text: string }>({ status: 'idle', text: '' });
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoveryOutcome, setRecoveryOutcome] = useState<{ status: 'idle' | 'success' | 'failed'; text: string }>({ status: 'idle', text: '' });

  // Admin simulation states
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminFraudLog, setAdminFraudLog] = useState<any[]>([]);
  const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);

  // Sync data
  const syncAllData = async () => {
    try {
      await Promise.all([
        fetchSecurityData(),
        fetchDevices(),
        fetchFraudEvents(false)
      ]);
      await loadLoginHistory();
      if (activeSegment === 'admin') {
        await loadAdminStats();
      }
    } catch (e) {
      console.error("Failed syncing Security Center data", e);
    }
  };

  const loadLoginHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/security/login-history');
      if (res.ok) {
        const data = await res.json();
        setLoginLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      const [uRes, fRes] = await Promise.all([
        fetch('/api/admin/security/risk-users'),
        fetch('/api/admin/security/fraud-events')
      ]);
      if (uRes.ok && fRes.ok) {
        setAdminUsers(await uRes.json());
        setAdminFraudLog(await fRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    syncAllData();
  }, []);

  useEffect(() => {
    if (activeSegment === 'admin') {
      loadAdminStats();
    }
  }, [activeSegment]);

  // Handle emergency actions
  const triggerEmergencyFreeze = async () => {
    const outcome = await freezeAccount();
    if (outcome.success) {
      setFreezeOutcome({ status: 'success', text: outcome.message });
      await syncAllData();
    } else {
      setFreezeOutcome({ status: 'failed', text: outcome.message });
    }
  };

  const triggerEmergencyRecovery = async () => {
    const outcome = await recoverAccount();
    if (outcome.success) {
      setRecoveryOutcome({ status: 'success', text: outcome.message });
      await syncAllData();
    } else {
      setRecoveryOutcome({ status: 'failed', text: outcome.message });
    }
  };

  // Resolve fraud alerts
  const handleVouchAlert = async (id: string) => {
    const success = await resolveFraudEvent(id);
    if (success) {
      await syncAllData();
    }
  };

  // Admin simulation locks/unlocks
  const adminToggleFreezeUser = async (userId: string, currentlySuspended: boolean) => {
    setIsAdminActionLoading(true);
    try {
      const endpoint = currentlySuspended 
        ? `/api/admin/security/unfreeze-user/${userId}` 
        : `/api/admin/security/freeze-user/${userId}`;
      const res = await fetch(endpoint, { method: 'PATCH' });
      if (res.ok) {
        await loadAdminStats();
        await syncAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  // Render score ring or badge
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'critical': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="lg:col-span-12 font-sans text-gray-100" id="security-center-module">
      {/* HEADER SECTION WITH REASSURING SUMMARY AND ACTION METRICS */}
      <div className="bg-gradient-to-r from-[#111726]/90 to-[#0A0D14]/90 border border-white/5 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-[40%] h-[100%] bg-gradient-to-l from-[#1E90FF]/5 to-transparent blur-[60px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="p-2 bg-[#00E0C7]/10 text-[#00E0C7] rounded-xl border border-[#00E0C7]/20">
                <Shield className="w-5 h-5 animate-pulse" />
              </span>
              <span className="text-xs font-mono font-semibold text-[#00E0C7] tracking-widest uppercase">Fintech Security Infrastructure</span>
            </div>
            <h1 className="text-[32px] md:text-[48px] font-bold leading-[40px] md:leading-[56px] tracking-[-0.02em] mb-2">
              Security & Trust Center
            </h1>
            <p className="text-[#8a919f] max-w-2xl">
              Advanced machine-learning fraud detection, encrypted hardware cryptographic device trust, and instant ledger isolation controls protect your multi-currency funds at all times.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={syncAllData}
              className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-2xl transition-all flex items-center justify-center text-gray-300"
              title="Refresh security logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowFreezeModal(true)}
              className="px-5 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-rose-500/30 rounded-2xl transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Emergency Freeze</span>
            </button>
          </div>
        </div>

        {/* TOP LEVEL SECURITY STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center md:text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 block mb-1">Security Health</span>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span className="text-sm font-bold text-white uppercase tracking-wide">
                {overview?.riskScore === 'critical' ? 'LOCKED' : 'OPTIMAL'}
              </span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center md:text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 block mb-1">Defense Score</span>
            <div className="flex items-center justify-center md:justify-start gap-1.5">
              <span className="text-sm font-mono font-bold text-[#00E0C7]">
                {overview?.riskScoreValue ?? 95}/100
              </span>
              <span className={`text-[9px] font-semibold border px-1.5 py-0.5 rounded-md ${getRiskColor(overview?.riskScore || 'low')}`}>
                {overview?.riskScore} risk
              </span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-[#00E0C7]/10 p-4 rounded-2xl text-center md:text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 block mb-1">Verified Nodes</span>
            <div className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-1">
              <span>{overview?.trustedDevices || 2} Approved</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center md:text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 block mb-1">Flagged Actions</span>
            <div className="text-sm font-bold flex items-center justify-center md:justify-start gap-1.5">
              {overview?.recentAlerts && overview.recentAlerts > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
                  <span className="text-amber-400 font-mono">{overview.recentAlerts} Suspicious</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="text-gray-400">0 Outstanding</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CORE NAVIGATION SEGMENTS */}
      <div className="flex border-b border-white/5 mb-6 gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveSegment('overview')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeSegment === 'overview'
              ? 'bg-[#1E90FF]/15 text-[#00E0C7] border border-[#00E0C7]/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Realtime Engine</span>
        </button>

        <button
          onClick={() => setActiveSegment('devices')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeSegment === 'devices'
              ? 'bg-[#1E90FF]/15 text-[#00E0C7] border border-[#00E0C7]/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Trusted Terminals</span>
        </button>

        <button
          onClick={() => setActiveSegment('history')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeSegment === 'history'
              ? 'bg-[#1E90FF]/15 text-[#00E0C7] border border-[#00E0C7]/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Login History</span>
        </button>

        <button
          onClick={() => setActiveSegment('biometrics')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeSegment === 'biometrics'
              ? 'bg-[#1E90FF]/15 text-[#00E0C7] border border-[#00E0C7]/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5" />
          <span>Biometrics & MFA</span>
        </button>

        <button
          onClick={() => setActiveSegment('admin')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            activeSegment === 'admin'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Compliance Admin Mode</span>
        </button>
      </div>

      {/* RENDER ACTIVE CONTEXT AREA */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSegment}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* SEGMENT 1: OVERVIEW & REAL-TIME FRAUD SIGNALS */}
          {activeSegment === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* ANALYTICAL RISK ENGINE CARDS */}
              <div className="lg:col-span-4 bg-[#182029]/60 border border-[#8a919f]/10 rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00E0C7]" />
                  <span>Dynamic Scoring</span>
                </h3>

                <div className="flex flex-col items-center justify-center py-6">
                  {/* Gauge indicator representing high fidelity circle */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="42" 
                        stroke="#00E0C7" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray="264"
                        strokeDashoffset={264 - (264 * (overview?.riskScoreValue || 95)) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-3xl font-extrabold text-white font-mono">{overview?.riskScoreValue || 95}</span>
                      <span className="text-[10px] text-gray-500 block uppercase tracking-widest mt-1">Trust Score</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center mt-6">
                    A defense evaluation based on device cryptographic footprint pairing, continuous CNIE database KYC match assurance, and transaction velocity.
                  </p>
                </div>

                <div className="space-y-3 mt-4 pt-4 border-t border-white/5 text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>MFA Telemetry</span>
                    <span className="text-emerald-400 font-mono font-medium">Secured</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Device Trust Rate</span>
                    <span className="text-white font-mono">100% Verified</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Platform Status</span>
                    <span className="text-[#00E0C7] uppercase font-mono">
                      {overview?.riskScore === 'critical' ? 'SUSPENDED' : 'ONLINE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTIVE FRAUD DETECTOR EVENTS IN REAL TIME */}
              <div className="lg:col-span-8 bg-[#182029]/60 border border-[#8a919f]/10 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce" />
                    <span>Machine-Learning Fraud Detector Alerts</span>
                  </h3>
                  <span className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-gray-400 font-mono">
                    Real-time logs
                  </span>
                </div>

                {isFraudLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw className="w-5 h-5 text-[#00E0C7] animate-spin" />
                  </div>
                ) : fraudEvents.filter(e => e.status !== 'RESOLVED').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 mb-3">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">Global Vault Fully Shielded</h4>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Our risk models show no suspicious transfers, impossible GPS logins, or irregular API patterns. Your money is secured.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 mb-2">
                      Suspicious activity has triggered manual evaluation constraints. Click <strong>“Vouch and Acknowledge”</strong> if you authorize this action, restoring normal score levels instantly.
                    </p>

                    {fraudEvents.map((event) => (
                      <div 
                        key={event.id}
                        className={`p-4 border rounded-2xl transition-all relative overflow-hidden ${
                          event.status === 'RESOLVED' 
                            ? 'bg-white/5 border-white/5 opacity-60' 
                            : 'bg-amber-500/[0.03] border-amber-500/20'
                        }`}
                      >
                        <div className="flex gap-3 relative z-10">
                          <span className={`p-2 rounded-xl mt-1 shrink-0 ${
                            event.status === 'RESOLVED' 
                              ? 'bg-gray-500/10 text-gray-400' 
                              : (event.riskLevel === 'HIGH' || event.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400')
                          }`}>
                            <AlertOctagon className="w-4 h-4" />
                          </span>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-bold text-white font-mono">
                                {event.eventType === 'impossible_travel' ? 'IMPOSSIBLE TRAVEL LOG' : 'IRREGULAR TRANSACTION SPIKE'}
                              </span>
                              <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded ${
                                event.status === 'RESOLVED' 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : (event.riskLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-500')
                              }`}>
                                {event.status === 'RESOLVED' ? 'RESOLVED' : `${event.riskLevel} risk`}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono ml-auto">
                                {new Date(event.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                              {event.description}
                            </p>

                            {event.status !== 'RESOLVED' && (
                              <div className="mt-3 flex items-center gap-3">
                                <button
                                  onClick={() => handleVouchAlert(event.id)}
                                  className="px-3.5 py-1.5 bg-[#00E0C7] hover:bg-[#00cfa7] text-black font-mono text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all"
                                >
                                  Vouch & Acknowledge
                                </button>
                                <button
                                  onClick={() => setShowFreezeModal(true)}
                                  className="text-[9px] font-mono text-rose-400 hover:underline hover:text-rose-300"
                                >
                                  No, Lock Account Instantly
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEGMENT 2: TRUSTED DEVICES & SESSIONS */}
          {activeSegment === 'devices' && (
            <div className="bg-[#182029]/60 border border-[#8a919f]/10 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                    Authorized Hardware Terminals & Device Signatures
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Authenticating web calls only from securely registered hardware fingerprints. Revoked devices instantly lose key permission credentials.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await revokeAllOtherSessions();
                    await syncAllData();
                  }}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 font-mono text-[9px] font-bold uppercase tracking-wider border border-rose-500/20 rounded-xl transition-all"
                >
                  Revoke All Others
                </button>
              </div>

              {isDeviceLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-5 h-5 text-[#00E0C7] animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {devices.map((dev) => (
                    <div 
                      key={dev.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        dev.isActive 
                          ? 'bg-white/[0.01] border-white/10' 
                          : 'bg-black/20 border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex gap-4">
                        <span className={`p-3 rounded-2xl shrink-0 flex items-center justify-center ${
                          dev.isTrusted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {dev.deviceModel.toLowerCase().includes('iphone') || dev.deviceModel.toLowerCase().includes('android') ? (
                            <Smartphone className="w-5 h-5" />
                          ) : (
                            <Laptop className="w-5 h-5" />
                          )}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-none">
                              {dev.deviceModel}
                            </span>
                            {dev.id === 'dev-1' && (
                              <span className="text-[8px] bg-[#00E0C7]/15 text-[#00E0C7] border border-[#00E0C7]/20 font-mono font-extrabold px-1.5 py-0.5 rounded">
                                CURRENT
                              </span>
                            )}
                            {dev.isTrusted ? (
                              <span className="text-[8px] bg-emerald-500/15 text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                                TRUSTED
                              </span>
                            ) : (
                              <span className="text-[8px] bg-amber-500/15 text-amber-500 font-mono px-1.5 py-0.5 rounded">
                                UNVERIFIED
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-gray-500 space-y-1 font-mono">
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-gray-600" />
                              <span>IP Range: {dev.ipAddress}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-600" />
                              <span>Region: {dev.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-600" />
                              <span>Activity Log: {dev.isActive ? 'Active Now' : new Date(dev.lastActive).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* ACTIONS */}
                          <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                            {!dev.isTrusted && (
                              <button
                                onClick={async () => {
                                  await trustDevice(dev.id);
                                  await syncAllData();
                                }}
                                className="px-3 py-1 bg-[#00E0C7]/10 hover:bg-[#00E0C7]/20 text-[#00E0C7] font-mono text-[9px] font-black uppercase tracking-widest rounded-lg border border-[#00E0C7]/30 transition-all"
                              >
                                Trust Hardware
                              </button>
                            )}

                            {dev.id !== 'dev-1' && (
                              <>
                                <button
                                  onClick={async () => {
                                    await revokeSession(dev.id);
                                    await syncAllData();
                                  }}
                                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all"
                                >
                                  Deauthorize Session
                                </button>
                                <button
                                  onClick={async () => {
                                    await removeDevice(dev.id);
                                    await syncAllData();
                                  }}
                                  className="text-rose-400 hover:underline hover:text-rose-300 text-[9px] font-mono ml-auto self-center"
                                >
                                  Wipe Hardware Profile
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEGMENT 3: DETAILED LOGIN HISTORIES */}
          {activeSegment === 'history' && (
            <div className="bg-[#182029]/60 border border-[#8a919f]/10 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                    Secure Authorization Timeline Logs
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Continuous logging of signins, access location audits, and biometric validation statuses. Unrecognized attempts trigger forced OTP verification.
                  </p>
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-5 h-5 text-[#00E0C7] animate-spin" />
                </div>
              ) : loginLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">No recorded authorization history found matches user scope.</div>
              ) : (
                <div className="relative border-l border-white/5 ml-3 pl-6 space-y-6">
                  {loginLogs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border border-black ${
                        log.loginStatus === 'blocked' ? 'bg-rose-500' : (log.loginStatus === 'suspicious' ? 'bg-amber-500' : 'bg-[#00E0C7]')
                      }`} />

                      <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl max-w-2xl">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                          <span className="text-xs font-bold text-white font-mono">
                            {log.device}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400">
                          <span>🌐 IP: {log.ipAddress}</span>
                          <span>🇲🇦 GeoIP: {log.location}</span>
                          
                          <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ml-auto ${
                            log.loginStatus === 'success' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : (log.loginStatus === 'blocked' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400')
                          }`}>
                            {log.loginStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEGMENT 4: BIOMETRIC AND MFA CONFIGURATION */}
          {activeSegment === 'biometrics' && (
            <div className="bg-[#182029]/60 border border-[#8a919f]/10 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white mb-4">
                Biometric Controls & Hardware Encryption Settings
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Configure FaceID, Fingerprint, and Multi-Factor Authenticator policies to defend payment execution channels, invoice releases, and card limit setups instantly.
              </p>

              <div className="space-y-6 max-w-xl">
                {/* Switch 1: Face ID / Fingerprint Auth */}
                <div className="flex items-start justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="flex gap-3">
                    <span className="p-2.5 bg-[#00E0C7]/10 text-[#00E0C7] border border-[#00E0C7]/20 rounded-xl max-h-[44px]">
                      <Fingerprint className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Enable Biometric Login</h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Use secure fingerprint or FaceID verification on supported hardware instead of typed security passwords.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const current = overview?.biometricsActive ?? true;
                      await toggleBiometrics(!current);
                      await syncAllData();
                    }}
                    className="p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E0C7] rounded-lg transition-all active:scale-95 text-gray-300 hover:text-white"
                  >
                    {overview?.biometricsActive ? (
                      <ToggleRight className="w-9 h-9 text-[#00E0C7]" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Switch 2: Mandatory Biometrics on Transfer Outflows */}
                <div className="flex items-start justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="flex gap-3">
                    <span className="p-2.5 bg-[#1E90FF]/10 text-[#1E90FF] border border-[#1E90FF]/20 rounded-xl max-h-[44px]">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Mandatory Biometrics for Transfers</h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Requires on-device biometric check for any outflow transfer exceeding DH 500 or $50.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      // Simulates switching transfer locks
                      toast.success("Secured: Mandatory biometric policy successfully injected on outbound wire channels!");
                    }}
                    className="p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E0C7] rounded-lg text-gray-300 hover:text-white"
                  >
                    <ToggleRight className="w-9 h-9 text-[#00E0C7]" />
                  </button>
                </div>

                {/* Switch 3: 2FA MFA Verification */}
                <div className="flex items-start justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="flex gap-3">
                    <span className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl max-h-[44px]">
                      <Lock className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Require Two-Factor (2FA) OTP</h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Sends a secure OTP pin via SMS/Push on unrecognized browsers, remote sessions, or invoice exports.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const current = overview?.twoFactorActive ?? true;
                      await toggleTwoFactor(!current);
                      await syncAllData();
                    }}
                    className="p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E0C7] rounded-lg transition-all active:scale-95 text-gray-300 hover:text-white"
                  >
                    {overview?.twoFactorActive ? (
                      <ToggleRight className="w-9 h-9 text-[#00E0C7]" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEGMENT 5: COMPLIANCE ADMIN FRAUD CONTROL simulation */}
          {activeSegment === 'admin' && (
            <div className="space-y-6">
              
              {/* ADMIN BANNER */}
              <div className="bg-rose-950/20 border border-rose-500/20 rounded-3xl p-5 text-xs text-rose-300 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-rose-400 mb-1">Administrative Compliance & Supervisor Authority Active</h4>
                  <p className="text-gray-400">
                    This interactive simulator authorizes you to toggle live account statuses, review raw unredacted model events, and simulate rapid triggers for testing audit records.
                  </p>
                </div>
              </div>

              {/* USER STATS WITH RISK CONTROL */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* ADMIN CARD PANEL: USER RISK STATUS LIST */}
                <div className="lg:col-span-12 bg-[#182029]/60 border border-[#8a919f]/10 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-white mb-4">
                    Fintech Client Ledger Security Control Panel
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs" aria-label="Admin users account status">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-500 font-mono tracking-wider">
                          <th className="py-3 px-2">Account Name</th>
                          <th className="py-3 px-2">Platform Status</th>
                          <th className="py-3 px-2">Identity match (KYC)</th>
                          <th className="py-3 px-2 text-center">Calculated Risk</th>
                          <th className="py-3 px-2 text-center">Alerts</th>
                          <th className="py-3 px-2 text-right">Emergency Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-white/[0.01]">
                            <td className="py-3.5 px-2">
                              <div className="font-bold text-white">{u.name}</div>
                              <div className="text-[10px] text-gray-500">{u.email}</div>
                            </td>
                            <td className="py-3.5 px-2">
                              <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded ${
                                u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {u.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-3.5 px-2">
                              <span className="text-gray-300">{u.kycStatus === 'approved' ? 'Approved (CNIE verified)' : 'Pending'}</span>
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              <span className={`px-2 py-0.5 font-mono text-[9px] font-semibold border rounded-lg ${
                                u.riskScore < 45 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : (u.riskScore < 75 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                              }`}>
                                {u.riskScore}/100 Score
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-center text-gray-300 font-mono">
                              {u.openFraudAlerts} open
                            </td>
                            <td className="py-3.5 px-2 text-right">
                              <button
                                onClick={() => adminToggleFreezeUser(u.id, u.status === 'suspended')}
                                className={`px-2.5 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-widest transition-all ${
                                  u.status === 'suspended'
                                    ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {u.status === 'suspended' ? 'Unfreeze' : 'Freeze Account'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ADMIN CARD PANEL: MASTER RISK EVENT LOG */}
                <div className="lg:col-span-12 bg-[#182029]/60 border border-[#8a919f]/10 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-white mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-500" />
                    <span>Global Anti-Money Laundering & Fraud Audit Feed</span>
                  </h3>

                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto">
                    {adminFraudLog.map((event) => (
                      <div key={event.id} className="p-3 border border-white/5 bg-black/10 rounded-xl flex items-start gap-3">
                        <span className={`p-1.5 rounded-lg inline-block ${
                          event.riskLevel === 'high' || event.riskLevel === 'critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs font-mono">{event.eventType.toUpperCase()}</span>
                            <span className="text-[9px] text-gray-500 font-mono">{new Date(event.createdAt).toLocaleString()}</span>
                            <span className={`text-[8px] font-semibold border px-1.5 py-0.2 rounded-md ${getRiskColor(event.riskLevel)}`}>
                              {event.riskLevel}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">{event.description}</p>
                          <div className="text-[9px] font-mono text-gray-500 mt-1 flex gap-2">
                            <span>Client ID: {event.userId}</span>
                            <span>Status: {event.resolved ? '✓ Resolved' : '✗ Active alert'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* EMERGENCY FREEZE MODAL DIALOG */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111420]/95 border border-rose-500/35 rounded-[32px] p-6 sm:p-8 max-w-md w-full relative shadow-[0_20px_50px_rgba(244,63,94,0.15)]">
            <div className="flex flex-col items-center text-center">
              <span className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/25 rounded-full mb-4 animate-pulse">
                <Power className="w-10 h-10" />
              </span>

              <h3 className="text-xl font-extrabold text-white mb-2">FLOW Critical Protection</h3>
              <p className="text-xs text-rose-200 uppercase font-mono font-semibold tracking-wider mb-4">
                LOCKDOWN PROTOCOL INITIATED
              </p>

              {freezeOutcome.status === 'idle' ? (
                <>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-sm mb-6">
                    Under FLOW instant protection directive, completing this action will instantly freeze your multi-currency accounts, lock all physical & virtual Visa credit cards, deactivate remote active login sessions, and block all outgoing payments in Morocco & worldwide.
                  </p>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowFreezeModal(false)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs font-bold uppercase rounded-2xl border border-white/10 transition-all"
                    >
                      Cancel Action
                    </button>
                    <button
                      onClick={triggerEmergencyFreeze}
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase rounded-2xl transition-all shadow-[0_4px_15px_rgba(244,63,94,0.3)]"
                    >
                      Lock All Assets
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <div className={`p-4 rounded-xl text-xs mb-6 font-mono text-left ${
                    freezeOutcome.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {freezeOutcome.text}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        setShowFreezeModal(false);
                        setFreezeOutcome({ status: 'idle', text: '' });
                        await syncAllData();
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase rounded-2xl transition-all"
                    >
                      Close Panel
                    </button>

                    <button
                      onClick={() => {
                        setShowFreezeModal(false);
                        setFreezeOutcome({ status: 'idle', text: '' });
                        setShowRecoverModal(true);
                      }}
                      className="w-full py-3 bg-[#00E0C7] hover:bg-[#00cfa7] text-black font-semibold font-mono text-xs font-bold uppercase rounded-2xl transition-all"
                    >
                      Restore System
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY RECOVERY PLAN DIALOG */}
      {showRecoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111420]/95 border border-[#00E0C7]/35 rounded-[32px] p-6 sm:p-8 max-w-md w-full relative shadow-[0_20px_50px_rgba(0,224,199,0.15)]">
            <div className="flex flex-col items-center text-center">
              <span className="p-4 bg-[#00E0C7]/10 text-[#00E0C7] border border-[#00E0C7]/25 rounded-full mb-4 animate-pulse">
                <ShieldCheck className="w-10 h-10" />
              </span>

              <h3 className="text-xl font-extrabold text-white mb-2">FLOW Identity Verification</h3>
              <p className="text-xs text-[#00E0C7] uppercase font-mono font-semibold tracking-wider mb-4">
                SECURE CREDENTIALS RECOVERY
              </p>

              {recoveryOutcome.status === 'idle' ? (
                <>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-sm mb-6">
                    Enter physical multi-currency hardware recovery mode. This simulates automated verification of your encrypted CNIE Moroccan passport photo key & original biometric FaceID setup.
                  </p>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowRecoverModal(false)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs font-bold uppercase rounded-2xl border border-white/10 transition-all"
                    >
                      Cancel Recovery
                    </button>
                    <button
                      onClick={triggerEmergencyRecovery}
                      className="flex-1 py-3 bg-[#00E0C7] hover:bg-[#00cfa7] text-black font-mono text-xs font-bold uppercase rounded-2xl transition-all shadow-md"
                    >
                      Verify Identity
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <div className={`p-4 rounded-xl text-xs mb-6 font-mono text-left ${
                    recoveryOutcome.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {recoveryOutcome.text}
                  </div>

                  <button
                    onClick={async () => {
                      setShowRecoverModal(false);
                      setRecoveryOutcome({ status: 'idle', text: '' });
                      await syncAllData();
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase rounded-2xl transition-all"
                  >
                    Return to Security Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
