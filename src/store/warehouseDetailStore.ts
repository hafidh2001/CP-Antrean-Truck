import { create } from 'zustand';
import { ITextElement, TAnyStorageUnit, WarehouseDecryptData } from '@/types/warehouseDetail';
import type { WarehouseDetailStore } from '@/types/warehouseDetail/store';
import { ElementTypeEnum } from '@/types';
import { isStorageUnit } from '@/functions/warehouseHelpers';
import { warehouseApi } from '@/services/warehouseApi';
import { decryptAES } from '@/functions/decrypt';

export const useWarehouseDetailStore = create<WarehouseDetailStore>((set, get) => ({
  currentWarehouse: null,
  selectedUnit: null,
  toolMode: 'select',
  isLoading: false,
  isSaving: false,
  error: null,
  decryptedData: null,
  hasInitialized: false,

  initializeFromEncryptedData: async (encryptedData: string) => {
    if (get().hasInitialized) return;

    set({ isLoading: true, error: null });
    
    try {
      // Decrypt to get warehouse_id and user_token
      const decrypted = await decryptAES<WarehouseDecryptData>(encryptedData);
      set({ decryptedData: decrypted });
      
      // Load warehouse data using decrypted info
      // Convert warehouse_id to number if it's a string
      const warehouseId = typeof decrypted.warehouse_id === 'string' 
        ? parseInt(decrypted.warehouse_id, 10) 
        : decrypted.warehouse_id;
        
      const warehouseData = await warehouseApi.getWarehouseLocations(
        warehouseId,
        decrypted.user_token
      );
      
      set({
        currentWarehouse: warehouseData,
        isLoading: false,
        error: null,
        hasInitialized: true
      });
    } catch (error) {
      console.error('Failed to initialize warehouse:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load warehouse',
        hasInitialized: true
      });
      throw error;
    }
  },

  setToolMode: (mode) => set({ toolMode: mode }),

  saveWarehouse: async () => {
    const state = get();
    if (!state.currentWarehouse || !state.decryptedData) {
      return { success: false, error: 'No warehouse or authentication data available' };
    }
    
    set({ isSaving: true, error: null });
    
    try {
      const result = await warehouseApi.saveWarehouseLocations(
        state.currentWarehouse.id,
        state.currentWarehouse.storage_units,
        state.decryptedData.user_token
      );
      
      if (result.success) {
        // Reload to get fresh data with IDs from backend
        const freshData = await warehouseApi.getWarehouseLocations(
          state.currentWarehouse.id,
          state.decryptedData.user_token
        );
        
        set({ 
          currentWarehouse: freshData,
          isSaving: false 
        });
        
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || 'Failed to save warehouse');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save warehouse';
      set({ isSaving: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  addUnit: (unit) => {
    set((state) => {
      if (!state.currentWarehouse) return state;
      
      // Ensure unique ID and proper type
      const newUnit: TAnyStorageUnit = {
        ...unit,
        id: unit.id || Date.now(),
        warehouse_id: state.currentWarehouse.id
      } as TAnyStorageUnit;
      
      return {
        ...state,
        currentWarehouse: {
          ...state.currentWarehouse,
          storage_units: [...state.currentWarehouse.storage_units, newUnit]
        }
      };
    });
  },

  updateUnit: (id, updates) => {
    set((state) => {
      if (!state.currentWarehouse) return state;
      
      return {
        ...state,
        currentWarehouse: {
          ...state.currentWarehouse,
          storage_units: state.currentWarehouse.storage_units.map(unit =>
            unit.id === id ? { ...unit, ...updates } as TAnyStorageUnit : unit
          )
        }
      };
    });
  },

  removeUnit: (id) => {
    set((state) => {
      if (!state.currentWarehouse) return state;
      
      return {
        ...state,
        currentWarehouse: {
          ...state.currentWarehouse,
          storage_units: state.currentWarehouse.storage_units.filter(unit => unit.id !== id)
        },
        selectedUnit: state.selectedUnit?.id === id ? null : state.selectedUnit
      };
    });
  },

  selectUnit: (unit) => set({ selectedUnit: unit }),

  moveUnit: (id, x, y) => {
    const state = get();
    if (!state.currentWarehouse) return;
    
    const unit = state.currentWarehouse.storage_units.find(u => u.id === id);
    if (!unit || !isStorageUnit(unit)) return;
    
    // Check for overlaps
    const overlap = get().checkOverlap(unit, x, y);
    if (overlap && overlap.id !== id) return;
    
    get().updateUnit(id, { x, y });
  },

  getStorageUnits: () => {
    const state = get();
    if (!state.currentWarehouse) return [];
    return state.currentWarehouse.storage_units.filter(isStorageUnit);
  },

  getTextElements: () => {
    const state = get();
    if (!state.currentWarehouse) return [];
    return state.currentWarehouse.storage_units.filter(
      unit => unit.type === ElementTypeEnum.TEXT
    ) as ITextElement[];
  },

  checkOverlap: (unit, newX, newY) => {
    const storageUnits = get().getStorageUnits();
    
    for (const otherUnit of storageUnits) {
      if (otherUnit.id === unit.id) continue;
      
      const overlap = (
        newX < otherUnit.x + otherUnit.width &&
        newX + unit.width > otherUnit.x &&
        newY < otherUnit.y + otherUnit.height &&
        newY + unit.height > otherUnit.y
      );
      
      if (overlap) return otherUnit;
    }
    
    return null;
  },

  reset: () => set({
    currentWarehouse: null,
    selectedUnit: null,
    toolMode: 'select',
    isLoading: false,
    isSaving: false,
    error: null,
    decryptedData: null,
    hasInitialized: false
  })
}));