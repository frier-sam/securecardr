/**
 * Card Validation and Sanitization Utilities
 * Comprehensive validation and sanitization for card data
 */

import { Card, CardFormData, ValidationResult } from '../types';
import { CardCategory, detectCardCategory } from '../utils/cardCategories';

/**
 * Card number validation utilities
 */
export const CardNumberValidator = {
  /**
   * Luhn algorithm for card number validation
   */
  luhnCheck(cardNumber: string): boolean {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }

    let sum = 0;
    let alternate = false;
    
    // Process digits from right to left
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);
      
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
  },

  /**
   * Detect card brand from number
   */
  detectBrand(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Visa
    if (cleanNumber.match(/^4/)) {
      return 'Visa';
    }
    
    // Mastercard
    if (cleanNumber.match(/^5[1-5]/) || cleanNumber.match(/^2[2-7]/)) {
      return 'Mastercard';
    }
    
    // American Express
    if (cleanNumber.match(/^3[47]/)) {
      return 'American Express';
    }
    
    // Discover
    if (cleanNumber.match(/^6(?:011|5)/)) {
      return 'Discover';
    }
    
    // Diners Club
    if (cleanNumber.match(/^3[068]/)) {
      return 'Diners Club';
    }
    
    // JCB
    if (cleanNumber.match(/^35/)) {
      return 'JCB';
    }
    
    return 'Unknown';
  },

  /**
   * Get expected length for card brand
   */
  getExpectedLength(brand: string): number[] {
    switch (brand) {
      case 'American Express':
        return [15];
      case 'Diners Club':
        return [14];
      case 'Visa':
        return [13, 16, 19];
      case 'Mastercard':
      case 'Discover':
      case 'JCB':
        return [16];
      default:
        return [13, 14, 15, 16, 17, 18, 19];
    }
  },

  /**
   * Validate card number format and checksum
   */
  validate(cardNumber: string): { isValid: boolean; brand: string; errors: string[] } {
    const errors: string[] = [];
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (!cleanNumber) {
      return { isValid: false, brand: 'Unknown', errors: ['Card number is required'] };
    }
    
    // Length validation
    if (cleanNumber.length < 13) {
      errors.push('Card number is too short');
    } else if (cleanNumber.length > 19) {
      errors.push('Card number is too long');
    }
    
    const brand = this.detectBrand(cleanNumber);
    const expectedLengths = this.getExpectedLength(brand);
    
    if (!expectedLengths.includes(cleanNumber.length)) {
      errors.push(`Invalid length for ${brand} card`);
    }
    
    // Luhn validation
    if (!this.luhnCheck(cleanNumber)) {
      errors.push('Invalid card number (failed checksum)');
    }
    
    return {
      isValid: errors.length === 0,
      brand,
      errors,
    };
  },
};

/**
 * Date validation utilities
 */
export const DateValidator = {
  /**
   * Validate expiry date format and logic
   */
  validateExpiryDate(expiryDate: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!expiryDate) {
      return { isValid: true, errors: [] }; // Optional field
    }
    
    // Format validation
    const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;
    if (!expiryRegex.test(expiryDate)) {
      errors.push('Format must be MM/YY or MM/YYYY');
      return { isValid: false, errors };
    }
    
    const [month, year] = expiryDate.split('/');
    const monthNum = parseInt(month);
    let yearNum = parseInt(year);
    
    // Convert 2-digit year to 4-digit
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      yearNum = currentCentury + yearNum;
      
      // Handle year rollover (e.g., in 2024, "30" means 2030, not 1930)
      if (yearNum < currentYear - 10) {
        yearNum += 100;
      }
    }
    
    // Date validation
    const expiryDateObj = new Date(yearNum, monthNum - 1, 1);
    const currentDate = new Date();
    currentDate.setDate(1); // Set to first day of current month
    
    if (expiryDateObj < currentDate) {
      errors.push('Card appears to be expired');
    }
    
    // Future date validation (not more than 20 years from now)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 20);
    
    if (expiryDateObj > maxFutureDate) {
      errors.push('Expiry date seems too far in the future');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate issue date
   */
  validateIssueDate(issueDate: string, expiryDate?: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!issueDate) {
      return { isValid: true, errors: [] }; // Optional field
    }
    
    // Format validation
    const dateRegex = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;
    if (!dateRegex.test(issueDate)) {
      errors.push('Format must be MM/YY or MM/YYYY');
      return { isValid: false, errors };
    }
    
    const [month, year] = issueDate.split('/');
    let yearNum = parseInt(year);
    
    // Convert 2-digit year to 4-digit
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      yearNum = currentCentury + yearNum;
      
      // Handle historical dates (issue dates are usually in the past)
      if (yearNum > currentYear + 5) {
        yearNum -= 100;
      }
    }
    
    const issueDateObj = new Date(yearNum, parseInt(month) - 1, 1);
    const currentDate = new Date();
    
    // Issue date shouldn't be too far in the past (more than 20 years)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 20);
    
    if (issueDateObj < minDate) {
      errors.push('Issue date seems too old');
    }
    
    // Issue date shouldn't be in the future
    if (issueDateObj > currentDate) {
      errors.push('Issue date cannot be in the future');
    }
    
    // Issue date should be before expiry date
    if (expiryDate) {
      const expiryValidation = this.validateExpiryDate(expiryDate);
      if (expiryValidation.isValid) {
        const [expMonth, expYear] = expiryDate.split('/');
        let expYearNum = parseInt(expYear);
        if (expYear.length === 2) {
          const currentYear = new Date().getFullYear();
          const currentCentury = Math.floor(currentYear / 100) * 100;
          expYearNum = currentCentury + expYearNum;
          if (expYearNum < currentYear - 10) {
            expYearNum += 100;
          }
        }
        
        const expiryDateObj = new Date(expYearNum, parseInt(expMonth) - 1, 1);
        if (issueDateObj >= expiryDateObj) {
          errors.push('Issue date must be before expiry date');
        }
      }
    }
    
    return { isValid: errors.length === 0, errors };
  },
};

