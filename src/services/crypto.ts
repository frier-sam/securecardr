/**
 * Client-side encryption utilities using Web Crypto API
 * Implements AES-GCM encryption with PBKDF2 + HKDF key derivation
 * 
 * SECURITY PRINCIPLES:
 * - All encryption happens client-side
 * - Keys are never stored or transmitted
 * - Sensitive data is cleared from memory after use
 * - Uses cryptographically secure random number generation
 */

import { EncryptedData } from '../types';

// Constants for encryption parameters
export const ENCRYPTION_CONSTANTS = {
  KEY_LENGTH: 256, // AES-256
  IV_LENGTH: 12,   // 96-bit IV for GCM
  SALT_LENGTH: 32, // 256-bit salt
  TAG_LENGTH: 16,  // 128-bit authentication tag
  PBKDF2_ITERATIONS: 100000, // Configurable, minimum 100k
  HKDF_INFO: new TextEncoder().encode('SecureCardr-v1'), // Version info for HKDF
} as const;

/**
 * Generate cryptographically secure random bytes
 */
export function generateSecureRandom(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return generateSecureRandom(ENCRYPTION_CONSTANTS.SALT_LENGTH);
}

/**
 * Generate a random initialization vector
 */
export function generateIV(): Uint8Array {
  return generateSecureRandom(ENCRYPTION_CONSTANTS.IV_LENGTH);
}

/**
 * Derive an encryption key from a passphrase using PBKDF2 + HKDF
 * @param passphrase - User's passphrase
 * @param salt - Random salt (should be stored with encrypted data)
 * @param iterations - PBKDF2 iterations (default: 100,000)
 * @returns Promise<CryptoKey> - Derived AES-GCM key
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = ENCRYPTION_CONSTANTS.PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  // Convert passphrase to bytes
  const passphraseBytes = new TextEncoder().encode(passphrase);
  
  try {
    // Step 1: Import passphrase as raw key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passphraseBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Step 2: Derive intermediate key using PBKDF2
    const pbkdf2Key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'HKDF', length: 256 },
      false,
      ['deriveKey']
    );

    // Step 3: Derive final encryption key using HKDF
    const finalKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32), // Zero salt for HKDF
        info: ENCRYPTION_CONSTANTS.HKDF_INFO,
      },
      pbkdf2Key,
      { name: 'AES-GCM', length: ENCRYPTION_CONSTANTS.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );

    // Clear sensitive data from memory
    passphraseBytes.fill(0);

    return finalKey;
  } catch (error) {
    // Clear sensitive data on error
    passphraseBytes.fill(0);
    throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt data using AES-GCM
 * @param data - Data to encrypt (string or ArrayBuffer)
 * @param key - Encryption key (from deriveKey)
 * @param iv - Initialization vector (should be random for each encryption)
 * @returns Promise<ArrayBuffer> - Encrypted data with authentication tag
 */
export async function encryptData(
  data: string | ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  try {
    // Convert string data to bytes if needed
    const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

    // Encrypt using AES-GCM
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: ENCRYPTION_CONSTANTS.TAG_LENGTH * 8, // Convert to bits
      },
      key,
      dataBytes
    );

    return encrypted;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data using AES-GCM
 * @param encryptedData - Encrypted data with authentication tag
 * @param key - Decryption key (from deriveKey)
 * @param iv - Initialization vector used for encryption
 * @returns Promise<ArrayBuffer> - Decrypted data
 */
export async function decryptData(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  try {
    // Decrypt using AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: ENCRYPTION_CONSTANTS.TAG_LENGTH * 8, // Convert to bits
      },
      key,
      encryptedData
    );

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * High-level encryption function that handles the complete workflow
 * @param data - Data to encrypt (string or ArrayBuffer)
 * @param passphrase - User's passphrase
 * @param salt - Optional salt (generates new one if not provided)
 * @returns Promise<EncryptedData> - Complete encrypted package
 */
