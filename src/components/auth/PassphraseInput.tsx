/**
 * Passphrase Input Component
 * Secure passphrase entry with strength validation and visual feedback
 */

import React, { useState, useCallback, useEffect } from 'react';
import { validatePassphraseStrength, generateSecurePassphrase } from '../../services/crypto';

interface PassphraseInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showStrengthMeter?: boolean;
  showGenerateButton?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PassphraseInput({
  value,
  onChange,
  onValidationChange,
  placeholder = "Enter your passphrase",
  autoFocus = false,
  showStrengthMeter = true,
  showGenerateButton = true,
  disabled = false,
  className = "",
}: PassphraseInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    score: number;
    feedback: string[];
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Validate passphrase whenever it changes
  useEffect(() => {
    if (value) {
      const result = validatePassphraseStrength(value);
      setValidation(result);
      onValidationChange(result.isValid);
    } else {
      setValidation(null);
      onValidationChange(false);
    }
  }, [value, onValidationChange]);

  const handleGeneratePassphrase = useCallback(async () => {
    try {
      setIsGenerating(true);
      const generated = await generateSecurePassphrase(6);
      onChange(generated);
    } catch (error) {
      console.error('Failed to generate passphrase:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [onChange]);

  const getStrengthColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrengthText = (score: number): string => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Weak';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`
            w-full px-4 py-3 pr-12 border rounded-lg font-mono text-sm
            transition-colors duration-200
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${validation?.isValid === false && value ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'}
            focus:outline-none focus:ring-2 focus:ring-primary-200
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            dark:focus:border-primary-400 dark:focus:ring-primary-900
          `}
        />
        
        {/* Toggle Visibility Button */}
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={isVisible ? 'Hide passphrase' : 'Show passphrase'}
        >
          {isVisible ? (
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Generate Button */}
      {showGenerateButton && (
        <button
          type="button"
          onClick={handleGeneratePassphrase}
          disabled={disabled || isGenerating}
          className="w-full px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Generating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Generate Secure Passphrase</span>
            </div>
          )}
        </button>
      )}

      {/* Strength Meter */}
      {showStrengthMeter && validation && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Strength:</span>
            <span className={`font-medium ${
              validation.score >= 80 ? 'text-green-600 dark:text-green-400' :
              validation.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
              validation.score >= 40 ? 'text-orange-600 dark:text-orange-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {getStrengthText(validation.score)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.score)}`}
              style={{ width: `${validation.score}%` }}
            />
          </div>
          
          {/* Feedback */}
          {validation.feedback.length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {validation.feedback.map((feedback, index) => (
                <div key={index} className="flex items-start space-x-1">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{feedback}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
