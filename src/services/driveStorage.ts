import { uploadFile, downloadFile, updateFile, deleteFile, searchFiles, initializeDriveStructure } from './drive';
import { encrypt, decryptString } from './crypto';
import { Card, EncryptedData } from '../types';
import { encryptCard, decryptCard } from './cardCrypto';
import { encryptImage, decryptImage } from './imageCrypto';

/**
 * Convert data URL to Blob without using fetch (CSP safe)
 */
function dataURLToBlob(dataURL: string): Blob {
  // Extract the base64 data and mime type
  const matches = dataURL.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid data URL');
  }
  
  const mimeType = matches[1];
  const base64Data = matches[2];
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: mimeType });
}

/**
 * Convert Blob to data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Safely parse JSON with error handling
 */
function safeJSONParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Attempted to parse:', text);
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Cache for folder IDs
let folderCache: {
  rootFolderId?: string;
  cardsFolderId?: string;
  metadataFolderId?: string;
  configFolderId?: string;
} = {};

/**
 * Initialize Drive storage and ensure folder structure exists
 */
export async function initializeDriveStorage(): Promise<void> {
  const folders = await initializeDriveStructure();
  folderCache = folders;
}

/**
 * Save an encrypted card to Drive (including image if present)
 */
export async function saveCardToDrive(
  card: Card,
  passphrase: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!folderCache.cardsFolderId) {
    await initializeDriveStorage();
  }
  
  // If card has an image (data URL), save it separately
  let imageFileId: string | undefined;
  if (card.imageUrl && card.imageUrl.startsWith('data:')) {
    // Convert data URL to Blob without using fetch (CSP safe)
    const imageBlob = dataURLToBlob(card.imageUrl);
    
    // Convert Blob to File for encryptImage function
    const imageFile = new File([imageBlob], `card_${card.id}_image.jpg`, {
      type: imageBlob.type,
      lastModified: Date.now()
    });
    
    // Save image to Drive
    imageFileId = await saveCardImageToDrive(
      card.id,
      imageFile,
      passphrase,
      onProgress
    );
    
    // Update card to reference the image file ID instead of data URL
    card = {
      ...card,
      imageUrl: `drive://${imageFileId}` // Special URL format to indicate Drive storage
    };
  }
  
  // Encrypt the card data
  const encryptedCard = await encryptCard(card, passphrase);
  
  // Prepare metadata for Drive
  const metadata = {
    name: `card_${card.id}.json`,
    mimeType: 'application/json',
    parents: [folderCache.cardsFolderId!],
    description: `Encrypted card: ${card.category} - ${card.nickname}`
  };
  
  // Upload to Drive
  const driveFile = await uploadFile(
    JSON.stringify(encryptedCard),
    metadata,
    onProgress
  );
  
  return driveFile.id;
}

/**
 * Save card image to Drive
 */
export async function saveCardImageToDrive(
  cardId: string,
  imageFile: File,
  passphrase: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!folderCache.cardsFolderId) {
    await initializeDriveStorage();
  }
  
  // Encrypt the image
  const encryptedImage = await encryptImage(imageFile, passphrase);
  
  // Prepare metadata
  const metadata = {
    name: `card_${cardId}_image.enc`,
    mimeType: 'application/octet-stream',
    parents: [folderCache.cardsFolderId!],
    description: `Encrypted image for card ${cardId}`
  };
  
  // Upload to Drive
  const driveFile = await uploadFile(
    JSON.stringify(encryptedImage),
    metadata,
    onProgress
  );
  
  return driveFile.id;
}

/**
 * Save card thumbnails to Drive
 */
