import type { IAntreanCard } from './index';

export interface AntreanTruckStore {
  antreanList: IAntreanCard[];
  isLoading: boolean;
  error: string | null;
  hasInitialized: boolean;
  
  loadAntreanListFromApi: (encryptedData: string) => Promise<void>;
  reset: () => void;
}