/**
 * Comprehensive card data validator
 */
export function validateCardData(data: CardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!data.nickname.trim()) {
    errors.nickname = 'Card nickname is required';
  } else if (data.nickname.length > 50) {
    errors.nickname = 'Nickname must be 50 characters or less';
  }
  
  // Card number validation - only strict for credit/debit cards
  if (data.number && data.number.trim()) {
    const cleanNumber = data.number.replace(/\D/g, '');
    
    // Only apply strict validation for credit/debit cards
    if (data.category === 'credit' || data.category === 'debit') {
      const cardValidation = CardNumberValidator.validate(data.number);
      if (!cardValidation.isValid) {
        errors.number = cardValidation.errors.join(', ');
      }
    } else {
      // For other card types, just basic length check
      if (cleanNumber.length > 50) {
        errors.number = 'Card number is too long';
      }
    }
  }
  
  // Required card number for credit/debit cards
  if ((data.category === 'credit' || data.category === 'debit') && (!data.number || !data.number.trim())) {
    errors.number = 'Card number is required for credit/debit cards';
  }
  
  // Expiry date validation
  if (data.expiryDate && data.expiryDate.trim()) {
    const expiryValidation = DateValidator.validateExpiryDate(data.expiryDate);
    if (!expiryValidation.isValid) {
      errors.expiryDate = expiryValidation.errors.join(', ');
    }
  }
  
  // Issue date validation
  if (data.issueDate && data.issueDate.trim()) {
    const issueValidation = DateValidator.validateIssueDate(data.issueDate, data.expiryDate);
    if (!issueValidation.isValid) {
      errors.issueDate = issueValidation.errors.join(', ');
    }
  }
  
  // Notes validation
  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must be 500 characters or less';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize card data before processing
 */
export function sanitizeCardData(data: CardFormData): CardFormData {
  return {
    category: data.category,
    nickname: data.nickname.trim().slice(0, 50),
    number: data.number ? data.number.replace(/\s+/g, ' ').trim() : '',
    expiryDate: data.expiryDate ? data.expiryDate.trim() : '',
    issueDate: data.issueDate ? data.issueDate.trim() : '',
    cvv: data.cvv ? data.cvv.trim() : '',
    cardholderName: data.cardholderName ? data.cardholderName.trim().slice(0, 100) : '',
    notes: data.notes ? data.notes.trim().slice(0, 500) : '',
    image: data.image,
  };
}

/**
 * Generate last 4 digits for display
 */
export function generateLast4(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  if (cleanNumber.length >= 4) {
    return cleanNumber.slice(-4);
  }
  return '';
}

/**
 * Mask card number for display
 */
export function maskCardNumber(cardNumber: string, showLast: number = 4): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  if (cleanNumber.length <= showLast) {
    return '*'.repeat(cleanNumber.length);
  }
  
  const maskedPart = '*'.repeat(cleanNumber.length - showLast);
  const visiblePart = cleanNumber.slice(-showLast);
  
  // Format with spaces for better readability
  const combined = maskedPart + visiblePart;
  return combined.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Format card number for display
 */
export function formatCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // American Express format: XXXX XXXXXX XXXXX
  if (cleanNumber.length === 15) {
    return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }
  
  // Diners Club format: XXXX XXXXXX XXXX
  if (cleanNumber.length === 14) {
    return cleanNumber.replace(/(\d{4})(\d{6})(\d{4})/, '$1 $2 $3');
  }
  
  // Standard format: XXXX XXXX XXXX XXXX
  return cleanNumber.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Validate and suggest card category
 */
