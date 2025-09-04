import axios from 'axios';
import type { IQuantityItem } from '@/types/productionCode';

// API Configuration from environment variables
const API_URL = import.meta.env.VITE_API_URL;
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Enable cookies for CSRF
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

interface ProductionCodeDetailResponse {
  nopol: string;
  jenis_barang: number;
  productionCode: {
    id: number;
    goods_code: string;
    goods_name: string | null;
    quantities: IQuantityItem[];
    total_entries: number;
  };
  error?: string;
}

interface JebolanResponse {
  jebolan: Array<{ id: number; qty: number }>;
  error?: string;
}

interface KodeProduksiResponse {
  kode_produksi: Array<{ id: number; kode_produksi: string }>;
  completed_entries: number;
  error?: string;
}

interface SaveResponse {
  success: boolean;
  jebolan_id?: number;
  kode_produksi_id?: number;
  error?: string;
  details?: any;
}

export const productionCodeEntryApi = {
  // Get production code detail for header
  async getProductionCodeDetail(antreanId: string, goodsId: string, userToken: string): Promise<ProductionCodeDetailResponse> {
    try {
      const requestBody = createApiRequest(
        'getProductionCodeDetail',
        'TAntreanRekomendasiLokasi',
        { 
          user_token: userToken,
          antrean_id: parseInt(antreanId),
          goods_id: parseInt(goodsId)
        },
        userToken
      );

      const response = await apiClient.post('', requestBody);
      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get jebolan list
  async getJebolan(antreanId: string, goodsId: string, userToken: string): Promise<Array<{ id: number; qty: number }>> {
    try {
      const requestBody = createApiRequest(
        'getJebolan',
        'TAntreanJebolan',
        { 
          user_token: userToken,
          antrean_id: parseInt(antreanId),
          goods_id: parseInt(goodsId)
        },
        userToken
      );

      const response = await apiClient.post('', requestBody);
      const data: JebolanResponse = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      return data.jebolan || [];
    } catch (error) {
      throw error;
    }
  },

  // Save jebolan (create or update)
  async saveJebolan(antreanId: string, goodsId: string, qty: number, userToken: string, jebolanId?: number): Promise<SaveResponse> {
    try {
      const requestBody = createApiRequest(
        'saveJebolan',
        'TAntreanJebolan',
        { 
          user_token: userToken,
          antrean_id: parseInt(antreanId),
          goods_id: parseInt(goodsId),
          qty: qty,
          ...(jebolanId && { jebolan_id: jebolanId })
        },
        userToken
      );

      const response = await apiClient.post('', requestBody);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get kode produksi list
  async getKodeProduksi(antreanId: string, goodsId: string, userToken: string): Promise<KodeProduksiResponse> {
    try {
      const requestBody = createApiRequest(
        'getKodeProduksi',
        'TAntreanKodeProduksi',
        { 
          user_token: userToken,
          antrean_id: parseInt(antreanId),
          goods_id: parseInt(goodsId)
        },
        userToken
      );

      const response = await apiClient.post('', requestBody);
      const data: KodeProduksiResponse = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Create kode produksi
  async createKodeProduksi(antreanId: string, goodsId: string, kodeProduksi: string, userToken: string): Promise<SaveResponse> {
    try {
      const requestBody = createApiRequest(
        'createKodeProduksi',
        'TAntreanKodeProduksi',
        { 
          user_token: userToken,
          antrean_id: parseInt(antreanId),
          goods_id: parseInt(goodsId),
          kode_produksi: kodeProduksi
        },
        userToken
      );

      const response = await apiClient.post('', requestBody);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete jebolan
  async deleteJebolan(antreanId: string, goodsId: string, userToken: string): Promise<SaveResponse> {
    try {
      const requestBody = createApiRequest(
        'deleteJebolan',
        'TAntreanJebolan',
        { 
          user_token: userToken,
          antrean_id: parseInt(antreanId),
          goods_id: parseInt(goodsId)
        },
        userToken
      );

      const response = await apiClient.post('', requestBody);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete kode produksi
  async deleteKodeProduksi(kodeProduksiId: number, userToken: string): Promise<SaveResponse> {
    try {
      const requestBody = createApiRequest(
        'deleteKodeProduksi',
        'TAntreanKodeProduksi',
        { 
          user_token: userToken,
          kode_produksi_id: kodeProduksiId
        },
        userToken
      );

      const response = await apiClient.post('', requestBody);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};