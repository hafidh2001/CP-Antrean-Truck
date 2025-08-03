import { create } from 'zustand';
import { Warehouse, StorageUnit } from '@/types/warehouse';
import warehouseData from '@/data/mockWarehouses.json';

interface MultiWarehouseStore {
  warehouses: Warehouse[];
  currentWarehouse: Warehouse | null;
  selectedUnit: StorageUnit | null;
  
  loadWarehouses: () => void;
  setCurrentWarehouse: (id: string) => void;
  updateWarehouseLayout: (warehouseId: string, updates: Partial<Warehouse['layout']>) => void;
  saveWarehouseToStorage: (warehouseId: string) => void;
  
  // Storage unit operations
  addStorageUnit: (unit: StorageUnit) => void;
  updateStorageUnit: (id: string, updates: Partial<StorageUnit>) => void;
  removeStorageUnit: (id: string) => void;
  selectUnit: (unit: StorageUnit | null) => void;
  moveStorageUnit: (id: string, x: number, y: number) => void;
  checkOverlap: (unit: StorageUnit, newX: number, newY: number) => StorageUnit | null;
  stackUnits: (draggedId: string, targetId: string) => void;
}

export const useMultiWarehouseStore = create<MultiWarehouseStore>((set, get) => ({
  warehouses: [],
  currentWarehouse: null,
  selectedUnit: null,

  loadWarehouses: () => {
    // Load from localStorage if exists, otherwise use mock data
    const savedData = localStorage.getItem('allWarehouses');
    if (savedData) {
      set({ warehouses: JSON.parse(savedData) });
    } else {
      set({ warehouses: warehouseData.warehouses as Warehouse[] });
    }
  },

  setCurrentWarehouse: (id) => {
    const warehouse = get().warehouses.find(w => w.id === id);
    if (warehouse) {
      // Update layout dimensions to current viewport
      const updatedWarehouse = {
        ...warehouse,
        layout: {
          ...warehouse.layout,
          width: window.innerWidth,
          height: window.innerHeight,
        }
      };
      set({ currentWarehouse: updatedWarehouse });
    }
  },

  updateWarehouseLayout: (warehouseId, updates) => {
    set((state) => {
      const warehouses = state.warehouses.map(w => 
        w.id === warehouseId 
          ? { ...w, layout: { ...w.layout, ...updates }, updatedAt: new Date().toISOString() }
          : w
      );
      
      const currentWarehouse = state.currentWarehouse?.id === warehouseId
        ? warehouses.find(w => w.id === warehouseId) || null
        : state.currentWarehouse;
      
      return { warehouses, currentWarehouse };
    });
  },

  saveWarehouseToStorage: (warehouseId) => {
    const state = get();
    const warehouse = state.warehouses.find(w => w.id === warehouseId);
    if (warehouse && state.currentWarehouse) {
      // Update the warehouse in the list
      const updatedWarehouses = state.warehouses.map(w =>
        w.id === warehouseId ? state.currentWarehouse! : w
      );
      
      // Save to localStorage
      localStorage.setItem('allWarehouses', JSON.stringify(updatedWarehouses));
      set({ warehouses: updatedWarehouses });
    }
  },

  // Storage unit operations
  addStorageUnit: (unit) =>
    set((state) => {
      if (!state.currentWarehouse) return state;
      
      const updatedLayout = {
        ...state.currentWarehouse.layout,
        storageUnits: [...state.currentWarehouse.layout.storageUnits, unit],
      };
      
      const updatedWarehouse = {
        ...state.currentWarehouse,
        layout: updatedLayout,
        updatedAt: new Date().toISOString(),
      };
      
      return { currentWarehouse: updatedWarehouse };
    }),

  updateStorageUnit: (id, updates) =>
    set((state) => {
      if (!state.currentWarehouse) return state;
      
      const updatedLayout = {
        ...state.currentWarehouse.layout,
        storageUnits: state.currentWarehouse.layout.storageUnits.map((unit) =>
          unit.id === id ? { ...unit, ...updates } : unit
        ),
      };
      
      const updatedWarehouse = {
        ...state.currentWarehouse,
        layout: updatedLayout,
        updatedAt: new Date().toISOString(),
      };
      
      return { currentWarehouse: updatedWarehouse };
    }),

  removeStorageUnit: (id) =>
    set((state) => {
      if (!state.currentWarehouse) return state;
      
      const updatedLayout = {
        ...state.currentWarehouse.layout,
        storageUnits: state.currentWarehouse.layout.storageUnits.filter((unit) => unit.id !== id),
      };
      
      const updatedWarehouse = {
        ...state.currentWarehouse,
        layout: updatedLayout,
        updatedAt: new Date().toISOString(),
      };
      
      return { currentWarehouse: updatedWarehouse };
    }),

  selectUnit: (unit) => set({ selectedUnit: unit }),

  moveStorageUnit: (id, x, y) =>
    set((state) => {
      if (!state.currentWarehouse) return state;
      
      const updatedLayout = {
        ...state.currentWarehouse.layout,
        storageUnits: state.currentWarehouse.layout.storageUnits.map((unit) =>
          unit.id === id ? { ...unit, x, y } : unit
        ),
      };
      
      const updatedWarehouse = {
        ...state.currentWarehouse,
        layout: updatedLayout,
        updatedAt: new Date().toISOString(),
      };
      
      return { currentWarehouse: updatedWarehouse };
    }),

  checkOverlap: (unit, newX, newY) => {
    const state = get();
    if (!state.currentWarehouse) return null;
    
    for (const other of state.currentWarehouse.layout.storageUnits) {
      if (other.id === unit.id) continue;
      
      const overlap = 
        newX < other.x + other.width &&
        newX + unit.width > other.x &&
        newY < other.y + other.height &&
        newY + unit.height > other.y;
        
      if (overlap) return other;
    }
    return null;
  },

  stackUnits: (draggedId, targetId) =>
    set((state) => {
      if (!state.currentWarehouse) return state;
      
      const targetUnit = state.currentWarehouse.layout.storageUnits.find((u: StorageUnit) => u.id === targetId);
      if (!targetUnit) return state;
      
      const updatedLayout = {
        ...state.currentWarehouse.layout,
        storageUnits: state.currentWarehouse.layout.storageUnits.map((unit) => {
          if (unit.id === draggedId) {
            return {
              ...unit,
              x: targetUnit.x,
              y: targetUnit.y,
              stackLevel: targetUnit.stackLevel + 1,
            };
          }
          return unit;
        }),
      };
      
      const updatedWarehouse = {
        ...state.currentWarehouse,
        layout: updatedLayout,
        updatedAt: new Date().toISOString(),
      };
      
      return { currentWarehouse: updatedWarehouse };
    }),
}));