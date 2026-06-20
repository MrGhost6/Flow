import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSecurityStore } from '../stores/securityStore';
import { useNotificationStore } from '../stores/notificationStore';

const ACCENT_COLORS = ['#a5c8ff', '#cabeff', '#00dfc6', '#ffb4ab', '#fbbf24'];

export default function SettingsPage() {
  const { overview, fetchSecurityData, toggleBiometrics, toggleTwoFactor } = useSecurityStore();
  const { notifications } = useNotificationStore();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState('#a5c8ff');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [txSpeed, setTxSpeed] = useState<'fastest' | 'standard' | 'economy'>('fastest');
  const [autoInvest, setAutoInvest] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  useEffect(() => {
    fetchSecurityData();
    setBiometricEnabled(overview?.biometricsActive ?? false);
    setMfaEnabled(overview?.twoFactorActive ?? false);
  }, []);

  useEffect(() => {
    if (overview) {
      setBiometricEnabled(overview.biometricsActive);
      setMfaEnabled(overview.twoFactorActive);
    }
  }, [overview]);

  useEffect(() => {
    const saved = localStorage.getItem('flow-dark-mode');
    if (saved !== null) setDarkMode(saved === 'true');
    const savedAccent = localStorage.getItem('flow-accent-color');
    if (savedAccent) setAccentColor(savedAccent);
    const savedPush = localStorage.getItem('flow-notif-push');
    if (savedPush !== null) setPushEnabled(savedPush === 'true');
    const savedEmail = localStorage.getItem('flow-notif-email');
    if (savedEmail !== null) setEmailEnabled(savedEmail === 'true');
    const savedPrice = localStorage.getItem('flow-notif-price');
    if (savedPrice !== null) setPriceAlerts(savedPrice === 'true');
    const savedCurrency = localStorage.getItem('flow-base-currency');
    if (savedCurrency) setBaseCurrency(savedCurrency);
    const savedTxSpeed = localStorage.getItem('flow-tx-speed');
    if (savedTxSpeed) setTxSpeed(savedTxSpeed as any);
    const savedAutoInvest = localStorage.getItem('flow-auto-invest');
    if (savedAutoInvest !== null) setAutoInvest(savedAutoInvest === 'true');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('flow-dark-mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', accentColor);
    localStorage.setItem('flow-accent-color', accentColor);
  }, [accentColor]);

  const handleBiometricToggle = async (checked: boolean) => {
    setBiometricEnabled(checked);
    const ok = await toggleBiometrics(checked);
    if (!ok) setBiometricEnabled(!checked);
  };

  const handleMfaToggle = async (checked: boolean) => {
    setMfaEnabled(checked);
    const ok = await toggleTwoFactor(checked);
    if (!ok) setMfaEnabled(!checked);
  };

  const toggleClass = 'relative inline-flex items-center cursor-pointer';
  const toggleBg = 'w-11 h-6 bg-[#2d353f] rounded-full transition-colors flex items-center px-1';
  const toggleDot = 'w-4 h-4 bg-white rounded-full transition-transform';
  const cardClass = 'p-4 bg-[#232b34]/30 rounded-2xl border border-[#404753]/10';
  const btnClass = 'flex items-center justify-between p-4 hover:bg-[#232b34]/40 rounded-2xl border border-[#404753]/10 transition-colors';

  return (
    <div className="animate-fade-in font-sans w-full">
      <header className="mb-8">
        <h1 className="text-[32px] md:text-[48px] font-bold leading-[40px] md:leading-[56px] tracking-[-0.02em] mb-2">Settings</h1>
        <p className="text-[#8a919f] max-w-2xl">Configure your liquid finance experience. Manage security, account preferences, and connectivity across the FLOW ecosystem.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">

          {/* Account & Security */}
          <section className="bg-[#182029]/60 backdrop-blur-2xl border border-[#8a919f]/10 rounded-3xl p-8 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#a5c8ff] text-3xl">shield_person</span>
              <h2 className="text-[24px] font-semibold tracking-[-0.01em]">Account &amp; Security</h2>
            </div>
            <div className="space-y-6">
              <div className={cardClass}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[18px]">Biometric Login</h3>
                    <p className="text-[#8a919f] text-[12px] font-semibold tracking-[0.05em] uppercase">Use FaceID or TouchID for rapid access.</p>
                  </div>
                  <label className={toggleClass}>
                    <input type="checkbox" className="sr-only" checked={biometricEnabled} onChange={(e) => handleBiometricToggle(e.target.checked)} />
                    <div className={`${toggleBg} ${biometricEnabled ? '!bg-[#2792ff]' : ''}`}>
                      <div className={`${toggleDot} ${biometricEnabled ? 'translate-x-[20px]' : ''}`} />
                    </div>
                  </label>
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[18px]">Multi-factor Authentication</h3>
                    <p className="text-[#8a919f] text-[12px] font-semibold tracking-[0.05em] uppercase">Secure your account with an extra layer of protection.</p>
                  </div>
                  <label className={toggleClass}>
                    <input type="checkbox" className="sr-only" checked={mfaEnabled} onChange={(e) => handleMfaToggle(e.target.checked)} />
                    <div className={`${toggleBg} ${mfaEnabled ? '!bg-[#2792ff]' : ''}`}>
                      <div className={`${toggleDot} ${mfaEnabled ? 'translate-x-[20px]' : ''}`} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className={btnClass} onClick={() => setChangePassOpen(true)}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#8a919f]">lock_reset</span>
                    <span className="font-bold">Change Password</span>
                  </div>
                  <span className="material-symbols-outlined text-[#8a919f]">chevron_right</span>
                </button>
                <button className={btnClass} onClick={() => setSessionsOpen(true)}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#8a919f]">devices</span>
                    <span className="font-bold">Active Sessions</span>
                  </div>
                  <span className="material-symbols-outlined text-[#8a919f]">chevron_right</span>
                </button>
              </div>
            </div>
          </section>

          {/* Financial Preferences */}
          <section className="bg-[#182029]/60 backdrop-blur-2xl border border-[#8a919f]/10 rounded-3xl p-8 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#00dfc6] text-3xl">account_balance_wallet</span>
              <h2 className="text-[24px] font-semibold tracking-[-0.01em]">Financial Preferences</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#232b34]/30 rounded-2xl border border-[#404753]/10 space-y-4">
                <label className="block text-[12px] font-semibold text-[#a5c8ff] uppercase tracking-[0.05em]">Base Currency</label>
                <div className="relative">
                  <select value={baseCurrency} onChange={(e) => { setBaseCurrency(e.target.value); localStorage.setItem('flow-base-currency', e.target.value); }} className="w-full bg-[#141c25] border border-[#404753]/20 rounded-xl py-3 px-4 appearance-none focus:ring-2 focus:ring-[#a5c8ff]/20 text-[#dbe3ef] outline-none">
                    <option value="USD">USD ($) United States Dollar</option>
                    <option value="EUR">EUR (€) Euro</option>
                    <option value="GBP">GBP (£) British Pound</option>
                    <option value="MAD">MAD (DH) Moroccan Dirham</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-[#8a919f]">expand_more</span>
                </div>
              </div>
              <div className="p-6 bg-[#232b34]/30 rounded-2xl border border-[#404753]/10 space-y-4">
                <label className="block text-[12px] font-semibold text-[#a5c8ff] uppercase tracking-[0.05em]">Transaction Speed</label>
                <div className="flex gap-2">
                  {(['fastest', 'standard', 'economy'] as const).map((speed) => (
                    <button key={speed} onClick={() => { setTxSpeed(speed); localStorage.setItem('flow-tx-speed', speed); }} className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-bold uppercase tracking-[0.05em] transition-all ${txSpeed === speed ? 'bg-[#2792ff] text-[#00315f]' : 'bg-[#2d353f]/50 text-[#8a919f]'}`}>{speed}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between p-4 bg-[#232b34]/30 rounded-2xl border border-[#404753]/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00dfc6]/10 flex items-center justify-center text-[#00dfc6]">
                  <span className="material-symbols-outlined">auto_graph</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[18px]">Auto-Investment</h3>
                  <p className="text-[#8a919f] text-[12px] font-semibold tracking-[0.05em] uppercase">Automatically allocate dividends to Liquid Pool.</p>
                </div>
              </div>
              <label className={toggleClass}>
                <input type="checkbox" className="sr-only" checked={autoInvest} onChange={(e) => { setAutoInvest(e.target.checked); localStorage.setItem('flow-auto-invest', String(e.target.checked)); }} />
                <div className={`${toggleBg} ${autoInvest ? '!bg-[#2792ff]' : ''}`}>
                  <div className={`${toggleDot} ${autoInvest ? 'translate-x-[20px]' : ''}`} />
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-8">

          {/* Appearance */}
          <section className="bg-[#182029]/60 backdrop-blur-2xl border border-[#8a919f]/10 rounded-3xl p-6 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all">
            <h2 className="text-[18px] font-bold mb-6">Appearance</h2>
            <div className="flex items-center justify-between p-4 bg-[#232b34]/30 rounded-2xl border border-[#404753]/10 mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#8a919f]">dark_mode</span>
                <span className="font-bold">Dark Mode</span>
              </div>
              <label className={toggleClass}>
                <input type="checkbox" className="sr-only" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                <div className={`${toggleBg} ${darkMode ? '!bg-[#2792ff]' : ''}`}>
                  <div className={`${toggleDot} ${darkMode ? 'translate-x-[20px]' : ''}`} />
                </div>
              </label>
            </div>
            <div className="p-4 bg-[#232b34]/30 rounded-2xl border border-[#404753]/10">
              <label className="block text-[12px] font-semibold text-[#8a919f] uppercase tracking-[0.05em] mb-3">Accent Color</label>
              <div className="flex justify-between">
                {ACCENT_COLORS.map((color) => (
                  <button key={color} onClick={() => setAccentColor(color)} className={`w-8 h-8 rounded-full transition-all ${accentColor === color ? 'ring-2 ring-white/40 scale-110' : ''}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-[#182029]/60 backdrop-blur-2xl border border-[#8a919f]/10 rounded-3xl p-6 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all">
            <h2 className="text-[18px] font-bold mb-6">Notifications</h2>
            <div className="space-y-4">
              {[
                { label: 'Push Notifications', key: 'push', val: pushEnabled, set: setPushEnabled, storage: 'flow-notif-push' },
                { label: 'Email Summaries', key: 'email', val: emailEnabled, set: setEmailEnabled, storage: 'flow-notif-email' },
                { label: 'Price Alerts', key: 'price', val: priceAlerts, set: setPriceAlerts, storage: 'flow-notif-price' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between text-[16px]">
                  <span className="text-[#8a919f]">{item.label}</span>
                  <label className={toggleClass}>
                    <input type="checkbox" className="sr-only" checked={item.val} onChange={(e) => { item.set(e.target.checked); localStorage.setItem(item.storage, String(e.target.checked)); }} />
                    <div className={`w-9 h-5 bg-[#2d353f] rounded-full transition-colors flex items-center px-0.5 ${item.val ? '!bg-[#2792ff]' : ''}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${item.val ? 'translate-x-[14px]' : ''}`} />
                    </div>
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[12px] text-[#8a919f]">
              <span className="font-semibold">{notifications.filter(n => !n.isRead).length} unread</span> notifications
            </div>
          </section>

          {/* Connected Apps */}
          <section className="bg-[#182029]/60 backdrop-blur-2xl border border-[#8a919f]/10 rounded-3xl p-6 hover:shadow-[0_0_20px_rgba(165,200,255,0.15)] transition-all">
            <h2 className="text-[18px] font-bold mb-6">Connected Apps</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#141c25]/50 rounded-xl border border-[#404753]/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#a5c8ff]" style={{ fontSize: '16px' }}>account_balance</span>
                  </div>
                  <span className="font-bold text-[12px]">Plaid Connection</span>
                </div>
                <span className="text-[#00dfc6] text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-[#00dfc6]/10 rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#141c25]/50 rounded-xl border border-[#404753]/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#cabeff]" style={{ fontSize: '16px' }}>cloud_sync</span>
                  </div>
                  <span className="font-bold text-[12px]">Google Drive</span>
                </div>
                <span className="text-[#8a919f] text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-[#2d353f] rounded-full">Syncing</span>
              </div>
              <button className="w-full py-2 border border-dashed border-[#404753]/30 rounded-xl text-[#8a919f] text-[12px] font-bold hover:border-[#a5c8ff]/50 hover:text-[#a5c8ff] transition-all">+ Connect New Service</button>
            </div>
          </section>

          {/* Danger Zone */}
          <button onClick={() => { if (window.confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) { toast.info('Account deactivation requested'); } }} className="w-full p-4 bg-[#182029]/60 backdrop-blur-2xl border border-[#ffb4ab]/20 rounded-2xl flex items-center justify-center gap-2 text-[#ffb4ab] font-bold hover:bg-[#ffb4ab]/5 transition-colors">
            <span className="material-symbols-outlined">delete_forever</span>
            Deactivate Account
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {changePassOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setChangePassOpen(false)}>
          <div className="bg-[#0c121c] border border-white/10 max-w-md w-full rounded-3xl p-6 space-y-5 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2792ff]">lock_reset</span>
                <span>Change Password</span>
              </h4>
              <button onClick={() => setChangePassOpen(false)} className="text-gray-400 hover:text-white text-xs">close</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Password updated successfully (simulated)'); setChangePassOpen(false); }} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 block font-mono uppercase mb-1.5">Current Password</label>
                <input type="password" required className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#2792ff] text-white" />
              </div>
              <div>
                <label className="text-gray-400 block font-mono uppercase mb-1.5">New Password</label>
                <input type="password" required minLength={8} className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#2792ff] text-white" />
              </div>
              <div>
                <label className="text-gray-400 block font-mono uppercase mb-1.5">Confirm New Password</label>
                <input type="password" required minLength={8} className="w-full bg-[#080d14] py-2.5 px-3 border border-white/10 rounded-xl focus:outline-none focus:border-[#2792ff] text-white" />
              </div>
              <button type="submit" className="w-full py-3 bg-[#2792ff] text-white font-semibold uppercase font-mono tracking-wider rounded-xl text-xs transition-transform hover:scale-[1.02]">UPDATE PASSWORD</button>
            </form>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {sessionsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSessionsOpen(false)}>
          <div className="bg-[#0c121c] border border-white/10 max-w-md w-full rounded-3xl p-6 space-y-5 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2792ff]">devices</span>
                <span>Active Sessions ({overview?.activeSessions || 0})</span>
              </h4>
              <button onClick={() => setSessionsOpen(false)} className="text-gray-400 hover:text-white text-xs">close</button>
            </div>
            <p className="text-xs text-gray-400">View and manage your active sessions in the <strong className="text-[#2792ff]">Security Center</strong>.</p>
            <button onClick={() => { setSessionsOpen(false); }} className="w-full py-3 bg-[#2792ff] text-white font-semibold uppercase font-mono tracking-wider rounded-xl text-xs">GO TO SECURITY CENTER</button>
          </div>
        </div>
      )}
    </div>
  );
}
