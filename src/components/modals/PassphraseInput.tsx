/**
 * PassphraseInput Component
 * Secure passphrase input with validation, strength meter, and generation
 */

import React, { useState, useCallback, useEffect } from 'react';

interface PassphraseInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showStrengthMeter?: boolean;
  showGenerateButton?: boolean;
  className?: string;
}

interface PassphraseStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  label: string;
  color: string;
  feedback: string[];
}

export function PassphraseInput({
  value,
  onChange,
  onValidationChange,
  placeholder = 'Enter passphrase',
  autoFocus = false,
  showStrengthMeter = false,
  showGenerateButton = false,
  className = '',
}: PassphraseInputProps) {
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [strength, setStrength] = useState<PassphraseStrength>({
    score: 0,
    label: 'Very Weak',
    color: 'bg-red-500',
    feedback: [],
  });

  /**
   * Validate passphrase strength and requirements
   */
  const validatePassphrase = useCallback((passphrase: string): PassphraseStrength => {
    const feedback: string[] = [];
    let score = 0;
    
    // Length requirements
    if (passphrase.length < 8) {
      feedback.push('Use at least 8 characters');
    } else if (passphrase.length < 12) {
      feedback.push('Consider using 12+ characters for better security');
      score += 1;
    } else {
      score += 2;
    }

    // Character type requirements
    const hasLower = /[a-z]/.test(passphrase);
    const hasUpper = /[A-Z]/.test(passphrase);
    const hasNumber = /\d/.test(passphrase);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase);
    
    const charTypes = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    
    if (charTypes < 2) {
      feedback.push('Use a mix of letters, numbers, and symbols');
    } else if (charTypes < 3) {
      feedback.push('Add more character types for better security');
      score += 1;
    } else {
      score += 2;
    }

    // Pattern checks
    if (passphrase.length >= 8) {
      // Check for common patterns
      if (/(.)\1{2,}/.test(passphrase)) {
        feedback.push('Avoid repeated characters');
        score = Math.max(0, score - 1);
      }
      
      if (/123|abc|qwe|password|admin/i.test(passphrase)) {
        feedback.push('Avoid common patterns and words');
        score = Math.max(0, score - 1);
      }
      
      // Bonus for length
      if (passphrase.length >= 16) {
        score += 1;
      }
    }

    // Determine label and color
    let label: string;
    let color: string;
    
    if (score === 0) {
      label = 'Very Weak';
      color = 'bg-red-500';
    } else if (score === 1) {
      label = 'Weak';
      color = 'bg-red-400';
    } else if (score === 2) {
      label = 'Fair';
      color = 'bg-yellow-500';
    } else if (score === 3) {
      label = 'Good';
      color = 'bg-green-500';
    } else {
      label = 'Strong';
      color = 'bg-green-600';
    }

    return { score, label, color, feedback };
  }, []);

  /**
   * Generate a secure passphrase
   */
  const generatePassphrase = useCallback(() => {
    const words = [
      'anchor', 'balloon', 'castle', 'dolphin', 'elephant', 'forest', 'garden', 'hammer',
      'island', 'jungle', 'kitten', 'ladder', 'mountain', 'notebook', 'ocean', 'pencil',
      'quartz', 'rainbow', 'sunset', 'treasure', 'umbrella', 'village', 'window', 'xylophone',
      'yellow', 'zigzag', 'apple', 'bridge', 'candle', 'dragon', 'engine', 'flower',
      'guitar', 'house', 'ice', 'jazz', 'kite', 'lemon', 'moon', 'nest',
      'orange', 'piano', 'quiet', 'rocket', 'star', 'tiger', 'universe', 'volcano',
      'water', 'x-ray', 'yoga', 'zebra', 'art', 'book', 'cloud', 'dream',
      'earth', 'fire', 'glass', 'heart', 'idea', 'journey', 'key', 'light'
    ];
    
    const symbols = '!@#$%^&*';
    const numbers = '0123456789';
    
    // Generate 4 random words
    const selectedWords = [];
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      selectedWords.push(words[randomIndex]);
    }
    
    // Capitalize first letter of each word
    const capitalizedWords = selectedWords.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    
    // Add random numbers and symbols
    const randomNumber = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    const passphrase = capitalizedWords.join('') + randomNumber + randomSymbol;
    onChange(passphrase);
  }, [onChange]);

  /**
   * Handle input changes
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  }, [onChange]);

  /**
   * Update strength and validation when value changes
   */
  useEffect(() => {
    const newStrength = validatePassphrase(value);
    setStrength(newStrength);
    
    // Consider valid if score >= 2 and length >= 12
    const isValid = newStrength.score >= 2 && value.length >= 12;
    onValidationChange(isValid);
  }, [value, validatePassphrase, onValidationChange]);

  /**
   * Toggle passphrase visibility
   */
  const toggleVisibility = useCallback(() => {
    setShowPassphrase(prev => !prev);
  }, []);

  /**
   * Clear the input
   */
  const clearInput = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Input */}
      <div className="relative">
        <input
          type={showPassphrase ? 'text' : 'password'}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          autoComplete="new-password"
          spellCheck={false}
        />
        
        {/* Control Buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {value && (
            <button
              type="button"
              onClick={clearInput}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <button
            type="button"
            onClick={toggleVisibility}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
          >
            {showPassphrase ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Generate Button */}
      {showGenerateButton && (
        <button
          type="button"
          onClick={generatePassphrase}
          className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Generate Secure Passphrase
        </button>
      )}

      {/* Strength Meter */}
      {showStrengthMeter && value && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Strength: {strength.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {value.length} characters
            </span>
          </div>
          
          {/* Strength Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${Math.max(10, (strength.score + 1) * 20)}%` }}
            />
          </div>
          
          {/* Feedback */}
          {strength.feedback.length > 0 && (
            <div className="space-y-1">
              {strength.feedback.map((feedback, index) => (
                <div key={index} className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                  <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {feedback}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security Tips */}
      {showStrengthMeter && !value && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Tips for a strong passphrase:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Use at least 12 characters</li>
            <li>Mix uppercase, lowercase, numbers, and symbols</li>
            <li>Avoid common words and patterns</li>
            <li>Consider using a memorable phrase</li>
          </ul>
        </div>
      )}
    </div>
  );
}
