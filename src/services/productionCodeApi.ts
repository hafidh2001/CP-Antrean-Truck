import axios from 'axios';
import { IQuantityItem } from '@/types/productionCode';

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

interface ApiProductionCodeResponse {
  nopol: string;
  jenis_barang: number;
  productionCodes: Array<{
    id: number;
    goods_code: string;
    goods_name: string;
    quantities: IQuantityItem[];
    total_entries: number;
    completed_entries: number;
  }>;
}

interface AntreanGateResponse {
  gates: Array<{
    id: number;
    gate_id: number;
    gate_code: string;
  }>;
  error?: string;
}

interface GateActionResponse {
  success: boolean;
  error?: string;
}

export const productionCodeApi = {
  /**
   * Get production codes by antrean ID
   */
  async getProductionCodes(antreanId: string, userToken: string): Promise<ApiProductionCodeResponse> {
    try {
      const params = { 
        user_token: userToken,
        antrean_id: antreanId
      };

      const response = await apiClient.post('', createApiRequest(
        'getAntreanKodeProduksi',
        'TAntreanRekomendasiLokasi',
        params,
        userToken
      ));


      // Parse the response
      let data = response.data;
      
      // If the response is a string, it might be double-encoded JSON
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          // Failed to parse JSON
        }
      }

      // Handle API error response
      if (data && data.error) {
        throw new Error(data.error);
      }

      // Validate response structure
      if (!data || typeof data !== 'object' || !Array.isArray(data.productionCodes)) {
        throw new Error('Invalid response from server');
      }

      return data as ApiProductionCodeResponse;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get antrean gates
   */
  async getAntreanGates(antreanId: string, userToken: string): Promise<AntreanGateResponse> {
    try {
      const response = await apiClient.post('', createApiRequest(
        'getAntreanGate',
        'TAntreanGate',
        { 
          user_token: userToken,
          antrean_id: parseInt(antreanId)
        },
        userToken
      ));

      const data = response.data;
      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Set antrean gate
   */
  async setAntreanGate(antreanId: string, gateId: number, position: number, userToken: string): Promise<GateActionResponse> {
    try {
      const response = await apiClient.post('', createApiRequest(
        'setAntreanGate',
        'TAntreanGate',
        { 
          user_token: userToken,
          antrean_id: parseInt(antreanId),
          gate_id: gateId,
          position: position
        },
        userToken
      ));

      const data = response.data;
      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete antrean gate 2 (only gate 2 can be deleted)
   */
  async deleteAntreanGate(antreanId: string, userToken: string): Promise<GateActionResponse> {
    try {
      const response = await apiClient.post('', createApiRequest(
        'deleteAntreanGate',
        'TAntreanGate',
        { 
          user_token: userToken,
          antrean_id: parseInt(antreanId)
        },
        userToken
      ));

      const data = response.data;
      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
};