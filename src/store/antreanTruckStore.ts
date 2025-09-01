import { create } from 'zustand';
import type { AntreanTruckStore } from '@/types/antreanTruck/store';
import type { IAntreanCard } from '@/types/antreanTruck';
import mockData from '@/data/antrean-truck-mock-data.json';

export const useAntreanTruckStore = create<AntreanTruckStore>((set) => ({
  antreanList: [],
  isLoading: false,
  error: null,

  loadAntreanList: () => {
    set({ isLoading: true, error: null });
    
    // Simulate loading with mock data
    setTimeout(() => {
      set({ 
        antreanList: mockData as IAntreanCard[],
        isLoading: false 
      });
    }, 500);
  },

  reset: () => set({
    antreanList: [],
    isLoading: false,
    error: null
  })
}));