export async function saveCardThumbnailsToDrive(
  cardId: string,
  thumbnails: { [size: string]: Blob },
  passphrase: string,
  onProgress?: (progress: number) => void
): Promise<{ [size: string]: string }> {
  if (!folderCache.cardsFolderId) {
    await initializeDriveStorage();
  }
  
  const thumbnailIds: { [size: string]: string } = {};
  const sizes = Object.keys(thumbnails);
  let completedCount = 0;
  
  for (const size of sizes) {
    // Convert thumbnail Blob to File for encryptImage
    const thumbnailFile = new File([thumbnails[size]], `card_${cardId}_thumb_${size}.jpg`, {
      type: thumbnails[size].type,
      lastModified: Date.now()
    });
    
    // Encrypt each thumbnail
    const encryptedThumbnail = await encryptImage(thumbnailFile, passphrase);
    
    // Prepare metadata
    const metadata = {
      name: `card_${cardId}_thumb_${size}.enc`,
      mimeType: 'application/octet-stream',
      parents: [folderCache.cardsFolderId!],
      description: `Encrypted ${size}px thumbnail for card ${cardId}`
    };
    
    // Upload to Drive
    const driveFile = await uploadFile(
      JSON.stringify(encryptedThumbnail),
      metadata,
      (progress) => {
        if (onProgress) {
          // Calculate overall progress across all thumbnails
          const overallProgress = Math.round(
            ((completedCount * 100) + progress) / sizes.length
          );
          onProgress(overallProgress);
        }
      }
    );
    
    thumbnailIds[size] = driveFile.id;
    completedCount++;
  }
  
  return thumbnailIds;
}

/**
 * Load a card from Drive (including image if present)
 */
export async function loadCardFromDrive(
  fileId: string,
  passphrase: string
): Promise<Card> {
  // Download the encrypted file
  const blob = await downloadFile(fileId);
  const encryptedJson = await blob.text();
  const encryptedCard = safeJSONParse(encryptedJson) as EncryptedData;
  
  // Decrypt the card
  const card = await decryptCard(encryptedCard, passphrase);
  
  // If card has a Drive image reference, load it
  if (card.imageUrl && card.imageUrl.startsWith('drive://')) {
    const imageFileId = card.imageUrl.replace('drive://', '');
    try {
      const imageBlob = await loadCardImageFromDrive(imageFileId, passphrase);
      // Convert blob to data URL
      const dataUrl = await blobToDataURL(imageBlob);
      card.imageUrl = dataUrl;
    } catch (error) {
      console.error('Failed to load card image:', error);
      // Remove the drive:// reference if image fails to load
      card.imageUrl = undefined;
    }
  }
  
  return card;
}

/**
 * Load card image from Drive
 */
export async function loadCardImageFromDrive(
  fileId: string,
  passphrase: string
): Promise<Blob> {
  try {
    // Download the encrypted image
    const encryptedBlob = await downloadFile(fileId);
    
    // Convert blob to text properly
    const encryptedText = await encryptedBlob.text();
    
    // Validate that we have actual text data
    if (!encryptedText || encryptedText.trim() === '') {
      throw new Error('Empty or invalid encrypted data received');
    }
    
    // Parse the encrypted data with safe parsing
    const encryptedData = safeJSONParse(encryptedText) as EncryptedData;
    
    // Validate encrypted data structure
    if (!encryptedData || typeof encryptedData !== 'object') {
      throw new Error('Invalid encrypted data structure');
    }
    
    // Decrypt and return the image blob
    return await decryptImage(encryptedData, passphrase);
    
  } catch (error) {
    console.error('Failed to load card image from Drive:', error);
    throw error;
  }
}

/**
 * List all cards from Drive
 */
export async function listCardsFromDrive(): Promise<Array<{
  id: string;
  fileId: string;
  name: string;
  modifiedTime: string;
}>> {
  if (!folderCache.cardsFolderId) {
    await initializeDriveStorage();
  }
  
  // Search for all card files
  const files = await searchFiles('card_', folderCache.cardsFolderId, 'application/json');
  
  return files
    .filter(file => file.name.endsWith('.json') && !file.name.includes('thumb'))
    .map(file => ({
      id: file.name.replace('card_', '').replace('.json', ''),
      fileId: file.id,
      name: file.name,
      modifiedTime: file.modifiedTime
    }));
}

/**
 * Update a card in Drive (including image if changed)
 */
