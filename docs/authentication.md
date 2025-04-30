# Authentication Documentation

## Overview

Zenith uses Supabase for authentication, providing a secure and scalable authentication system. This document outlines the authentication flows, available API endpoints, and implementation details.

## Authentication Flow

### Email/Password Authentication

1. **Sign Up Flow**:
   ```mermaid
   sequenceDiagram
       Client->>Supabase: POST /auth/v1/signup
       Note over Supabase: Validate credentials
       Supabase->>Database: Create user record
       Supabase-->>Client: Return user data
       Note over Client: Store session
   ```

2. **Sign In Flow**:
   ```mermaid
   sequenceDiagram
       Client->>Supabase: POST /auth/v1/token
       Note over Supabase: Validate credentials
       Supabase-->>Client: Return access token
       Note over Client: Store token & session
   ```

3. **Password Reset Flow**:
   ```mermaid
   sequenceDiagram
       Client->>Supabase: POST /auth/v1/recover
       Supabase->>User: Send reset email
       User->>Client: Click reset link
       Client->>Supabase: POST /auth/v1/user
       Supabase-->>Client: Confirm reset
   ```

## API Endpoints

### Base URL
All endpoints are prefixed with your Supabase project URL:
```
https://[PROJECT_ID].supabase.co
```

### Required Headers
All requests must include:
```http
apikey: [SUPABASE_ANON_KEY]
Content-Type: application/json
```

Authenticated endpoints also require:
```http
Authorization: Bearer [ACCESS_TOKEN]
```

### Endpoints

#### 1. Sign Up
- **URL**: `/auth/v1/signup`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "data": {
      "full_name": "User Name"
    }
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "id": "user_id",
    "email": "user@example.com",
    "access_token": "jwt_token"
  }
  ```

#### 2. Sign In
- **URL**: `/auth/v1/token?grant_type=password`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "jwt_token",
    "token_type": "bearer",
    "expires_in": 3600
  }
  ```

#### 3. Get User
- **URL**: `/auth/v1/user`
- **Method**: `GET`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  {
    "id": "user_id",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "User Name"
    }
  }
  ```

#### 4. Reset Password Request
- **URL**: `/auth/v1/recover`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**: `200 OK`

#### 5. Update User
- **URL**: `/auth/v1/user`
- **Method**: `PUT`
- **Auth**: Required
- **Body**:
  ```json
  {
    "email": "newemail@example.com",
    "data": {
      "full_name": "Updated Name"
    }
  }
  ```
- **Response**: `200 OK`

#### 6. Sign Out
- **URL**: `/auth/v1/logout`
- **Method**: `POST`
- **Auth**: Required
- **Response**: `204 No Content`

## Error Handling

### Common Error Codes
- `400`: Invalid request parameters
- `401`: Unauthorized (invalid/expired token)
- `404`: Resource not found
- `409`: Email already registered
- `422`: Validation error

### Error Response Format
```json
{
  "error": "error_code",
  "message": "Human readable message",
  "status": 400
}
```

## Security Considerations

1. **Password Requirements**:
   - Minimum 12 characters
   - Must include uppercase and lowercase letters
   - Must include numbers
   - Must include special characters

2. **Token Management**:
   - Access tokens expire after 1 hour
   - Refresh tokens are automatically rotated
   - Store tokens securely in memory or secure storage

3. **Rate Limiting**:
   - Sign-in attempts are limited to 10 per minute
   - Password reset requests are limited to 3 per hour

## Testing

### Postman Collection
A Postman collection is available at `postman/Zenith-Auth.postman_collection.json` for testing all authentication endpoints.

To use:
1. Import the collection and environment files
2. Set your Supabase credentials in the environment
3. Follow the testing sequence:
   - Sign Up → Sign In → Get User → Update User → Sign Out

### Environment Setup
Configure the following environment variables:
```json
{
  "SUPABASE_URL": "your_project_url",
  "SUPABASE_ANON_KEY": "your_anon_key",
  "ACCESS_TOKEN": "obtained_after_login"
}
```

## Client Implementation

### React Hook Example
```typescript
import { supabase } from '../services/supabase';

export const useAuth = () => {
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { signIn, signUp, signOut };
};
```

## Best Practices

1. **Security**:
   - Never store tokens in localStorage
   - Use secure HTTP-only cookies
   - Implement CSRF protection
   - Enable MFA when possible

2. **UX**:
   - Provide clear error messages
   - Show password strength indicators
   - Implement progressive loading states
   - Handle offline scenarios gracefully

3. **Maintenance**:
   - Monitor auth logs regularly
   - Implement session timeouts
   - Regular security audits
   - Keep dependencies updated

## Troubleshooting

### Common Issues

1. **Token Expired**
   - Symptom: 401 Unauthorized
   - Solution: Refresh token or re-authenticate

2. **Invalid Credentials**
   - Symptom: 400 Bad Request
   - Solution: Verify email/password format

3. **Rate Limited**
   - Symptom: 429 Too Many Requests
   - Solution: Implement exponential backoff

### Debug Checklist
- Verify environment variables
- Check token expiration
- Validate request headers
- Monitor network requests
- Check browser console
- Verify CORS settings 