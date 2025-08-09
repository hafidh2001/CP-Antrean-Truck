import { TAnyStorageUnit, IStorageUnit, ITextElement } from '@/types/warehouseDetail';
import { ElementTypeEnum } from '@/types';

/**
 * Type guard to check if a unit is a storage unit
 * @param unit - The unit to check
 * @returns true if unit is a IStorageUnit
 */
export function isStorageUnit(unit: TAnyStorageUnit): unit is IStorageUnit {
  return unit.type === ElementTypeEnum.STORAGE;
}

/**
 * Type guard to check if a unit is a text element
 * @param unit - The unit to check
 * @returns true if unit is a ITextElement
 */
export function isTextElement(unit: TAnyStorageUnit): unit is ITextElement {
  return unit.type === ElementTypeEnum.TEXT;
}

