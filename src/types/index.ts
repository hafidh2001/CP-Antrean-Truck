// Global enums used across modules
export enum ElementTypeEnum {
  STORAGE = 'storage',
  TEXT = 'text'
}

export enum StorageTypeEnum {
  WAREHOUSE = 'warehouse',
  RACK = 'rack',
  ECERAN = 'eceran'
}

// Antrean status enum (used in multiple modules)
export enum AntreanStatusEnum {
  OPEN = 'OPEN',
  LOADING = 'LOADING',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING'
}