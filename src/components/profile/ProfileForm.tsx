import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getProfileById, updateProfile, isUsernameTaken, Profile } from '@/services/profileService';
import { AvatarUploader } from './AvatarUploader';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define a schema for profile validation
const profileFormSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(50, { message: 'Name cannot be longer than 50 characters.' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(30, { message: 'Username cannot be longer than 30 characters.' })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Username can only contain letters, numbers, underscores, and hyphens.',
    }),
  bio: z
    .string()
    .max(500, { message: 'Bio cannot be longer than 500 characters.' })
    .optional(),
  website: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .or(z.literal(''))
    .optional(),
  location: z
    .string()
    .max(100, { message: 'Location cannot be longer than 100 characters.' })
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState<string>('');

  // Initialize form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
      username: '',
      bio: '',
      website: '',
      location: '',
    },
    mode: 'onChange',
  });

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const profileData = await getProfileById(user.id);

        if (profileData) {
          setProfile(profileData);
          setOriginalUsername(profileData.username || '');
          
          // Update form with profile data
          form.reset({
            full_name: profileData.full_name || '',
            username: profileData.username || '',
            bio: profileData.bio || '',
            website: profileData.website || '',
            location: profileData.location || '',
          });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [user, form]);

  // Handle form submission
  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Check if username changed and if it's taken
      if (values.username !== originalUsername) {
        const taken = await isUsernameTaken(values.username, user.id);
        if (taken) {
          setError('This username is already taken. Please choose another one.');
          setIsLoading(false);
          return;
        }
      }

      // Update profile
      const result = await updateProfile({
        id: user.id,
        ...values,
      });

      if (!result.success) {
        setError('Failed to update profile. Please try again.');
        return;
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile information has been successfully updated.',
      });

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...values } : { id: user.id, ...values }));
      setOriginalUsername(values.username);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  // Show a loading state while fetching profile data
  if (isLoading && !profile) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center mb-8">
        <AvatarUploader 
          currentAvatarUrl={profile?.avatar_url} 
          size="md"
          onAvatarChange={(url) => {
            setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
          }}
        />
        <p className="text-sm text-muted-foreground mt-3">
          Click on the image to upload a new profile picture
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public username that will be used in URLs.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a little bit about yourself"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Brief description for your profile. Max 500 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormDescription>
                  Your personal or professional website.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="San Francisco, CA" {...field} />
                </FormControl>
                <FormDescription>
                  Where you are based. This is optional and will be publicly visible.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              disabled={!form.formState.isDirty}
            >
              Save Changes
            </LoadingButton>
          </div>
        </form>
      </Form>
    </div>
  );
} 