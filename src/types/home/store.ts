import type { IWarehouse } from './index';

export interface HomeStore {
  warehouses: IWarehouse[];
  isLoading: boolean;
  error: string | null;
  
  // Load warehouses list
  loadWarehouses: () => void;
  
  // Add new warehouse
  addWarehouse: (name: string, description: string) => void;
  
  // Delete warehouse
  deleteWarehouse: (id: number) => void;
  
  // Reset store
  reset: () => void;
}