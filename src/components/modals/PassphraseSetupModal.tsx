/**
 * Passphrase Setup Modal
 * Handles initial passphrase creation with confirmation and security education
 */

import React, { useState, useCallback } from 'react';
import { PassphraseInput } from './PassphraseInput';
import { testCryptoAvailability } from '../../services/crypto';
import { Logo } from '../common/Logo';

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

  const steps = [
    { id: 'intro', label: 'Welcome', number: 1 },
    { id: 'create', label: 'Create', number: 2 },
    { id: 'confirm', label: 'Confirm', number: 3 },
    { id: 'final', label: 'Secure', number: 4 }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-surface rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-center mb-4">
            <Logo size={40} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary text-center">
            Set Up Your Vault Passphrase
          </h2>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-6">
            {steps.map((s, index) => (
              <React.Fragment key={s.id}>
                <div className={`flex items-center ${index > 0 ? 'ml-3' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    index <= currentStepIndex 
                      ? 'bg-primary text-white' 
                      : 'bg-slate-700 text-text-secondary'
                  }`}>
                    {index < currentStepIndex ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.number
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 transition-all ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Crypto Error */}
        {cryptoError && (
          <div className="p-6 bg-red-900/20 border-l-4 border-red-500">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-200">
                  Encryption Not Available
                </h3>
                <p className="text-sm text-red-300 mt-1">
                  {cryptoError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Intro Step */}
          {step === 'intro' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🔐</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Welcome to SecureCardr
                </h3>
                <p className="text-text-secondary">
                  Your passphrase is the only key to your encrypted vault. 
                  We use zero-knowledge encryption, meaning we never see or store your passphrase.
                </p>
              </div>

              <div className="bg-background rounded-lg p-4 space-y-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Client-Side Encryption</p>
                    <p className="text-xs text-text-secondary">Your data is encrypted in your browser</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Zero Knowledge</p>
                    <p className="text-xs text-text-secondary">We never see your passphrase or data</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Your Control</p>
                    <p className="text-xs text-text-secondary">Only you can decrypt your vault</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Step */}
          {step === 'create' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Create Your Passphrase
                </h3>
                <p className="text-sm text-text-secondary">
                  Choose a strong, memorable passphrase. This will be the only way to access your vault.
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

              <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-amber-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-200">Important</p>
                    <p className="text-xs text-amber-300 mt-1">
                      We cannot recover your passphrase. Make sure to remember it or store it securely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Confirm Your Passphrase
                </h3>
                <p className="text-sm text-text-secondary">
                  Please enter your passphrase again to confirm.
                </p>
              </div>

              <PassphraseInput
                value={confirmPassphrase}
                onChange={handleConfirmPassphraseChange}
                onValidationChange={setIsConfirmValid}
                placeholder="Confirm your passphrase"
                autoFocus
                showStrengthMeter={false}
                showGenerateButton={false}
              />

              {confirmPassphrase.length > 0 && !isConfirmValid && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-md">
                  <p className="text-sm text-red-200 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Passphrases don't match
                  </p>
                </div>
              )}

              {isConfirmValid && (
                <div className="p-3 bg-green-900/20 border border-green-800 rounded-md">
                  <p className="text-sm text-green-200 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Passphrases match
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Final Step */}
          {step === 'final' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🛡️</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Final Security Check
                </h3>
                <p className="text-sm text-text-secondary">
                  Please confirm you understand the following:
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 space-y-4">
                <div className="flex items-start">
                  <div className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 cursor-pointer transition-all ${
                    acceptedWarning ? 'bg-primary border-primary' : 'border-slate-600'
                  }`} onClick={() => setAcceptedWarning(!acceptedWarning)}>
                    {acceptedWarning && (
                      <svg className="w-3 h-3 text-white m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <label className="cursor-pointer flex-1" onClick={() => setAcceptedWarning(!acceptedWarning)}>
                    <p className="text-sm text-text-primary">I understand that:</p>
                    <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                      <li>• SecureCardr cannot recover my passphrase</li>
                      <li>• If I forget my passphrase, I will lose access to my vault</li>
                      <li>• I should store my passphrase securely</li>
                      <li>• My data is encrypted with zero-knowledge encryption</li>
                    </ul>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700">
          <div className="flex justify-between">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              disabled={cryptoError !== null}
            >
              Cancel
            </button>

            {step !== 'final' ? (
              <button
                onClick={handleNext}
                disabled={
                  cryptoError !== null ||
                  (step === 'create' && !isPassphraseValid) ||
                  (step === 'confirm' && !isConfirmValid)
                }
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!acceptedWarning || cryptoError !== null}
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Create Vault</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
