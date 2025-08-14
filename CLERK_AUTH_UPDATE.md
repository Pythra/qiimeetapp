# Clerk Auth Configuration Update

## Overview
Updated Clerk authentication configuration to use `fallbackRedirectUrl` instead of `redirectUrl` for better OAuth handling and compatibility. Also removed deprecated `afterSignInUrl` and `afterSignUpUrl` props as they are no longer needed with `fallbackRedirectUrl`.

## Changes Made

### 1. App.js Updates
- **File**: `App.js`
- **Changes**: Replaced all instances of `redirectUrl` with `fallbackRedirectUrl`
- **Locations**:
  - `oauthOptions.google.fallbackRedirectUrl`
  - `oauthOptions.facebook.fallbackRedirectUrl`
  - `fallbackRedirectUrl` prop on ClerkProvider

### 2. Signup Index.js Updates
- **File**: `screens/intro/signup/index.js`
- **Changes**: Updated OAuth flow configuration
- **Locations**:
  - Variable name: `redirectUrl` → `fallbackRedirectUrl`
  - Console log: "Redirect URL" → "Fallback Redirect URL"
  - startSSOFlow parameter: `redirectUrl` → `fallbackRedirectUrl`

### 3. Deprecated Props Removal
- **File**: `App.js`
- **Changes**: Removed deprecated `afterSignInUrl` and `afterSignUpUrl` props
- **Reason**: These props are deprecated and `fallbackRedirectUrl` handles both sign-in and sign-up cases

## Why This Change?

### Benefits of `fallbackRedirectUrl`
1. **Better OAuth Handling**: `fallbackRedirectUrl` is the recommended approach for Clerk OAuth flows
2. **Improved Compatibility**: Works better across different platforms and OAuth providers
3. **Fallback Behavior**: Provides a fallback URL when the primary OAuth flow fails
4. **Future-Proof**: Aligns with Clerk's latest best practices

### What `fallbackRedirectUrl` Does
- Serves as a backup redirect destination for OAuth flows
- Ensures users are redirected to the correct location even if the primary OAuth flow encounters issues
- Maintains the same user experience while improving reliability

## Configuration Details

### OAuth Options
```javascript
oauthOptions={{
  google: {
    scopes: ['email', 'profile', 'openid'],
    fallbackRedirectUrl: 'qiimeet://oauth-callback',
  },
  facebook: {
    scopes: ['email', 'public_profile'],
    fallbackRedirectUrl: 'qiimeet://oauth-callback',
  }
}}
```

### ClerkProvider Props
```javascript
<ClerkProvider
  fallbackRedirectUrl="qiimeet://oauth-callback"
>
```

### OAuth Flow Configuration
```javascript
const fallbackRedirectUrl = AuthSession.makeRedirectUri({
  scheme: 'qiimeet',
  path: 'oauth-callback',
  queryParams: {
    callback: 'true'
  }
});

const oauthPromise = startSSOFlow({
  strategy: strategy,
  fallbackRedirectUrl: fallbackRedirectUrl,
});
```

## Notes

- **No Breaking Changes**: This update maintains the same OAuth flow behavior
- **Improved Reliability**: Better handling of edge cases in OAuth flows
- **Maintained URLs**: All redirect URLs remain the same (`qiimeet://oauth-callback`)
- **Backward Compatible**: Existing OAuth flows will continue to work

## Testing

After this update, test the following OAuth flows:
1. Google Sign-In
2. Facebook Sign-In
3. OAuth callback handling
4. Deep link navigation

Ensure that users are properly redirected after OAuth completion and that the fallback behavior works as expected.
