import { ElementTypeEnum, StorageTypeEnum } from '../index';

// Text styling interface
export interface ITextStyling {
  fontSize: number;
  fontFamily: string;
  rotation: number;
  textColor: string;
}

// Base storage unit interface (for both storage units and text elements)
export interface IBaseStorageUnit {
  id: number;
  type: ElementTypeEnum;
  name: string;
  x: number;
  y: number;
  warehouseId: number;
  textStyling: ITextStyling;
}

// Storage unit specific interface
export interface IStorageUnit extends IBaseStorageUnit {
  type: ElementTypeEnum.STORAGE;
  width: number;
  height: number;
  typeStorage: StorageTypeEnum;
  stackLevel?: number;
}

// Text element specific interface
export interface ITextElement extends IBaseStorageUnit {
  type: ElementTypeEnum.TEXT;
}

// Union type for all storage units
export type TAnyStorageUnit = IStorageUnit | ITextElement;

// Warehouse layout interface
export interface IWarehouseLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  storageUnits: TAnyStorageUnit[];
}

// Warehouse interface
export interface IWarehouse {
  id: number;
  name: string;
  description?: string;
  layout: IWarehouseLayout;
  createdAt: string;
  updatedAt: string;
}

// Drawing rect interface for floor plan
export interface IDrawingRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}


// Tool mode type
export type TToolMode = 'select' | 'rectangle' | 'text';

// Resize direction type
export type TResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | null;

// Font family options
export interface IFontFamily {
  value: string;
  label: string;
}