/**
 * Migration utilities for SecureCardr
 * Helps convert cards from old format to new format with multiple images support
 */

import { Card, CardImage } from '../types';

/**
 * Migrates a card from the old format (single imageUrl) to the new format (multiple images)
 */
export function migrateCardToNewFormat(card: Card): Card {
  // If card already has images array, it's already migrated
  if (card.images && Array.isArray(card.images)) {
    return card;
  }

  // Initialize images array
  const images: CardImage[] = [];

  // If card has legacy imageUrl, convert it to images array
  if (card.imageUrl) {
    const legacyImage: CardImage = {
      id: `legacy-${card.id}`,
      url: card.imageUrl,
      name: 'Card Image',
      size: 0,
      type: 'image/jpeg',
      addedAt: card.addedAt || new Date(),
      // Keep driveFileId if it's a drive URL
      driveFileId: card.imageUrl.startsWith('drive://') 
        ? card.imageUrl.replace('drive://', '') 
        : undefined
    };
    images.push(legacyImage);
  }

  // Return migrated card
  return {
    ...card,
    images,
    // Keep imageUrl for backward compatibility
    imageUrl: card.imageUrl
  };
}

/**
 * Migrates an array of cards to the new format
 */
export function migrateCardsToNewFormat(cards: Card[]): Card[] {
  return cards.map(migrateCardToNewFormat);
}

/**
 * Checks if a card needs migration
 */
export function cardNeedsMigration(card: Card): boolean {
  // Card needs migration if it has imageUrl but no images array
  return !!(card.imageUrl && (!card.images || card.images.length === 0));
}

/**
 * Gets the primary image for a card (for backward compatibility)
 */
export function getCardPrimaryImage(card: Card): string | undefined {
  // If card has images array, return the first one
  if (card.images && card.images.length > 0) {
    return card.images[0].url;
  }

  // Fall back to legacy imageUrl
  return card.imageUrl;
}

/**
 * Gets all images for a card (handles both old and new formats)
 */
export function getCardImages(card: Card): CardImage[] {
  // If card has images array, return it
  if (card.images && Array.isArray(card.images)) {
    return card.images;
  }

  // If card has legacy imageUrl, convert it to images array
  if (card.imageUrl) {
    return [{
      id: `legacy-${card.id}`,
      url: card.imageUrl,
      name: 'Card Image',
      size: 0,
      type: 'image/jpeg',
      addedAt: card.addedAt || new Date(),
      driveFileId: card.imageUrl.startsWith('drive://') 
        ? card.imageUrl.replace('drive://', '') 
        : undefined
    }];
  }

  return [];
}

/**
 * Converts File objects to CardImage objects
 */
export function filesToCardImages(files: File[]): CardImage[] {
  return files.map(file => ({
    id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
    type: file.type,
    addedAt: new Date()
  }));
}

/**
 * Cleans up blob URLs from CardImage objects
 */
export function cleanupCardImageUrls(images: CardImage[]): void {
  images.forEach(image => {
    if (image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
  });
}

/**
 * Validates CardImage objects
 */
export function validateCardImage(image: CardImage): boolean {
  return !!(
    image.id &&
    image.url &&
    image.name &&
    typeof image.size === 'number' &&
    image.type &&
    image.addedAt instanceof Date
  );
}

/**
 * Validates array of CardImage objects
 */
export function validateCardImages(images: CardImage[]): boolean {
  return Array.isArray(images) && images.every(validateCardImage);
}
