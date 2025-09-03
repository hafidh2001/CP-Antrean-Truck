import axios from 'axios';
import { IProductionCodeCard, IQuantityItem } from '@/types/productionCode';

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
  }
};