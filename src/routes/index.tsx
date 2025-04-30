import { createBrowserRouter } from 'react-router-dom';
import { AuthCallback } from './AuthCallback';

export const router = createBrowserRouter([
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  // ... existing routes ...
]); 