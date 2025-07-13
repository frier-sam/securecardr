/**
 * Enhanced Image Gallery Component
 * Supports multiple images per card with drag & drop
 */

import React, { useState, useCallback, useRef } from 'react';
import { CardImage, ImageGalleryProps } from '../../types';
import { ImageWorkflow } from './ImageWorkflow';

export function ImageGallery({ 
  images, 
  onImageAdd, 
  onImageRemove, 
  onImageView, 
  maxImages = 5,
  allowMultiple = true,
  readOnly = false
}: ImageGalleryProps) {
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CardImage | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (readOnly) return;
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const filesToAdd = allowMultiple ? imageFiles : [imageFiles[0]];
      const availableSlots = maxImages - images.length;
      const finalFiles = filesToAdd.slice(0, availableSlots);
      
      if (finalFiles.length > 0) {
        onImageAdd(finalFiles);
      }
    }
  }, [readOnly, allowMultiple, maxImages, images.length, onImageAdd]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const filesToAdd = allowMultiple ? imageFiles : [imageFiles[0]];
      const availableSlots = maxImages - images.length;
      const finalFiles = filesToAdd.slice(0, availableSlots);
      
      if (finalFiles.length > 0) {
        onImageAdd(finalFiles);
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [allowMultiple, maxImages, images.length, onImageAdd]);

  const handleImageCapture = useCallback((file: File) => {
    onImageAdd([file]);
    setShowWorkflow(false);
  }, [onImageAdd]);

  const handleImageClick = useCallback((image: CardImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
    onImageView(image);
  }, [onImageView]);

  const canAddMore = images.length < maxImages && !readOnly;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-secondary">
          Card Images {images.length > 0 && (
            <span className="text-xs text-text-secondary">({images.length}/{maxImages})</span>
          )}
        </label>
        
        {canAddMore && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowWorkflow(true)}
              className="text-sm text-primary hover:text-blue-400 transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Camera</span>
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-primary hover:text-blue-400 transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload</span>
            </button>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-slate-600 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => handleImageClick(image)}
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              
              {/* Image overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(image);
                    }}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  
                  {!readOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageRemove(image.id);
                      }}
                      className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Image index */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
          
          {/* Add more button */}
          {canAddMore && (
            <div
              className={`aspect-square rounded-lg border-2 border-dashed transition-all cursor-pointer flex items-center justify-center ${
                dragOver 
                  ? 'border-primary bg-primary/10' 
                  : 'border-slate-600 hover:border-primary/50 hover:bg-primary/5'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-text-secondary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-text-secondary">Add Image</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Empty state
        <div
          className={`w-full p-8 border-2 border-dashed rounded-lg transition-all ${
            dragOver 
              ? 'border-primary bg-primary/10' 
              : 'border-slate-600 hover:border-primary/50'
          } ${canAddMore ? 'cursor-pointer' : ''}`}
          onDragOver={canAddMore ? handleDragOver : undefined}
          onDragLeave={canAddMore ? handleDragLeave : undefined}
          onDrop={canAddMore ? handleDrop : undefined}
          onClick={canAddMore ? () => fileInputRef.current?.click() : undefined}
        >
          <div className="text-center">
            <svg className="w-12 h-12 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium text-text-primary mb-2">
              {readOnly ? 'No images' : 'Add card images'}
            </p>
            {!readOnly && (
              <p className="text-sm text-text-secondary">
                Drag & drop images here or click to browse
                <br />
                <span className="text-xs">
                  Supports up to {maxImages} images
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={allowMultiple}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Image Workflow Modal */}
      <ImageWorkflow
        isOpen={showWorkflow}
        onClose={() => setShowWorkflow(false)}
        onImageCapture={handleImageCapture}
      />

      {/* Image Viewer Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* Close button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image info */}
            <div className="absolute bottom-4 left-4 bg-black/50 text-white p-3 rounded-lg">
              <p className="text-sm font-medium">{selectedImage.name}</p>
              <p className="text-xs text-gray-300">
                {(selectedImage.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
