import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for upload response
 */
export interface UploadResponse {
  path?: string;
  error?: Error | null;
  fullPath?: string;
  filename?: string;
}

/**
 * Supabase storage buckets used in the app
 */
export enum StorageBucket {
  AVATARS = 'avatars',
  TEMP = 'temp',
  PUBLIC = 'public',
}

/**
 * Creates necessary storage buckets if they don't exist
 */
export async function createBucketsIfNeeded(): Promise<void> {
  try {
    // Create avatars bucket if it doesn't exist
    const { error: avatarsError } = await supabase.storage.createBucket(
      StorageBucket.AVATARS, 
      { 
        public: false,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']  
      }
    );
    
    if (avatarsError && !avatarsError.message.includes('already exists')) {
      console.error('Error creating avatars bucket:', avatarsError);
    }

    // Create public bucket if it doesn't exist
    const { error: publicError } = await supabase.storage.createBucket(
      StorageBucket.PUBLIC, 
      { 
        public: true,
        fileSizeLimit: 1024 * 1024 * 10, // 10MB
      }
    );

    if (publicError && !publicError.message.includes('already exists')) {
      console.error('Error creating public bucket:', publicError);
    }

    // Create temp bucket for temporary files
    const { error: tempError } = await supabase.storage.createBucket(
      StorageBucket.TEMP, 
      { 
        public: false,
        fileSizeLimit: 1024 * 1024 * 10, // 10MB
      }
    );

    if (tempError && !tempError.message.includes('already exists')) {
      console.error('Error creating temp bucket:', tempError);
    }
  } catch (error) {
    console.error('Error creating storage buckets:', error);
  }
}

/**
 * Uploads an image to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket to upload to
 * @param path Optional path within the bucket
 * @param userId User ID for path construction
 * @returns Information about the uploaded file or error
 */
export async function uploadImage(
  file: File, 
  bucket: StorageBucket = StorageBucket.AVATARS,
  path: string = '',
  userId?: string
): Promise<UploadResponse> {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Create path based on user if available
    const filePath = userId
      ? `${userId}/${path ? path + '/' : ''}${fileName}`
      : `${path ? path + '/' : ''}${fileName}`;

    // Upload the file
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Return the path to the file
    return {
      path: filePath,
      fullPath: getPublicUrl(bucket, filePath),
      filename: fileName,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { error: error instanceof Error ? error : new Error('Unknown upload error') };
  }
}

/**
 * Updates a user's avatar image
 * @param userId The user's ID
 * @param file The image file to upload as avatar
 * @returns Information about the uploaded file or error
 */
export async function updateUserAvatar(
  userId: string, 
  file: File
): Promise<UploadResponse> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!file) {
      throw new Error('No file provided');
    }

    // Check if user has an existing avatar to delete
    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    const existingAvatar = profileData?.avatar_url;
    
    // Extract existing path if it exists
    if (existingAvatar) {
      const pathMatch = existingAvatar.match(/avatars\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        // Delete the existing avatar
        await supabase.storage
          .from(StorageBucket.AVATARS)
          .remove([pathMatch[1]]);
      }
    }

    // Upload new avatar
    const result = await uploadImage(file, StorageBucket.AVATARS, 'avatar', userId);
    
    if (result.error) {
      throw result.error;
    }

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: result.fullPath,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return result;
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return { error: error instanceof Error ? error : new Error('Unknown error updating avatar') };
  }
}

/**
 * Get a public URL for a file in storage
 * @param bucket The storage bucket
 * @param path The path to the file within the bucket
 * @returns The public URL for the file
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Deletes a file from storage
 * @param bucket The storage bucket containing the file
 * @param path The path to the file within the bucket
 * @returns Success status and any error
 */
export async function deleteFile(
  bucket: StorageBucket, 
  path: string
): Promise<{ success: boolean; error?: Error }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error(`Error deleting file from ${bucket}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error deleting file') 
    };
  }
}

/**
 * Fetch a list of files in a bucket
 * @param bucket The storage bucket
 * @param path Optional path within the bucket
 * @returns List of files or error
 */
export async function listFiles(
  bucket: StorageBucket, 
  path: string = ''
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      throw error;
    }

    return { data };
  } catch (error) {
    console.error('Error listing files:', error);
    return { 
      error: error instanceof Error ? error : new Error('Unknown error listing files') 
    };
  }
} 