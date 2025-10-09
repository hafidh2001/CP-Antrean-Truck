import axios from 'axios';
import type { IGateOption } from '@/types/productionCode';

// API Configuration from environment variables
const API_URL = import.meta.env.VITE_API_URL;
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

// Validate environment variables
if (!API_URL || !API_TOKEN) {
  throw new Error('API configuration is missing. Please check environment variables.');
}

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

export interface IAntreanItem {
  antrean_id: number;
  nopol: string;
  status: string;
  assigned_kerani_time: string;
  assigned_kerani_timestamp: number | null; // Unix timestamp for count up calculation
  loading_time_minutes?: number;
  elapsed_minutes: number;
  remaining_time_formatted: {
    hours: number;
    minutes: number;
    seconds: number;
    display: string;
  };
}

export interface IGateData {
  gate_id: number;
  gate_code: string;
  warehouse_name: string;
  antrean_list: IAntreanItem[];
}

export interface IGateAntreanResponse {
  gates: IGateData[];
  server_time: string;
  timestamp: number;
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
  },

  async getGateAntreanList(userToken: string): Promise<IGateAntreanResponse> {
    try {
      const requestBody = createApiRequest(
        'getGateAntreanList',
        'MGate',
        { user_token: userToken },
        userToken
      );

      const response = await apiClient.post<IGateAntreanResponse>('', requestBody);

      if ('error' in response.data) {
        throw new Error((response.data as any).error);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch gate antrean list:', error);
      throw error;
    }
  }
};