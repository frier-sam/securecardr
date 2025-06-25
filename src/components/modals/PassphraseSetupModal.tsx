/**
 * Passphrase Setup Modal
 * Handles initial passphrase creation with confirmation and security education
 */

import React, { useState, useCallback } from 'react';
import { PassphraseInput } from './PassphraseInput';
import { testCryptoAvailability } from '../../services/crypto';

interface PassphraseSetupModalProps {
  isOpen: boolean;
  onComplete: (passphrase: string) => void;
  onCancel: () => void;
}

export function PassphraseSetupModal({ isOpen, onComplete, onCancel }: PassphraseSetupModalProps) {
  const [step, setStep] = useState<'intro' | 'create' | 'confirm' | 'final'>('intro');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [isPassphraseValid, setIsPassphraseValid] = useState(false);
  const [isConfirmValid, setIsConfirmValid] = useState(false);
  const [acceptedWarning, setAcceptedWarning] = useState(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);

  // Check crypto availability on component mount
  React.useEffect(() => {
    if (isOpen) {
      testCryptoAvailability().then(result => {
        if (!result.available) {
          setCryptoError(result.error || 'Encryption not available');
        }
      });
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (step === 'intro') {
      setStep('create');
    } else if (step === 'create' && isPassphraseValid) {
      setStep('confirm');
    } else if (step === 'confirm' && isConfirmValid && passphrase === confirmPassphrase) {
      setStep('final');
    }
  }, [step, isPassphraseValid, isConfirmValid, passphrase, confirmPassphrase]);

  const handleComplete = useCallback(() => {
    if (acceptedWarning && passphrase === confirmPassphrase) {
      onComplete(passphrase);
      // Clear sensitive data
      setPassphrase('');
      setConfirmPassphrase('');
    }
  }, [acceptedWarning, passphrase, confirmPassphrase, onComplete]);

  const handleCancel = useCallback(() => {
    // Clear sensitive data
    setPassphrase('');
    setConfirmPassphrase('');
    setStep('intro');
    setAcceptedWarning(false);
    onCancel();
  }, [onCancel]);

  const handleConfirmPassphraseChange = useCallback((value: string) => {
    setConfirmPassphrase(value);
    setIsConfirmValid(value.length > 0 && value === passphrase);
  }, [passphrase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Set Up Your Passphrase
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Step {step === 'intro' ? 1 : step === 'create' ? 2 : step === 'confirm' ? 3 : 4} of 4
          </p>
        </div>

        {/* Crypto Error */}
        {cryptoError && (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <div className="flex">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Encryption Not Available
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {cryptoError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {step === 'intro' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Secure Your Cards
                </h3>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Your passphrase is the <strong>only way</strong> to decrypt your cards. 
                  It's never stored on our servers or in your browser.
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Important: If you forget your passphrase, your data cannot be recovered.
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        Store it safely - consider using a password manager.
                      </p>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Use at least 12 characters</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Mix letters, numbers, and symbols</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Consider a memorable phrase</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 'create' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Create Your Passphrase
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose a strong passphrase that you'll remember. We can generate one for you if needed.
                </p>
              </div>
              
              <PassphraseInput
                value={passphrase}
                onChange={setPassphrase}
                onValidationChange={setIsPassphraseValid}
                placeholder="Enter your passphrase"
                autoFocus
                showStrengthMeter
                showGenerateButton
              />
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Confirm Your Passphrase
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Enter your passphrase again to confirm it's correct.
                </p>
              </div>
              
              <PassphraseInput
                value={confirmPassphrase}
                onChange={handleConfirmPassphraseChange}
                onValidationChange={() => {}} // Validation handled in parent
                placeholder="Confirm your passphrase"
                autoFocus
                showStrengthMeter={false}
                showGenerateButton={false}
              />
              
              {confirmPassphrase && passphrase !== confirmPassphrase && (
                <div className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Passphrases do not match
                </div>
              )}
            </div>
          )}

          {step === 'final' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ready to Secure Your Cards
                </h3>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-red-800 dark:text-red-200 mb-2">
                      Final Warning: Data Recovery is Impossible
                    </p>
                    <p className="text-red-700 dark:text-red-300 mb-3">
                      If you lose your passphrase, there is absolutely no way to recover your encrypted cards. 
                      Make sure you have safely stored your passphrase.
                    </p>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={acceptedWarning}
                        onChange={(e) => setAcceptedWarning(e.target.checked)}
                        className="mt-1 mr-2"
                      />
                      <span className="text-red-700 dark:text-red-300">
                        I understand and accept that my data cannot be recovered if I lose my passphrase
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          
          <div className="space-x-3">
            {step !== 'intro' && step !== 'final' && (
              <button
                onClick={() => setStep(step === 'confirm' ? 'create' : 'intro')}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            )}
            
            {step === 'final' ? (
              <button
                onClick={handleComplete}
                disabled={!acceptedWarning || cryptoError !== null}
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
              >
                Complete Setup
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={
                  (step === 'create' && !isPassphraseValid) ||
                  (step === 'confirm' && (!isConfirmValid || passphrase !== confirmPassphrase)) ||
                  cryptoError !== null
                }
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
              >
                {step === 'intro' ? 'Get Started' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
