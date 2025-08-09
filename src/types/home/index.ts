// Home module reusable types
export interface IWarehouse {
  id: number;
  name: string;
  description?: string;
  layout: IWarehouseLayout;
  createdAt: string;
  updatedAt: string;
}

export interface IWarehouseLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  storageUnits: Array<unknown>; // Simplified for home module
}