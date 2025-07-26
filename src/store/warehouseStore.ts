import { create } from 'zustand';
import { StorageUnit, WarehouseLayout } from '@/types/warehouse';

interface WarehouseStore {
  layout: WarehouseLayout;
  selectedUnit: StorageUnit | null;
  setLayout: (layout: WarehouseLayout) => void;
  addStorageUnit: (unit: StorageUnit) => void;
  updateStorageUnit: (id: string, updates: Partial<StorageUnit>) => void;
  removeStorageUnit: (id: string) => void;
  selectUnit: (unit: StorageUnit | null) => void;
  moveStorageUnit: (id: string, x: number, y: number) => void;
  checkOverlap: (unit: StorageUnit, newX: number, newY: number) => StorageUnit | null;
  stackUnits: (draggedId: string, targetId: string) => void;
}

export const useWarehouseStore = create<WarehouseStore>((set, get) => ({
  layout: {
    id: '1',
    name: 'Main Warehouse',
    width: 800,
    height: 600,
    gridSize: 20,
    storageUnits: [],
  },
  selectedUnit: null,
  setLayout: (layout) => set({ layout }),
  addStorageUnit: (unit) =>
    set((state) => ({
      layout: {
        ...state.layout,
        storageUnits: [...state.layout.storageUnits, unit],
      },
    })),
  updateStorageUnit: (id, updates) =>
    set((state) => ({
      layout: {
        ...state.layout,
        storageUnits: state.layout.storageUnits.map((unit) =>
          unit.id === id ? { ...unit, ...updates } : unit
        ),
      },
    })),
  removeStorageUnit: (id) =>
    set((state) => ({
      layout: {
        ...state.layout,
        storageUnits: state.layout.storageUnits.filter((unit) => unit.id !== id),
      },
    })),
  selectUnit: (unit) => set({ selectedUnit: unit }),
  moveStorageUnit: (id, x, y) =>
    set((state) => ({
      layout: {
        ...state.layout,
        storageUnits: state.layout.storageUnits.map((unit) =>
          unit.id === id ? { ...unit, x, y } : unit
        ),
      },
    })),
  checkOverlap: (unit, newX, newY) => {
    const state = get();
    for (const other of state.layout.storageUnits) {
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
      const targetUnit = state.layout.storageUnits.find((u: StorageUnit) => u.id === targetId);
      if (!targetUnit) return state;
      
      return {
        layout: {
          ...state.layout,
          storageUnits: state.layout.storageUnits.map((unit) => {
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
        },
      };
    }),
}));