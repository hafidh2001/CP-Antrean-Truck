import axios from 'axios';
import { IAntreanCard } from '@/types/antreanTruck';

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

export const antreanTruckApi = {
  /**
   * Get antrean truck list
   */
  async getAntreanTruck(userToken: string, status?: string | string[]): Promise<IAntreanCard[]> {
    try {
      const params: any = { 
        user_token: userToken
      };
      
      // Only add status if provided
      if (status !== undefined) {
        params.status = status;
      }

      const response = await apiClient.post('', createApiRequest(
        'getAntreanTruck',
        'TAntrean',
        params,
        userToken
      ));


      // Parse the response - handle double encoding issue
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
      if (!Array.isArray(data)) {
        throw new Error('Invalid response from server');
      }

      // Transform API response to match frontend interface
      const antreanList: IAntreanCard[] = data.map((item: any) => ({
        id: item.id,
        nopol: item.nopol,
        created_at: item.created_time,
        jenis_barang: item.jenis_barang || 0 // Use actual count from API
      }));

      return antreanList;
    } catch (error) {
      throw error;
    }
  }
};