/**
 * Card data encryption utilities
 * Handles encryption/decryption of card data with proper serialization
 */

import { Card, EncryptedData } from '../types';
import { encrypt, decrypt, decryptString } from './crypto';

/**
 * Encrypt card data for storage
 * @param card - Card object to encrypt
 * @param passphrase - User's passphrase
 * @returns Promise<EncryptedData> - Encrypted card data
 */
export async function encryptCard(card: Card, passphrase: string): Promise<EncryptedData> {
  try {
    // Create a clean copy of the card data
    const cardData = {
      ...card,
      // Ensure dates are properly serialized
      addedAt: card.addedAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(cardData);

    // Encrypt the JSON string
    const encrypted = await encrypt(jsonString, passphrase);

    return encrypted;
  } catch (error) {
    throw new Error(`Failed to encrypt card data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt card data from storage
 * @param encryptedData - Encrypted card data
 * @param passphrase - User's passphrase
 * @returns Promise<Card> - Decrypted card object
 */
export async function decryptCard(encryptedData: EncryptedData, passphrase: string): Promise<Card> {
  try {
    // Decrypt to JSON string
    const jsonString = await decryptString(encryptedData, passphrase);

    // Parse JSON
    const cardData = JSON.parse(jsonString);

    // Convert date strings back to Date objects
    return {
      ...cardData,
      addedAt: new Date(cardData.addedAt),
      updatedAt: new Date(cardData.updatedAt),
    };
  } catch (error) {
    throw new Error(`Failed to decrypt card data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt multiple cards in batch
 * @param cards - Array of cards to encrypt
 * @param passphrase - User's passphrase
 * @returns Promise<EncryptedData[]> - Array of encrypted card data
 */
export async function encryptCards(cards: Card[], passphrase: string): Promise<EncryptedData[]> {
  const results: EncryptedData[] = [];
  
  for (const card of cards) {
    const encrypted = await encryptCard(card, passphrase);
    results.push(encrypted);
  }
  
  return results;
}

/**
 * Decrypt multiple cards in batch
 * @param encryptedCards - Array of encrypted card data
 * @param passphrase - User's passphrase
 * @returns Promise<Card[]> - Array of decrypted cards
 */
export async function decryptCards(encryptedCards: EncryptedData[], passphrase: string): Promise<Card[]> {
  const results: Card[] = [];
  
  for (const encryptedCard of encryptedCards) {
    const card = await decryptCard(encryptedCard, passphrase);
    results.push(card);
  }
  
  return results;
}

/**
 * Encrypt a card index for faster searches
 * @param cards - Array of cards
 * @param passphrase - User's passphrase
 * @returns Promise<EncryptedData> - Encrypted index data
 */
export async function encryptCardIndex(cards: Card[], passphrase: string): Promise<EncryptedData> {
  try {
    // Create searchable index with minimal data
    const index = cards.map(card => ({
      id: card.id,
      category: card.category,
      nickname: card.nickname,
      last4: card.last4,
      addedAt: card.addedAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    }));

    const jsonString = JSON.stringify({
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      cards: index,
    });

    return await encrypt(jsonString, passphrase);
  } catch (error) {
    throw new Error(`Failed to encrypt card index: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt card index
 * @param encryptedIndex - Encrypted index data
 * @param passphrase - User's passphrase
 * @returns Promise<CardIndex> - Decrypted index
 */
export async function decryptCardIndex(encryptedIndex: EncryptedData, passphrase: string): Promise<{
  version: string;
  lastUpdated: Date;
  cards: Array<{
    id: string;
    category: Card['category'];
    nickname: string;
    last4?: string;
    addedAt: Date;
    updatedAt: Date;
  }>;
}> {
  try {
    const jsonString = await decryptString(encryptedIndex, passphrase);
    const indexData = JSON.parse(jsonString);

    return {
      version: indexData.version,
      lastUpdated: new Date(indexData.lastUpdated),
      cards: indexData.cards.map((card: any) => ({
        ...card,
        addedAt: new Date(card.addedAt),
        updatedAt: new Date(card.updatedAt),
      })),
    };
  } catch (error) {
    throw new Error(`Failed to decrypt card index: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt generic JSON data
 * @param data - Any serializable object
 * @param passphrase - User's passphrase
 * @returns Promise<EncryptedData> - Encrypted data
 */
export async function encryptJSON<T>(data: T, passphrase: string): Promise<EncryptedData> {
  try {
    const jsonString = JSON.stringify(data);
    return await encrypt(jsonString, passphrase);
  } catch (error) {
    throw new Error(`Failed to encrypt JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt generic JSON data
 * @param encryptedData - Encrypted data
 * @param passphrase - User's passphrase
 * @returns Promise<T> - Decrypted and parsed data
 */
export async function decryptJSON<T>(encryptedData: EncryptedData, passphrase: string): Promise<T> {
  try {
    const jsonString = await decryptString(encryptedData, passphrase);
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Failed to decrypt JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate encrypted data structure
 * @param data - Data to validate
 * @returns boolean - True if valid encrypted data structure
 */
export function isValidEncryptedData(data: any): data is EncryptedData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.iv === 'string' &&
    typeof data.salt === 'string' &&
    typeof data.ciphertext === 'string' &&
    typeof data.authTag === 'string'
  );
}

/**
 * Sanitize card data before encryption (remove sensitive debugging info)
 * @param card - Card to sanitize
 * @returns Card - Sanitized card
 */
export function sanitizeCardForEncryption(card: Card): Card {
  // Create a clean copy without any potential debugging or internal properties
  return {
    id: card.id,
    category: card.category,
    nickname: card.nickname,
    number: card.number,
    expiryDate: card.expiryDate,
    issueDate: card.issueDate,
    notes: card.notes,
    imageUrl: card.imageUrl,
    last4: card.last4,
    addedAt: card.addedAt,
    updatedAt: card.updatedAt,
  };
}

/**
 * Create a card fingerprint for integrity checking (non-encrypted)
 * @param card - Card to fingerprint
 * @returns Promise<string> - Card fingerprint
 */
export async function createCardFingerprint(card: Card): Promise<string> {
  const fingerprintData = {
    id: card.id,
    nickname: card.nickname,
    category: card.category,
    last4: card.last4,
    updatedAt: card.updatedAt.toISOString(),
  };

  const jsonString = JSON.stringify(fingerprintData);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Verify card integrity using fingerprint
 * @param card - Card to verify
 * @param expectedFingerprint - Expected fingerprint
 * @returns Promise<boolean> - True if card matches fingerprint
 */
export async function verifyCardIntegrity(card: Card, expectedFingerprint: string): Promise<boolean> {
  try {
    const actualFingerprint = await createCardFingerprint(card);
    return actualFingerprint === expectedFingerprint;
  } catch (error) {
    return false;
  }
}