export function validateAndSuggestCategory(data: CardFormData): {
  suggestedCategory?: CardCategory;
  confidence: number;
  reason: string;
} {
  let suggestedCategory: CardCategory | undefined;
  let confidence = 0;
  let reason = '';
  
  if (data.number && data.number.trim()) {
    const detectedCategory = detectCardCategory(data.number);
    const cardValidation = CardNumberValidator.validate(data.number);
    
    if (cardValidation.isValid) {
      suggestedCategory = detectedCategory;
      confidence = 0.9; // High confidence for valid card numbers
      reason = `Detected as ${cardValidation.brand} ${detectedCategory} card`;
    } else if (cardValidation.brand !== 'Unknown') {
      suggestedCategory = detectedCategory;
      confidence = 0.6; // Medium confidence for invalid but recognizable patterns
      reason = `Appears to be ${cardValidation.brand} ${detectedCategory} card (validation failed)`;
    }
  }
  
  // Keyword-based detection from nickname
  if (!suggestedCategory || confidence < 0.7) {
    const nickname = data.nickname.toLowerCase();
    
    if (nickname.includes('credit') || nickname.includes('visa') || nickname.includes('mastercard') || 
        nickname.includes('amex') || nickname.includes('discover')) {
      suggestedCategory = 'credit';
      confidence = Math.max(confidence, 0.7);
      reason = 'Based on card nickname keywords';
    } else if (nickname.includes('debit') || nickname.includes('bank')) {
      suggestedCategory = 'debit';
      confidence = Math.max(confidence, 0.7);
      reason = 'Based on card nickname keywords';
    } else if (nickname.includes('loyalty') || nickname.includes('reward') || nickname.includes('points')) {
      suggestedCategory = 'loyalty';
      confidence = Math.max(confidence, 0.7);
      reason = 'Based on card nickname keywords';
    } else if (nickname.includes('id') || nickname.includes('license') || nickname.includes('passport')) {
      suggestedCategory = 'id';
      confidence = Math.max(confidence, 0.7);
      reason = 'Based on card nickname keywords';
    }
  }
  
  return {
    suggestedCategory,
    confidence,
    reason,
  };
}

/**
 * Security validation for sensitive data
 */
export function validateSensitiveData(data: CardFormData): {
  hasPlaintextSensitiveData: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let hasPlaintextSensitiveData = false;
  
  // Check for CVV in notes or number
  const cvvPattern = /\b\d{3,4}\b/;
  if (data.notes && cvvPattern.test(data.notes)) {
    warnings.push('Potential CVV found in notes - consider removing for security');
    hasPlaintextSensitiveData = true;
  }
  
  // Check for PIN patterns
  const pinPattern = /\bpin\s*:?\s*\d{4,6}\b/i;
  if (data.notes && pinPattern.test(data.notes)) {
    warnings.push('Potential PIN found in notes - consider removing for security');
    hasPlaintextSensitiveData = true;
  }
  
  // Check for SSN patterns
  const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/;
  if (data.notes && ssnPattern.test(data.notes)) {
    warnings.push('Potential SSN found in notes - consider removing for security');
    hasPlaintextSensitiveData = true;
  }
  
  return {
    hasPlaintextSensitiveData,
    warnings,
  };
}

/**
 * Create a complete card object from form data
 */
export function createCardFromFormData(
  formData: CardFormData, 
  id?: string
): Omit<Card, 'imageUrl'> {
  const sanitized = sanitizeCardData(formData);
  const now = new Date();
  
  return {
    id: id || crypto.randomUUID(),
    category: sanitized.category,
    nickname: sanitized.nickname,
    number: sanitized.number || undefined,
    expiryDate: sanitized.expiryDate || undefined,
    issueDate: sanitized.issueDate || undefined,
    cvv: sanitized.cvv || undefined,
    cardholderName: sanitized.cardholderName || undefined,
    notes: sanitized.notes || undefined,
    last4: sanitized.number ? generateLast4(sanitized.number) : undefined,
    addedAt: now,
    updatedAt: now,
  };
}

/**
 * Update existing card with form data
 */
export function updateCardFromFormData(
  existingCard: Card, 
  formData: CardFormData
): Omit<Card, 'imageUrl'> {
  const sanitized = sanitizeCardData(formData);
  
  return {
    ...existingCard,
    category: sanitized.category,
    nickname: sanitized.nickname,
    number: sanitized.number || undefined,
    expiryDate: sanitized.expiryDate || undefined,
    issueDate: sanitized.issueDate || undefined,
    cvv: sanitized.cvv || undefined,
    cardholderName: sanitized.cardholderName || undefined,
    notes: sanitized.notes || undefined,
    last4: sanitized.number ? generateLast4(sanitized.number) : undefined,
    updatedAt: new Date(),
  };
}
