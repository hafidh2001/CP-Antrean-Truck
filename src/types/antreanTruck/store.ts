import type { IAntreanCard } from './index';

export interface AntreanTruckStore {
  antreanList: IAntreanCard[];
  isLoading: boolean;
  error: string | null;
  
  loadAntreanList: () => void;
  reset: () => void;
}