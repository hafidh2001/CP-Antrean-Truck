import { create } from "zustand";
import type { AntreanTruckStore } from "@/types/antreanTruck/store";
import type { AntreanTruckDecryptData } from "@/types/antreanTruck";
import { antreanTruckApi } from "@/services/antreanTruckApi";
import { decryptAES } from "@/functions/decrypt";
import { AntreanStatusEnum } from "@/types";

export const useAntreanTruckStore = create<AntreanTruckStore>((set) => ({
  antreanList: [],
  isLoading: false,
  error: null,
  hasInitialized: false,

  loadAntreanListFromApi: async (encryptedData: string) => {
    set({ isLoading: true, error: null });

    try {
      const decrypted = await decryptAES<AntreanTruckDecryptData>(
        encryptedData
      );
      const antreanList = await antreanTruckApi.getAntreanTruck(
        decrypted.user_token,
        [
          AntreanStatusEnum.LOADING,
          AntreanStatusEnum.VERIFYING,
          AntreanStatusEnum.PENDING,
        ]
      );

      // Sort: items with status badges (all except LOADING) appear first
      const sortedAntreanList = [...antreanList].sort((a, b) => {
        const aHasBadge = a.status !== AntreanStatusEnum.LOADING;
        const bHasBadge = b.status !== AntreanStatusEnum.LOADING;

        if (aHasBadge && !bHasBadge) return -1;
        if (!aHasBadge && bHasBadge) return 1;
        return 0;
      });

      set({
        antreanList: sortedAntreanList,
        isLoading: false,
        hasInitialized: true,
      });
    } catch (error) {
      set({
        antreanList: [],
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
        hasInitialized: true,
      });
    }
  },

  reset: () =>
    set({
      antreanList: [],
      isLoading: false,
      error: null,
      hasInitialized: false,
    }),
}));
