import { create } from 'zustand';
import { AnalyticsOverview } from '../types';

interface AnalyticsTrends {
  name: string;
  Income: number;
  Expenses: number;
}

interface AnalyticsState {
  overview: AnalyticsOverview | null;
  trends: AnalyticsTrends[];
  categories: { name: string; value: number; color: string }[];
  timeframe: string;
  isLoading: boolean;
  error: string | null;
  fetchAnalytics: (timeframe?: string) => Promise<void>;
  setTimeframe: (timeframe: string) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overview: null,
  trends: [],
  categories: [],
  timeframe: '3_months',
  isLoading: false,
  error: null,

  setTimeframe: (timeframe) => set({ timeframe }),

  fetchAnalytics: async (timeframe) => {
    const selectedTimeframe = timeframe || '3_months';
    set({ isLoading: true, error: null, timeframe: selectedTimeframe });
    try {
      const res = await fetch(`/api/analytics/overview?timeframe=${selectedTimeframe}`);
      if (!res.ok) throw new Error('Failed to fetch analytics overview');
      const data = await res.json();
      
      // Backend returns: { totalIncome, totalExpenses, netCashflow, balance, transactionCount }
      // Calculate pie data (backend doesn't return categoriesBreakdown, use empty)
      const catData: { name: string; value: number; color: string }[] = [];

      // Calculate trends
      const trendRes = await fetch(`/api/analytics/trends?timeframe=${selectedTimeframe}`);
      const trendRaw = trendRes.ok ? await trendRes.json() : [];
      const trendData = Array.isArray(trendRaw) ? trendRaw : (trendRaw.trends || []);

      set({
        overview: {
          totalSpent: (data.totalExpenses || 0).toFixed(2),
          totalReceived: (data.totalIncome || 0).toFixed(2),
          netCashflow: (data.netCashflow || 0).toFixed(2),
          topCategory: 'Other',
          savingsRate: data.totalIncome > 0 ? ((data.totalIncome - data.totalExpenses) / data.totalIncome * 100).toFixed(1) + '%' : '0.0%'
        },
        categories: catData,
        trends: trendData,
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update analytics engine', isLoading: false });
    }
  }
}));
