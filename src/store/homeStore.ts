import { create } from 'zustand';
import type { HomeStore } from '@/types/home/store';
import type { IWarehouse } from '@/types/home';
import mockData from '@/data/mock-data.json';

// For now, using mock data since API for warehouse list is not implemented
const DEFAULT_WAREHOUSE: IWarehouse = {
  id: mockData.id as number,
  name: mockData.name,
  description: mockData.description
};

export const useHomeStore = create<HomeStore>((set, get) => ({
  warehouses: [],
  isLoading: false,
  error: null,

  loadWarehouses: () => {
    set({ isLoading: true, error: null });
    
    // Simulate loading with mock data
    setTimeout(() => {
      set({ 
        warehouses: [DEFAULT_WAREHOUSE],
        isLoading: false 
      });
    }, 500);
  },

  addWarehouse: (name, description) => {
    const state = get();
    const maxId = Math.max(0, ...state.warehouses.map(w => w.id));
    const newWarehouse: IWarehouse = {
      id: maxId + 1,
      name,
      description
    };
    
    set(state => ({
      warehouses: [...state.warehouses, newWarehouse]
    }));
  },

  deleteWarehouse: (id) => {
    set(state => ({
      warehouses: state.warehouses.filter(w => w.id !== id)
    }));
  },

  reset: () => set({
    warehouses: [],
    isLoading: false,
    error: null
  })
}));