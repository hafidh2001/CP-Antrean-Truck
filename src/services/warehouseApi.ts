import axios from 'axios';
import { IWarehouse, TAnyStorageUnit } from '@/types/warehouseDetail';

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
const createApiRequest = (functionName: string, model: string, params: any, userToken: string) => ({
  function: functionName,
  mode: 'function',
  model: model,
  params: params,
  token: API_TOKEN,
  user_token: userToken,
});

export const warehouseApi = {
  /**
   * Get warehouse with all locations/storage units
   */
  async getWarehouseLocations(warehouseId: number, userToken: string): Promise<IWarehouse> {
    try {
      const response = await apiClient.post('', createApiRequest(
        'getWarehouseLocations',
        'MLocation',
        { warehouse_id: warehouseId },
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
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from server');
      }

      // Ensure required fields exist
      if (!data.id || !data.name) {
        throw new Error('Invalid warehouse data: missing id or name');
      }

      // Ensure storage_units is an array
      if (!Array.isArray(data.storage_units)) {
        data.storage_units = [];
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Save warehouse locations (Update/Insert Strategy)
   * This will update existing, insert new, and delete removed units
   */
  async saveWarehouseLocations(
    warehouseId: number, 
    storageUnits: TAnyStorageUnit[],
    userToken: string
  ): Promise<SaveLocationResponse> {
    try {
      // Send units with their IDs (backend will handle new vs existing)
      const response = await apiClient.post('', createApiRequest(
        'saveWarehouseLocations',
        'MLocation',
        {
          warehouse_id: warehouseId,
          storage_units: storageUnits
        },
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
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get list of warehouses (for future use)
   */
  async getWarehouseList(userToken: string): Promise<IWarehouse[]> {
    try {
      const response = await apiClient.post('', createApiRequest(
        'getWarehouseList',
        'MWarehouse',
        {},
        userToken
      ));

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      // Return empty array as fallback
      return [];
    }
  }
};

// Export types for use in other files
export type { ApiResponse, SaveLocationResponse };