/**
 * Simplified Image Processing Workflow Component
 * Clean and minimal - just capture and crop
 */

import { useState, useCallback } from 'react';
import { ImageCapture } from './ImageCapture';
import { ImageCropper } from './ImageCropper';

interface ImageWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCapture?: (imageFile: File) => void;
  className?: string;
}

type WorkflowStep = 'capture' | 'crop';

interface WorkflowState {
  currentStep: WorkflowStep;
  originalImage: File | null;
}

export function ImageWorkflow({ 
  isOpen,
  onClose,
  onImageCapture,
  className = '' 
}: ImageWorkflowProps) {
  const [state, setState] = useState<WorkflowState>({
    currentStep: 'capture',
    originalImage: null,
  });

  const resetWorkflow = useCallback(() => {
    setState({
      currentStep: 'capture',
      originalImage: null,
    });
  }, []);

  const handleClose = useCallback(() => {
    resetWorkflow();
    onClose();
  }, [onClose, resetWorkflow]);

  const handleImageCaptureInternal = useCallback((file: File) => {
    setState({
      originalImage: file,
      currentStep: 'crop',
    });
  }, []);

  const handleImageClear = useCallback(() => {
    resetWorkflow();
  }, [resetWorkflow]);

  const handleCropComplete = useCallback((croppedFile: File) => {
    // Save the cropped image and close workflow
    if (onImageCapture) {
      onImageCapture(croppedFile);
    }
    handleClose();
  }, [onImageCapture, handleClose]);

  const handleCropCancel = useCallback(() => {
    setState({
      currentStep: 'capture',
      originalImage: null,
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto">
      <div className={`bg-white dark:bg-gray-800 w-full min-h-screen md:min-h-0 md:mt-8 md:mb-8 md:rounded-lg md:shadow-2xl md:max-w-4xl ${className}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
                  Add Card Photo
                </h2>
                
                {/* Simple Progress Steps */}
                <div className="mt-3 flex items-center text-sm space-x-4">
                  <div className={`flex items-center space-x-1 ${
                    state.currentStep === 'capture' ? 'text-primary' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {state.currentStep !== 'capture' ? (
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
                    state.currentStep === 'crop' ? 'text-primary' : 'text-gray-400'
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-current"></span>
                    <span>Crop</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          {state.currentStep === 'capture' && (
            <ImageCapture
              onImageSelect={handleImageCaptureInternal}
              onImageClear={handleImageClear}
              className="max-w-2xl mx-auto"
            />
          )}
          
          {state.currentStep === 'crop' && state.originalImage && (
            <ImageCropper
              imageFile={state.originalImage}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              className="max-w-4xl mx-auto"
            />
          )}
        </div>

        {/* Simple Info Panel */}
        {state.currentStep === 'capture' && (
          <div className="container mx-auto px-4 pb-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-base font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Quick Tips
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Take a clear photo of your card</li>
                      <li>• Make sure all edges are visible</li>
                      <li>• Avoid glare and shadows</li>
                      <li>• You can crop the image in the next step</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}