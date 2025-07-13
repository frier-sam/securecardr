/**
 * Advanced Image Editor Component
 * Full-featured image editor with adjustments, filters, and enhancements
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ImageAdjustments, 
  processImageWithAdjustments, 
  analyzeImageQuality,
  extractColorPalette 
} from '../../services/imageProcessing';

interface ImageEditorProps {
  imageFile: File;
  onSave: (processedFile: File, thumbnail: File) => void;
  onCancel: () => void;
  className?: string;
}

interface EditorState {
  adjustments: ImageAdjustments;
  isProcessing: boolean;
  previewUrl: string | null;
  originalUrl: string;
  qualityAnalysis: any;
  colorPalette: string[];
  showAdvanced: boolean;
}

const ADJUSTMENT_PRESETS = {
  auto: { brightness: 5, contrast: 10, saturation: 5, sharpness: 15 },
  vivid: { brightness: 10, contrast: 20, saturation: 25, sharpness: 20 },
  soft: { brightness: -5, contrast: -10, saturation: -15, sharpness: 5 },
  bw: { brightness: 0, contrast: 15, saturation: -100, sharpness: 10 },
  vintage: { brightness: -10, contrast: -5, saturation: -20, sharpness: 0 },
};

export function ImageEditor({ imageFile, onSave, onCancel, className = '' }: ImageEditorProps) {
  const [state, setState] = useState<EditorState>({
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    },
    isProcessing: false,
    previewUrl: null,
    originalUrl: '',
    qualityAnalysis: null,
    colorPalette: [],
    showAdvanced: false,
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize component
  useEffect(() => {
    const originalUrl = URL.createObjectURL(imageFile);
    setState(prev => ({ ...prev, originalUrl, previewUrl: originalUrl }));

    // Analyze image quality
    analyzeImageQuality(imageFile).then(analysis => {
      setState(prev => ({ ...prev, qualityAnalysis: analysis }));
    }).catch(console.error);

    // Extract color palette
    extractColorPalette(imageFile).then(palette => {
      setState(prev => ({ ...prev, colorPalette: palette }));
    }).catch(console.error);

    return () => {
      URL.revokeObjectURL(originalUrl);
      if (state.previewUrl && state.previewUrl !== originalUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
    };
  }, [imageFile]);

  // Debounced preview update
  const updatePreview = useCallback(async (adjustments: ImageAdjustments) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      setState(prev => ({ ...prev, isProcessing: true }));

      try {
        const result = await processImageWithAdjustments(imageFile, adjustments, 800, 600, 0.8);
        const newPreviewUrl = URL.createObjectURL(result.processedFile);
        
        // Clean up old preview URL
        if (state.previewUrl && state.previewUrl !== state.originalUrl) {
          URL.revokeObjectURL(state.previewUrl);
        }

        setState(prev => ({ 
          ...prev, 
          previewUrl: newPreviewUrl, 
          isProcessing: false 
        }));
      } catch (error) {
        console.error('Failed to update preview:', error);
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    }, 300);
  }, [imageFile, state.previewUrl, state.originalUrl]);

  // Handle adjustment changes
  const handleAdjustmentChange = useCallback((field: keyof ImageAdjustments, value: any) => {
    const newAdjustments = { ...state.adjustments, [field]: value };
    setState(prev => ({ ...prev, adjustments: newAdjustments }));
    updatePreview(newAdjustments);
  }, [state.adjustments, updatePreview]);

  // Apply preset
  const applyPreset = useCallback((presetName: keyof typeof ADJUSTMENT_PRESETS) => {
    const preset = ADJUSTMENT_PRESETS[presetName];
    const newAdjustments = { 
      ...state.adjustments, 
      ...preset,
      rotation: state.adjustments.rotation, // Keep rotation
      flipHorizontal: state.adjustments.flipHorizontal, // Keep flips
      flipVertical: state.adjustments.flipVertical,
    };
    setState(prev => ({ ...prev, adjustments: newAdjustments }));
    updatePreview(newAdjustments);
  }, [state.adjustments, updatePreview]);

  // Reset adjustments
  const resetAdjustments = useCallback(() => {
    const resetAdjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    };
    setState(prev => ({ ...prev, adjustments: resetAdjustments, previewUrl: state.originalUrl }));
  }, [state.originalUrl]);

  // Save processed image
  const handleSave = useCallback(async () => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const result = await processImageWithAdjustments(imageFile, state.adjustments);
      onSave(result.processedFile, result.thumbnail);
    } catch (error) {
      console.error('Failed to process image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [imageFile, state.adjustments, onSave]);

  const hasAdjustments = Object.values(state.adjustments).some((value, index) => {
    const defaults = [0, 0, 0, 0, 0, false, false];
    return value !== defaults[index];
  });

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Image Editor
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Enhance your card photo for better OCR results
            </p>
          </div>
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

      {/* Quality Analysis */}
      {state.qualityAnalysis && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Image Quality Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Brightness: </span>
                  <span className="font-medium">{Math.round(state.qualityAnalysis.scores.brightness)}%</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Contrast: </span>
                  <span className="font-medium">{Math.round(state.qualityAnalysis.scores.contrast)}%</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Sharpness: </span>
                  <span className="font-medium">{Math.round(state.qualityAnalysis.scores.sharpness)}%</span>
                </div>
              </div>
              {state.qualityAnalysis.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-blue-800 dark:text-blue-200 text-xs">
                    💡 {state.qualityAnalysis.suggestions[0]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Preview Area */}
        <div className="flex-1 p-6">
          <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
            {state.isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-900 dark:text-white">Processing...</span>
                </div>
              </div>
            )}
            
            <img
              src={state.previewUrl || state.originalUrl}
              alt="Image preview"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>

          {/* Color Palette */}
          {state.colorPalette.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dominant Colors
              </h5>
              <div className="flex space-x-2">
                {state.colorPalette.map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full lg:w-80 p-6 bg-gray-50 dark:bg-gray-900 lg:border-l border-gray-200 dark:border-gray-700">
          {/* Presets */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Quick Presets
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset('auto')}
                className="px-3 py-2 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
              >
                Auto Enhance
              </button>
              <button
                onClick={() => applyPreset('vivid')}
                className="px-3 py-2 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Vivid
              </button>
              <button
                onClick={() => applyPreset('soft')}
                className="px-3 py-2 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Soft
              </button>
              <button
                onClick={() => applyPreset('bw')}
                className="px-3 py-2 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                B&W
              </button>
            </div>
          </div>

          {/* Transform Controls */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Transform
            </h4>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <button
                onClick={() => handleAdjustmentChange('rotation', (state.adjustments.rotation - 90 + 360) % 360)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Rotate Left"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={() => handleAdjustmentChange('rotation', (state.adjustments.rotation + 90) % 360)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Rotate Right"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
              <button
                onClick={() => handleAdjustmentChange('flipHorizontal', !state.adjustments.flipHorizontal)}
                className={`p-2 rounded-md transition-colors ${
                  state.adjustments.flipHorizontal 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Flip Horizontal"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
              <button
                onClick={() => handleAdjustmentChange('flipVertical', !state.adjustments.flipVertical)}
                className={`p-2 rounded-md transition-colors ${
                  state.adjustments.flipVertical 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Flip Vertical"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v8m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Adjustment Sliders */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Adjustments
            </h4>
            
            {/* Brightness */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-600 dark:text-gray-400">Brightness</label>
                <span className="text-xs text-gray-500 dark:text-gray-500">{state.adjustments.brightness}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={state.adjustments.brightness}
                onChange={(e) => handleAdjustmentChange('brightness', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-600 dark:text-gray-400">Contrast</label>
                <span className="text-xs text-gray-500 dark:text-gray-500">{state.adjustments.contrast}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={state.adjustments.contrast}
                onChange={(e) => handleAdjustmentChange('contrast', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-600 dark:text-gray-400">Saturation</label>
                <span className="text-xs text-gray-500 dark:text-gray-500">{state.adjustments.saturation}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={state.adjustments.saturation}
                onChange={(e) => handleAdjustmentChange('saturation', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Sharpness */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-600 dark:text-gray-400">Sharpness</label>
                <span className="text-xs text-gray-500 dark:text-gray-500">{state.adjustments.sharpness}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={state.adjustments.sharpness}
                onChange={(e) => handleAdjustmentChange('sharpness', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Reset Button */}
          {hasAdjustments && (
            <div className="mt-6">
              <button
                onClick={resetAdjustments}
                className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Reset All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <button
          onClick={onCancel}
          disabled={state.isProcessing}
          className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        
        <button
          onClick={handleSave}
          disabled={state.isProcessing}
          className="px-6 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {state.isProcessing && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          <span>Save Enhanced Image</span>
        </button>
      </div>
    </div>
  );
}
