import axios from 'axios';
import { IWarehouse, TAnyStorageUnit } from '@/types/warehouseDetail';

// API Configuration
const API_URL = 'https://hachi.kamz-kun.id/cp_fifo/index.php?r=Api';
const API_TOKEN = 'dctfvgybefvgyabdfhwuvjlnsd';
const USER_TOKEN = 'dNS1f.f4HKgIXqH9GDs9F150nhSbK';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Response interfaces
interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface SaveLocationResponse {
  success: boolean;
  message: string;
  results: {
    deleted: number;
    inserted: number;
    total_sent: number;
    errors: string[];
  };
}

// Helper to create API request body
const createApiRequest = (functionName: string, model: string, params: any) => ({
  function: functionName,
  mode: 'function',
  model: model,
  params: params,
  token: API_TOKEN,
  user_token: USER_TOKEN,
});

export const warehouseApi = {
  /**
   * Get warehouse with all locations/storage units
   */
  async getWarehouseLocations(warehouseId: number): Promise<IWarehouse> {
    try {
      const response = await apiClient.post('', createApiRequest(
        'getWarehouseLocations',
        'MLocation',
        { warehouse_id: warehouseId }
      ));

      console.log('API Response:', response.data);

      // Parse the response - handle double encoding issue
      let data = response.data;
      
      // If the response is a string, it might be double-encoded JSON
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          console.log('Parsed response:', data);
        } catch (e) {
          console.error('Failed to parse JSON string:', e);
        }
      }

      // Handle API error response
      if (data && data.error) {
        throw new Error(data.error);
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Ensure required fields exist
      if (!data.id || !data.name) {
        console.error('Missing required fields in response:', data);
        throw new Error('Invalid warehouse data: missing id or name');
      }

      // Ensure storage_units is an array
      if (!Array.isArray(data.storage_units)) {
        console.warn('storage_units is not an array, defaulting to empty array');
        data.storage_units = [];
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch warehouse locations:', error);
      throw error;
    }
  },

  /**
   * Save warehouse locations (Update/Insert Strategy)
   * This will update existing, insert new, and delete removed units
   */
  async saveWarehouseLocations(
    warehouseId: number, 
    storageUnits: TAnyStorageUnit[]
  ): Promise<SaveLocationResponse> {
    try {
      // Send units with their IDs (backend will handle new vs existing)
      const response = await apiClient.post('', createApiRequest(
        'saveWarehouseLocations',
        'MLocation',
        {
          warehouse_id: warehouseId,
          storage_units: storageUnits
        }
      ));

      // Parse the response - handle double encoding issue
      let data = response.data;
      
      // If the response is a string, it might be double-encoded JSON
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse JSON string:', e);
        }
      }

      // Handle API error response
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Failed to save warehouse locations:', error);
      throw error;
    }
  },

  /**
   * Get list of warehouses (for future use)
   */
  async getWarehouseList(): Promise<IWarehouse[]> {
    try {
      const response = await apiClient.post('', createApiRequest(
        'getWarehouseList',
        'MWarehouse',
        {}
      ));

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch warehouse list:', error);
      // Return empty array as fallback
      return [];
    }
  }
};

// Export types for use in other files
export type { ApiResponse, SaveLocationResponse };