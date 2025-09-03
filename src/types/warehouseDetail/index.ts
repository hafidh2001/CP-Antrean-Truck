import { ElementTypeEnum, StorageTypeEnum } from '../index';

// Text styling interface
export interface ITextStyling {
  font_size: number;
  font_family: string;
  rotation: number;
  text_color: string;
}

// Base storage unit interface (for both storage units and text elements)
export interface IBaseStorageUnit {
  id: number;
  type: ElementTypeEnum;
  label: string;
  x: number;
  y: number;
  warehouse_id: number;
  text_styling: ITextStyling;
}

// Storage unit specific interface
export interface IStorageUnit extends IBaseStorageUnit {
  type: ElementTypeEnum.STORAGE;
  width: number;
  height: number;
  type_storage: StorageTypeEnum;
}

// Text element specific interface
export interface ITextElement extends IBaseStorageUnit {
  type: ElementTypeEnum.TEXT;
}

// Union type for all storage units
export type TAnyStorageUnit = IStorageUnit | ITextElement;

// Warehouse interface
export interface IWarehouse {
  id: number;
  name: string;
  description?: string;
  storage_units: TAnyStorageUnit[];
}

// Decrypt data for warehouse module
export interface WarehouseDecryptData {
  user_token: string;
  warehouse_id: number | string;
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