export async function encrypt(
  data: string | ArrayBuffer,
  passphrase: string,
  salt?: Uint8Array
): Promise<EncryptedData> {
  // Generate salt and IV if not provided
  const finalSalt = salt || generateSalt();
  const iv = generateIV();

  try {
    // Derive encryption key
    const key = await deriveKey(passphrase, finalSalt);

    // Encrypt the data
    const encrypted = await encryptData(data, key, iv);

    // Return base64-encoded result
    return {
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(finalSalt),
      ciphertext: arrayBufferToBase64(encrypted.slice(0, -ENCRYPTION_CONSTANTS.TAG_LENGTH)),
      authTag: arrayBufferToBase64(encrypted.slice(-ENCRYPTION_CONSTANTS.TAG_LENGTH)),
    };
  } catch (error) {
    throw new Error(`Encryption process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * High-level decryption function that handles the complete workflow
 * @param encryptedData - Complete encrypted package
 * @param passphrase - User's passphrase
 * @returns Promise<ArrayBuffer> - Decrypted data
 */
export async function decrypt(
  encryptedData: EncryptedData,
  passphrase: string
): Promise<ArrayBuffer> {
  try {
    // Decode base64 components
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const salt = base64ToArrayBuffer(encryptedData.salt);
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const authTag = base64ToArrayBuffer(encryptedData.authTag);

    // Combine ciphertext and auth tag
    const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(authTag), ciphertext.byteLength);

    // Derive decryption key
    const key = await deriveKey(passphrase, new Uint8Array(salt));

    // Decrypt the data
    const decrypted = await decryptData(combined.buffer, key, new Uint8Array(iv));

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data and return as UTF-8 string
 * @param encryptedData - Complete encrypted package
 * @param passphrase - User's passphrase
 * @returns Promise<string> - Decrypted string
 */
export async function decryptString(
  encryptedData: EncryptedData,
  passphrase: string
): Promise<string> {
  const decrypted = await decrypt(encryptedData, passphrase);
  return new TextDecoder().decode(decrypted);
}

/**
 * Utility function to convert ArrayBuffer to base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility function to convert base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Validate passphrase strength
 * @param passphrase - Passphrase to validate
 * @returns ValidationResult with strength assessment
 */
export function validatePassphraseStrength(passphrase: string): {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (passphrase.length >= 12) {
    score += 25;
  } else if (passphrase.length >= 8) {
    score += 15;
    feedback.push('Consider using a longer passphrase (12+ characters)');
  } else {
    feedback.push('Passphrase should be at least 8 characters long');
  }

  // Character variety
  if (/[a-z]/.test(passphrase)) score += 15;
  if (/[A-Z]/.test(passphrase)) score += 15;
  if (/[0-9]/.test(passphrase)) score += 15;
  if (/[^a-zA-Z0-9]/.test(passphrase)) score += 20;

  // Bonus for very long passphrases
  if (passphrase.length >= 20) score += 10;

  // Penalty for common patterns
  if (/^[a-zA-Z]+$/.test(passphrase)) {
    score -= 10;
    feedback.push('Add numbers or special characters for better security');
  }
  if (/^[0-9]+$/.test(passphrase)) {
    score -= 20;
    feedback.push('Use a mix of letters, numbers, and special characters');
  }
  if (/(.)\1{2,}/.test(passphrase)) {
    score -= 10;
    feedback.push('Avoid repeating characters');
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Provide overall feedback
  if (score >= 80) {
    feedback.unshift('Strong passphrase');
  } else if (score >= 60) {
    feedback.unshift('Good passphrase, but could be stronger');
  } else if (score >= 40) {
    feedback.unshift('Moderate passphrase strength');
  } else {
    feedback.unshift('Weak passphrase - consider improving');
  }

  return {
    isValid: score >= 40, // Minimum acceptable score
    score,
    feedback,
  };
}

/**
 * Securely clear sensitive data from memory
 * Note: This is a best-effort approach as JavaScript doesn't guarantee memory clearing
 */
export function clearSensitiveData(data: string | Uint8Array | ArrayBuffer): void {
  if (typeof data === 'string') {
    // Can't directly clear string in JavaScript, but we can try to overwrite variables
    return;
  }
  
  if (data instanceof Uint8Array) {
    data.fill(0);
  } else if (data instanceof ArrayBuffer) {
    new Uint8Array(data).fill(0);
  }
}

/**
 * Test if Web Crypto API is available and working
 */
export async function testCryptoAvailability(): Promise<{ available: boolean; error?: string }> {
  try {
    // Test basic crypto functionality
    if (!crypto || !crypto.subtle) {
      return { available: false, error: 'Web Crypto API not available' };
    }

    // Test AES-GCM support
    const testKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Test PBKDF2 support
    const testKeyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('test'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return { available: true };
  } catch (error) {
    return {
      available: false,
      error: `Crypto test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generate a secure random passphrase using cryptographic random number generator
 * @param wordCount - Number of words in passphrase (default: 6)
 * @returns Promise<string> - Generated passphrase
 */
export async function generateSecurePassphrase(wordCount: number = 6): Promise<string> {
  // Simple word list for passphrase generation (in production, use a larger list)
  const words = [
    'apple', 'brave', 'chair', 'dance', 'eagle', 'flame', 'grape', 'house',
    'light', 'magic', 'night', 'ocean', 'peace', 'queen', 'river', 'stone',
    'trust', 'unity', 'voice', 'water', 'youth', 'zebra', 'cloud', 'dream',
    'field', 'giant', 'happy', 'image', 'joker', 'king', 'lemon', 'mouse',
    'noise', 'olive', 'piano', 'quick', 'radio', 'smile', 'tiger', 'under',
    'violet', 'world', 'extra', 'young', 'zero', 'beach', 'candy', 'drive'
  ];

  const selectedWords: string[] = [];
  const randomBytes = generateSecureRandom(wordCount);

  for (let i = 0; i < wordCount; i++) {
    const index = randomBytes[i] % words.length;
    selectedWords.push(words[index]);
  }

  return selectedWords.join('-');
}
