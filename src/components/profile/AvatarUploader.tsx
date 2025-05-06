import React, { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { updateUserAvatar } from '@/services/storageService';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onAvatarChange?: (url: string) => void;
  showUploadButton?: boolean;
}

export function AvatarUploader({
  currentAvatarUrl,
  size = 'md',
  onAvatarChange,
  showUploadButton = true,
}: AvatarUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);

  // Size mapping for the uploader component
  const sizeMap = {
    sm: { width: 100, height: 100 },
    md: { width: 150, height: 150 },
    lg: { width: 200, height: 200 },
    xl: { width: 250, height: 250 },
  };

  const uploadAvatar = async (file: File | null) => {
    if (!file || !user) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await updateUserAvatar(user.id, file);

      if (result.error) {
        setError('Failed to upload avatar. Please try again.');
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: 'Could not upload your profile picture. Please try again.',
        });
        return;
      }

      if (result.fullPath) {
        setPreviewUrl(result.fullPath);
        
        toast({
          title: 'Avatar updated',
          description: 'Your profile picture has been successfully updated.',
        });

        if (onAvatarChange) {
          onAvatarChange(result.fullPath);
        }
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('An unexpected error occurred. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Upload error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    toast({
      variant: 'destructive',
      title: 'Invalid image',
      description: errorMessage,
    });
  };

  return (
    <div className="flex flex-col items-center">
      <ImageUpload
        initialImage={currentAvatarUrl}
        onChange={uploadAvatar}
        onError={handleError}
        width={sizeMap[size].width}
        height={sizeMap[size].height}
        shape="circle"
        hideControls={!showUploadButton}
        disabled={isUploading}
        maxSizeMB={2}
        acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
        label="Profile Picture"
        fallbackText="Upload Profile Picture"
      />
      
      {error && (
        <p className="text-destructive text-sm mt-2">{error}</p>
      )}
    </div>
  );
} 