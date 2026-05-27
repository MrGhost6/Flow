import { create } from 'zustand';
import { AuditLog, KycSubmission, SupportTicket, FraudEvent } from '../types';

// Admin profile roles
export type AdminRole = 'super_admin' | 'compliance_admin' | 'support_agent' | 'risk_agent' | 'finance_admin' | 'operations_admin';

export interface AdminMetrics {
  totalVolumeUSD: number;
  activeUsers: number;
  openFraudAlerts: number;
  openTickets: number;
  pendingKYC: number;
  complianceRatio: number;
}

export interface ChartItem {
  date: string;
  volumeSecured: number;
  activeSecs: number;
}

export interface AdminNotification {
  id: string;
  text: string;
  category: 'kyc' | 'fraud' | 'support' | 'system';
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: string;
}

// -----------------------------------------
// 1. MASTER ADMIN & ROLE STORE
// -----------------------------------------
interface AdminState {
  currentRole: AdminRole;
  metrics: AdminMetrics | null;
  activityChart: ChartItem[];
  notifications: AdminNotification[];
  isLoading: boolean;
  error: string | null;
  setRole: (role: AdminRole) => void;
  fetchDashboard: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  triggerSystemWideFreeze: () => Promise<boolean>;
}

export const useAdminStore = create<AdminState>((set) => ({
  currentRole: 'super_admin',
  metrics: null,
  activityChart: [],
  notifications: [],
  isLoading: false,
  error: null,

  setRole: (role) => set({ currentRole: role }),

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to pull admin workspace dashboard data.');
      const data = await res.json();
      set({
        metrics: data.metrics,
        activityChart: data.activityChart,
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        set({ notifications: data });
      }
    } catch (err) {
      console.error(err);
    }
  },

  markNotificationRead: async (id) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
        }));
      }
    } catch (err) {
      console.error(err);
    }
  },

  triggerSystemWideFreeze: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/admin/security/emergency-freeze', { method: 'POST' });
      set({ isLoading: false });
      return res.ok;
    } catch (err) {
      set({ isLoading: false });
      return false;
    }
  }
}));

// -----------------------------------------
// 2. KYC COMPLIANCE STORE
// -----------------------------------------
interface KycState {
  submissions: KycSubmission[];
  selectedSubmission: KycSubmission | null;
  isLoading: boolean;
  error: string | null;
  fetchSubmissions: () => Promise<void>;
  selectSubmission: (sub: KycSubmission | null) => void;
  reviewSubmission: (id: string, status: 'approved' | 'rejected', remarks: string) => Promise<boolean>;
}

export const useKycStore = create<KycState>((set, get) => ({
  submissions: [],
  selectedSubmission: null,
  isLoading: false,
  error: null,

  fetchSubmissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/kyc');
      if (!res.ok) throw new Error('Could not retrieve KYC review submissions queue.');
      const data = await res.json();
      set({ submissions: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectSubmission: (sub) => set({ selectedSubmission: sub }),

  reviewSubmission: async (id, status, remarks) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/admin/kyc/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks })
      });
      if (!res.ok) throw new Error('Failed to update KYC status.');
      
      const updated = await res.json();
      set((state) => ({
        submissions: state.submissions.map((sub) => (sub.id === id ? updated : sub)),
        selectedSubmission: state.selectedSubmission?.id === id ? updated : state.selectedSubmission,
        isLoading: false
      }));
      return true;
    } catch (err) {
      set({ isLoading: false });
      return false;
    }
  }
}));

// -----------------------------------------
// 3. USER MODERATION STORE
// -----------------------------------------
export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'freelancer' | 'student' | 'traveler' | 'business';
  primaryCurrency: string;
  country: string;
  dob: string;
  status: 'active' | 'restricted' | 'frozen' | 'suspended';
  kycStatus: string;
  riskScore: number;
  wallets?: any[];
  role?: string | null;
}

interface ModerationState {
  users: AdminUserDetail[];
  selectedUser: AdminUserDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchUserDetail: (id: string) => Promise<void>;
  setUserStatus: (id: string, status: string) => Promise<boolean>;
  freezeUser: (id: string) => Promise<boolean>;
  restrictUser: (id: string) => Promise<boolean>;
  assignAdminRole: (id: string, role: string | null) => Promise<boolean>;
}

export const useModerationStore = create<ModerationState>((set, get) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to retrieve compliance user database.');
      const data = await res.json();
      set({ users: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchUserDetail: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error('Failed to pull detailed user ledger record.');
      const data = await res.json();
      set({ selectedUser: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setUserStatus: async (id, status) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, status: status as any } : u)),
          selectedUser: state.selectedUser?.id === id ? { ...state.selectedUser, status: status as any } : state.selectedUser
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  freezeUser: async (id) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/freeze`, { method: 'PATCH' });
      if (res.ok) {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, status: 'frozen' } : u)),
          selectedUser: state.selectedUser?.id === id ? { ...state.selectedUser, status: 'frozen' } : state.selectedUser
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  restrictUser: async (id) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/restrict`, { method: 'PATCH' });
      if (res.ok) {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, status: 'restricted' } : u)),
          selectedUser: state.selectedUser?.id === id ? { ...state.selectedUser, status: 'restricted' } : state.selectedUser
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  assignAdminRole: async (id, role) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, role: role || undefined } : u)),
          selectedUser: state.selectedUser?.id === id ? { ...state.selectedUser, role: role || undefined } : state.selectedUser
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}));

