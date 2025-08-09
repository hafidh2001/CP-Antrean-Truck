// Home module reusable types
export interface IWarehouse {
  id: number;
  name: string;
  description?: string;
  storageUnits: Array<unknown>; // Simplified for home module
  createdAt: string;
  updatedAt: string;
}