import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Fingerprint,
  UserCheck,
  Lock,
  RefreshCw,
  Clock,
  Laptop,
  Check,
  X
} from 'lucide-react';
import { AuditLog, SecuritySession, KycSubmission } from '../types';

interface SupervisorProps {
  userProfile: any;
  onRefreshStates: () => void;
}

export default function SupervisorHubPanel({ userProfile, onRefreshStates }: SupervisorProps) {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'kyc' | 'devices' | 'admin'>('audit');
  
  // Data States
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [devices, setDevices] = useState<SecuritySession[]>([]);
  const [kycQueue, setKycQueue] = useState<KycSubmission[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  // Form Inputs
  const [docType, setDocType] = useState('CNIE (Moroccan National ID)');
  const [docNum, setDocNum] = useState('');
  
  // UX Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [systemAlert, setSystemAlert] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Load compliance details from API
  const loadComplianceStates = async () => {
    setIsLoading(true);
    try {
      // 1. Audit Logs
      const auditRes = await fetch('/api/admin/audit-logs');
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.slice(0, 15)); // Display last 15
      }

      // 2. Devices
      const devRes = await fetch('/api/security/devices');
      if (devRes.ok) {
        const devData = await devRes.json();
        setDevices(devData);
      }

      // 3. KYC Submissions Queue (Admin)
      const kycRes = await fetch('/api/admin/kyc');
      if (kycRes.ok) {
        const kycData = await kycRes.json();
        setKycQueue(kycData);
      }

      // 4. Sandbox Users List (Admin)
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

    } catch (e) {
      console.warn('Supervisor live APIs offline, loading local sandbox simulations.', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplianceStates();
  }, [activeSubTab]);

  // Submit KYC scanned document
  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNum.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: docType,
          documentNumber: docNum,
          selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=82'
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSystemAlert({ type: 'success', text: 'Scanned biometric document uploaded. Status set to: UNDER REVIEW.' });
        setDocNum('');
        onRefreshStates();
      } else {
        setSystemAlert({ type: 'danger', text: data.message || 'Upload failed.' });
      }
    } catch (err) {
      setSystemAlert({ type: 'danger', text: 'Biometric server connection interrupted.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Perform Emergency Panic Lock (Freezes ALL Assets)
  const triggerEmergencyLock = async () => {
    if (!window.confirm('🚨 CRITICAL SAFETY WARNING: Are you sure you want to activate the EMERGENCY FLOW FREEZE protocol? This will immediately lock all active ledgers, disable cards, and invalidate active sessions.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/security/emergency-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSystemAlert({ type: 'danger', text: '🚨 ALL FLOW ACCOUNTS COLD FROZEN. System operates in regulatory audit mode.' });
        onRefreshStates();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Verification Command
  const handleReviewKyc = async (kycId: string, decision: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/kyc/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycId, decision })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSystemAlert({ type: 'success', text: `Biometric credential successfully reviewed: ${decision.toUpperCase()}` });
        onRefreshStates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="lg:col-span-12 bg-[#182029]/60 backdrop-blur-2xl border border-[#8a919f]/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden" id="compliance-supervisor-panel">
      {/* Glow Halo */}
      <div className="absolute top-0 left-1/2 w-80 h-80 bg-[#7B5CFF]/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5 select-none relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#7B5CFF]/10 border border-[#7B5CFF]/20 text-[#7B5CFF]">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">System Supervisor & Compliance</h2>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Fintech-grade audit trail & biometric regulatory HUD</p>
          </div>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-white/[0.03] border border-white/5 text-[10px] font-mono rounded-full uppercase text-gray-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E0C7] animate-ping" aria-hidden="true" />
            Active ledger synced
          </span>
          <button 
            onClick={loadComplianceStates}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5 active:scale-95"
            aria-label="Refresh Security"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* System Warning Message Bar */}
      {systemAlert && (
        <div role="alert" className={`my-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono relative z-20 animate-fade-in ${
          systemAlert.type === 'success' ? 'bg-[#00E0C7]/10 border-[#00E0C7]/20 text-white' : 'bg-red-500/10 border-red-500/20 text-white animate-pulse'
        }`}>
          <div>{systemAlert.text}</div>
          <button onClick={() => setSystemAlert(null)} className="text-[10px] text-gray-400 hover:text-white uppercase font-bold pl-2">Dismiss</button>
        </div>
      )}

      {/* Secondary Sub-Tabs Menu Layout */}
      <div className="flex bg-[#0c121c]/60 border border-white/5 rounded-2xl p-1 gap-1 text-xs font-medium my-6 max-w-xl select-none relative z-10 text-[11px] font-mono uppercase tracking-wider" role="tablist" aria-label="Supervisor hub sections">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex-1 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeSubTab === 'audit' ? 'bg-white/5 text-[#00E0C7] font-semibold border border-white/10' : 'text-gray-400 hover:text-white'
          }`}
          role="tab"
          aria-selected={activeSubTab === 'audit'}
          aria-controls="subtab-panel-audit"
          id="subtab-audit"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Ledger Logs</span>
        </button>
        <button
          onClick={() => setActiveSubTab('kyc')}
          className={`flex-1 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeSubTab === 'kyc' ? 'bg-white/5 text-[#00E0C7] font-semibold border border-white/10' : 'text-gray-400 hover:text-white'
          }`}
          role="tab"
          aria-selected={activeSubTab === 'kyc'}
          aria-controls="subtab-panel-kyc"
          id="subtab-kyc"
        >
          <Fingerprint className="w-3.5 h-3.5" />
          <span>Biometric ID</span>
        </button>
        <button
          onClick={() => setActiveSubTab('devices')}
          className={`flex-1 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeSubTab === 'devices' ? 'bg-white/5 text-[#00E0C7] font-semibold border border-white/10' : 'text-gray-400 hover:text-white'
          }`}
          role="tab"
          aria-selected={activeSubTab === 'devices'}
          aria-controls="subtab-panel-devices"
          id="subtab-devices"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Sessions</span>
        </button>
        <button
          onClick={() => setActiveSubTab('admin')}
          className={`flex-1 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeSubTab === 'admin' ? 'bg-white/5 text-purple-400 font-semibold border border-white/10' : 'text-gray-400 hover:text-white'
          }`}
          role="tab"
          aria-selected={activeSubTab === 'admin'}
          aria-controls="subtab-panel-admin"
          id="subtab-admin"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Reviewer Guard</span>
        </button>
      </div>

      {/* SUB TAB LAYOUT SWITCHES */}
      <div className="relative z-10 text-xs">

        {/* SUB-TAB 1: IMMUTABLE AUDIT LOGS LEDGER */}
        {activeSubTab === 'audit' && (
          <div className="space-y-4 animate-fade-in" role="tabpanel" id="subtab-panel-audit" aria-labelledby="subtab-audit">
            <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-mono">Live Sandbox Operations Ledger Entries ({auditLogs.length})</span>
              <span className="text-[9px] text-[#00e0c7] font-mono">Status: Immutable Ledger Protection</span>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[600px] bg-[#0c121c]/40 border border-white/5 rounded-2xl overflow-hidden font-mono text-[10px]">
                <table className="w-full text-left" aria-label="Audit log entries">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-gray-400 uppercase text-[9px] tracking-wider">
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Action Executed</th>
                      <th className="p-3.5 text-center">Severity</th>
                      <th className="p-3.5">Audit Proof Trace Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.01]">
                        <td className="p-3.5 text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-3.5 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[8px] ${
                            log.category === 'AUTH' ? 'bg-sky-500/10 text-sky-400' :
                            log.category === 'WALLET' ? 'bg-emerald-500/10 text-emerald-400' :
                            log.category === 'SECURITY' ? 'bg-amber-500/10 text-amber-500' :
                            log.category === 'TRANSACTION' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-gray-500/10 text-gray-300'
                          }`}>
                            {log.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-200">{log.action}</td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            log.severity === 'CRITICAL' ? 'bg-red-500 text-white animate-pulse' :
                            log.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-500' :
                            'text-gray-400 bg-white/5'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-400 truncate max-w-[280px]">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: REGULATORY ID DOCUMENTS & KYC SUBMISSION */}
        {activeSubTab === 'kyc' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" role="tabpanel" id="subtab-panel-kyc" aria-labelledby="subtab-kyc">
            {/* Identity Upload Form */}
            <div className="bg-[#0c121c]/40 border border-white/5 p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-mono text-gray-400 uppercase font-bold">Upload Moroccan Biometric ID (CNIE)</h3>
              <p className="text-[10px] text-gray-500 leading-relaxed font-sans">Submit export compliance documentation and verify your residency status to unlock international clearing limits and cross-border bank pairings.</p>
              
              <form onSubmit={handleSubmitKyc} className="space-y-4">
                <div>
                  <label htmlFor="super-doctype-select" className="text-gray-400 block font-mono uppercase text-[9px] mb-1.5">Document Variant</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-black py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#7b5cff] text-white"
                    id="super-doctype-select"
                  >
                    <option value="CNIE (Moroccan National ID)">Moroccan National ID Card (CNIE)</option>
                    <option value="Passport (International)">International Biometric Passport</option>
                    <option value="RC Registration (Business)">Registre du Commerce (Moroccan RC)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="super-docnum-input" className="text-gray-400 block font-mono uppercase text-[9px] mb-1.5">Document National Serial Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AB123456"
                    value={docNum}
                    onChange={(e) => setDocNum(e.target.value)}
                    className="w-full bg-black py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#7b5cff] font-mono text-white"
                    id="super-docnum-input"
                  />
                </div>

                <div className="p-3 rounded-xl bg-purple-500/5 border border-[#7b5cff]/15 text-[9px] text-gray-500 leading-relaxed font-mono">
                  🔒 AI-OCR compliance parsing verifies document authenticity. Standard approval time is instant under FLOW Sandbox mode.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#7B5CFF] hover:bg-[#6a4eed] text-white uppercase text-[10px] tracking-wider rounded-xl transition-all font-bold"
                >
                  UPLOAD CNIE CREDENTIALS
                </button>
              </form>
            </div>

            {/* Current KYC Verification Status Panel */}
            <div className="bg-[#0c121c]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono text-gray-400 uppercase font-bold mb-4">Verification Audits</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <span className="text-gray-400">Financial Identity Scope</span>
                    <span className="font-bold text-white uppercase">{userProfile?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <span className="text-gray-400">KYC Status Tag</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      userProfile?.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      userProfile?.status === 'under_review' ? 'bg-amber-500/10 text-amber-500 animate-pulse border border-amber-500/20' :
                      'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {userProfile?.status || 'unverified'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-gray-400">Sandbox Security Score</span>
                    <span className="font-bold text-emerald-400 text-sm font-mono">{userProfile?.securityScore || 620} / 850</span>
                  </div>
                </div>
              </div>

              {/* Status micro reports */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[9px] text-gray-400 leading-relaxed space-y-1.5 font-mono">
                <p className="font-bold text-[#00E0C7]">✔ UNRESTRICTED LEDGER ACCESS</p>
                <p>Status approved parameters enable interbank conversions, MAD direct payouts, international bank wiring, and high virtual card limits.</p>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: ACTIVE SYSTEM SESSIONS & DEVICE BIOMETRICS */}
        {activeSubTab === 'devices' && (
          <div className="space-y-6 animate-fade-in" role="tabpanel" id="subtab-panel-devices" aria-labelledby="subtab-devices">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
              <div>
                <h4 className="font-bold text-white uppercase text-xs">Biometric Device Fingerprints & Trust list</h4>
                <p className="text-[10px] text-gray-400 font-sans mt-0.5">Below are devices authorized to sign ledger clearance bills under your identity profile.</p>
              </div>

              {/* Emergency Lockdown Action */}
              <button
                onClick={triggerEmergencyLock}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-red-900/40"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>⚠️ TRIGGER SYSTEM EMERGENCY FREEZE</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((dev) => (
                <div key={dev.id} className="bg-[#0c121c]/40 border border-white/5 rounded-2xl p-5 flex justify-between items-center hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-xs text-white">{dev.deviceModel}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-1">{dev.location} · {dev.ipAddress}</div>
                      <div className="text-[9px] text-gray-500 font-mono mt-0.5">Last active: {new Date(dev.lastActive).toLocaleTimeString()}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[8px] bg-[#00E0C7]/10 text-[#00E0C7] uppercase font-mono border border-[#00E0C7]/20">
                      {dev.isActive ? 'Active System Node' : 'Secondary'}
                    </span>
                    <div className="text-[9px] text-[#00E0C7] font-mono mt-1 font-bold">Trusted Fingerprint</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-TAB 4: COMPLIANCE ADMIN QUEUE EXTREME REVIEW PANEL */}
        {activeSubTab === 'admin' && (
          <div className="space-y-6 animate-fade-in" role="tabpanel" id="subtab-panel-admin" aria-labelledby="subtab-admin">
            <div className="p-4 rounded-2xl bg-[#0c121c]/60 border border-purple-500/20 text-purple-200">
              <h4 className="text-xs font-bold uppercase font-mono text-purple-400 flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4" />
                <span>REGULATORY COMPLIANCE AGENT WORKSPACE (REGULATOR OVERRIDE)</span>
              </h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">This supervisor sandbox mock allows you to test both regulatory approval pathways and emergency freezes. Tap Approve or Reject on KYC requests to alter the live server's authorization scopes in real-time!</p>
            </div>

            {/* Sandbox Users Admin State Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 space-y-4">
                <h4 className="font-mono text-[10px] text-gray-400 uppercase font-bold">Awaiting Biometric Evaluation Queue ({kycQueue.length})</h4>
                
                {kycQueue.length === 0 ? (
                  <div className="p-8 text-center bg-[#0c121c]/40 border border-white/5 rounded-2xl text-gray-500">
                    No ID verification documents currently in review queue. Submit a document signature in the Biometric ID sub-tab to fill this queue!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kycQueue.map((item) => (
                      <div key={item.id} className="bg-purple-900/5 border border-purple-500/10 hover:border-purple-500/25 transition-all rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <p className="text-[11px] font-bold text-white font-mono uppercase">{item.documentType}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">Serial: {item.documentNumber}</p>
                          <p className="text-[9px] text-purple-400 font-mono mt-0.5">Submitted status: {item.status}</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handleReviewKyc(item.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[9px] tracking-wider uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReviewKyc(item.id, 'rejected')}
                            className="bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[9px] tracking-wider uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Sandbox Accounts Status (Live State review) */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="font-mono text-[10px] text-gray-400 uppercase font-bold">Active Account Audits</h4>
                <div className="bg-[#0c121c]/40 border border-white/5 rounded-2xl p-4 space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex justify-between items-center py-2.5 border-b border-white/[0.03] last:border-0">
                      <div>
                        <div className="font-bold text-white text-xs">{u.name}</div>
                        <div className="text-[9px] text-gray-400 font-mono mt-0.5">{u.email}</div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold ${
                          u.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          u.status === 'under_review' ? 'bg-amber-500/10 text-amber-500' :
                          u.status === 'frozen' ? 'bg-red-500 text-white animate-pulse' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {u.status}
                        </span>
                        <div className="text-[8px] font-mono text-gray-500 mt-1 uppercase">Clearing limit: {u.primaryCurrency} {u.status === 'approved' ? '250,050' : '1,500'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
