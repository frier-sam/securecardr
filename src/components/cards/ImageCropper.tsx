/**
 * Image Cropper Component
 * Integrates Cropper.js for advanced image editing and cropping
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: number;
  className?: string;
}

interface CropperState {
  cropper: Cropper | null;
  isProcessing: boolean;
  cropData: any;
}

export function ImageCropper({
  imageFile,
  onCropComplete,
  onCancel,
  aspectRatio,
  className = '',
}: ImageCropperProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropperState, setCropperState] = useState<CropperState>({
    cropper: null,
    isProcessing: false,
    cropData: null,
  });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Create image URL for the cropper
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Initialize cropper when image loads
  useEffect(() => {
    if (!imageRef.current || !imageUrl) return;

    const cropper = new Cropper(imageRef.current, {
      aspectRatio: aspectRatio || 1.586, // Credit card aspect ratio
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      minContainerWidth: 300,
      minContainerHeight: 200,
      background: true,
      responsive: true,
      checkOrientation: true,
      modal: true,
      ready() {
        setCropperState(prev => ({ ...prev, cropper }));
      },
      crop(event) {
        setCropperState(prev => ({ ...prev, cropData: event.detail }));
      },
    });

    return () => {
      cropper.destroy();
      setCropperState(prev => ({ ...prev, cropper: null }));
    };
  }, [imageUrl, aspectRatio]);

  const handleCrop = useCallback(async () => {
    if (!cropperState.cropper) {
      setError('Cropper not initialized');
      return;
    }

    setCropperState(prev => ({ ...prev, isProcessing: true }));
    setError(null);

    try {
      const canvas = cropperState.cropper.getCroppedCanvas({
        width: 800,
        height: Math.round(800 / (aspectRatio || 1.586)),
        minWidth: 400,
        minHeight: 250,
        maxWidth: 1600,
        maxHeight: 1000,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File(
              [blob],
              `cropped-${imageFile.name}`,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );
            onCropComplete(croppedFile);
          } else {
            setError('Failed to create cropped image');
            setCropperState(prev => ({ ...prev, isProcessing: false }));
          }
        },
        'image/jpeg',
        0.85
      );
    } catch (err) {
      setError('Failed to crop image');
      setCropperState(prev => ({ ...prev, isProcessing: false }));
      console.error('Crop error:', err);
    }
  }, [cropperState.cropper, aspectRatio, imageFile.name, onCropComplete]);

  const handleReset = useCallback(() => {
    if (cropperState.cropper) {
      cropperState.cropper.reset();
    }
  }, [cropperState.cropper]);

  const handleZoom = useCallback((delta: number) => {
    if (cropperState.cropper) {
      cropperState.cropper.zoom(delta);
    }
  }, [cropperState.cropper]);

  const handleRotate = useCallback((degrees: number) => {
    if (cropperState.cropper) {
      cropperState.cropper.rotate(degrees);
    }
  }, [cropperState.cropper]);

  const handleFlip = useCallback((horizontal: boolean) => {
    if (cropperState.cropper) {
      if (horizontal) {
        cropperState.cropper.scaleX(-cropperState.cropper.getImageData().scaleX);
      } else {
        cropperState.cropper.scaleY(-cropperState.cropper.getImageData().scaleY);
      }
    }
  }, [cropperState.cropper]);

  const handleAspectRatioChange = useCallback((ratio: number | null) => {
    if (cropperState.cropper) {
      cropperState.cropper.setAspectRatio(ratio || NaN);
    }
  }, [cropperState.cropper]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Crop Your Card Photo
          </h3>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          {/* Aspect Ratio Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aspect:</span>
            <button
              onClick={() => handleAspectRatioChange(1.586)}
              className="px-3 py-1 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
            >
              Card
            </button>
            <button
              onClick={() => handleAspectRatioChange(1)}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Square
            </button>
            <button
              onClick={() => handleAspectRatioChange(null)}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Free
            </button>
          </div>

          {/* Transform Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleZoom(0.1)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
            <button
              onClick={() => handleRotate(-90)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Rotate Left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={() => handleRotate(90)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Rotate Right"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
            <button
              onClick={() => handleFlip(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Flip Horizontal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            <button
              onClick={() => handleFlip(false)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Flip Vertical"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v8m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
            <button
              onClick={handleReset}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Reset"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Cropper Container */}
      <div className="p-4">
        <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
          {imageUrl ? (
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Card to crop"
              className="max-w-full block"
              style={{ maxHeight: '500px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-500 dark:text-gray-400">Loading image...</div>
            </div>
          )}
        </div>
      </div>

      {/* Crop Info */}
      {cropperState.cropData && (
        <div className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400">
          Size: {Math.round(cropperState.cropData.width)} × {Math.round(cropperState.cropData.height)}px
        </div>
      )}

      {/* Actions - Fixed for better mobile visibility */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex justify-between gap-3">
          <button
            onClick={onCancel}
            disabled={cropperState.isProcessing}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleCrop}
            disabled={cropperState.isProcessing || !cropperState.cropper}
            className="px-6 py-2 text-sm bg-primary text-white hover:bg-primary-600 disabled:bg-gray-400 rounded-md transition-colors disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
          >
            {cropperState.isProcessing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{cropperState.isProcessing ? 'Processing...' : 'Apply Crop'}</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-primary-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="space-y-1">
            <p><strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Drag to move the image, resize the crop box by dragging corners</li>
              <li>Use toolbar buttons to zoom, rotate, or flip the image</li>
              <li>Card aspect ratio is recommended for payment cards</li>
              <li>Final image will be optimized for storage and display</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
