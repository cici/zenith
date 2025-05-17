-- NOTE: Buckets are created via the Supabase JS API, not SQL.
-- See src/services/storageService.ts for implementation.
-- 
-- Bucket creation and configuration happens through the Supabase JavaScript API:
-- 
-- const { error } = await supabase.storage.createBucket('bucket_name', {
--   public: false,
--   fileSizeLimit: 1024 * 1024 * 2,
--   allowedMimeTypes: ['image/png', 'image/jpeg']
-- });
--
-- Buckets needed for this application:
-- - avatars: For user profile pictures (private)
-- - public: For publicly accessible files
-- - temp: For temporary file uploads

-- The following RLS policies can be applied manually through the Supabase dashboard
-- or via the migration script in your Supabase project

-- Security policies for avatars bucket

-- Anyone can view avatar files (needed for public profile pictures)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Only authenticated users can upload avatars with size and type restrictions
CREATE POLICY "Users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    octet_length(content) <= 2097152 AND
    (
        mime_type = 'image/jpeg' OR
        mime_type = 'image/png' OR
        mime_type = 'image/gif' OR
        mime_type = 'image/webp'
    )
);

-- Only users can update their own avatars (path must start with their user ID)
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Only users can delete their own avatars (path must start with their user ID)
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Security policies for public bucket

-- Anyone can view public files
CREATE POLICY "Public files are viewable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'public');

-- Only authenticated users can upload to public bucket
CREATE POLICY "Only authenticated users can upload public files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'public' AND
    octet_length(content) <= 10485760
);

-- Only the owner can update their files in public bucket
CREATE POLICY "Only owners can update their public files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'public' AND
    owner = auth.uid()
);

-- Only the owner can delete their files in public bucket
CREATE POLICY "Only owners can delete their public files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'public' AND
    owner = auth.uid()
);

-- Security policies for temp bucket

-- Only authenticated users can upload to temp bucket (files here are temporary)
CREATE POLICY "Only authenticated users can upload temp files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'temp' AND
    octet_length(content) <= 10485760
);

-- Only owners can view their temp files
CREATE POLICY "Only owners can view their temp files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'temp' AND
    owner = auth.uid()
);

-- Auto-delete files in temp bucket after 24 hours
-- Note: Requires pg_cron extension to be enabled
-- If pg_cron is available, uncomment the following:

/*
SELECT cron.schedule('cleanup-temp-bucket', '0 0 * * *', $$
  DELETE FROM storage.objects
  WHERE bucket_id = 'temp' AND created_at < now() - interval '24 hours'
$$);
*/ 