// -----------------------------------------
// 4. SUSPICIOUS FRAUD OPERATIONS STORE
// -----------------------------------------
interface FraudOpsState {
  events: FraudEvent[];
  selectedEvent: FraudEvent | null;
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  selectEvent: (ev: FraudEvent | null) => void;
  resolveEvent: (id: string) => Promise<boolean>;
  escalateEvent: (id: string) => Promise<boolean>;
}

export const useFraudOpsStore = create<FraudOpsState>((set) => ({
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/fraud-events');
      if (!res.ok) throw new Error('Failed to pull security risk alert feed.');
      const data = await res.json();
      set({ events: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectEvent: (ev) => set({ selectedEvent: ev }),

  resolveEvent: async (id) => {
    try {
      const res = await fetch(`/api/admin/fraud-events/${id}/resolve`, { method: 'PATCH' });
      if (res.ok) {
        const resolved = await res.json();
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? resolved : e)),
          selectedEvent: state.selectedEvent?.id === id ? resolved : state.selectedEvent
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  escalateEvent: async (id) => {
    try {
      const res = await fetch(`/api/admin/fraud-events/${id}/escalate`, { method: 'PATCH' });
      if (res.ok) {
        const escalated = await res.json();
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? escalated : e)),
          selectedEvent: state.selectedEvent?.id === id ? escalated : state.selectedEvent
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}));

// -----------------------------------------
// 5. TECHNICAL SUPPORT OPERATIONS STORE
// -----------------------------------------
export interface SupportTicketEnriched extends SupportTicket {
  userName?: string;
}

interface SupportOpsState {
  tickets: SupportTicketEnriched[];
  selectedTicket: SupportTicketEnriched | null;
  isLoading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  fetchTicketDetail: (id: string) => Promise<void>;
  updateTicketAttributes: (id: string, attributes: { status?: string; priority?: string; category?: string }) => Promise<boolean>;
  sendAgentReply: (id: string, text: string) => Promise<boolean>;
}

export const useSupportOpsStore = create<SupportOpsState>((set) => ({
  tickets: [],
  selectedTicket: null,
  isLoading: false,
  error: null,

  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/support/tickets');
      if (!res.ok) throw new Error('Could not pull support operations queue.');
      const data = await res.json();
      set({ tickets: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchTicketDetail: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`);
      if (!res.ok) throw new Error('Could not fetch support ticket details.');
      const data = await res.json();
      set({ selectedTicket: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateTicketAttributes: async (id, attributes) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributes)
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...updated } : t)),
          selectedTicket: state.selectedTicket?.id === id ? { ...state.selectedTicket, ...updated } : state.selectedTicket
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  sendAgentReply: async (id, text) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...updated } : t)),
          selectedTicket: state.selectedTicket?.id === id ? { ...state.selectedTicket, ...updated } : state.selectedTicket
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}));

// -----------------------------------------
// 6. TRACE AUDIT EXPLORER STORE
// -----------------------------------------
interface AuditExplorerState {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
}

export const useAuditStore = create<AuditExplorerState>((set) => ({
  logs: [],
  isLoading: false,
  error: null,

  fetchLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (!res.ok) throw new Error('Could not acquire system immutable audit logs.');
      const data = await res.json();
      set({ logs: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));

// -----------------------------------------
// 7. OPERATIONAL ANALYTICS STORE
// -----------------------------------------
export interface AnalyticsUserMetric {
  growthRate: number;
  userTypesDistribution: { freelancer: number; student: number; traveler: number; business: number };
  verificationStatuses: { active: number; pending: number; restricted: number; frozen: number };
}

export interface AnalyticsTxMetric {
  totalTransactionsCount: number;
  volumeByCurrency: { USD: number; EUR: number; MAD: number };
  categoryVolume: { Software: number; Income: number; Dining: number; Travel: number };
}

export interface AnalyticsFraudMetric {
  rate: number;
  eventsCount: number;
  activeAlertsCount: number;
  severityBreakdown: { low: number; medium: number; high: number; critical: number };
}

export interface AnalyticsSupportMetric {
  avgResolutionTimeMinutes: number;
  priorityBreakdown: { low: number; medium: number; high: number; critical: number };
  statusBreakdown: { open: number; pending: number; resolved: number; closed: number };
}

interface AnalyticsState {
  usersMetric: AnalyticsUserMetric | null;
  transactionsMetric: AnalyticsTxMetric | null;
  fraudMetric: AnalyticsFraudMetric | null;
  supportMetric: AnalyticsSupportMetric | null;
  isLoading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
}

export const useAdminAnalyticsStore = create<AnalyticsState>((set) => ({
  usersMetric: null,
  transactionsMetric: null,
  fraudMetric: null,
  supportMetric: null,
  isLoading: false,
  error: null,

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const [uRes, tRes, fRes, sRes] = await Promise.all([
        fetch('/api/admin/analytics/users'),
        fetch('/api/admin/analytics/transactions'),
        fetch('/api/admin/analytics/fraud'),
        fetch('/api/admin/analytics/support'),
      ]);

      set({
        usersMetric: uRes.ok ? await uRes.json() : null,
        transactionsMetric: tRes.ok ? await tRes.json() : null,
        fraudMetric: fRes.ok ? await fRes.json() : null,
        supportMetric: sRes.ok ? await sRes.json() : null,
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));
