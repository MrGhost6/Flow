import { create } from 'zustand';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to pull system alert streams');
      const data = await res.json();
      set({ notifications: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Notification sync failed', isLoading: false });
    }
  },

  markAsRead: async (id) => {
    const prev = get().notifications;
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    }));
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
      if (!res.ok) {
        set({ notifications: prev });
      }
    } catch (err) {
      set({ notifications: prev });
      console.error('Failed to mark notification read status', err);
    }
  },

  markAllAsRead: async () => {
    const prev = get().notifications;
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true }))
    }));
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      if (!res.ok) {
        set({ notifications: prev });
      }
    } catch (err) {
      set({ notifications: prev });
      console.error('Failed to clear notifications stream', err);
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.isRead).length;
  }
}));
