import { create } from 'zustand';
import type { WarehouseViewStore } from '@/types/warehouseView';
import { warehouseApi } from '@/services/warehouseApi';

// Hardcoded token for view-only access
const VIEW_USER_TOKEN = 'dNS1f.f4HKgIXqH9GDs9F150nhSbK';

export const useWarehouseViewStore = create<WarehouseViewStore>((set, get) => ({
  currentWarehouse: null,
  isLoading: false,
  error: null,
  hasInitialized: false,

  loadWarehouse: async (warehouseId: number) => {
    if (get().hasInitialized) return;

    set({ isLoading: true, error: null });
    
    try {
      // Use hardcoded token for view-only access
      const warehouseData = await warehouseApi.getWarehouseLocations(
        warehouseId,
        VIEW_USER_TOKEN
      );
      
      set({
        currentWarehouse: warehouseData,
        isLoading: false,
        error: null,
        hasInitialized: true
      });
    } catch (error) {
      console.error('Failed to load warehouse:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load warehouse',
        hasInitialized: true
      });
    }
  },

  reset: () => set({
    currentWarehouse: null,
    isLoading: false,
    error: null,
    hasInitialized: false
  })
}));