export async function updateCardInDrive(
  fileId: string,
  card: Card,
  passphrase: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  // Handle image update if present
  if (card.imageUrl && card.imageUrl.startsWith('data:')) {
    // Convert data URL to Blob without using fetch (CSP safe)
    const imageBlob = dataURLToBlob(card.imageUrl);
    
    // Check if image already exists
    const existingImageFiles = await searchFiles(`card_${card.id}_image.enc`, folderCache.cardsFolderId);
    
    let imageFileId: string;
    if (existingImageFiles.length > 0) {
      // Update existing image
      const imageFile = new File([imageBlob], `card_${card.id}_image.jpg`, {
        type: imageBlob.type,
        lastModified: Date.now()
      });
      const encryptedImage = await encryptImage(imageFile, passphrase);
      await updateFile(
        existingImageFiles[0].id,
        JSON.stringify(encryptedImage),
        {
          name: `card_${card.id}_image.enc`,
          mimeType: 'application/octet-stream'
        }
      );
      imageFileId = existingImageFiles[0].id;
    } else {
      // Save new image
      const imageFile = new File([imageBlob], `card_${card.id}_image.jpg`, {
        type: imageBlob.type,
        lastModified: Date.now()
      });
      imageFileId = await saveCardImageToDrive(card.id, imageFile, passphrase);
    }
    
    // Update card to reference the image file ID
    card = {
      ...card,
      imageUrl: `drive://${imageFileId}`
    };
  }
  
  // Encrypt the updated card
  const encryptedCard = await encryptCard(card, passphrase);
  
  // Update the file
  await updateFile(
    fileId,
    JSON.stringify(encryptedCard),
    {
      name: `card_${card.id}.json`,
      mimeType: 'application/json'
    },
    onProgress
  );
}

/**
 * Delete a card from Drive (including images and thumbnails)
 */
export async function deleteCardFromDrive(cardId: string): Promise<void> {
  if (!folderCache.cardsFolderId) {
    await initializeDriveStorage();
  }
  
  // Find all files related to this card
  const files = await searchFiles(`card_${cardId}`, folderCache.cardsFolderId);
  
  // Delete all related files
  const deletePromises = files.map(file => deleteFile(file.id));
  await Promise.all(deletePromises);
}

/**
 * Delete all cards from Drive (for vault reset)
 */
export async function deleteAllCardsFromDrive(): Promise<void> {
  if (!folderCache.cardsFolderId) {
    await initializeDriveStorage();
  }
  
  // Get all files in the cards folder
  const files = await searchFiles('', folderCache.cardsFolderId);
  
  // Delete all files
  const deletePromises = files.map(file => deleteFile(file.id));
  await Promise.all(deletePromises);
  
  // Also clear preferences and index
  if (folderCache.configFolderId) {
    const configFiles = await searchFiles('', folderCache.configFolderId);
    const configDeletePromises = configFiles.map(file => deleteFile(file.id));
    await Promise.all(configDeletePromises);
  }
  
  if (folderCache.metadataFolderId) {
    const metadataFiles = await searchFiles('', folderCache.metadataFolderId);
    const metadataDeletePromises = metadataFiles.map(file => deleteFile(file.id));
    await Promise.all(metadataDeletePromises);
  }
}

/**
 * Save user preferences to Drive
 */
export async function savePreferencesToDrive(
  preferences: any,
  passphrase: string
): Promise<void> {
  if (!folderCache.configFolderId) {
    await initializeDriveStorage();
  }
  
  // Encrypt preferences using high-level encrypt function
  const encrypted = await encrypt(JSON.stringify(preferences), passphrase);
  
  // Save to Drive
  const metadata = {
    name: 'preferences.json',
    mimeType: 'application/json',
    parents: [folderCache.configFolderId!]
  };
  
  // Check if preferences file exists
  const existingFiles = await searchFiles('preferences.json', folderCache.configFolderId);
  
  if (existingFiles.length > 0) {
    // Update existing file
    await updateFile(
      existingFiles[0].id,
      JSON.stringify(encrypted)
    );
  } else {
    // Create new file
    await uploadFile(
      JSON.stringify(encrypted),
      metadata
    );
  }
}

