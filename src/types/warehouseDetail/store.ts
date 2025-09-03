import { IWarehouse, TAnyStorageUnit, TToolMode, WarehouseDecryptData } from './index';

export interface DecryptedData extends WarehouseDecryptData {}

export interface WarehouseDetailStore {
  currentWarehouse: IWarehouse | null;
  selectedUnit: TAnyStorageUnit | null;
  toolMode: TToolMode;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  decryptedData: DecryptedData | null;
  hasInitialized: boolean;
  
  // Initialize and load warehouse from encrypted data
  initializeFromEncryptedData: (encryptedData: string) => Promise<void>;
  
  // Tool mode
  setToolMode: (mode: TToolMode) => void;
  
  // Save warehouse
  saveWarehouse: () => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // Unit operations
  addUnit: (unit: TAnyStorageUnit) => void;
  updateUnit: (id: number, updates: Partial<TAnyStorageUnit>) => void;
  removeUnit: (id: number) => void;
  selectUnit: (unit: TAnyStorageUnit | null) => void;
  moveUnit: (id: number, x: number, y: number) => void;
  
  // Helpers
  getStorageUnits: () => import('./index').IStorageUnit[];
  getTextElements: () => import('./index').ITextElement[];
  checkOverlap: (unit: import('./index').IStorageUnit, newX: number, newY: number) => import('./index').IStorageUnit | null;
  
  // Reset store
  reset: () => void;
}