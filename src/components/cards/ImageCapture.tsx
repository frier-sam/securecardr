/**
 * Camera and File Input Component
 * Handles camera capture, file selection, and image preview
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { validateImageFile } from '../../services/imageCrypto';

interface ImageCaptureProps {
  onImageSelect: (file: File) => void;
  onImageClear: () => void;
  currentImage?: File | string | null;
  disabled?: boolean;
  className?: string;
}

type CaptureMode = 'file' | 'camera' | null;

export function ImageCapture({
  onImageSelect,
  onImageClear,
  currentImage,
  disabled = false,
  className = '',
}: ImageCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check camera availability
  const [cameraAvailable, setCameraAvailable] = useState(false);

  useEffect(() => {
    // Check if camera is available
    if (navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const hasCamera = devices.some(device => device.kind === 'videoinput');
          setCameraAvailable(hasCamera);
        })
        .catch(() => setCameraAvailable(false));
    }
  }, []);

  // Generate preview URL for current image
  useEffect(() => {
    if (currentImage) {
      if (typeof currentImage === 'string') {
        setPreview(currentImage);
      } else if (currentImage instanceof File) {
        const url = URL.createObjectURL(currentImage);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setPreview(null);
    }
  }, [currentImage]);

  // Cleanup stream when component unmounts or mode changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsCapturing(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      setIsCapturing(false);
      console.error('Camera access error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setCaptureMode(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Canvas not available');
      return;
    }

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `card-photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          
          try {
            validateImageFile(file);
            onImageSelect(file);
            stopCamera();
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Invalid image file');
          }
        } else {
          setError('Failed to capture photo');
        }
      },
      'image/jpeg',
      0.8
    );
  }, [onImageSelect, stopCamera]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        validateImageFile(file);
        onImageSelect(file);
        setCaptureMode(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Invalid image file');
      }
    }
    // Reset input value
    event.target.value = '';
  }, [onImageSelect]);

  const handleModeSelect = useCallback((mode: CaptureMode) => {
    setError(null);
    setCaptureMode(mode);
    
    if (mode === 'camera') {
      startCamera();
    } else if (mode === 'file') {
      fileInputRef.current?.click();
    }
  }, [startCamera]);

  const handleRetry = useCallback(() => {
    setError(null);
    if (captureMode === 'camera') {
      startCamera();
    }
  }, [captureMode, startCamera]);

  if (preview && !isCapturing) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Card preview"
            className="max-w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
          />
          <button
            type="button"
            onClick={onImageClear}
            disabled={disabled}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleModeSelect('file')}
            disabled={disabled}
            className="btn-secondary text-sm"
          >
            Replace Photo
          </button>
          {cameraAvailable && (
            <button
              type="button"
              onClick={() => handleModeSelect('camera')}
              disabled={disabled}
              className="btn-secondary text-sm"
            >
              Take New Photo
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isCapturing && captureMode === 'camera') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gray-900 rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
            onLoadedData={() => setIsCapturing(true)}
          />
          
          {/* Camera overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white/50 rounded-lg"></div>
            <div className="absolute top-4 left-4 right-4 text-center">
              <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                Position your card within the frame
              </div>
            </div>
          </div>
          
          {/* Capture button */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              type="button"
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
            </button>
          </div>
          
          {/* Cancel button */}
          <button
            type="button"
            onClick={stopCamera}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Main selection interface
  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="text-red-800 dark:text-red-200 font-medium">
                Error
              </p>
              <p className="text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-medium mt-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Add Card Photo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Take a photo or select from your device
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {cameraAvailable && (
              <button
                type="button"
                onClick={() => handleModeSelect('camera')}
                disabled={disabled}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Take Photo</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={() => handleModeSelect('file')}
              disabled={disabled}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Choose File</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supported formats: JPEG, PNG, WebP • Max size: 10MB
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
