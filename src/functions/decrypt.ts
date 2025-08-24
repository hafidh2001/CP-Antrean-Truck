import { DecryptedData } from '@/types/warehouseDetail/store';

export const decryptAES = async (encryptedData: string): Promise<DecryptedData> => {
  const secretKey = import.meta.env.VITE_DECRYPT_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('VITE_DECRYPT_SECRET_KEY is not configured in environment variables');
  }
  
  try {
    // Fix URL encoding issue where + becomes space
    const fixedEncryptedData = encryptedData.replace(/ /g, '+');
    
    // Decode base64
    const encryptedBuffer = Uint8Array.from(atob(fixedEncryptedData), c => c.charCodeAt(0));
    
    // Extract IV (first 16 bytes) and ciphertext
    const iv = encryptedBuffer.slice(0, 16);
    const ciphertext = encryptedBuffer.slice(16);
    
    // Create key from secret
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    
    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      ciphertext
    );
    
    // Convert to string and parse JSON
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);
    
    // Parse and validate decrypted data
    const data = JSON.parse(decryptedText);
    
    if (!data.user_token || typeof data.warehouse_id !== 'number') {
      throw new Error('Invalid decrypted data format');
    }
    
    return data as DecryptedData;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};