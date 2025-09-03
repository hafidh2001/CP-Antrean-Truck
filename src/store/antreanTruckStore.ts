import { create } from 'zustand';
import type { AntreanTruckStore } from '@/types/antreanTruck/store';
import type { AntreanTruckDecryptData } from '@/types/antreanTruck';
import { antreanTruckApi } from '@/services/antreanTruckApi';
import { decryptAES } from '@/functions/decrypt';

export const useAntreanTruckStore = create<AntreanTruckStore>((set) => ({
  antreanList: [],
  isLoading: false,
  error: null,

  loadAntreanListFromApi: async (encryptedData: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Decrypt to get user_token
      const decrypted = await decryptAES<AntreanTruckDecryptData>(encryptedData);
      
      // Fetch data from API using user_token
      const antreanList = await antreanTruckApi.getAntreanTruck(
        decrypted.user_token
      );
      
      set({ 
        antreanList, 
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to load antrean truck list:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      });
      throw error;
    }
  },

  reset: () => set({
    antreanList: [],
    isLoading: false,
    error: null
  })
}));