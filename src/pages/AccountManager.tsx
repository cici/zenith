import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/layouts/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings } from '@/components/account/AccountSettings';
import { SessionManagement } from '@/components/account/SessionManagement';
import { ActivityHistory } from '@/components/account/ActivityHistory';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Alert } from '@/components/ui/alert';
import { updateSessionActivity } from '@/services/accountService';

const AccountManagerPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');
  
  // Update session activity when the page is loaded
  useEffect(() => {
    if (user) {
      updateSessionActivity().catch(error => {
        console.error('Failed to update session activity:', error);
      });
    }
  }, [user]);
  
  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            Please log in to access account management features
          </Alert>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Account Management</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <AccountSettings />
          </TabsContent>
          
          <TabsContent value="sessions">
            <SessionManagement />
          </TabsContent>
          
          <TabsContent value="activity">
            <ActivityHistory limit={15} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

// Wrap the page with ProtectedRoute to ensure authentication
export default function WrappedAccountManagerPage() {
  return (
    <ProtectedRoute>
      <AccountManagerPage />
    </ProtectedRoute>
  );
} 