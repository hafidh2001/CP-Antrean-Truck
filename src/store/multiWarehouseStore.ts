import { create } from 'zustand';
import { IWarehouse, IStorageUnit, ITextElement, TAnyStorageUnit, TToolMode } from '@/types/warehouseDetail';
import { ElementTypeEnum, StorageTypeEnum } from '@/types';
import { isStorageUnit, isTextElement } from '@/functions/warehouseHelpers';
import mockData from '@/data/mock-data.json';




interface MultiWarehouseStore {
  warehouses: IWarehouse[];
  currentWarehouse: IWarehouse | null;
  selectedUnit: TAnyStorageUnit | null;
  toolMode: TToolMode;
  
  loadWarehouses: () => void;
  setToolMode: (mode: TToolMode) => void;
  addWarehouse: (name: string, description: string) => void;
  deleteWarehouse: (id: number) => void;
  setCurrentWarehouse: (id: number) => void;
  updateWarehouse: (warehouseId: number, updates: Partial<IWarehouse>) => void;
  saveWarehouseToStorage: () => void;
  saveAllWarehouses: () => void;
  
  // Unified storage unit operations
  addUnit: (unit: TAnyStorageUnit) => void;
  updateUnit: (id: number, updates: Partial<TAnyStorageUnit>) => void;
  removeUnit: (id: number) => void;
  selectUnit: (unit: TAnyStorageUnit | null) => void;
  moveUnit: (id: number, x: number, y: number) => void;
  
  // Helper methods
  getStorageUnits: () => IStorageUnit[];
  getTextElements: () => ITextElement[];
  checkOverlap: (unit: IStorageUnit, newX: number, newY: number) => IStorageUnit | null;
}

// Helper function to ensure data compatibility
const migrateOldData = (data: any[]): IWarehouse[] => {
  return data.map((warehouse: any) => {
    const warehouseId = typeof warehouse.id === 'string' ? parseInt(warehouse.id) || 1 : warehouse.id;
    let storage_units: TAnyStorageUnit[] = [];

    // Handle old structure with layout
    if (warehouse.layout) {
      // Migrate old storageUnits from layout
      if (warehouse.layout.storage_units) {
        warehouse.layout.storage_units.forEach((unit: any) => {
          if ('type' in unit && unit.type === ElementTypeEnum.STORAGE) {
            storage_units.push(unit as TAnyStorageUnit);
          } else {
            // Legacy storage unit
            storage_units.push({
              id: typeof unit.id === 'string' ? parseInt(unit.id) || Date.now() : unit.id,
              type: ElementTypeEnum.STORAGE,
              label: unit.name,
              x: unit.x,
              y: unit.y,
              warehouse_id: warehouseId,
              width: unit.width,
              height: unit.height,
              type_storage: unit.type === 'rack' ? StorageTypeEnum.RACK : StorageTypeEnum.WAREHOUSE,
              text_styling: {
                font_size: 16,
                font_family: 'Arial, sans-serif',
                rotation: unit.rotation || 0,
                text_color: '#000000'
              }
            } as IStorageUnit);
          }
        });
      }
      
      // Migrate old textElements from layout
      if (warehouse.layout.text_elements) {
        warehouse.layout.text_elements.forEach((element: any) => {
          storage_units.push({
            id: typeof element.id === 'string' ? parseInt(element.id) || Date.now() : element.id,
            type: ElementTypeEnum.TEXT,
            label: element.text || 'Text',
            x: element.x,
            y: element.y,
            warehouse_id: warehouseId,
            text_styling: {
              font_size: element.font_size || 16,
              font_family: element.font_family || 'Arial, sans-serif',
              rotation: element.rotation || 0,
              text_color: element.color || '#000000'
            }
          } as ITextElement);
        });
      }
    } else if (warehouse.storage_units) {
      // Already in new format
      storage_units = warehouse.storage_units;
    }
    
    return {
      id: warehouseId,
      name: warehouse.name,
      description: warehouse.description,
      storage_units: storage_units
    } as IWarehouse;
  });
};

