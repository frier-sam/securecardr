/**
 * Encryption Demo Component
 * Interactive demonstration of the encryption process for user education
 */

import React, { useState, useCallback, useEffect } from 'react';
import { encrypt, decrypt, decryptString, validatePassphraseStrength } from '../../services/crypto';

interface EncryptionDemoProps {
  onComplete?: () => void;
  className?: string;
}

const DEMO_DATA = {
  sampleCard: {
    nickname: "Demo Credit Card",
    number: "4532-1234-5678-9000",
    expiry: "12/2025",
    cvv: "123"
  },
  sampleText: "This is your sensitive card information that will be encrypted client-side before being stored in your Google Drive."
};

type DemoStep = 'intro' | 'passphrase' | 'encrypting' | 'encrypted' | 'decrypting' | 'complete';

export function EncryptionDemo({ onComplete, className = "" }: EncryptionDemoProps) {
  const [currentStep, setCurrentStep] = useState<DemoStep>('intro');
  const [demoPassphrase, setDemoPassphrase] = useState('');
  const [encryptedResult, setEncryptedResult] = useState<any>(null);
  const [decryptedResult, setDecryptedResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate a demo passphrase
  useEffect(() => {
    if (currentStep === 'passphrase' && !demoPassphrase) {
      setDemoPassphrase('SecureCardr-Demo-2024!');
    }
  }, [currentStep, demoPassphrase]);

  const handleEncrypt = useCallback(async () => {
    if (!demoPassphrase) return;

    setIsProcessing(true);
    setError(null);
    setCurrentStep('encrypting');

    try {
      // Simulate processing time for educational effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Encrypt the demo data
      const encrypted = await encrypt(JSON.stringify(DEMO_DATA.sampleCard), demoPassphrase);
      setEncryptedResult(encrypted);
      setCurrentStep('encrypted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption failed');
      setCurrentStep('passphrase');
    } finally {
      setIsProcessing(false);
    }
  }, [demoPassphrase]);

  const handleDecrypt = useCallback(async () => {
    if (!encryptedResult || !demoPassphrase) return;

    setIsProcessing(true);
    setError(null);
    setCurrentStep('decrypting');

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Decrypt the data
      const decrypted = await decryptString(encryptedResult, demoPassphrase);
      setDecryptedResult(decrypted);
      setCurrentStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed');
      setCurrentStep('encrypted');
    } finally {
      setIsProcessing(false);
    }
  }, [encryptedResult, demoPassphrase]);

  const resetDemo = useCallback(() => {
    setCurrentStep('intro');
    setDemoPassphrase('');
    setEncryptedResult(null);
    setDecryptedResult('');
    setError(null);
  }, []);

  const stepTitles = {
    intro: 'How SecureCardr Protects Your Data',
    passphrase: 'Your Passphrase is the Key',
    encrypting: 'Encrypting Your Data',
    encrypted: 'Your Data is Now Secure',
    decrypting: 'Decrypting Your Data',
    complete: 'Complete Control'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {stepTitles[currentStep]}
        </h3>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${
                currentStep === 'intro' ? 0 :
                currentStep === 'passphrase' ? 20 :
                currentStep === 'encrypting' ? 40 :
                currentStep === 'encrypted' ? 60 :
                currentStep === 'decrypting' ? 80 :
                100
              }%`
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {currentStep === 'intro' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Let's see exactly how your card data is protected with military-grade encryption.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Sample Card Data:</h4>
              <div className="font-mono text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>Nickname: {DEMO_DATA.sampleCard.nickname}</div>
                <div>Number: {DEMO_DATA.sampleCard.number}</div>
                <div>Expiry: {DEMO_DATA.sampleCard.expiry}</div>
                <div>CVV: {DEMO_DATA.sampleCard.cvv}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">Client-Side Only</div>
                <div className="text-gray-500 dark:text-gray-400">Encryption happens in your browser</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 01-2-2M9 7a2 2 0 00-2 2m0 0a2 2 0 00-2 2m2-2a2 2 0 002 2m-2-2a2 2 0 012-2" />
                  </svg>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">AES-256 Encryption</div>
                <div className="text-gray-500 dark:text-gray-400">Military-grade security</div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">Your Drive</div>
                <div className="text-gray-500 dark:text-gray-400">Stored in your Google Drive</div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'passphrase' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 01-2-2M9 7a2 2 0 00-2 2m0 0a2 2 0 00-2 2m2-2a2 2 0 002 2m-2-2a2 2 0 012-2" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Your passphrase is used to generate a unique encryption key. For this demo, we'll use a sample passphrase.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Demo Passphrase:
              </label>
              <div className="font-mono text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2">
                {demoPassphrase}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This passphrase will generate a 256-bit encryption key using PBKDF2 + HKDF
              </p>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                100,000+ PBKDF2 iterations for key strengthening
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                HKDF for additional key derivation security
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Random salt for each encryption
              </div>
            </div>
          </div>
        )}

        {(currentStep === 'encrypting' || currentStep === 'encrypted') && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                currentStep === 'encrypting' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
              }`}>
                {currentStep === 'encrypting' ? (
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {currentStep === 'encrypting' 
                  ? 'Encrypting your card data with AES-256-GCM...'
                  : 'Your data is now encrypted and secure!'
                }
              </p>
            </div>

            {currentStep === 'encrypted' && encryptedResult && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Encrypted Data Structure:</h4>
                  <div className="font-mono text-xs text-gray-600 dark:text-gray-400 space-y-2">
                    <div><span className="text-blue-600 dark:text-blue-400">IV:</span> {encryptedResult.iv.substring(0, 32)}...</div>
                    <div><span className="text-green-600 dark:text-green-400">Salt:</span> {encryptedResult.salt.substring(0, 32)}...</div>
                    <div><span className="text-purple-600 dark:text-purple-400">Ciphertext:</span> {encryptedResult.ciphertext.substring(0, 32)}...</div>
                    <div><span className="text-red-600 dark:text-red-400">Auth Tag:</span> {encryptedResult.authTag}</div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium text-green-800 dark:text-green-200">Data Successfully Encrypted</p>
                      <p className="text-green-700 dark:text-green-300">This encrypted data can now be safely stored in your Google Drive. Even if someone gains access to your files, they cannot read your card information without your passphrase.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(currentStep === 'decrypting' || currentStep === 'complete') && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                currentStep === 'decrypting' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
              }`}>
                {currentStep === 'decrypting' ? (
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 01-2-2M9 7a2 2 0 00-2 2m0 0a2 2 0 00-2 2m2-2a2 2 0 002 2m-2-2a2 2 0 012-2" />
                  </svg>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {currentStep === 'decrypting' 
                  ? 'Decrypting your data with your passphrase...'
                  : 'Perfect! Your data has been decrypted successfully.'
                }
              </p>
            </div>

            {currentStep === 'complete' && decryptedResult && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Decrypted Card Data:</h4>
                  <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
                    {JSON.stringify(JSON.parse(decryptedResult), null, 2)}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">You're in Complete Control</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Only you have your passphrase</li>
                    <li>• Only you can decrypt your data</li>
                    <li>• Your data is stored in YOUR Google Drive</li>
                    <li>• SecureCardr never sees your unencrypted information</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-red-800 dark:text-red-200">
                <strong>Demo Error:</strong> {error}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <button
          onClick={resetDemo}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Start Over
        </button>
        
        <div className="space-x-3">
          {currentStep === 'intro' && (
            <button
              onClick={() => setCurrentStep('passphrase')}
              className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              See How It Works
            </button>
          )}
          
          {currentStep === 'passphrase' && (
            <button
              onClick={handleEncrypt}
              disabled={isProcessing}
              className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              Encrypt Data
            </button>
          )}
          
          {currentStep === 'encrypted' && (
            <button
              onClick={handleDecrypt}
              disabled={isProcessing}
              className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              Decrypt Data
            </button>
          )}
          
          {currentStep === 'complete' && (
            <button
              onClick={onComplete}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              I Understand
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
