// Home module reusable types
export interface IWarehouse {
  id: number;
  name: string;
  description?: string;
  storage_units: Array<unknown>; // Simplified for home module
}