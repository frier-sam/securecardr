/**
 * Enhanced Image Processing Workflow Component
 * Integrates camera capture, cropping, editing, OCR, and validation
 */

import React, { useState, useCallback } from 'react';
import { ImageCapture } from './ImageCapture';
import { ImageCropper } from './ImageCropper';
import { ImageEditor } from './ImageEditor';
import { OCRValidation } from './OCRValidation';
import { performOCR } from '../../services/ocr';
import { OCRResult, CardFormData } from '../../types';

interface ImageWorkflowProps {
  onComplete: (cardData: Partial<CardFormData>) => void;
  onCancel: () => void;
  className?: string;
}

type WorkflowStep = 'capture' | 'crop' | 'edit' | 'ocr' | 'validate';

interface WorkflowState {
  currentStep: WorkflowStep;
  originalImage: File | null;
  croppedImage: File | null;
  editedImage: File | null;
  thumbnailImage: File | null;
  ocrResult: OCRResult | null;
  isProcessing: boolean;
  error: string | null;
  ocrProgress: number;
  showEditor: boolean;
}

export function ImageWorkflow({ onComplete, onCancel, className = '' }: ImageWorkflowProps) {
  const [state, setState] = useState<WorkflowState>({
    currentStep: 'capture',
    originalImage: null,
    croppedImage: null,
    editedImage: null,
    thumbnailImage: null,
    ocrResult: null,
    isProcessing: false,
    error: null,
    ocrProgress: 0,
    showEditor: false,
  });

  const resetWorkflow = useCallback(() => {
    setState({
      currentStep: 'capture',
      originalImage: null,
      croppedImage: null,
      editedImage: null,
      thumbnailImage: null,
      ocrResult: null,
      isProcessing: false,
      error: null,
      ocrProgress: 0,
      showEditor: false,
    });
  }, []);

  const handleImageCapture = useCallback((file: File) => {
    setState(prev => ({
      ...prev,
      originalImage: file,
      currentStep: 'crop',
      error: null,
    }));
  }, []);

  const handleImageClear = useCallback(() => {
    resetWorkflow();
  }, [resetWorkflow]);

  const handleCropComplete = useCallback((croppedFile: File) => {
    setState(prev => ({
      ...prev,
      croppedImage: croppedFile,
      currentStep: 'edit',
      error: null,
    }));
  }, []);

  const handleCropCancel = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'capture',
      originalImage: null,
    }));
  }, []);

  const handleEditComplete = useCallback(async (editedFile: File, thumbnailFile: File) => {
    setState(prev => ({
      ...prev,
      editedImage: editedFile,
      thumbnailImage: thumbnailFile,
      currentStep: 'ocr',
      isProcessing: true,
      error: null,
      ocrProgress: 0,
      showEditor: false,
    }));

    try {
      const ocrResult = await performOCR(editedFile, (progress) => {
        setState(prev => ({ ...prev, ocrProgress: progress }));
      });

      setState(prev => ({
        ...prev,
        ocrResult,
        currentStep: 'validate',
        isProcessing: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'OCR processing failed',
        isProcessing: false,
      }));
    }
  }, []);

  const handleSkipEdit = useCallback(async () => {
    if (!state.croppedImage) return;
    
    setState(prev => ({
      ...prev,
      editedImage: state.croppedImage,
      currentStep: 'ocr',
      isProcessing: true,
      error: null,
      ocrProgress: 0,
    }));

    try {
      const ocrResult = await performOCR(state.croppedImage, (progress) => {
        setState(prev => ({ ...prev, ocrProgress: progress }));
      });

      setState(prev => ({
        ...prev,
        ocrResult,
        currentStep: 'validate',
        isProcessing: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'OCR processing failed',
        isProcessing: false,
      }));
    }
  }, [state.croppedImage]);

  const handleEditCancel = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'crop',
      showEditor: false,
    }));
  }, []);

  const handleOCRAccept = useCallback((cardData: Partial<CardFormData>) => {
    onComplete(cardData);
  }, [onComplete]);

  const handleOCRReject = useCallback(() => {
    resetWorkflow();
  }, [resetWorkflow]);

  const handleOCRRetry = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'capture',
      originalImage: null,
      croppedImage: null,
      editedImage: null,
      thumbnailImage: null,
      ocrResult: null,
      showEditor: false,
    }));
  }, []);

  const handleSkipOCR = useCallback(() => {
    if (state.editedImage) {
      const cardData: Partial<CardFormData> = {
        image: state.editedImage,
      };
      onComplete(cardData);
    }
  }, [state.editedImage, onComplete]);

  // Render based on current step
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'capture':
        return (
          <ImageCapture
            onImageSelect={handleImageCapture}
            onImageClear={handleImageClear}
            currentImage={state.originalImage}
          />
        );

      case 'crop':
        if (!state.originalImage) return null;
        return (
          <ImageCropper
            imageFile={state.originalImage}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatio={1.586} // Credit card aspect ratio
          />
        );

      case 'edit':
        if (!state.croppedImage) return null;
        
        if (state.showEditor) {
          return (
            <ImageEditor
              imageFile={state.croppedImage}
              onSave={handleEditComplete}
              onCancel={handleEditCancel}
            />
          );
        }
        
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl mx-auto p-8 text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Enhance Your Image
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Optional: Enhance your image for better OCR results, or continue with the current image.
                </p>
              </div>
              
              {/* Preview */}
              <div className="max-w-sm mx-auto">
                <img
                  src={URL.createObjectURL(state.croppedImage)}
                  alt="Cropped preview"
                  className="w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setState(prev => ({ ...prev, showEditor: true }))}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Enhance Image</span>
                </button>
                
                <button
                  onClick={handleSkipEdit}
                  className="px-6 py-3 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Continue with Current Image</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'ocr':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl mx-auto p-8 text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Reading Your Card
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Using OCR to extract text from your enhanced card image...
                </p>
              </div>
              
              {state.isProcessing && (
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${state.ocrProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {state.ocrProgress}% complete
                  </p>
                </div>
              )}
              
              {state.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <p className="font-medium">OCR Processing Failed</p>
                      <p className="mt-1">{state.error}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-center space-x-3">
                    <button
                      onClick={handleSkipOCR}
                      className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                    >
                      Skip OCR & Continue
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, currentStep: 'edit', error: null }))}
                      className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                    >
                      Try Different Enhancement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'validate':
        if (!state.ocrResult || !state.editedImage) return null;
        return (
          <OCRValidation
            ocrResult={state.ocrResult}
            originalImage={state.editedImage}
            onAccept={handleOCRAccept}
            onReject={handleOCRReject}
            onRetry={handleOCRRetry}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Smart Card Capture
              </h2>
              
              {/* Enhanced Progress Steps */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={`flex items-center space-x-1 ${
                  state.currentStep === 'capture' ? 'text-primary-600 dark:text-primary-400' : 
                  ['crop', 'edit', 'ocr', 'validate'].includes(state.currentStep) ? 'text-green-600 dark:text-green-400' :
                  'text-gray-400'
                }`}>
                  {['crop', 'edit', 'ocr', 'validate'].includes(state.currentStep) ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current"></span>
                  )}
                  <span>Capture</span>
                </div>
                
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                <div className={`flex items-center space-x-1 ${
                  state.currentStep === 'crop' ? 'text-primary-600 dark:text-primary-400' : 
                  ['edit', 'ocr', 'validate'].includes(state.currentStep) ? 'text-green-600 dark:text-green-400' :
                  'text-gray-400'
                }`}>
                  {['edit', 'ocr', 'validate'].includes(state.currentStep) ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current"></span>
                  )}
                  <span>Crop</span>
                </div>
                
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                <div className={`flex items-center space-x-1 ${
                  state.currentStep === 'edit' ? 'text-primary-600 dark:text-primary-400' : 
                  ['ocr', 'validate'].includes(state.currentStep) ? 'text-green-600 dark:text-green-400' :
                  'text-gray-400'
                }`}>
                  {['ocr', 'validate'].includes(state.currentStep) ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current"></span>
                  )}
                  <span>Enhance</span>
                </div>
                
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                <div className={`flex items-center space-x-1 ${
                  state.currentStep === 'validate' ? 'text-green-600 dark:text-green-400' :
                  state.currentStep === 'ocr' ? 'text-primary-600 dark:text-primary-400' :
                  'text-gray-400'
                }`}>
                  {state.currentStep === 'validate' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-current"></span>
                  )}
                  <span>Extract & Verify</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {renderCurrentStep()}
      </div>

      {/* OCR Information Panel - only show on capture step */}
      {state.currentStep === 'capture' && (
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Smart Card Recognition with Enhancement
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 mb-4">
                    SecureCardr features advanced image processing and OCR technology to automatically extract and enhance your card information.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📸 Smart Capture</h5>
                      <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Camera & file upload</li>
                        <li>• Automatic card detection</li>
                        <li>• Guided framing overlay</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">✂️ Precision Tools</h5>
                      <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Professional cropping</li>
                        <li>• Brightness & contrast</li>
                        <li>• Rotation & alignment</li>
                        <li>• Sharpening filters</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🤖 AI Recognition</h5>
                      <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Card numbers & dates</li>
                        <li>• Cardholder names</li>
                        <li>• Smart validation</li>
                        <li>• Error correction</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
