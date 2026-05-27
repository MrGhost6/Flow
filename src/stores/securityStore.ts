import { create } from 'zustand';
import { SecurityOverview } from '../types';

interface SecurityState {
  overview: SecurityOverview | null;
  isLoading: boolean;
  error: string | null;
  fetchSecurityData: () => Promise<void>;
  freezeAccount: () => Promise<{ success: boolean; message: string }>;
  recoverAccount: () => Promise<{ success: boolean; message: string }>;
  toggleBiometrics: (active: boolean) => Promise<boolean>;
  toggleTwoFactor: (active: boolean) => Promise<boolean>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  overview: null,
  isLoading: false,
  error: null,

  fetchSecurityData: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Fetch dynamically computed risk score
      const scoreRes = await fetch('/api/security/score');
      if (!scoreRes.ok) throw new Error('Could not pull security score analysis.');
      const scoreData = await scoreRes.json();

      // 2. Fetch devices and sessions count
      const devRes = await fetch('/api/security/devices');
      const devData = devRes.ok ? await devRes.json() : [];

      const activeSess = devData.filter((d: any) => d.isActive).length || 1;
      const trustedDev = devData.filter((d: any) => d.isTrusted).length || 1;

      // 3. Set combined overview
      let scoreLabel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (scoreData.score < 50) scoreLabel = 'critical';
      else if (scoreData.score < 75) scoreLabel = 'high';
      else if (scoreData.score < 90) scoreLabel = 'medium';

      set({
        overview: {
          riskScore: scoreLabel,
          riskScoreValue: scoreData.score || 95,
          trustedDevices: trustedDev,
          activeSessions: activeSess,
          recentAlerts: scoreData.riskSignalsDetected || 0,
          biometricsActive: scoreData.biometricsActive ?? true,
          twoFactorActive: scoreData.twoFactorActive ?? true
        },
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed security load', isLoading: false });
    }
  },

  freezeAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/security/emergency-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Could not execute freeze protocol.');
      const data = await res.json();
      
      // Update local state to reflectsuspended state if successful
      if (get().overview) {
        set({
          overview: {
            ...get().overview!,
            riskScore: 'critical',
            riskScoreValue: 20
          }
        });
      }

      set({ isLoading: false });
      return { success: true, message: data.message };
    } catch (err: any) {
      set({ error: err.message || 'Freeze critical path failed', isLoading: false });
      return { success: false, message: err.message || 'Failed freeze trigger' };
    }
  },

  recoverAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/security/recover-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Credentials recovery authorization rejected.');
      const data = await res.json();
      
      set({ isLoading: false });
      await get().fetchSecurityData();
      return { success: true, message: data.message };
    } catch (err: any) {
      set({ error: err.message || 'Recovery workflow execution failed', isLoading: false });
      return { success: false, message: err.message || 'Failed recovery request' };
    }
  },

  toggleBiometrics: async (active: boolean) => {
    try {
      const res = await fetch('/api/security/biometrics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: active })
      });
      if (res.ok) {
        if (get().overview) {
          set({
            overview: {
              ...get().overview!,
              biometricsActive: active
            }
          });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  toggleTwoFactor: async (active: boolean) => {
    try {
      const res = await fetch('/api/security/two-factor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: active })
      });
      if (res.ok) {
        if (get().overview) {
          set({
            overview: {
              ...get().overview!,
              twoFactorActive: active
            }
          });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}));
