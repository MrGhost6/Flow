import { create } from 'zustand';
import { SecuritySession } from '../types';

interface DeviceState {
  devices: SecuritySession[];
  isLoading: boolean;
  error: string | null;
  fetchDevices: () => Promise<void>;
  trustDevice: (id: string) => Promise<boolean>;
  removeDevice: (id: string) => Promise<boolean>;
  revokeSession: (id: string) => Promise<boolean>;
  revokeAllOtherSessions: () => Promise<boolean>;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  isLoading: false,
  error: null,

  fetchDevices: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/security/devices');
      if (!res.ok) throw new Error('Could not pull cached active device credentials.');
      const data = await res.json();
      set({ devices: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch terminal assets', isLoading: false });
    }
  },

  trustDevice: async (id: string) => {
    try {
      const res = await fetch(`/api/security/devices/${id}/trust`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const updatedDevice = await res.json();
        set({
          devices: get().devices.map(d => d.id === id ? { ...d, ...updatedDevice } : d)
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  removeDevice: async (id: string) => {
    try {
      const res = await fetch(`/api/security/devices/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        set({
          devices: get().devices.filter(d => d.id !== id)
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  revokeSession: async (id: string) => {
    try {
      const res = await fetch(`/api/security/sessions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        set({
          devices: get().devices.filter(d => d.id !== id) // Session revoked removes device/session
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  revokeAllOtherSessions: async () => {
    try {
      const res = await fetch('/api/security/sessions', {
        method: 'DELETE'
      });
      if (res.ok) {
        // Keep only current devices (e.g. usually the one with a dynamic marker, but in mock let's clear inactive devices or keep only 1)
        const current = get().devices.filter(d => d.isActive);
        set({ devices: current });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}));
