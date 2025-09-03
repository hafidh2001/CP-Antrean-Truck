import Cookies from 'js-cookie';
import { decryptAES } from '@/functions/decrypt';

const SESSION_COOKIE_NAME = 'kerani_session';
const COOKIE_EXPIRES_DAYS = 1; // 1 day

export interface SessionData {
  user_token: string;
  user_id?: string;
  role?: string;
}

export const sessionService = {
  /**
   * Save session data from encrypted token
   */
  saveSession: async (encryptedToken: string): Promise<SessionData> => {
    try {
      const decrypted = await decryptAES<SessionData>(encryptedToken);
      
      // Store the original encrypted token in cookie
      Cookies.set(SESSION_COOKIE_NAME, encryptedToken, { 
        expires: COOKIE_EXPIRES_DAYS,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
      });
      
      return decrypted;
    } catch (error) {
      throw new Error('Failed to save session');
    }
  },

  /**
   * Get current session data
   */
  getSession: async (): Promise<SessionData | null> => {
    try {
      const encryptedToken = Cookies.get(SESSION_COOKIE_NAME);
      if (!encryptedToken) return null;
      
      const decrypted = await decryptAES<SessionData>(encryptedToken);
      return decrypted;
    } catch (error) {
      // Invalid session, remove cookie
      sessionService.clearSession();
      return null;
    }
  },

  /**
   * Get encrypted token for navigation
   */
  getEncryptedToken: (): string | null => {
    return Cookies.get(SESSION_COOKIE_NAME) || null;
  },

  /**
   * Check if user has valid kerani session
   */
  isValidKeraniSession: async (): Promise<boolean> => {
    const session = await sessionService.getSession();
    return session?.user_token ? true : false;
  },

  /**
   * Clear session
   */
  clearSession: (): void => {
    Cookies.remove(SESSION_COOKIE_NAME);
  }
};