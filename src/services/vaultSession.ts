/**
 * Vault Session Management Service
 * Implements secure temporary passphrase storage with automatic expiry
 * 
 * SECURITY NOTES:
 * - Uses sessionStorage which is cleared when the browser tab is closed
 * - Implements automatic expiry after 5 minutes of inactivity
 * - Passphrase is encrypted in memory with a session key
 */

import { generateSalt, generateSecureRandom, arrayBufferToBase64, base64ToArrayBuffer } from './crypto';

const SESSION_KEY = 'securecardr_vault_session';
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

interface VaultSession {
  encryptedPassphrase: string;
  salt: string;
  expiresAt: number;
  sessionKey: string;
}

class VaultSessionManager {
  private sessionKey: CryptoKey | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  /**
   * Initialize the session manager and generate a session key
   */
  async initialize(): Promise<void> {
    // Generate a random session key for this browser session
    this.sessionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Store the passphrase securely in session storage
   */
  async storePassphrase(passphrase: string): Promise<void> {
    if (!this.sessionKey) {
      await this.initialize();
    }

    try {
      // Generate random salt and IV for session encryption
      const salt = generateSalt();
      const iv = generateSecureRandom(12);
      
      // Encrypt the passphrase with the session key
      const encoder = new TextEncoder();
      const passphraseData = encoder.encode(passphrase);
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.sessionKey!,
        passphraseData
      );

      // Export session key for storage
      const exportedKey = await crypto.subtle.exportKey('raw', this.sessionKey!);
      
      // Create session object
      const session: VaultSession = {
        encryptedPassphrase: arrayBufferToBase64(new Uint8Array([...iv, ...new Uint8Array(encryptedData)])),
        salt: arrayBufferToBase64(salt),
        expiresAt: Date.now() + SESSION_TIMEOUT,
        sessionKey: arrayBufferToBase64(exportedKey)
      };

      // Store in sessionStorage
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      
      // Set timeout to clear session
      this.resetTimeout();
    } catch (error) {
      console.error('Failed to store vault session:', error);
      throw error;
    }
  }

  /**
   * Retrieve the passphrase from session storage if valid
   */
  async retrievePassphrase(): Promise<string | null> {
    try {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;

      const session: VaultSession = JSON.parse(sessionData);
      
      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      // Import the session key
      const keyData = base64ToArrayBuffer(session.sessionKey);
      this.sessionKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );

      // Decrypt the passphrase
      const encryptedData = base64ToArrayBuffer(session.encryptedPassphrase);
      const iv = encryptedData.slice(0, 12);
      const ciphertext = encryptedData.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.sessionKey,
        ciphertext
      );

      const decoder = new TextDecoder();
      const passphrase = decoder.decode(decryptedData);

      // Extend session timeout on successful retrieval
      this.extendSession();
      
      return passphrase;
    } catch (error) {
      console.error('Failed to retrieve vault session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Extend the session timeout
   */
  extendSession(): void {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (!sessionData) return;

    const session: VaultSession = JSON.parse(sessionData);
    session.expiresAt = Date.now() + SESSION_TIMEOUT;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    this.resetTimeout();
  }

  /**
   * Clear the vault session
   */
  clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.sessionKey = null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Reset the automatic timeout
   */
  private resetTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.clearSession();
    }, SESSION_TIMEOUT);
  }

  /**
   * Check if a valid session exists
   */
  hasValidSession(): boolean {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (!sessionData) return false;

    try {
      const session: VaultSession = JSON.parse(sessionData);
      return Date.now() < session.expiresAt;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const vaultSession = new VaultSessionManager();