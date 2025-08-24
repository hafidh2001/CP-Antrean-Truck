import { create } from 'zustand';
import type { WarehouseViewStore } from '@/types/warehouseView';
import { warehouseApi } from '@/services/warehouseApi';

// Hardcoded token for view-only access
const VIEW_USER_TOKEN = 'dNS1f.f4HKgIXqH9GDs9F150nhSbK';

export const useWarehouseViewStore = create<WarehouseViewStore>((set) => ({
  currentWarehouse: null,
  isLoading: false,
  error: null,

  loadWarehouse: async (warehouseId: number) => {
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
        error: null
      });
    } catch (error) {
      console.error('Failed to load warehouse:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load warehouse'
      });
    }
  },

  reset: () => set({
    currentWarehouse: null,
    isLoading: false,
    error: null
  })
}));