/**
 * Advanced Image Processing Utilities
 * Provides image adjustments, filters, and enhancements
 */

export interface ImageAdjustments {
  brightness: number;    // -100 to 100
  contrast: number;      // -100 to 100
  saturation: number;    // -100 to 100
  sharpness: number;     // 0 to 100
  rotation: number;      // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface ImageProcessingResult {
  processedFile: File;
  thumbnail: File;
  metadata: {
    originalSize: { width: number; height: number };
    processedSize: { width: number; height: number };
    fileSize: number;
    adjustments: ImageAdjustments;
  };
}

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
};

/**
 * Apply image adjustments to a file
 */
export async function processImageWithAdjustments(
  imageFile: File,
  adjustments: Partial<ImageAdjustments> = {},
  maxWidth: number = 1600,
  maxHeight: number = 1200,
  quality: number = 0.85
): Promise<ImageProcessingResult> {
  const finalAdjustments = { ...DEFAULT_ADJUSTMENTS, ...adjustments };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = async () => {
      try {
        const originalSize = { width: img.width, height: img.height };
        
        // Calculate dimensions after rotation
        const isRotated = finalAdjustments.rotation === 90 || finalAdjustments.rotation === 270;
        const sourceWidth = isRotated ? img.height : img.width;
        const sourceHeight = isRotated ? img.width : img.height;
        
        // Calculate processed dimensions
        const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
        const processedWidth = Math.round(sourceWidth * scale);
        const processedHeight = Math.round(sourceHeight * scale);
        
        // Set canvas size
        canvas.width = processedWidth;
        canvas.height = processedHeight;
        
        // Save context
        ctx.save();
        
        // Apply transformations
        ctx.translate(processedWidth / 2, processedHeight / 2);
        
        // Apply rotation
        if (finalAdjustments.rotation !== 0) {
          ctx.rotate((finalAdjustments.rotation * Math.PI) / 180);
        }
        
        // Apply flips
        const scaleX = finalAdjustments.flipHorizontal ? -1 : 1;
        const scaleY = finalAdjustments.flipVertical ? -1 : 1;
        ctx.scale(scaleX, scaleY);
        
        // Draw image
        ctx.drawImage(
          img,
          -processedWidth / 2,
          -processedHeight / 2,
          processedWidth,
          processedHeight
        );
        
        // Restore context
        ctx.restore();
        
        // Apply color adjustments
        if (needsColorAdjustments(finalAdjustments)) {
          applyColorAdjustments(ctx, processedWidth, processedHeight, finalAdjustments);
        }
        
        // Apply sharpness
        if (finalAdjustments.sharpness > 0) {
          applySharpening(ctx, processedWidth, processedHeight, finalAdjustments.sharpness);
        }
        
        // Create processed file
        canvas.toBlob(async (processedBlob) => {
          if (!processedBlob) {
            reject(new Error('Failed to process image'));
            return;
          }
          
          const processedFile = new File(
            [processedBlob],
            `processed-${imageFile.name}`,
            { type: 'image/jpeg' }
          );
          
          // Create thumbnail
          const thumbnail = await createThumbnailFromCanvas(canvas, 200);
          
          const result: ImageProcessingResult = {
            processedFile,
            thumbnail,
            metadata: {
              originalSize,
              processedSize: { width: processedWidth, height: processedHeight },
              fileSize: processedFile.size,
              adjustments: finalAdjustments,
            },
          };
          
          resolve(result);
        }, 'image/jpeg', quality);
        
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Check if color adjustments are needed
 */
function needsColorAdjustments(adjustments: ImageAdjustments): boolean {
  return adjustments.brightness !== 0 || 
         adjustments.contrast !== 0 || 
         adjustments.saturation !== 0;
}

/**
 * Apply color adjustments using image data manipulation
 */
function applyColorAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adjustments: ImageAdjustments
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Convert adjustments to filter values
  const brightnessValue = adjustments.brightness / 100;
  const contrastValue = (adjustments.contrast + 100) / 100;
  const saturationValue = (adjustments.saturation + 100) / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // Apply brightness
    r = Math.max(0, Math.min(255, r + (brightnessValue * 255)));
    g = Math.max(0, Math.min(255, g + (brightnessValue * 255)));
    b = Math.max(0, Math.min(255, b + (brightnessValue * 255)));
    
    // Apply contrast
    r = Math.max(0, Math.min(255, (r - 128) * contrastValue + 128));
    g = Math.max(0, Math.min(255, (g - 128) * contrastValue + 128));
    b = Math.max(0, Math.min(255, (b - 128) * contrastValue + 128));
    
    // Apply saturation
    if (saturationValue !== 1) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = Math.max(0, Math.min(255, gray + (r - gray) * saturationValue));
      g = Math.max(0, Math.min(255, gray + (g - gray) * saturationValue));
      b = Math.max(0, Math.min(255, gray + (b - gray) * saturationValue));
    }
    
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply sharpening filter
 */
function applySharpening(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const factor = intensity / 100;
  
  // Sharpening kernel
  const kernel = [
    0, -factor, 0,
    -factor, 1 + 4 * factor, -factor,
    0, -factor, 0
  ];
  
  const newData = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            sum += data[pixelIndex] * kernel[kernelIndex];
          }
        }
        const targetIndex = (y * width + x) * 4 + c;
        newData[targetIndex] = Math.max(0, Math.min(255, sum));
      }
    }
  }
  
  const newImageData = new ImageData(newData, width, height);
  ctx.putImageData(newImageData, 0, 0);
}

