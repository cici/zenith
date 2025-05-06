import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateImage, compressAvatar, createThumbnail } from '@/utils/imageUtils';
import { LoadingButton } from '@/components/ui/loading-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ImageUploadProps {
  initialImage?: string;
  onChange?: (file: File | null) => void;
  onError?: (error: string) => void;
  className?: string;
  maxSizeMB?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  shape?: 'square' | 'rounded' | 'circle';
  hideControls?: boolean;
  disabled?: boolean;
  acceptedTypes?: string[];
  label?: string;
  fallbackText?: string;
}

export function ImageUpload({
  initialImage,
  onChange,
  onError,
  className,
  maxSizeMB = 2,
  width = 150,
  height = 150,
  aspectRatio,
  shape = 'circle',
  hideControls = false,
  disabled = false,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  label = 'Upload Image',
  fallbackText = 'Upload',
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hovering, setHovering] = useState(false);

  // Set shape class based on the shape prop
  const shapeClass = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none',
  }[shape];

  // Handle the file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const file = acceptedFiles[0];
      
      // Validate the file
      const validation = await validateImage(file, {
        maxSizeMB,
        acceptedFormats: acceptedTypes,
      });
      
      if (!validation.isValid) {
        setError(validation.error || 'Invalid image file');
        if (onError) onError(validation.error || 'Invalid image file');
        return;
      }
      
      // Compress the image
      const compressedFile = await compressAvatar(file);
      
      // Create a preview
      const thumbnail = await createThumbnail(compressedFile, Math.max(width, height) * 2);
      setPreviewUrl(thumbnail);
      
      // Call the onChange callback with the compressed file
      if (onChange) onChange(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image. Please try again.');
      if (onError) onError('Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [maxSizeMB, acceptedTypes, onChange, onError, width, height]);

  // Initialize dropzone
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject 
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedTypes,
    },
    maxFiles: 1,
    disabled: disabled || isLoading,
  });

  // Clear the image
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (onChange) onChange(null);
  }, [onChange]);

  // Update preview when initialImage changes
  useEffect(() => {
    if (initialImage) {
      setPreviewUrl(initialImage);
    }
  }, [initialImage]);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        {...getRootProps({
          className: cn(
            'relative flex flex-col items-center justify-center cursor-pointer transition-all border-2 border-dashed bg-muted/30',
            isDragActive && 'border-primary/70 bg-primary/5',
            isDragAccept && 'border-green-500 bg-green-500/5',
            isDragReject && 'border-red-500 bg-red-500/5',
            disabled && 'opacity-50 cursor-not-allowed',
            isLoading && 'opacity-70',
            shapeClass,
            previewUrl ? 'border-primary/40' : 'border-muted-foreground/40'
          ),
          style: { 
            width: width ? `${width}px` : '100%', 
            height: height ? `${height}px` : '100%',
            aspectRatio: aspectRatio ? `${aspectRatio}` : undefined, 
          },
          onMouseEnter: () => setHovering(true),
          onMouseLeave: () => setHovering(false)
        })}
      >
        <input {...getInputProps()} />
        
        {previewUrl ? (
          <>
            <Avatar className="w-full h-full rounded-none overflow-hidden">
              <AvatarImage src={previewUrl} alt="Uploaded image" className="object-cover" />
              <AvatarFallback className="w-full h-full">
                <User className="w-12 h-12 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            
            {/* Overlay on hover */}
            {hovering && !hideControls && !disabled && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 p-2">
                <Upload className="h-8 w-8 text-white" />
                <span className="text-white text-xs font-medium">
                  Drop to replace
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <ImageIcon className="h-10 w-10 mb-2 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Drag &amp; drop or click to select
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1">
              {acceptedTypes.map(type => type.split('/')[1]).join(', ')} · Max {maxSizeMB}MB
            </div>
          </div>
        )}
        
        {/* Clear button */}
        {previewUrl && !hideControls && !disabled && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleClear}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-r-transparent rounded-full"></div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mt-2 p-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Upload button (optional) */}
      {!hideControls && !previewUrl && (
        <LoadingButton
          type="button"
          size="sm"
          variant="outline"
          className="mt-2"
          isLoading={isLoading}
          disabled={disabled || isLoading}
          onClick={(e) => {
            e.preventDefault();
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) input.click();
          }}
        >
          {fallbackText}
        </LoadingButton>
      )}
    </div>
  );
} 