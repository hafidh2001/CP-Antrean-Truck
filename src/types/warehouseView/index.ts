import { IWarehouse } from '@/types/warehouseDetail';

export interface WarehouseViewStore {
  currentWarehouse: IWarehouse | null;
  isLoading: boolean;
  error: string | null;
  hasInitialized: boolean;
  
  // Load warehouse by ID (no auth needed, uses hardcoded token)
  loadWarehouse: (warehouseId: number) => Promise<void>;
  
  // Reset store
  reset: () => void;
}