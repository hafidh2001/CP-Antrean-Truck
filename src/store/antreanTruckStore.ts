import { create } from 'zustand';
import type { AntreanTruckStore } from '@/types/antreanTruck/store';
import type { IAntreanCard } from '@/types/antreanTruck';
import kraniMockData from '@/data/krani-mock-data.json';

const STORAGE_KEY = 'antrean-truck-data';
const MOCK_DATA_VERSION = 'v3'; // Increment this when mock data changes
const VERSION_KEY = 'antrean-truck-data-version';

// Initialize localStorage with mock data - always in dev mode
const initializeStorage = () => {
  const isDev = import.meta.env.DEV;
  const currentVersion = localStorage.getItem(VERSION_KEY);
  
  // In dev mode, always use latest mock data
  if (isDev || currentVersion !== MOCK_DATA_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kraniMockData.antreanTruck));
    localStorage.setItem(VERSION_KEY, MOCK_DATA_VERSION);
  }
};

// Get data from localStorage
const getStoredData = (): IAntreanCard[] => {
  initializeStorage();
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const useAntreanTruckStore = create<AntreanTruckStore>((set) => ({
  antreanList: [],
  isLoading: false,
  error: null,

  loadAntreanList: () => {
    set({ isLoading: true, error: null });
    
    // Simulate loading from localStorage
    setTimeout(() => {
      const antreanCards = getStoredData();
      set({ antreanList: antreanCards, isLoading: false });
    }, 300);
  },

  reset: () => set({
    antreanList: [],
    isLoading: false,
    error: null
  })
}));