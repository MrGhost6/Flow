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
      
      // Calculate pie data
      const catData = Object.entries(data.categoriesBreakdown || {}).map(([key, value]) => {
        let color = '#2792ff';
        if (key === 'Dining') color = '#00dfc6';
        if (key === 'Utilities') color = '#cabeff';
        if (key === 'Travel') color = '#a5c8ff';
        return { name: key, value: Number(value), color };
      });

      // Calculate trends
      const trendRes = await fetch(`/api/analytics/trends?timeframe=${selectedTimeframe}`);
      const trendData = trendRes.ok ? await trendRes.json() : [];

      set({
        overview: {
          totalSpent: data.totalMonthlySpentUSD.toFixed(2),
          totalReceived: (data.totalMonthlySpentUSD * 1.5).toFixed(2), // proportional income mock
          netCashflow: (data.totalMonthlySpentUSD * 0.5).toFixed(2),
          topCategory: data.topCategory || 'Dining',
          savingsRate: `${data.savingsRatePercentage || 74}%`
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
