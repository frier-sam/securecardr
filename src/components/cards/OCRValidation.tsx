
import React, { useState, useCallback, useEffect } from 'react';
import { parseCardInfo, validateOCRResults } from '../../services/ocr';
import { OCRResult, CardFormData } from '../../types';
import { CardCategory } from '../../utils/cardCategories';
import { CategoryBadge, CategorySelector } from './CardCategoryComponents';
import { validateCardData } from '../../utils/cardValidation';

interface OCRValidationProps {
  ocrResult: OCRResult;
  originalImage: File;
  onAccept: (correctedData: Partial<CardFormData>) => void;
  onReject: () => void;
  onRetry: () => void;
  className?: string;
}

type ValidationStatus = 'pending' | 'validating' | 'complete';

export function OCRValidation({
  ocrResult,
  originalImage,
  onAccept,
  onReject,
  onRetry,
  className = '',
}: OCRValidationProps) {
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('pending');
  const [parsedInfo, setParsedInfo] = useState<ReturnType<typeof parseCardInfo> | null>(null);
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateOCRResults> | null>(null);
  
  // Editable fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [nickname, setNickname] = useState('');
  const [category, setCategory] = useState<CardCategory>('credit');
  const [notes, setNotes] = useState('');
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string>('');

  // Generate image preview
  useEffect(() => {
    const url = URL.createObjectURL(originalImage);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [originalImage]);

  // Parse OCR results on mount
  useEffect(() => {
    setValidationStatus('validating');
    
    try {
      const parsed = parseCardInfo(ocrResult);
      const validation = validateOCRResults(parsed);
      
      setParsedInfo(parsed);
      setValidationResult(validation);
      
      // Pre-fill form fields
      setCardNumber(parsed.cardNumber || '');
      setExpiryDate(parsed.expiryDate || '');
      setCardholderName(parsed.cardholderName || '');
      setCategory(parsed.suggestedCategory || 'credit');
      
      // Generate nickname from cardholder name or category
      if (parsed.cardholderName) {
        setNickname(`${parsed.cardholderName}'s Card`);
      } else {
        const categoryInfo = {
          credit: 'Credit Card',
          debit: 'Debit Card',
          loyalty: 'Loyalty Card',
          id: 'ID Card',
          other: 'Card',
        };
        setNickname(`My ${categoryInfo[parsed.suggestedCategory || 'credit']}`);
      }
      
      setValidationStatus('complete');
    } catch (error) {
      console.error('OCR parsing failed:', error);
      setValidationStatus('complete');
    }
  }, [ocrResult]);

  // Validate form fields
  const validateFields = useCallback(() => {
    const formData: CardFormData = {
      category,
      nickname,
      number: cardNumber,
      expiryDate,
      notes,
      issueDate: '',
    };
    
    const validation = validateCardData(formData);
    setFieldErrors(validation.errors);
    return validation.isValid;
  }, [category, nickname, cardNumber, expiryDate, notes]);

  const handleAccept = useCallback(() => {
    if (!validateFields()) {
      return;
    }
    
    const correctedData: Partial<CardFormData> = {
      category,
      nickname,
      number: cardNumber || undefined,
      expiryDate: expiryDate || undefined,
      notes: notes || undefined,
      image: originalImage,
    };
    
    onAccept(correctedData);
  }, [category, nickname, cardNumber, expiryDate, notes, originalImage, onAccept, validateFields]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    switch (field) {
      case 'cardNumber':
        setCardNumber(value);
        break;
      case 'expiryDate':
        setExpiryDate(value);
        break;
      case 'cardholderName':
        setCardholderName(value);
        break;
      case 'nickname':
        setNickname(value);
        break;
      case 'notes':
        setNotes(value);
        break;
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [fieldErrors]);

  if (validationStatus === 'validating') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto p-8 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-900 dark:text-white">Processing OCR Results...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Review OCR Results
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Verify and correct the extracted information below
            </p>
          </div>
          
          {parsedInfo && (
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Confidence</div>
              <div className={`text-lg font-semibold ${
                parsedInfo.confidence >= 80 ? 'text-green-600 dark:text-green-400' :
                parsedInfo.confidence >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {parsedInfo.confidence}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Alerts */}
      {validationResult && (
        <div className="p-6 space-y-4">
          {!validationResult.isReliable && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                    Low Confidence Results
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Please carefully review and correct the extracted information below.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {validationResult.warnings.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="text-red-800 dark:text-red-200 font-medium mb-2">Validation Issues Found</p>
                  <ul className="text-red-700 dark:text-red-300 space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Original Image */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Original Image</h4>
            <div className="relative">
              <img
                src={imagePreview}
                alt="Original card image"
                className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <div className="absolute top-2 right-2">
                <button
                  onClick={onRetry}
                  className="px-3 py-1 bg-black/50 text-white text-sm rounded-md hover:bg-black/70 transition-colors"
                >
                  Retake Photo
                </button>
              </div>
            </div>
            
            {/* Raw OCR Text */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Raw OCR Text</h5>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
                  {ocrResult.text || 'No text detected'}
                </pre>
              </div>
            </div>
          </div>

          {/* Extracted Information Form */}
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 dark:text-white">Extracted Information</h4>
            
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Card Type
              </label>
              <CategorySelector
                selectedCategory={category}
                onCategorySelect={setCategory}
                layout="list"
                className="space-y-2"
              />
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Card Nickname *
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleFieldChange('nickname', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  fieldErrors.nickname ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white`}
                placeholder="e.g., My Credit Card"
              />
              {fieldErrors.nickname && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.nickname}</p>
              )}
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Card Number
                {parsedInfo?.cardNumber && (
                  <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    Detected
                  </span>
                )}
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => handleFieldChange('cardNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                  fieldErrors.number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white`}
                placeholder="1234 5678 9012 3456"
              />
              {fieldErrors.number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.number}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date
                {parsedInfo?.expiryDate && (
                  <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    Detected
                  </span>
                )}
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                  fieldErrors.expiryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white`}
                placeholder="MM/YY"
              />
              {fieldErrors.expiryDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.expiryDate}</p>
              )}
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cardholder Name
                {parsedInfo?.cardholderName && (
                  <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    Detected
                  </span>
                )}
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => handleFieldChange('cardholderName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                placeholder="John Doe"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white resize-vertical"
                placeholder="Additional notes about this card..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <div className="flex space-x-3">
          <button
            onClick={onReject}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Start Over
          </button>
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Retake Photo
          </button>
        </div>
        
        <button
          onClick={handleAccept}
          className="px-6 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Accept & Save Card</span>
        </button>
      </div>
    </div>
  );
}