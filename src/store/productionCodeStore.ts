import { create } from 'zustand';
import type { ProductionCodeStore } from '@/types/productionCode/store';
import type { IProductionCodeCard } from '@/types/productionCode';
import keraniMockData from '@/data/kerani-mock-data.json';

const STORAGE_KEY_PREFIX = 'production-codes-';
const MOCK_DATA_VERSION = 'v3'; // Increment this when mock data changes
const VERSION_KEY = 'production-codes-version';

// Initialize localStorage with mock data - always in dev mode
const initializeStorage = (nopol: string) => {
  const isDev = import.meta.env.DEV;
  const currentVersion = localStorage.getItem(VERSION_KEY);
  const storageKey = `${STORAGE_KEY_PREFIX}${nopol}`;
  
  // In dev mode, always use latest mock data
  if (isDev || currentVersion !== MOCK_DATA_VERSION) {
    // Clear all old production code data in dev mode
    if (isDev) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Set new data
    const mockProductionData = keraniMockData.productionCodes[nopol as keyof typeof keraniMockData.productionCodes];
    if (mockProductionData) {
      localStorage.setItem(storageKey, JSON.stringify(mockProductionData));
    }
    
    // Update version
    localStorage.setItem(VERSION_KEY, MOCK_DATA_VERSION);
  } else {
    // In production, only initialize if empty
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      const mockProductionData = keraniMockData.productionCodes[nopol as keyof typeof keraniMockData.productionCodes];
      if (mockProductionData) {
        localStorage.setItem(storageKey, JSON.stringify(mockProductionData));
      }
    }
  }
};

// Get data from localStorage
const getStoredData = (nopol: string) => {
  initializeStorage(nopol);
  const storageKey = `${STORAGE_KEY_PREFIX}${nopol}`;
  const stored = localStorage.getItem(storageKey);
  
  if (stored) {
    const data = JSON.parse(stored);
    
    // Update completed_entries based on entry data
    const entryDataKey = `production-code-entry-${nopol}`;
    data.productionCodes = data.productionCodes.map((code: any) => {
      const entryKey = `${entryDataKey}-${code.id}`;
      const entryData = localStorage.getItem(entryKey);
      
      if (entryData) {
        const entry = JSON.parse(entryData);
        code.completed_entries = entry.productionCodes?.length || 0;
      }
      
      return code;
    });
    
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  }
  
  return null;
};

export const useProductionCodeStore = create<ProductionCodeStore>((set) => ({
  nopol: '',
  goodsCount: 0,
  productionCodes: [],
  isLoading: false,
  error: null,
  selectedGate1: null,
  selectedGate2: null,

  loadProductionCodes: (nopol: string) => {
    set({ isLoading: true, error: null });
    
    // Simulate loading from localStorage
    setTimeout(() => {
      const data = getStoredData(nopol);
      
      if (data) {
        const codes: IProductionCodeCard[] = data.productionCodes.map((code: any) => ({
          ...code,
          isCompleted: code.completed_entries === code.total_entries,
          progress_percentage: Math.round((code.completed_entries / code.total_entries) * 100)
        }));
        
        set({ 
          nopol: data.nopol,
          goodsCount: data.goodsCount,
          productionCodes: codes,
          isLoading: false 
        });
      } else {
        set({ 
          productionCodes: [],
          isLoading: false,
          error: 'Data tidak ditemukan untuk nopol: ' + nopol
        });
      }
    }, 300);
  },

  setSelectedGate1: (gate: string | null) => {
    set({ selectedGate1: gate });
  },

  setSelectedGate2: (gate: string | null) => {
    set({ selectedGate2: gate });
  },

  reset: () => set({
    nopol: '',
    goodsCount: 0,
    productionCodes: [],
    isLoading: false,
    error: null,
    selectedGate1: null,
    selectedGate2: null
  })
}));