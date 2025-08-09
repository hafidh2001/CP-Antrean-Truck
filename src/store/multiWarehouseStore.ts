import { create } from 'zustand';
import { IWarehouse, IStorageUnit, ITextElement, TAnyStorageUnit, TToolMode } from '@/types/warehouseDetail';
import { ElementTypeEnum, StorageTypeEnum } from '@/types';
import { isStorageUnit, isTextElement } from '@/functions/warehouseHelpers';
import warehouseData from '@/data/mockWarehouses.json';

// Types for legacy data migration
interface LegacyStorageUnit {
  id: string | number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: StorageTypeEnum;
  stackLevel?: number;
  rotation?: number;
}

interface LegacyTextElement {
  id: string | number;
  text?: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
  color?: string;
}

interface LegacyLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  storageUnits?: (LegacyStorageUnit | TAnyStorageUnit)[];
  textElements?: LegacyTextElement[];
}

interface LegacyWarehouse {
  id: string | number;
  name: string;
  description?: string;
  layout: LegacyLayout;
  createdAt: string;
  updatedAt: string;
}

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
  updateWarehouseLayout: (warehouseId: number, updates: Partial<IWarehouse['layout']>) => void;
  saveWarehouseToStorage: (warehouseId: number) => void;
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
  stackUnits: (draggedId: number, targetId: number) => void;
}

// Helper function to ensure data compatibility
const migrateOldData = (data: LegacyWarehouse[]): IWarehouse[] => {
  return data.map((warehouse: LegacyWarehouse) => {
    // If warehouse has old structure with textElements
    if (warehouse.layout && warehouse.layout.textElements) {
      const storageUnits: TAnyStorageUnit[] = [];
      
      // Migrate old storageUnits
      if (warehouse.layout.storageUnits) {
        warehouse.layout.storageUnits.forEach((unit: LegacyStorageUnit | TAnyStorageUnit) => {
          if ('type' in unit && unit.type === ElementTypeEnum.STORAGE) {
            // Already migrated
            storageUnits.push(unit as TAnyStorageUnit);
            return;
          }
          const legacyUnit = unit as LegacyStorageUnit;
          storageUnits.push({
            id: typeof legacyUnit.id === 'string' ? parseInt(legacyUnit.id) || Date.now() : legacyUnit.id,
            type: ElementTypeEnum.STORAGE,
            name: legacyUnit.name,
            x: legacyUnit.x,
            y: legacyUnit.y,
            warehouseId: typeof warehouse.id === 'string' ? parseInt(warehouse.id) || 1 : warehouse.id,
            width: legacyUnit.width,
            height: legacyUnit.height,
            typeStorage: legacyUnit.type === 'rack' ? StorageTypeEnum.RACK : StorageTypeEnum.WAREHOUSE,
            stackLevel: legacyUnit.stackLevel || 0,
            textStyling: {
              fontSize: 16,
              fontFamily: 'Arial, sans-serif',
              rotation: legacyUnit.rotation || 0,
              textColor: '#000000'
            }
          } as IStorageUnit);
        });
      }
      
      // Migrate old textElements
      if (warehouse.layout.textElements) {
        warehouse.layout.textElements.forEach((element: LegacyTextElement) => {
          storageUnits.push({
            id: typeof element.id === 'string' ? parseInt(element.id) || Date.now() : element.id,
            type: ElementTypeEnum.TEXT,
            name: element.text || 'Text',
            x: element.x,
            y: element.y,
            warehouseId: typeof warehouse.id === 'string' ? parseInt(warehouse.id) || 1 : warehouse.id,
            textStyling: {
              fontSize: element.fontSize || 16,
              fontFamily: element.fontFamily || 'Arial, sans-serif',
              rotation: element.rotation || 0,
              textColor: element.color || '#000000'
            }
          } as ITextElement);
        });
      }
      
      return {
        id: typeof warehouse.id === 'string' ? parseInt(warehouse.id) || 1 : warehouse.id,
        name: warehouse.name,
        description: warehouse.description,
        layout: {
          id: warehouse.layout.id,
          name: warehouse.layout.name,
          width: warehouse.layout.width,
          height: warehouse.layout.height,
          gridSize: warehouse.layout.gridSize,
          storageUnits
        },
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt
      } as IWarehouse;
    }

    // Migrate existing storageUnits to add warehouseId if missing and update type
    if (warehouse.layout?.storageUnits) {
      const migratedUnits = warehouse.layout.storageUnits.map((unit: LegacyStorageUnit | TAnyStorageUnit) => {
        if ('type' in unit && (unit.type === ElementTypeEnum.STORAGE || unit.type === ElementTypeEnum.TEXT)) {
          // Already migrated unit
          return unit;
        }
        const legacyUnit = unit as LegacyStorageUnit;
        return {
          ...legacyUnit,
          id: typeof legacyUnit.id === 'string' ? parseInt(legacyUnit.id) || Date.now() : legacyUnit.id,
          type: ElementTypeEnum.STORAGE,
          warehouseId: typeof warehouse.id === 'string' ? parseInt(warehouse.id) || 1 : warehouse.id,
          typeStorage: legacyUnit.type === 'rack' ? StorageTypeEnum.RACK : StorageTypeEnum.WAREHOUSE,
          textStyling: {
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            rotation: 0,
            textColor: '#000000'
          }
        } as TAnyStorageUnit;
      });
      
      return {
        id: typeof warehouse.id === 'string' ? parseInt(warehouse.id) || 1 : warehouse.id,
        name: warehouse.name,
        description: warehouse.description,
        layout: {
          id: warehouse.layout.id,
          name: warehouse.layout.name,
          width: warehouse.layout.width,
          height: warehouse.layout.height,
          gridSize: warehouse.layout.gridSize,
          storageUnits: migratedUnits
        },
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt
      } as IWarehouse;
    }
    
    // Return warehouse with proper ID type
    return {
      id: typeof warehouse.id === 'string' ? parseInt(warehouse.id) || 1 : warehouse.id,
      name: warehouse.name,
      description: warehouse.description,
      layout: {
        id: warehouse.layout.id,
        name: warehouse.layout.name,
        width: warehouse.layout.width,
        height: warehouse.layout.height,
        gridSize: warehouse.layout.gridSize,
        storageUnits: warehouse.layout.storageUnits || []
      },
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt
    } as IWarehouse;
  });
};

