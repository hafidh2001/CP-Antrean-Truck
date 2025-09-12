/**
 * Utility functions for handling URL parameters with encrypted keys
 */

/**
 * Extracts and decodes the encrypted key from URL search parameters
 * Handles URL encoding issues where special characters may be encoded
 * 
 * @param search - The search string from location (e.g., "?key=abc%2B123")
 * @returns The decoded encrypted key or null if not found
 */
export const extractEncryptedKey = (search: string): string | null => {
  if (!search) return null;
  
  try {
    // Use URLSearchParams which automatically handles decoding
    const searchParams = new URLSearchParams(search);
    const key = searchParams.get('key');
    
    if (!key) return null;
    
    // The key is already decoded by URLSearchParams
    // URLSearchParams automatically decodes:
    // - %2B → +
    // - %2F → /
    // - %3D → =
    // - %20 → space
    
    return key;
  } catch (error) {
    console.error('Error extracting encrypted key:', error);
    return null;
  }
};

/**
 * Creates a properly encoded URL with encrypted key
 * 
 * @param baseUrl - The base URL without query parameters
 * @param encryptedKey - The encrypted key to append
 * @returns The complete URL with properly encoded key
 */
export const createEncryptedUrl = (baseUrl: string, encryptedKey: string): string => {
  // Use encodeURIComponent to properly encode special characters
  return `${baseUrl}?key=${encodeURIComponent(encryptedKey)}`;
};

/**
 * Validates if an encrypted key looks valid (basic validation)
 * 
 * @param key - The key to validate
 * @returns True if the key appears to be valid
 */
export const isValidEncryptedKey = (key: string | null): boolean => {
  if (!key) return false;
  
  // Basic validation: should be base64-like string
  // May contain: A-Z, a-z, 0-9, +, /, =
  const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
  return base64Pattern.test(key);
};