export const useMultiWarehouseStore = create<MultiWarehouseStore>((set, get) => ({
  warehouses: [],
  currentWarehouse: null,
  selectedUnit: null,
  toolMode: 'select',

  loadWarehouses: () => {
    // Load from localStorage if exists
    const savedData = localStorage.getItem('allWarehouses');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      const migrated = migrateOldData(Array.isArray(parsed) ? parsed : parsed.warehouses || []);
      set({ warehouses: migrated });
    } else {
      // Use default warehouse with mock data
      const defaultWarehouse = migrateOldData([mockData])[0];
      set({ warehouses: [defaultWarehouse] });
      localStorage.setItem('allWarehouses', JSON.stringify([defaultWarehouse]));
    }
  },

  setToolMode: (mode) => set({ toolMode: mode }),

  addWarehouse: (name, description) => {
    const state = get();
    const maxId = Math.max(0, ...state.warehouses.map(w => w.id));
    const newWarehouse: IWarehouse = {
      id: maxId + 1,
      name,
      description,
      storage_units: []
    };

    set((state) => {
      const updatedWarehouses = [...state.warehouses, newWarehouse];
      // Save to localStorage immediately
      localStorage.setItem('allWarehouses', JSON.stringify(updatedWarehouses));
      return { warehouses: updatedWarehouses };
    });
  },

  deleteWarehouse: (id) => {
    set((state) => {
      const updatedWarehouses = state.warehouses.filter(w => w.id !== id);
      // Save to localStorage immediately
      localStorage.setItem('allWarehouses', JSON.stringify(updatedWarehouses));
      
      // If the deleted warehouse was the current one, clear it
      const newCurrentWarehouse = state.currentWarehouse?.id === id ? null : state.currentWarehouse;
      
      return { 
        warehouses: updatedWarehouses,
        currentWarehouse: newCurrentWarehouse
      };
    });
  },

  setCurrentWarehouse: (id) => {
    const warehouse = get().warehouses.find(w => w.id === id);
    if (warehouse) {
      set({ currentWarehouse: warehouse, selectedUnit: null });
    }
  },

  updateWarehouse: (warehouseId, updates) => {
    set((state) => {
      const warehouses = state.warehouses.map(w => 
        w.id === warehouseId 
          ? { ...w, ...updates }
          : w
      );
      
      const currentWarehouse = state.currentWarehouse?.id === warehouseId
        ? warehouses.find(w => w.id === warehouseId) || null
        : state.currentWarehouse;
      
      // Save to localStorage
      localStorage.setItem('allWarehouses', JSON.stringify(warehouses));
      
      return { warehouses, currentWarehouse };
    });
  },

  saveWarehouseToStorage: () => {
    const state = get();
    localStorage.setItem('allWarehouses', JSON.stringify(state.warehouses));
  },

  saveAllWarehouses: () => {
    const state = get();
    localStorage.setItem('allWarehouses', JSON.stringify(state.warehouses));
  },

  // Unified unit operations
  addUnit: (unit) => {
    const currentWarehouse = get().currentWarehouse;
    if (!currentWarehouse) return;
    
    const updatedUnits = [...currentWarehouse.storage_units, unit];
    get().updateWarehouse(currentWarehouse.id, { storage_units: updatedUnits });
  },

  updateUnit: (id, updates) => {
    const currentWarehouse = get().currentWarehouse;
    if (!currentWarehouse) return;
    
    const updatedUnits = currentWarehouse.storage_units.map(unit => 
      unit.id === id ? { ...unit, ...updates } as TAnyStorageUnit : unit
    );
    get().updateWarehouse(currentWarehouse.id, { storage_units: updatedUnits });
  },

  removeUnit: (id) => {
    const currentWarehouse = get().currentWarehouse;
    if (!currentWarehouse) return;
    
    const updatedUnits = currentWarehouse.storage_units.filter(unit => unit.id !== id);
    get().updateWarehouse(currentWarehouse.id, { storage_units: updatedUnits });
    set({ selectedUnit: null });
  },

  selectUnit: (unit) => set({ selectedUnit: unit }),

  moveUnit: (id, x, y) => {
    get().updateUnit(id, { x, y });
  },

  // Helper methods
  getStorageUnits: () => {
    const { currentWarehouse } = get();
    if (!currentWarehouse) return [];
    return currentWarehouse.storage_units.filter(isStorageUnit);
  },

  getTextElements: () => {
    const { currentWarehouse } = get();
    if (!currentWarehouse) return [];
    return currentWarehouse.storage_units.filter(isTextElement);
  },

  checkOverlap: (unit, newX, newY) => {
    const storageUnits = get().getStorageUnits();
    for (const other of storageUnits) {
      if (other.id === unit.id) continue;
      
      const overlap = !(
        newX + unit.width <= other.x ||
        newX >= other.x + other.width ||
        newY + unit.height <= other.y ||
        newY >= other.y + other.height
      );
      
      if (overlap) return other;
    }
    return null;
  }
}));