# Firebase Setup Guide for Qiimeet

## Current Status
The app is currently configured to use Expo's push notification service without Firebase. This approach works for both development and production.

## If you want to use Firebase (Optional)

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Add your Android and iOS apps to the project

### 2. Download Configuration Files
- **Android**: Download `google-services.json` and place it in `android/app/`
- **iOS**: Download `GoogleService-Info.plist` and place it in the root directory

### 3. Update app.json
Add the Firebase configuration back to `app.json`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/messaging"
    ]
  }
}
```

### 4. Install Firebase Dependencies
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 5. Update notificationService.js
Replace the current token registration with Firebase implementation.

## Current Implementation
The app currently uses Expo's push notification service which:
- Works without Firebase configuration
- Supports both development and production
- Uses your EAS project ID for token generation
- Is simpler to set up and maintain

## Testing Notifications
1. Run the app on a physical device
2. Check the console logs for push token generation
3. Verify the token is saved to your backend
4. Test sending notifications from your backend 