export const useMultiWarehouseStore = create<MultiWarehouseStore>((set, get) => ({
  warehouses: [],
  currentWarehouse: null,
  selectedUnit: null,
  toolMode: 'select',

  loadWarehouses: () => {
    // Load from localStorage if exists, otherwise use mock data
    const savedData = localStorage.getItem('allWarehouses');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      const migrated = migrateOldData(Array.isArray(parsed) ? parsed : parsed.warehouses || []);
      set({ warehouses: migrated });
    } else {
      set({ warehouses: warehouseData.warehouses as IWarehouse[] });
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
      layout: {
        id: `layout-${Date.now()}`,
        name: `Layout ${name}`,
        width: window.innerWidth,
        height: window.innerHeight,
        gridSize: 20,
        storageUnits: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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

  saveAllWarehouses: () => {
    const state = get();
    localStorage.setItem('allWarehouses', JSON.stringify(state.warehouses));
  },

  // Unified unit operations
  addUnit: (unit) =>
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

  updateUnit: (id, updates) =>
    set((state) => {
      if (!state.currentWarehouse) return state;
      
      const updatedLayout = {
        ...state.currentWarehouse.layout,
        storageUnits: state.currentWarehouse.layout.storageUnits.map((unit) =>
          unit.id === id ? { ...unit, ...updates } as TAnyStorageUnit : unit
        ) as TAnyStorageUnit[],
      };
      
      const updatedWarehouse = {
        ...state.currentWarehouse,
        layout: updatedLayout,
        updatedAt: new Date().toISOString(),
      };
      
      return { currentWarehouse: updatedWarehouse };
    }),

  removeUnit: (id) =>
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
      
      return { 
        currentWarehouse: updatedWarehouse,
        selectedUnit: state.selectedUnit?.id === id ? null : state.selectedUnit
      };
    }),

  selectUnit: (unit) => set({ selectedUnit: unit }),

  moveUnit: (id, x, y) =>
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

  // Helper methods
  getStorageUnits: () => {
    const { currentWarehouse } = get();
    if (!currentWarehouse) return [];
    return currentWarehouse.layout.storageUnits.filter(isStorageUnit);
  },

  getTextElements: () => {
    const { currentWarehouse } = get();
    if (!currentWarehouse) return [];
    return currentWarehouse.layout.storageUnits.filter(isTextElement);
  },

  checkOverlap: (unit, newX, newY) => {
    const state = get();
    if (!state.currentWarehouse) return null;
    
    const storageUnits = state.currentWarehouse.layout.storageUnits.filter(isStorageUnit);
    
    for (const other of storageUnits) {
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
      
      const targetUnit = state.currentWarehouse.layout.storageUnits.find(
        (u) => u.id === targetId && isStorageUnit(u)
      ) as IStorageUnit | undefined;
      
      if (!targetUnit) return state;
      
      const updatedLayout = {
        ...state.currentWarehouse.layout,
        storageUnits: state.currentWarehouse.layout.storageUnits.map((unit) => {
          if (unit.id === draggedId && isStorageUnit(unit)) {
            return {
              ...unit,
              x: targetUnit.x,
              y: targetUnit.y,
              stackLevel: (targetUnit.stackLevel || 0) + 1,
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