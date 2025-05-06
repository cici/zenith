import imageCompression from 'browser-image-compression';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageProcessingOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  maxIteration?: number; 
  exifOrientation?: number;
  fileType?: string;
  initialQuality?: number;
}

/**
 * Default options for image compression
 */
const defaultCompressionOptions: ImageProcessingOptions = {
  maxSizeMB: 1,              // Maximum file size in MB
  maxWidthOrHeight: 1024,    // Maximum width or height
  useWebWorker: true,        // Use web worker for compression
  initialQuality: 0.8,       // Initial compression quality
  fileType: 'image/jpeg',    // Default output format
};

/**
 * Stricter options for avatars
 */
const avatarCompressionOptions: ImageProcessingOptions = {
  maxSizeMB: 0.5,            // Maximum file size in MB
  maxWidthOrHeight: 400,     // Maximum width or height for avatar
  useWebWorker: true,        // Use web worker for compression
  initialQuality: 0.85,      // Slightly higher quality for avatars
  fileType: 'image/jpeg',    // Default output format
};

/**
 * Compresses an image file based on provided options
 * @param file Image file to compress
 * @param options Compression options (optional)
 * @returns Compressed file or original if compression fails
 */
export async function compressImage(
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<File> {
  try {
    // Merge default options with provided options
    const compressionOptions = { 
      ...defaultCompressionOptions, 
      ...options 
    };

    // Perform compression
    const compressedFile = await imageCompression(file, compressionOptions);
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Compresses an image specifically for use as an avatar
 * @param file Image file to compress
 * @param customOptions Additional options to override defaults
 * @returns Compressed file optimized for avatar use
 */
export async function compressAvatar(
  file: File,
  customOptions: Partial<ImageProcessingOptions> = {}
): Promise<File> {
  return compressImage(file, { ...avatarCompressionOptions, ...customOptions });
}

/**
 * Validates an image file to ensure it meets requirements
 * @param file File to validate
 * @param options Validation options
 * @returns Validation result
 */
export async function validateImage(
  file: File,
  options: {
    maxSizeMB?: number;
    acceptedFormats?: string[];
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Default options
    const {
      maxSizeMB = 2,
      acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      minWidth = 0,
      minHeight = 0,
      maxWidth = 10000,
      maxHeight = 10000,
    } = options;

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return {
        isValid: false,
        error: `Unsupported file format. Please use one of the following: ${acceptedFormats.join(', ')}`
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return {
        isValid: false,
        error: `File size exceeds the maximum allowed size of ${maxSizeMB}MB`
      };
    }

    // Check dimensions if min/max specified
    if (minWidth > 0 || minHeight > 0 || maxWidth < 10000 || maxHeight < 10000) {
      const dimensions = await getImageDimensions(file);
      
      if (dimensions.width < minWidth || dimensions.height < minHeight) {
        return {
          isValid: false,
          error: `Image dimensions too small. Minimum size is ${minWidth}x${minHeight} pixels.`
        };
      }

      if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
        return {
          isValid: false,
          error: `Image dimensions too large. Maximum size is ${maxWidth}x${maxHeight} pixels.`
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating image:', error);
    return {
      isValid: false,
      error: 'Failed to validate image. Please try another file.'
    };
  }
}

/**
 * Gets the dimensions (width and height) of an image file
 * @param file Image file
 * @returns Promise resolving to image dimensions
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
      URL.revokeObjectURL(img.src); // Clean up
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src); // Clean up
      reject(new Error('Failed to load image for dimension calculation'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Creates a thumbnail preview from an image file
 * @param file Image file
 * @param maxSize Maximum width or height for the thumbnail
 * @returns Data URL for the thumbnail
 */
export function createThumbnail(file: File, maxSize: number = 100): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate thumbnail dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
          }
        }

        // Create canvas and draw thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => {
        reject(new Error('Error creating thumbnail'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    reader.readAsDataURL(file);
  });
} 