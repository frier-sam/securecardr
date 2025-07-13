/**
 * Image encryption utilities
 * Handles encryption/decryption of binary image data for card photos
 */

import { EncryptedData } from '../types';
import { encrypt, decrypt } from './crypto';

/**
 * Image processing utilities
 */
export const IMAGE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  THUMBNAIL_SIZE: 400, // pixels
  COMPRESSION_QUALITY: 0.8,
} as const;

/**
 * Encrypt image file data
 * @param imageFile - Image file to encrypt
 * @param passphrase - User's passphrase
 * @returns Promise<EncryptedData> - Encrypted image data
 */
export async function encryptImage(imageFile: File, passphrase: string): Promise<EncryptedData> {
  try {
    // Validate image file
    validateImageFile(imageFile);

    // Convert file to ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();

    // Encrypt the binary data
    const encrypted = await encrypt(arrayBuffer, passphrase);

    return encrypted;
  } catch (error) {
    throw new Error(`Failed to encrypt image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt image data
 * @param encryptedData - Encrypted image data
 * @param passphrase - User's passphrase
 * @param mimeType - Original image MIME type
 * @returns Promise<Blob> - Decrypted image blob
 */
export async function decryptImage(
  encryptedData: EncryptedData,
  passphrase: string,
  mimeType: string = 'image/jpeg'
): Promise<Blob> {
  try {
    // Decrypt the binary data
    const decryptedBuffer = await decrypt(encryptedData, passphrase);

    // Create blob from decrypted data
    return new Blob([decryptedBuffer], { type: mimeType });
  } catch (error) {
    throw new Error(`Failed to decrypt image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create encrypted thumbnail from image
 * @param imageFile - Original image file
 * @param passphrase - User's passphrase
 * @param size - Thumbnail size in pixels (default: 400)
 * @returns Promise<EncryptedData> - Encrypted thumbnail data
 */
export async function createEncryptedThumbnail(
  imageFile: File,
  passphrase: string,
  size: number = IMAGE_CONSTANTS.THUMBNAIL_SIZE
): Promise<EncryptedData> {
  try {
    // Create thumbnail
    const thumbnailBlob = await createThumbnail(imageFile, size);

    // Convert to ArrayBuffer
    const arrayBuffer = await thumbnailBlob.arrayBuffer();

    // Encrypt thumbnail
    const encrypted = await encrypt(arrayBuffer, passphrase);

    return encrypted;
  } catch (error) {
    throw new Error(`Failed to create encrypted thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create thumbnail from image file
 * @param imageFile - Image file
 * @param size - Maximum dimension in pixels
 * @param quality - JPEG quality (0-1)
 * @returns Promise<Blob> - Thumbnail blob
 */
export async function createThumbnail(
  imageFile: File,
  size: number = IMAGE_CONSTANTS.THUMBNAIL_SIZE,
  quality: number = IMAGE_CONSTANTS.COMPRESSION_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const { width, height } = calculateThumbnailDimensions(
        img.width,
        img.height,
        size
      );

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Calculate thumbnail dimensions maintaining aspect ratio
 */
function calculateThumbnailDimensions(
  originalWidth: number,
  originalHeight: number,
  maxSize: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  if (width > height) {
    if (width > maxSize) {
      height = (height * maxSize) / width;
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = (width * maxSize) / height;
      height = maxSize;
    }
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Validate image file
 * @param imageFile - File to validate
 * @throws Error if validation fails
 */
export function validateImageFile(imageFile: File): void {
  // Check file size
  if (imageFile.size > IMAGE_CONSTANTS.MAX_FILE_SIZE) {
    throw new Error(`Image file too large. Maximum size: ${IMAGE_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check file type
  if (!IMAGE_CONSTANTS.SUPPORTED_FORMATS.includes(imageFile.type as any)) {
    throw new Error(`Unsupported image format. Supported: ${IMAGE_CONSTANTS.SUPPORTED_FORMATS.join(', ')}`);
  }

  // Check if file is actually an image
  if (!imageFile.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }
}

/**
 * Compress image before encryption
 * @param imageFile - Original image file
 * @param quality - Compression quality (0-1)
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Promise<Blob> - Compressed image blob
 */
export async function compressImage(
  imageFile: File,
  quality: number = IMAGE_CONSTANTS.COMPRESSION_QUALITY,
  maxWidth: number = 2048,
  maxHeight: number = 2048
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate compressed dimensions
      const { width, height } = calculateThumbnailDimensions(
        img.width,
        img.height,
        Math.max(maxWidth, maxHeight)
      );

      // Ensure we don't exceed individual dimension limits
      const finalWidth = Math.min(width, maxWidth);
      const finalHeight = Math.min(height, maxHeight);

      // Set canvas size
      canvas.width = finalWidth;
      canvas.height = finalHeight;

      // Draw compressed image
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        imageFile.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Extract EXIF data from image (non-sensitive metadata)
 * @param imageFile - Image file
 * @returns Promise<ImageMetadata> - Extracted metadata
 */
export async function extractImageMetadata(imageFile: File): Promise<{
  fileName: string;
  fileSize: number;
  mimeType: string;
  lastModified: Date;
  dimensions?: { width: number; height: number };
}> {
  const metadata = {
    fileName: imageFile.name,
    fileSize: imageFile.size,
    mimeType: imageFile.type,
    lastModified: new Date(imageFile.lastModified),
  };

  try {
    // Get image dimensions
    const dimensions = await getImageDimensions(imageFile);
    return { ...metadata, dimensions };
  } catch (error) {
    // Return metadata without dimensions if extraction fails
    return metadata;
  }
}

/**
 * Get image dimensions
 * @param imageFile - Image file
 * @returns Promise<{width: number, height: number}> - Image dimensions
 */
export function getImageDimensions(imageFile: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for dimension extraction'));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Convert encrypted image to data URL for display
 * @param encryptedImage - Encrypted image data
 * @param passphrase - User's passphrase
 * @param mimeType - Image MIME type
 * @returns Promise<string> - Data URL
 */
export async function encryptedImageToDataURL(
  encryptedImage: EncryptedData,
  passphrase: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    const imageBlob = await decryptImage(encryptedImage, passphrase, mimeType);
    return blobToDataURL(imageBlob);
  } catch (error) {
    throw new Error(`Failed to convert encrypted image to data URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert blob to data URL
 * @param blob - Blob to convert
 * @returns Promise<string> - Data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Batch encrypt multiple images
 * @param imageFiles - Array of image files
 * @param passphrase - User's passphrase
 * @returns Promise<EncryptedData[]> - Array of encrypted image data
 */
export async function encryptImages(imageFiles: File[], passphrase: string): Promise<EncryptedData[]> {
  const results: EncryptedData[] = [];

  for (const imageFile of imageFiles) {
    const encrypted = await encryptImage(imageFile, passphrase);
    results.push(encrypted);
  }

  return results;
}

/**
 * Create a secure image filename
 * @param originalName - Original filename
 * @param cardId - Associated card ID
 * @returns string - Secure filename
 */
export function createSecureImageFilename(originalName: string, cardId: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  return `card_${cardId}_${timestamp}.${extension}`;
}

/**
 * Validate that decrypted image data is valid
 * @param imageBlob - Decrypted image blob
 * @returns Promise<boolean> - True if valid image
 */
export async function validateDecryptedImage(imageBlob: Blob): Promise<boolean> {
  try {
    // Try to create an image from the blob
    const url = URL.createObjectURL(imageBlob);
    
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(true);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      
      img.src = url;
    });
  } catch (error) {
    return false;
  }
}
