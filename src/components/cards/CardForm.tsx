/**
 * Card Entry Form Component
 * Manual form for adding and editing card information
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardFormData, ValidationResult } from '../../types';
import { ImageWorkflow } from './ImageWorkflow';

interface CardFormProps {
  initialData?: Partial<Card>;
  onSubmit: (cardData: CardFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const CARD_CATEGORIES = [
  { value: 'credit', label: 'Credit Card', icon: '💳' },
  { value: 'debit', label: 'Debit Card', icon: '💰' },
  { value: 'loyalty', label: 'Loyalty Card', icon: '🏆' },
  { value: 'id', label: 'ID Card', icon: '🆔' },
  { value: 'other', label: 'Other', icon: '📄' },
] as const;

export function CardForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: CardFormProps) {
  const [formData, setFormData] = useState<CardFormData>({
    category: initialData?.category || 'credit',
    nickname: initialData?.nickname || '',
    number: initialData?.number || '',
    expiryDate: initialData?.expiryDate || '',
    issueDate: initialData?.issueDate || '',
    notes: initialData?.notes || '',
  });

  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: {},
  });

  const [showFullNumber, setShowFullNumber] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate form data
  const validateForm = useCallback((data: CardFormData): ValidationResult => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!data.nickname.trim()) {
      errors.nickname = 'Card nickname is required';
    }

    // Card number validation (basic)
    if (data.number) {
      const cleanNumber = data.number.replace(/\s|-/g, '');
      if (cleanNumber && !/^\d{8,19}$/.test(cleanNumber)) {
        errors.number = 'Card number must be 8-19 digits';
      }
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

  const handleInputChange = useCallback((field: keyof CardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCardNumberChange = useCallback((value: string) => {
    // Format card number with spaces
    const cleanValue = value.replace(/\D/g, '');
    const formattedValue = cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    handleInputChange('number', formattedValue);
  }, [handleInputChange]);

  const handleExpiryDateChange = useCallback((value: string) => {
    // Auto-format expiry date
    let cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
      cleanValue = cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 6);
    }
    handleInputChange('expiryDate', cleanValue);
  }, [handleInputChange]);

  const handleImageWorkflowComplete = useCallback((cardData: Partial<CardFormData>) => {
    // Auto-fill form with OCR results
    if (cardData.category) {
      handleInputChange('category', cardData.category);
    }
    if (cardData.nickname) {
      handleInputChange('nickname', cardData.nickname);
    }
    if (cardData.number) {
      handleInputChange('number', cardData.number);
    }
    if (cardData.expiryDate) {
      handleInputChange('expiryDate', cardData.expiryDate);
    }
    if (cardData.notes) {
      handleInputChange('notes', cardData.notes);
    }
    
    // Set the image
    if (cardData.image) {
      setImageFile(cardData.image);
      const url = URL.createObjectURL(cardData.image);
      setImagePreview(url);
    }
    
    setImageModalOpen(false);
  }, [handleInputChange]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file must be smaller than 10MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validation.isValid || isLoading) {
      return;
    }

    try {
      const submitData: CardFormData = {
        ...formData,
        image: imageFile || undefined,
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Failed to submit card:', error);
    }
  }, [formData, imageFile, validation.isValid, isLoading, onSubmit]);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
            Card Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CARD_CATEGORIES.map(category => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleInputChange('category', category.value)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-sm
                  ${formData.category === category.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
              >
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="font-medium">{category.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nickname */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Card Nickname *
            </label>
            <input
              id="nickname"
              type="text"
              value={formData.nickname}
              onChange={(e) => handleInputChange('nickname', e.target.value)}
              placeholder="e.g., My Visa Card"
              className={`
                w-full px-3 py-2 border rounded-md text-sm
                ${validation.errors.nickname ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                dark:bg-gray-800 dark:text-white
              `}
            />
            {validation.errors.nickname && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validation.errors.nickname}
              </p>
            )}
          </div>

          {/* Category-specific field */}
          {formData.category === 'credit' || formData.category === 'debit' ? (
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Card Number
              </label>
              <div className="relative">
                <input
                  id="number"
                  type={showFullNumber ? 'text' : 'password'}
                  value={formData.number}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className={`
                    w-full px-3 py-2 pr-10 border rounded-md text-sm font-mono
                    ${validation.errors.number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    dark:bg-gray-800 dark:text-white
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowFullNumber(!showFullNumber)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showFullNumber ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validation.errors.number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validation.errors.number}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                ID/Reference Number
              </label>
              <input
                id="number"
                type="text"
                value={formData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                placeholder="Enter ID or reference number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Expiry Date
            </label>
            <input
              id="expiryDate"
              type="text"
              value={formData.expiryDate}
              onChange={(e) => handleExpiryDateChange(e.target.value)}
              placeholder="MM/YY"
              maxLength={7}
              className={`
                w-full px-3 py-2 border rounded-md text-sm font-mono
                ${validation.errors.expiryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                dark:bg-gray-800 dark:text-white
              `}
            />
            {validation.errors.expiryDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validation.errors.expiryDate}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="issueDate" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Issue Date
            </label>
            <input
              id="issueDate"
              type="text"
              value={formData.issueDate}
              onChange={(e) => handleExpiryDateChange(e.target.value)}
              placeholder="MM/YY"
              maxLength={7}
              className={`
                w-full px-3 py-2 border rounded-md text-sm font-mono
                ${validation.errors.issueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                dark:bg-gray-800 dark:text-white
              `}
            />
            {validation.errors.issueDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validation.errors.issueDate}
              </p>
            )}
          </div>
        </div>

        {/* Image Upload with Smart Workflow */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Card Photo (Optional)
          </label>
          
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Card preview"
                className="w-48 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Add Card Photo
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Take a photo or upload an image. We'll automatically extract card details!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setImageModalOpen(true)}
                    className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Smart Capture</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload File</span>
                  </button>
                </div>
                
                <p className="text-xs text-gray-400">
                  Supported: JPEG, PNG, WebP • Max: 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes about this card..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white resize-vertical"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!validation.isValid || isLoading}
            className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{mode === 'create' ? 'Add Card' : 'Update Card'}</span>
          </button>
        </div>
      </form>

      {/* Hidden file input for simple upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Image Workflow Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <ImageWorkflow
            onComplete={handleImageWorkflowComplete}
            onCancel={() => setImageModalOpen(false)}
          />
        </div>
      )}
    </>
  );
}
