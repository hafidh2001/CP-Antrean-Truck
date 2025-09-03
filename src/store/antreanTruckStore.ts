import { create } from 'zustand';
import type { AntreanTruckStore } from '@/types/antreanTruck/store';
import type { AntreanTruckDecryptData } from '@/types/antreanTruck';
import { antreanTruckApi } from '@/services/antreanTruckApi';
import { decryptAES } from '@/functions/decrypt';

export const useAntreanTruckStore = create<AntreanTruckStore>((set) => ({
  antreanList: [],
  isLoading: false,
  error: null,
  hasInitialized: false,

  loadAntreanListFromApi: async (encryptedData: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const decrypted = await decryptAES<AntreanTruckDecryptData>(encryptedData);
      const antreanList = await antreanTruckApi.getAntreanTruck(decrypted.user_token);
      
      set({ 
        antreanList, 
        isLoading: false,
        hasInitialized: true
      });
    } catch (error) {
      set({
        antreanList: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
        hasInitialized: true
      });
    }
  },

  reset: () => set({
    antreanList: [],
    isLoading: false,
    error: null,
    hasInitialized: false
  })
}));