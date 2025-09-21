import { create } from 'zustand';
import { gateApi, type IGateData } from '@/services/gateApi';

interface GateMonitorStore {
  gates: IGateData[];
  serverTime: string | null;
  timestamp: number | null;
  isLoading: boolean;
  error: string | null;
  intervalId: NodeJS.Timeout | null;
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
    const { intervalId, fetchGateData, updateCountdowns } = get();
    
    // Stop existing polling if any
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Initial fetch
    fetchGateData();

    // Set up polling for countdown updates
    const newIntervalId = setInterval(() => {
      updateCountdowns();
    }, intervalMs);

    // Refresh data from server every 30 seconds
    const refreshIntervalId = setInterval(() => {
      fetchGateData();
    }, 30000);

    set({ intervalId: newIntervalId });
  },

  stopPolling: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }
  },

  updateCountdowns: () => {
    set((state) => {
      const updatedGates = state.gates.map(gate => ({
        ...gate,
        antrean_list: gate.antrean_list
          .map(antrean => {
            // Decrease remaining time by 1 second
            const newRemainingMinutes = Math.max(0, antrean.remaining_minutes - (1 / 60));
            
            // Calculate new formatted time
            const hours = Math.floor(newRemainingMinutes / 60);
            const minutes = Math.floor(newRemainingMinutes % 60);
            const seconds = Math.floor((newRemainingMinutes * 60) % 60);
            
            return {
              ...antrean,
              remaining_minutes: newRemainingMinutes,
              remaining_time_formatted: {
                hours,
                minutes,
                seconds,
                display: hours > 0
                  ? `${hours} JAM ${minutes} MENIT ${seconds} DETIK`
                  : minutes > 0
                    ? `${minutes} MENIT ${seconds} DETIK`
                    : `${seconds} DETIK`
              }
            };
          })
          // Filter out completed antrean (remaining_minutes <= 0)
          .filter(antrean => antrean.remaining_minutes > 0)
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
      userToken: null,
    });
  },
}));