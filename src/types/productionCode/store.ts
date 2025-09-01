import type { IProductionCodeCard } from './index';

export interface ProductionCodeStore {
  nopol: string;
  goodsCount: number;
  productionCodes: IProductionCodeCard[];
  isLoading: boolean;
  error: string | null;
  selectedGate1: string | null;
  selectedGate2: string | null;
  
  loadProductionCodes: (nopol: string) => void;
  setSelectedGate1: (gate: string | null) => void;
  setSelectedGate2: (gate: string | null) => void;
  reset: () => void;
}