/**
 * Load user preferences from Drive
 */
export async function loadPreferencesFromDrive(passphrase: string): Promise<any> {
  if (!folderCache.configFolderId) {
    await initializeDriveStorage();
  }
  
  // Search for preferences file
  const files = await searchFiles('preferences.json', folderCache.configFolderId);
  
  if (files.length === 0) {
    return null; // No preferences saved yet
  }
  
  // Download and decrypt
  const blob = await downloadFile(files[0].id);
  const encryptedJson = await blob.text();
  const encryptedData = safeJSONParse(encryptedJson) as EncryptedData;
  
  // Decrypt preferences using high-level decrypt function
  const decryptedJson = await decryptString(encryptedData, passphrase);
  
  return JSON.parse(decryptedJson);
}

/**
 * Save card index to Drive (for performance)
 */
export async function saveCardIndexToDrive(
  index: Array<{
    id: string;
    fileId: string;
    category: string;
    nickname: string;
    last4?: string;
    addedAt: Date;
    updatedAt: Date;
  }>,
  passphrase: string
): Promise<void> {
  if (!folderCache.metadataFolderId) {
    await initializeDriveStorage();
  }
  
  // Encrypt index using high-level encrypt function
  const encrypted = await encrypt(JSON.stringify(index), passphrase);
  
  // Save to Drive
  const metadata = {
    name: 'index.json',
    mimeType: 'application/json',
    parents: [folderCache.metadataFolderId!]
  };
  
  // Check if index file exists
  const existingFiles = await searchFiles('index.json', folderCache.metadataFolderId);
  
  if (existingFiles.length > 0) {
    // Update existing file
    await updateFile(
      existingFiles[0].id,
      JSON.stringify(encrypted)
    );
  } else {
    // Create new file
    await uploadFile(
      JSON.stringify(encrypted),
      metadata
    );
  }
}

/**
 * Load card index from Drive
 */
export async function loadCardIndexFromDrive(passphrase: string): Promise<Array<{
  id: string;
  fileId: string;
  category: string;
  nickname: string;
  last4?: string;
  addedAt: Date;
  updatedAt: Date;
}> | null> {
  if (!folderCache.metadataFolderId) {
    await initializeDriveStorage();
  }
  
  // Search for index file
  const files = await searchFiles('index.json', folderCache.metadataFolderId);
  
  if (files.length === 0) {
    return null; // No index saved yet
  }
  
  // Download and decrypt
  const blob = await downloadFile(files[0].id);
  const encryptedJson = await blob.text();
  const encryptedData = safeJSONParse(encryptedJson) as EncryptedData;
  
  // Decrypt index using high-level decrypt function
  const decryptedJson = await decryptString(encryptedData, passphrase);
  
  return JSON.parse(decryptedJson);
}

/**
 * Get Drive storage usage for the app
 */
export async function getAppStorageUsage(): Promise<{
  totalSize: number;
  cardCount: number;
  imageCount: number;
}> {
  if (!folderCache.rootFolderId) {
    await initializeDriveStorage();
  }
  
  // Get all files in the app folder
  const allFiles: any[] = [];
  let pageToken: string | undefined;
  
  do {
    const result = await searchFiles('', folderCache.rootFolderId);
    allFiles.push(...result);
    pageToken = undefined; // Simple implementation without pagination
  } while (pageToken);
  
  // Calculate usage
  let totalSize = 0;
  let cardCount = 0;
  let imageCount = 0;
  
  for (const file of allFiles) {
    if (file.size) {
      totalSize += parseInt(file.size);
    }
    
    if (file.name.endsWith('.json') && file.name.startsWith('card_')) {
      cardCount++;
    } else if (file.name.includes('_image.enc') || file.name.includes('_thumb_')) {
      imageCount++;
    }
  }
  
  return {
    totalSize,
    cardCount,
    imageCount
  };
}
