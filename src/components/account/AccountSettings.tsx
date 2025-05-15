import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { changePassword, updateEmail, deleteAccount } from '@/services/accountService';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Password schema with validation
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Email schema with validation
const emailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required for verification'),
});

// Account deletion schema
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for verification'),
  confirmDelete: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'Please type DELETE MY ACCOUNT to confirm' }),
  }),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type EmailFormData = z.infer<typeof emailSchema>;
type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

export const AccountSettings: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('password');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: user?.email || '',
      password: '',
    },
  });
  
  // Delete account form
  const deleteForm = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmDelete: '' as any,
    },
  });
  
  // Handle password change
  const handlePasswordChange = async (data: PasswordFormData) => {
    try {
      setPasswordStatus(null);
      
      const { success, error } = await changePassword(
        data.currentPassword,
        data.newPassword
      );
      
      if (success) {
        setPasswordStatus({
          type: 'success',
          message: 'Password changed successfully',
        });
        passwordForm.reset();
      } else {
        setPasswordStatus({
          type: 'error',
          message: error.message || 'Failed to change password',
        });
      }
    } catch (error) {
      setPasswordStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };
  
  // Handle email update
  const handleEmailUpdate = async (data: EmailFormData) => {
    try {
      setEmailStatus(null);
      
      const { success, error, message } = await updateEmail(
        data.newEmail,
        data.password
      );
      
      if (success) {
        setEmailStatus({
          type: 'success',
          message: message || 'Verification email sent. Please check your inbox.',
        });
        emailForm.reset({
          newEmail: data.newEmail,
          password: '',
        });
      } else {
        setEmailStatus({
          type: 'error',
          message: error.message || 'Failed to update email',
        });
      }
    } catch (error) {
      setEmailStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async (data: DeleteAccountFormData) => {
    try {
      setDeleteStatus(null);
      
      const { success, error } = await deleteAccount(data.password);
      
      if (success) {
        setDeleteStatus({
          type: 'success',
          message: 'Account deleted successfully',
        });
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setDeleteStatus({
          type: 'error',
          message: error.message || 'Failed to delete account',
        });
      }
    } catch (error) {
      setDeleteStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };
  
  if (!user) {
    return (
      <Alert variant="destructive">Please log in to access account settings</Alert>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="password">Change Password</TabsTrigger>
          <TabsTrigger value="email">Email Settings</TabsTrigger>
          <TabsTrigger value="delete">Delete Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="password">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Change Password</h2>
              
              {passwordStatus && (
                <Alert 
                  variant={passwordStatus.type === 'success' ? 'default' : 'destructive'}
                  className="mb-4"
                >
                  {passwordStatus.message}
                </Alert>
              )}
              
              <form 
                onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                className="space-y-4"
              >
                <div>
                  <Input
                    placeholder="Current Password"
                    type="password"
                    {...passwordForm.register('currentPassword')}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Input
                    placeholder="New Password"
                    type="password"
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Input
                    placeholder="Confirm New Password"
                    type="password"
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={passwordForm.formState.isSubmitting || !passwordForm.formState.isDirty}
                >
                  {passwordForm.formState.isSubmitting ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
              
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p>Password requirements:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>At least 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="email">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Email Settings</h2>
              
              {emailStatus && (
                <Alert 
                  variant={emailStatus.type === 'success' ? 'default' : 'destructive'}
                  className="mb-4"
                >
                  {emailStatus.message}
                </Alert>
              )}
              
              <form
                onSubmit={emailForm.handleSubmit(handleEmailUpdate)}
                className="space-y-4"
              >
                <div>
                  <Input
                    placeholder="Current Email"
                    type="email"
                    value={user.email || ''}
                    disabled
                  />
                </div>
                
                <div>
                  <Input
                    placeholder="New Email"
                    type="email"
                    {...emailForm.register('newEmail')}
                  />
                  {emailForm.formState.errors.newEmail && (
                    <p className="text-sm text-red-500 mt-1">
                      {emailForm.formState.errors.newEmail.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Input
                    placeholder="Password (for verification)"
                    type="password"
                    {...emailForm.register('password')}
                  />
                  {emailForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {emailForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={emailForm.formState.isSubmitting || !emailForm.formState.isDirty}
                >
                  {emailForm.formState.isSubmitting ? 'Updating...' : 'Update Email'}
                </Button>
              </form>
              
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  A verification email will be sent to your new address.
                  You must click the link in that email to complete the update.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="delete">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-500">Delete Account</h2>
              
              {deleteStatus && (
                <Alert 
                  variant={deleteStatus.type === 'success' ? 'default' : 'destructive'}
                  className="mb-4"
                >
                  {deleteStatus.message}
                </Alert>
              )}
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-6 text-red-800 dark:text-red-300">
                <p className="font-medium">Warning: This action cannot be undone!</p>
                <p className="mt-1">
                  Deleting your account will permanently remove all your data, including:
                </p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Profile information</li>
                  <li>Uploaded files and images</li>
                  <li>Preferences and settings</li>
                  <li>Activity history</li>
                </ul>
              </div>
              
              <form
                onSubmit={deleteForm.handleSubmit(handleDeleteAccount)}
                className="space-y-4"
              >
                <div>
                  <Input
                    placeholder="Password (for verification)"
                    type="password"
                    {...deleteForm.register('password')}
                  />
                  {deleteForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {deleteForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Input
                    placeholder="Type DELETE MY ACCOUNT to confirm"
                    {...deleteForm.register('confirmDelete')}
                  />
                  {deleteForm.formState.errors.confirmDelete && (
                    <p className="text-sm text-red-500 mt-1">
                      {deleteForm.formState.errors.confirmDelete.message}
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={deleteForm.formState.isSubmitting || !deleteForm.formState.isDirty}
                >
                  {deleteForm.formState.isSubmitting ? 'Deleting...' : 'Permanently Delete Account'}
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 