/**
 * Create thumbnail from canvas
 */
async function createThumbnailFromCanvas(
  sourceCanvas: HTMLCanvasElement,
  maxSize: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    // Calculate thumbnail dimensions
    const scale = Math.min(maxSize / sourceCanvas.width, maxSize / sourceCanvas.height);
    canvas.width = Math.round(sourceCanvas.width * scale);
    canvas.height = Math.round(sourceCanvas.height * scale);
    
    // Draw scaled image
    ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
    
    // Convert to file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
        resolve(file);
      } else {
        reject(new Error('Failed to create thumbnail'));
      }
    }, 'image/jpeg', 0.8);
  });
}

/**
 * Create multiple thumbnail sizes
 */
export async function createMultipleThumbnails(
  imageFile: File,
  sizes: number[] = [100, 200, 400]
): Promise<{ size: number; file: File }[]> {
  const thumbnails: { size: number; file: File }[] = [];
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        for (const size of sizes) {
          const scale = Math.min(size / img.width, size / img.height);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const thumbnailFile = await createThumbnailFromCanvas(canvas, size);
          thumbnails.push({ size, file: thumbnailFile });
        }
        
        resolve(thumbnails);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Optimize image for storage
 */
export async function optimizeImageForStorage(
  imageFile: File,
  maxFileSize: number = 500 * 1024, // 500KB
  maxDimension: number = 1200
): Promise<File> {
  let quality = 0.9;
  let result = imageFile;
  
  // First, resize if needed
  if (imageFile.size > maxFileSize) {
    const processed = await processImageWithAdjustments(
      imageFile,
      {},
      maxDimension,
      maxDimension,
      quality
    );
    result = processed.processedFile;
  }
  
  // Iteratively reduce quality if still too large
  while (result.size > maxFileSize && quality > 0.3) {
    quality -= 0.1;
    const processed = await processImageWithAdjustments(
      imageFile,
      {},
      maxDimension,
      maxDimension,
      quality
    );
    result = processed.processedFile;
  }
  
  return result;
}

/**
 * Extract color palette from image
 */
export async function extractColorPalette(
  imageFile: File,
  colorCount: number = 5
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      try {
        // Scale down for faster processing
        const scale = Math.min(100 / img.width, 100 / img.height);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple color extraction (could be enhanced with k-means clustering)
        const colorMap = new Map<string, number>();
        
        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
          const r = Math.round(data[i] / 32) * 32;
          const g = Math.round(data[i + 1] / 32) * 32;
          const b = Math.round(data[i + 2] / 32) * 32;
          
          const color = `rgb(${r}, ${g}, ${b})`;
          colorMap.set(color, (colorMap.get(color) || 0) + 1);
        }
        
        // Get most frequent colors
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, colorCount)
          .map(([color]) => color);
        
        resolve(sortedColors);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Check if image needs enhancement
 */
export async function analyzeImageQuality(imageFile: File): Promise<{
  needsEnhancement: boolean;
  suggestions: string[];
  scores: {
    brightness: number;
    contrast: number;
    sharpness: number;
  };
}> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      try {
        // Scale down for analysis
        const scale = Math.min(200 / img.width, 200 / img.height);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Analyze brightness
        let totalBrightness = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          totalBrightness += brightness;
          totalPixels++;
        }
        
        const avgBrightness = totalBrightness / totalPixels;
        const brightnessScore = Math.max(0, Math.min(100, (avgBrightness / 255) * 100));
        
        // Simple contrast analysis
        let minBrightness = 255;
        let maxBrightness = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          minBrightness = Math.min(minBrightness, brightness);
          maxBrightness = Math.max(maxBrightness, brightness);
        }
        
        const contrastRange = maxBrightness - minBrightness;
        const contrastScore = Math.max(0, Math.min(100, (contrastRange / 255) * 100));
        
        // Simple sharpness estimation (edge detection)
        let edgeStrength = 0;
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            const idx = (y * canvas.width + x) * 4;
            const rightIdx = (y * canvas.width + x + 1) * 4;
            const bottomIdx = ((y + 1) * canvas.width + x) * 4;
            
            const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const right = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
            const bottom = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
            
            edgeStrength += Math.abs(current - right) + Math.abs(current - bottom);
          }
        }
        
        const sharpnessScore = Math.max(0, Math.min(100, edgeStrength / (canvas.width * canvas.height) / 10));
        
        // Generate suggestions
        const suggestions: string[] = [];
        let needsEnhancement = false;
        
        if (brightnessScore < 30) {
          suggestions.push('Image appears too dark - consider increasing brightness');
          needsEnhancement = true;
        } else if (brightnessScore > 80) {
          suggestions.push('Image appears too bright - consider decreasing brightness');
          needsEnhancement = true;
        }
        
        if (contrastScore < 40) {
          suggestions.push('Low contrast detected - consider increasing contrast');
          needsEnhancement = true;
        }
        
        if (sharpnessScore < 20) {
          suggestions.push('Image appears blurry - consider applying sharpening');
          needsEnhancement = true;
        }
        
        if (!needsEnhancement) {
          suggestions.push('Image quality looks good!');
        }
        
        resolve({
          needsEnhancement,
          suggestions,
          scores: {
            brightness: brightnessScore,
            contrast: contrastScore,
            sharpness: sharpnessScore,
          },
        });
        
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}
