import { uploadFile, downloadFile, updateFile, deleteFile, searchFiles, initializeDriveStructure } from './drive';
import { encrypt, decrypt, decryptString } from './crypto';
import { Card, EncryptedData } from '../types';
import { encryptCard, decryptCard } from './cardCrypto';
import { encryptImage, decryptImage } from './imageCrypto';

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
 * Save an encrypted card to Drive
 */
export async function saveCardToDrive(
  card: Card,
  passphrase: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!folderCache.cardsFolderId) {
    await initializeDriveStorage();
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
  imageBlob: Blob,
  passphrase: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!folderCache.cardsFolderId) {
    await initializeDriveStorage();
  }
  
  // Encrypt the image
  const encryptedImage = await encryptImage(imageBlob, passphrase);
  
  // Prepare metadata
  const metadata = {
    name: `card_${cardId}_image.enc`,
    mimeType: 'application/octet-stream',
    parents: [folderCache.cardsFolderId!],
    description: `Encrypted image for card ${cardId}`
  };
  
  // Upload to Drive
  const driveFile = await uploadFile(
    new Blob([encryptedImage]),
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
    // Encrypt each thumbnail
    const encryptedThumbnail = await encryptImage(thumbnails[size], passphrase);
    
    // Prepare metadata
    const metadata = {
      name: `card_${cardId}_thumb_${size}.enc`,
      mimeType: 'application/octet-stream',
      parents: [folderCache.cardsFolderId!],
      description: `Encrypted ${size}px thumbnail for card ${cardId}`
    };
    
    // Upload to Drive
    const driveFile = await uploadFile(
      new Blob([encryptedThumbnail]),
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
 * Load a card from Drive
 */
export async function loadCardFromDrive(
  fileId: string,
  passphrase: string
): Promise<Card> {
  // Download the encrypted file
  const blob = await downloadFile(fileId);
  const encryptedJson = await blob.text();
  const encryptedCard = JSON.parse(encryptedJson) as EncryptedData;
  
  // Decrypt and return
  return await decryptCard(encryptedCard, passphrase);
}

/**
 * Load card image from Drive
 */
export async function loadCardImageFromDrive(
  fileId: string,
  passphrase: string
): Promise<Blob> {
  // Download the encrypted image
  const encryptedBlob = await downloadFile(fileId);
  const encryptedBuffer = await encryptedBlob.arrayBuffer();
  
  // Decrypt and return
  return await decryptImage(new Uint8Array(encryptedBuffer), passphrase);
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
 * Update a card in Drive
 */
export async function updateCardInDrive(
  fileId: string,
  card: Card,
  passphrase: string,
  onProgress?: (progress: number) => void
): Promise<void> {
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
  const encryptedData = JSON.parse(encryptedJson) as EncryptedData;
  
  // Decrypt preferences using high-level decrypt function
  const decryptedJson = await decryptString(encryptedData, passphrase);
  
  return JSON.parse(decryptedJson);
}

/**
 * Save encrypted card index to Drive for faster loading
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
  const encryptedData = JSON.parse(encryptedJson) as EncryptedData;
  
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