/**
 * OCR (Optical Character Recognition) utilities using Tesseract.js
 * Extracts text from card images and attempts to parse card information
 */

import Tesseract from 'tesseract.js';
import { OCRResult } from '../types';
import { detectCardCategory, CardCategory } from '../utils/cardCategories';

/**
 * OCR Configuration and Constants
 */
const OCR_CONFIG = {
  language: 'eng',
  options: {
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz /-().',
    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
    preserve_interword_spaces: '1',
  },
  // Preprocessing filters
  preprocessing: {
    enhance: true,
    grayscale: true,
    threshold: 0.5,
  },
} as const;

/**
 * Card number patterns for different card types
 */
const CARD_PATTERNS = {
  // Standard card number patterns (with spaces, dashes, or no separators)
  cardNumber: [
    /\b(?:\d{4}[\s-]?){3}\d{4}\b/g, // 16 digits (Visa, MC, Discover)
    /\b(?:\d{4}[\s-]?){2}\d{7}\b/g,  // 15 digits (Amex)
    /\b\d{4}[\s-]?\d{6}[\s-]?\d{4}\b/g, // 14 digits (Diners)
  ],
  // Expiry date patterns
  expiryDate: [
    /\b(0[1-9]|1[0-2])[\s/\-]?([0-9]{2}|20[0-9]{2})\b/g, // MM/YY or MM/YYYY
    /\b([0-9]{2})[\s/\-]?(0[1-9]|1[0-2])\b/g, // YY/MM (less common)
  ],
  // Name patterns (usually in caps)
  cardholderName: [
    /\b[A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?\b/g, // First Last (Middle)
  ],
  // CVV patterns
  cvv: [
    /\b\d{3,4}\b/g,
  ],
} as const;

/**
 * Enhanced OCR processing with image preprocessing
 */
export async function performOCR(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    // Create worker with configuration
    const worker = await Tesseract.createWorker({
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    // Initialize worker
    await worker.loadLanguage(OCR_CONFIG.language);
    await worker.initialize(OCR_CONFIG.language);
    await worker.setParameters(OCR_CONFIG.options);

    // Preprocess image if needed
    const processedImage = await preprocessImage(imageFile);

    // Perform OCR
    const { data } = await worker.recognize(processedImage);

    // Cleanup
    await worker.terminate();

    // Process results
    const result: OCRResult = {
      text: data.text,
      confidence: data.confidence || 0,
      words: data.words?.map(word => ({
        text: word.text,
        confidence: word.confidence || 0,
        bbox: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0,
        },
      })) || [],
    };

    return result;
  } catch (error) {
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Preprocess image for better OCR results
 */
async function preprocessImage(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply preprocessing filters
        if (OCR_CONFIG.preprocessing.grayscale) {
          grayscaleFilter(data);
        }

        if (OCR_CONFIG.preprocessing.enhance) {
          contrastFilter(data, 1.2);
        }

        // Apply threshold if specified
        if (OCR_CONFIG.preprocessing.threshold) {
          thresholdFilter(data, OCR_CONFIG.preprocessing.threshold);
        }

        // Put processed data back
        ctx.putImageData(imageData, 0, 0);

        // Convert to data URL
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Apply grayscale filter
 */
function grayscaleFilter(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // Alpha channel (i + 3) remains unchanged
  }
}

/**
 * Apply contrast filter
 */
function contrastFilter(data: Uint8ClampedArray, contrast: number): void {
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
  }
}

/**
 * Apply threshold filter (binary)
 */
function thresholdFilter(data: Uint8ClampedArray, threshold: number): void {
  const thresholdValue = threshold * 255;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const binary = gray > thresholdValue ? 255 : 0;
    
    data[i] = binary;     // Red
    data[i + 1] = binary; // Green
    data[i + 2] = binary; // Blue
  }
}

/**
 * Parse card information from OCR text
 */
export function parseCardInfo(ocrResult: OCRResult): {
  cardNumber?: string;
  expiryDate?: string;
  cardholderName?: string;
  suggestedCategory?: CardCategory;
  confidence: number;
  rawMatches: Record<string, string[]>;
} {
  const text = ocrResult.text;
  const rawMatches: Record<string, string[]> = {};

  // Extract card numbers
  const cardNumbers: string[] = [];
  CARD_PATTERNS.cardNumber.forEach(pattern => {
    const matches = text.match(pattern) || [];
    cardNumbers.push(...matches.map(m => m.replace(/[\s-]/g, '')));
  });
  rawMatches.cardNumber = [...new Set(cardNumbers)]; // Remove duplicates

  // Extract expiry dates
  const expiryDates: string[] = [];
  CARD_PATTERNS.expiryDate.forEach(pattern => {
    const matches = text.match(pattern) || [];
    expiryDates.push(...matches.map(formatExpiryDate));
  });
  rawMatches.expiryDate = [...new Set(expiryDates.filter(Boolean))];

  // Extract cardholder names
  const names: string[] = [];
  CARD_PATTERNS.cardholderName.forEach(pattern => {
    const matches = text.match(pattern) || [];
    names.push(...matches.map(m => m.trim()));
  });
  rawMatches.cardholderName = [...new Set(names)];

  // Select best matches
  const bestCardNumber = selectBestCardNumber(rawMatches.cardNumber);
  const bestExpiryDate = selectBestExpiryDate(rawMatches.expiryDate);
  const bestName = selectBestName(rawMatches.cardholderName);

  // Determine category
  const suggestedCategory = bestCardNumber ? detectCardCategory(bestCardNumber) : undefined;

  // Calculate confidence based on successful extractions
  let confidence = ocrResult.confidence || 0;
  if (bestCardNumber) confidence += 30;
  if (bestExpiryDate) confidence += 20;
  if (bestName) confidence += 10;
  confidence = Math.min(100, confidence);

  return {
    cardNumber: bestCardNumber,
    expiryDate: bestExpiryDate,
    cardholderName: bestName,
    suggestedCategory,
    confidence,
    rawMatches,
  };
}

/**
 * Select the most likely card number from candidates
 */
function selectBestCardNumber(candidates: string[]): string | undefined {
  if (candidates.length === 0) return undefined;

  // Sort by validity and length
  const scored = candidates
    .map(num => ({
      number: num,
      score: scoreCardNumber(num),
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].number : undefined;
}

/**
 * Score a card number candidate
 */
function scoreCardNumber(cardNumber: string): number {
  let score = 0;

  // Length check
  const length = cardNumber.length;
  if ([13, 14, 15, 16, 17, 18, 19].includes(length)) {
    score += 20;
  }

  // All digits check
  if (/^\d+$/.test(cardNumber)) {
    score += 20;
  }

  // Brand pattern check
  if (/^4/.test(cardNumber)) score += 10; // Visa
  else if (/^5[1-5]/.test(cardNumber)) score += 10; // Mastercard
  else if (/^3[47]/.test(cardNumber)) score += 10; // Amex
  else if (/^6/.test(cardNumber)) score += 10; // Discover

  // Basic Luhn check (simplified)
  if (isValidLuhn(cardNumber)) {
    score += 30;
  }

  return score;
}

/**
 * Simplified Luhn algorithm check
 */
function isValidLuhn(cardNumber: string): boolean {
  let sum = 0;
  let alternate = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

/**
 * Select the most likely expiry date
 */
function selectBestExpiryDate(candidates: string[]): string | undefined {
  if (candidates.length === 0) return undefined;

  // Filter valid dates and select the most recent
  const validDates = candidates
    .filter(isValidExpiryDate)
    .sort((a, b) => {
      const [aMonth, aYear] = a.split('/').map(Number);
      const [bMonth, bYear] = b.split('/').map(Number);
      return (bYear * 12 + bMonth) - (aYear * 12 + aMonth);
    });

  return validDates[0];
}

/**
 * Check if expiry date is valid and in the future
 */
function isValidExpiryDate(dateStr: string): boolean {
  const parts = dateStr.split('/');
  if (parts.length !== 2) return false;

  const month = parseInt(parts[0]);
  const year = parseInt(parts[1]);

  if (month < 1 || month > 12) return false;

  // Convert 2-digit year to 4-digit
  const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
  
  const expiryDate = new Date(fullYear, month - 1);
  const now = new Date();
  now.setDate(1); // Set to first of current month

  return expiryDate > now && fullYear <= new Date().getFullYear() + 20;
}

/**
 * Format expiry date consistently
 */
function formatExpiryDate(match: string): string {
  const cleaned = match.replace(/[\s/-]/g, '');
  
  // Try different patterns
  if (/^\d{4}$/.test(cleaned)) {
    // MMYY
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2);
  } else if (/^\d{6}$/.test(cleaned)) {
    // MMYYYY
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2);
  }
  
  // Return original if no pattern matches
  return match;
}

/**
 * Select the most likely cardholder name
 */
function selectBestName(candidates: string[]): string | undefined {
  if (candidates.length === 0) return undefined;

  // Score names by likelihood
  const scored = candidates
    .map(name => ({
      name: name.trim(),
      score: scoreName(name),
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].name : undefined;
}

/**
 * Score a name candidate
 */
function scoreName(name: string): number {
  let score = 0;

  // Basic validation
  if (name.length < 3 || name.length > 50) return 0;

  // Should have at least two words
  const words = name.split(/\s+/);
  if (words.length >= 2) score += 20;

  // Should be mostly letters
  const letterRatio = (name.match(/[A-Za-z]/g) || []).length / name.length;
  score += Math.round(letterRatio * 30);

  // Avoid common non-name patterns
  if (/\d/.test(name)) score -= 10; // Contains numbers
  if (name.includes('VALID')) score -= 20; // Common card text
  if (name.includes('MEMBER')) score -= 20; // Common card text
  if (name.length > 26) score -= 10; // Too long for typical name

  return Math.max(0, score);
}

/**
 * Validate OCR results and provide confidence metrics
 */
export function validateOCRResults(parsedInfo: ReturnType<typeof parseCardInfo>): {
  isReliable: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check overall confidence
  if (parsedInfo.confidence < 60) {
    warnings.push('Low OCR confidence - results may be inaccurate');
    suggestions.push('Try taking a clearer photo with better lighting');
  }

  // Validate card number
  if (parsedInfo.cardNumber) {
    if (!isValidLuhn(parsedInfo.cardNumber)) {
      warnings.push('Card number failed validation check');
      suggestions.push('Please verify the card number manually');
    }
  } else {
    suggestions.push('Card number not detected - you may need to enter it manually');
  }

  // Validate expiry date
  if (parsedInfo.expiryDate) {
    if (!isValidExpiryDate(parsedInfo.expiryDate)) {
      warnings.push('Expiry date appears invalid or expired');
      suggestions.push('Please verify the expiry date');
    }
  } else {
    suggestions.push('Expiry date not detected - check if it\'s clearly visible');
  }

  const isReliable = parsedInfo.confidence >= 70 && warnings.length === 0;

  return {
    isReliable,
    warnings,
    suggestions,
  };
}
