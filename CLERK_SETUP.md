# Clerk Setup Guide

## Current Configuration

The app is now configured with the official Clerk token cache and proper SSO implementation.

## Required Clerk Dashboard Configuration

To make Google OAuth work properly, you need to configure the following in your Clerk dashboard:

### 1. OAuth Settings
1. Go to your Clerk Dashboard
2. Navigate to "User & Authentication" > "Social Connections"
3. Enable Google OAuth
4. Add your Google OAuth credentials (Client ID and Client Secret)
5. **Important**: Ensure the following scopes are configured for Google OAuth:
   - `email` - Required to get user's email address
   - `profile` - Required to get user's name and profile information
   - `openid` - Required for OAuth 2.0 authentication

### 2. Redirect URLs
Add the following redirect URLs to your Clerk application:
- `qiimeet://auth/callback`
- `exp://localhost:8081/--/auth/callback` (for development)

### 3. Allowed Origins
Add your app's domain to the allowed origins:
- `localhost:8081` (for development)
- Your production domain

## Current Implementation

The app now uses:
- Official `tokenCache` from `@clerk/clerk-expo/token-cache`
- Proper SSO flow without custom redirect URLs
- Secure token storage with expo-secure-store

## Testing

To test the implementation:
1. Run the app
2. Check console logs for "Testing Clerk token cache..."
3. Try Google sign-in
4. Verify that tokens are properly stored and retrieved

## Troubleshooting

If you still get errors:
1. Check that Google OAuth is properly configured in Clerk dashboard
2. Verify redirect URLs are added to Clerk settings
3. Ensure the publishable key is correct
4. Check that expo-secure-store is working properly 