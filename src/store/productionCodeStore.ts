import { create } from 'zustand';
import type { ProductionCodeStore } from '@/types/productionCode/store';
import type { IProductionCodeCard } from '@/types/productionCode';
import mockData from '@/data/production-code-mock-data.json';

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
    
    // Simulate loading with mock data
    setTimeout(() => {
      const data = mockData[nopol as keyof typeof mockData];
      
      if (data) {
        const codes: IProductionCodeCard[] = data.productionCodes.map(code => ({
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
    }, 500);
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