import axios from 'axios';
import type { IGateOption } from '@/types/gate';

// API Configuration
const API_URL = 'https://hachi.kamz-kun.id/cp_fifo/index.php?r=Api';
const API_TOKEN = 'dctfvgybefvgyabdfhwuvjlnsd';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Helper to create API request body
const createApiRequest = (functionName: string, model: string, params: any, userToken: string) => ({
  function: functionName,
  mode: 'function',
  model: model,
  params: params,
  token: API_TOKEN,
  user_token: userToken,
});

interface GateResponse {
  gates: IGateOption[];
  error?: string;
}

export const gateApi = {
  async getGateOptions(userToken: string): Promise<IGateOption[]> {
    try {
      const requestBody = createApiRequest(
        'getGateOptions',
        'MGate',
        { user_token: userToken },
        userToken
      );

      const response = await apiClient.post('', requestBody);

      const data: GateResponse = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      return data.gates || [];
    } catch (error) {
      console.error('Failed to fetch gate options:', error);
      throw error;
    }
  }
};