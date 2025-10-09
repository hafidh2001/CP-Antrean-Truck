import { create } from 'zustand';
import { gateApi, type IGateData } from '@/services/gateApi';

interface GateMonitorStore {
  gates: IGateData[];
  serverTime: string | null;
  timestamp: number | null;
  isLoading: boolean;
  error: string | null;
  intervalId: NodeJS.Timeout | null;
  refreshIntervalId: NodeJS.Timeout | null;
  userToken: string | null;
  
  // Actions
  setUserToken: (token: string) => void;
  fetchGateData: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  updateCountdowns: () => void;
  reset: () => void;
}

export const useGateMonitorStore = create<GateMonitorStore>((set, get) => ({
  gates: [],
  serverTime: null,
  timestamp: null,
  isLoading: false,
  error: null,
  intervalId: null,
  refreshIntervalId: null,
  userToken: null,

  setUserToken: (token) => {
    set({ userToken: token });
  },

  fetchGateData: async () => {
    const { userToken } = get();
    if (!userToken) {
      set({ error: 'No user token available' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await gateApi.getGateAntreanList(userToken);
      
      set({
        gates: response.gates,
        serverTime: response.server_time,
        timestamp: response.timestamp,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch gate data',
        isLoading: false,
      });
    }
  },

  startPolling: (intervalMs = 1000) => {
    const { intervalId, refreshIntervalId, fetchGateData, updateCountdowns } = get();
    
    // Stop existing polling if any
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
    }

    // Initial fetch
    fetchGateData();

    // Set up polling for countdown updates
    const newIntervalId = setInterval(() => {
      updateCountdowns();
    }, intervalMs);

    // Refresh data from server every 30 seconds
    const newRefreshIntervalId = setInterval(() => {
      fetchGateData();
    }, 30000);

    set({ 
      intervalId: newIntervalId,
      refreshIntervalId: newRefreshIntervalId
    });
  },

  stopPolling: () => {
    const { intervalId, refreshIntervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
    }
    set({ intervalId: null, refreshIntervalId: null });
  },

  updateCountdowns: () => {
    set((state) => {
      const updatedGates = state.gates.map(gate => ({
        ...gate,
        antrean_list: gate.antrean_list
          .map(antrean => {
            // Count up logic: calculate elapsed time from assigned_kerani_timestamp
            let elapsedSeconds = 0;

            if (antrean.assigned_kerani_timestamp) {
              // Calculate elapsed time in seconds
              const currentTimeSeconds = Math.floor(Date.now() / 1000);
              elapsedSeconds = currentTimeSeconds - antrean.assigned_kerani_timestamp;
            }
            // Else: status OPEN or no timestamp, keep at 0

            // Convert to hours, minutes, seconds
            const hours = Math.floor(elapsedSeconds / 3600);
            const minutes = Math.floor((elapsedSeconds % 3600) / 60);
            const seconds = elapsedSeconds % 60;

            // Format display
            const display = hours > 0
              ? `${hours} JAM ${minutes} MENIT ${seconds} DETIK`
              : minutes > 0
                ? `${minutes} MENIT ${seconds} DETIK`
                : `${seconds} DETIK`;

            return {
              ...antrean,
              remaining_time_formatted: {
                hours,
                minutes,
                seconds,
                display
              }
            };
          })
      }));

      return { gates: updatedGates };
    });
  },

  reset: () => {
    const { stopPolling } = get();
    stopPolling();
    set({
      gates: [],
      serverTime: null,
      timestamp: null,
      isLoading: false,
      error: null,
      intervalId: null,
      refreshIntervalId: null,
      userToken: null,
    });
  },
}));