import { create } from 'zustand';
import { SearchResult } from '../types';

interface FinancialSearchState {
  query: string;
  searchResult: SearchResult | null;
  history: string[];
  isLoading: boolean;
  error: string | null;
  setQuery: (q: string) => void;
  search: (query: string) => Promise<SearchResult | null>;
  clearResult: () => void;
}

export const useFinancialSearchStore = create<FinancialSearchState>((set, get) => ({
  query: '',
  searchResult: null,
  history: [],
  isLoading: false,
  error: null,

  setQuery: (q) => set({ query: q }),

  search: async (query) => {
    if (!query.trim()) return null;
    set({ isLoading: true, error: null, query });
    try {
      const res = await fetch('/api/financial-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error('Search failed matching parameters');
      const data: SearchResult = await res.json();
      
      const prevHist = get().history.filter(h => h !== query);
      set({
        searchResult: data,
        history: [query, ...prevHist].slice(0, 5), // Keep top 5 searches
        isLoading: false
      });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Intelligent search failed', isLoading: false });
      return null;
    }
  },

  clearResult: () => set({ searchResult: null, query: '' })
}));
