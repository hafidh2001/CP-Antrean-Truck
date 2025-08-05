export interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface StorageUnit {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  items: Item[];
  stackLevel: number;
  color?: string;
  rotation?: number; // 0, 90, 180, 270
  type?: 'warehouse' | 'rack'; // Based on color
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  rotation: number; // 0, 90, 180, 270
  color?: string;
}

export interface WarehouseLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  storageUnits: StorageUnit[];
  textElements?: TextElement[];
}

export interface Warehouse {
  id: string;
  name: string;
  description?: string;
  layout: WarehouseLayout;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseData {
  warehouses: Warehouse[];
}