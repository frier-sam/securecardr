/**
 * Enhanced Card Entry Form Component
 * Now supports multiple images per card with drag & drop
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardFormData, CardImage, ValidationResult } from '../../types';
import { ImageGallery } from './ImageGallery';

interface CardFormProps {
  initialData?: Partial<Card>;
  onSubmit: (cardData: CardFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

const CARD_CATEGORIES = [
  { value: 'credit', label: 'Credit Card', icon: '💳' },
  { value: 'debit', label: 'Debit Card', icon: '💰' },
  { value: 'loyalty', label: 'Loyalty Card', icon: '🎁' },
  { value: 'id', label: 'ID Card', icon: '🆔' },
  { value: 'other', label: 'Other', icon: '📋' },
] as const;

export function CardForm({ initialData, onSubmit, onCancel, mode }: CardFormProps) {
  const [formData, setFormData] = useState<CardFormData>({
    category: initialData?.category || 'credit',
    nickname: initialData?.nickname || '',
    number: initialData?.number || '',
    expiryDate: initialData?.expiryDate || '',
    issueDate: initialData?.issueDate || '',
    notes: initialData?.notes || '',
    cardholderName: initialData?.cardholderName || '',
    cvv: initialData?.cvv || '',
    images: [], // Initialize as empty array
  });

  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: {},
  });

  const [showFullNumber, setShowFullNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [cardImages, setCardImages] = useState<CardImage[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Initialize images from existing card data
  useEffect(() => {
    if (initialData?.images) {
      setCardImages(initialData.images);
    } else if (initialData?.imageUrl) {
      // Handle backward compatibility
      const legacyImage: CardImage = {
        id: `legacy-${Date.now()}`,
        url: initialData.imageUrl,
        name: 'Card Image',
        size: 0,
        type: 'image/jpeg',
        addedAt: new Date(),
      };
      setCardImages([legacyImage]);
    }
  }, [initialData]);

  // Validate form data
  const validateForm = useCallback((data: CardFormData): ValidationResult => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!data.nickname.trim()) {
      errors.nickname = 'Card nickname is required';
    }

    // Card number validation - only strict for credit/debit cards
    if (data.number) {
      const cleanNumber = data.number.replace(/\s|-/g, '');
      
      // Only validate format for credit/debit cards
      if (data.category === 'credit' || data.category === 'debit') {
        if (cleanNumber && !/^\d{8,19}$/.test(cleanNumber)) {
          errors.number = 'Card number must be 8-19 digits';
        }
      } else {
        // For other card types, just check length
        if (cleanNumber.length > 50) {
          errors.number = 'Card number is too long';
        }
      }
    }
    
    // Required card number for credit/debit cards
    if ((data.category === 'credit' || data.category === 'debit') && !data.number?.trim()) {
      errors.number = 'Card number is required for credit/debit cards';
    }

    // Expiry date validation
    if (data.expiryDate) {
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2,4}$/;
      if (!expiryRegex.test(data.expiryDate)) {
        errors.expiryDate = 'Format: MM/YY or MM/YYYY';
      } else {
        // Check if date is in the future
        const [month, year] = data.expiryDate.split('/');
        const expiryYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
        const expiryDate = new Date(expiryYear, parseInt(month) - 1);
        const now = new Date();
        now.setDate(1); // Set to first day of current month
        
        if (expiryDate < now) {
          errors.expiryDate = 'Card appears to be expired';
        }
      }
    }

    // Issue date validation
    if (data.issueDate) {
      const issueDateRegex = /^(0[1-9]|1[0-2])\/\d{2,4}$/;
      if (!issueDateRegex.test(data.issueDate)) {
        errors.issueDate = 'Format: MM/YY or MM/YYYY';
      }
    }

    // CVV validation
    if (data.cvv && !/^\d{3,4}$/.test(data.cvv)) {
      errors.cvv = 'CVV must be 3-4 digits';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  // Update validation when form data changes
  useEffect(() => {
    const result = validateForm(formData);
    setValidation(result);
  }, [formData, validateForm]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagesAdd = useCallback((files: File[]) => {
    const newImages: CardImage[] = files.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      addedAt: new Date(),
    }));

    setCardImages(prev => [...prev, ...newImages]);
    setImageFiles(prev => [...prev, ...files]);
  }, []);

  const handleImageRemove = useCallback((imageId: string) => {
    setCardImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove?.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== imageId);
    });

    // Also remove from files if it's a new image
    setImageFiles(prev => {
      const imageIndex = cardImages.findIndex(img => img.id === imageId);
      if (imageIndex !== -1 && imageIndex < prev.length) {
        return prev.filter((_, index) => index !== imageIndex);
      }
      return prev;
    });
  }, [cardImages]);

  const handleImageView = useCallback((image: CardImage) => {
    // Image viewing is handled by the ImageGallery component
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid) return;

    setSubmitting(true);
    try {
      const submitData: CardFormData = {
        ...formData,
        images: imageFiles,
        // For backward compatibility, include the first image as 'image'
        image: imageFiles[0] || undefined,
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      cardImages.forEach(image => {
        if (image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [cardImages]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Selection */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-2">
          Card Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {CARD_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: cat.value as any }))}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.category === cat.value
                  ? 'border-primary bg-primary/10 text-text-primary'
                  : 'border-slate-600 hover:border-slate-500 text-text-secondary'
              }`}
            >
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="text-xs font-medium">{cat.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Card Nickname */}
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-text-secondary mb-2">
          Card Nickname <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="nickname"
          name="nickname"
          value={formData.nickname}
          onChange={handleChange}
          placeholder="e.g., My Rewards Card"
          className={`w-full px-4 py-3 bg-background border ${
            validation.errors.nickname ? 'border-red-500' : 'border-slate-600'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary`}
          required
        />
        {validation.errors.nickname && (
          <p className="mt-1 text-sm text-red-400">{validation.errors.nickname}</p>
        )}
      </div>

      {/* Card Number */}
      <div>
        <label htmlFor="number" className="block text-sm font-medium text-text-secondary mb-2">
          Card Number
        </label>
        <div className="relative">
          <input
            type={showFullNumber ? 'text' : 'password'}
            id="number"
            name="number"
            value={formData.number}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            className={`w-full px-4 py-3 pr-12 bg-background border ${
              validation.errors.number ? 'border-red-500' : 'border-slate-600'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary font-mono`}
          />
          <button
            type="button"
            onClick={() => setShowFullNumber(!showFullNumber)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {showFullNumber ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {validation.errors.number && (
          <p className="mt-1 text-sm text-red-400">{validation.errors.number}</p>
        )}
      </div>

      {/* Cardholder Name */}
      <div>
        <label htmlFor="cardholderName" className="block text-sm font-medium text-text-secondary mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          id="cardholderName"
          name="cardholderName"
          value={formData.cardholderName || ''}
          onChange={handleChange}
          placeholder="John Doe"
          className="w-full px-4 py-3 bg-background border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary"
        />
      </div>

      {/* Expiry Date and CVV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-text-secondary mb-2">
            Expiry Date
          </label>
          <input
            type="text"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            placeholder="MM/YY"
            className={`w-full px-4 py-3 bg-background border ${
              validation.errors.expiryDate ? 'border-red-500' : 'border-slate-600'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary`}
          />
          {validation.errors.expiryDate && (
            <p className="mt-1 text-sm text-red-400">{validation.errors.expiryDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-text-secondary mb-2">
            CVV
          </label>
          <div className="relative">
            <input
              type={showCVV ? 'text' : 'password'}
              id="cvv"
              name="cvv"
              value={formData.cvv || ''}
              onChange={handleChange}
              placeholder="123"
              maxLength={4}
              className={`w-full px-4 py-3 pr-12 bg-background border ${
                validation.errors.cvv ? 'border-red-500' : 'border-slate-600'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary`}
            />
            <button
              type="button"
              onClick={() => setShowCVV(!showCVV)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            >
              {showCVV ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {validation.errors.cvv && (
            <p className="mt-1 text-sm text-red-400">{validation.errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Issue Date (optional) */}
      <div>
        <label htmlFor="issueDate" className="block text-sm font-medium text-text-secondary mb-2">
          Issue Date (Optional)
        </label>
        <input
          type="text"
          id="issueDate"
          name="issueDate"
          value={formData.issueDate}
          onChange={handleChange}
          placeholder="MM/YY"
          className={`w-full px-4 py-3 bg-background border ${
            validation.errors.issueDate ? 'border-red-500' : 'border-slate-600'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary`}
        />
        {validation.errors.issueDate && (
          <p className="mt-1 text-sm text-red-400">{validation.errors.issueDate}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-2">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any additional information..."
          className="w-full px-4 py-3 bg-background border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary resize-none"
        />
      </div>

      {/* Enhanced Image Gallery */}
      <ImageGallery
        images={cardImages}
        onImageAdd={handleImagesAdd}
        onImageRemove={handleImageRemove}
        onImageView={handleImageView}
        maxImages={5}
        allowMultiple={true}
        readOnly={false}
      />

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 sm:flex-initial px-6 py-3 text-text-secondary hover:text-text-primary transition-colors font-medium"
          disabled={submitting}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={!validation.isValid || submitting}
          className="flex-1 sm:flex-initial px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
              </svg>
              <span>{mode === 'create' ? 'Add Card' : 'Update Card'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
