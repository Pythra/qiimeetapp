# Image Loading Troubleshooting Guide

## Issue Description
Images are not displaying in the latest Android build, particularly profile pictures from CloudFront.

## Root Causes Identified & Fixed

### 1. **Network Security Configuration Missing**
- **Problem**: Android 9+ (API 28+) requires explicit network security configuration
- **Solution**: Created `network_security_config.xml` with proper domain configurations
- **File**: `android/app/src/main/res/xml/network_security_config.xml`

### 2. **Missing usesCleartextTraffic**
- **Problem**: Android 9+ blocks cleartext traffic by default
- **Solution**: Added `android:usesCleartextTraffic="true"` to AndroidManifest.xml
- **Location**: `android/app/src/main/AndroidManifest.xml`

### 3. **ProGuard Obfuscation**
- **Problem**: Network-related classes being obfuscated in release builds
- **Solution**: Added ProGuard rules to keep network and image-related classes
- **File**: `android/app/proguard-rules.pro`

### 4. **Bootsplash Configuration Conflicts**
- **Problem**: Removed bootsplash configuration that could interfere with image loading
- **Solution**: Cleaned up app.json and removed bootsplash plugin

## Configuration Changes Made

### Network Security Config
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">qiimeet-backend.fly.dev</domain>
        <domain includeSubdomains="true">d11n4tndq0o4wh.cloudfront.net</domain>
        <domain includeSubdomains="true">clerk.accounts.dev</domain>
        <domain includeSubdomains="true">api.clerk.dev</domain>
        <domain includeSubdomains="true">accounts.clerk.dev</domain>
    </domain-config>
    
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>
```

### AndroidManifest.xml Updates
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="true"
    ...>
```

### ProGuard Rules
```proguard
# Keep network-related classes
-keep class com.facebook.react.modules.network.** { *; }
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Keep React Native Image components
-keep class com.facebook.react.views.image.** { *; }
-keep class com.facebook.drawee.** { *; }
-keep class com.facebook.imagepipeline.** { *; }
```

## Image Loading Flow

### Current Implementation
```javascript
const getProfileImage = (user) => {
  const cloudFrontUrl = 'https://d11n4tndq0o4wh.cloudfront.net';
  let profilePic = user.profilePictures;
  
  if (Array.isArray(profilePic) && profilePic.length > 0) {
    profilePic = profilePic[0];
  }
  
  if (profilePic) {
    if (profilePic.startsWith('/uploads/')) {
      return `${cloudFrontUrl}${profilePic}`;
    }
    if (profilePic.startsWith('http')) {
      return profilePic;
    }
    if (!profilePic.startsWith('/')) {
      return `${cloudFrontUrl}/uploads/images/${profilePic}`;
    }
    return profilePic;
  }
  
  return require('../../assets/model.jpg');
};
```

## Testing Steps

### 1. **Clean Build**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 2. **Verify Network Security**
- Check if `network_security_config.xml` exists in `android/app/src/main/res/xml/`
- Verify AndroidManifest.xml has the network security config reference

### 3. **Test Image Loading**
- Check browser console for network errors
- Verify CloudFront URLs are accessible
- Test with different image formats (JPG, PNG, WebP)

### 4. **Debug Network Requests**
```javascript
// Add to getProfileImage function for debugging
console.log('Profile pic:', profilePic);
console.log('Final URL:', finalUrl);
```

## Common Issues & Solutions

### Issue: Images not loading in release build
**Solution**: Check ProGuard rules and ensure network classes are preserved

### Issue: Network security policy errors
**Solution**: Verify network security config is properly referenced in manifest

### Issue: CloudFront access denied
**Solution**: Check CloudFront distribution settings and CORS configuration

### Issue: Images loading in debug but not release
**Solution**: Ensure ProGuard is not stripping network-related code

## CloudFront Configuration Check

### Required Headers
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: *
```

### Cache Policy
- Ensure CloudFront is not blocking requests
- Check if images are being served from the correct origin
- Verify CloudFront distribution is active and accessible

## Additional Debugging

### Enable Network Logging
```javascript
// Add to App.js or Home.js for debugging
console.log('API Base URL:', API_BASE_URL);
console.log('CloudFront URL:', 'https://d11n4tndq0o4wh.cloudfront.net');
```

### Test Direct URLs
- Try accessing CloudFront URLs directly in browser
- Verify image paths are correct
- Check if backend is returning proper image URLs

## Next Steps

1. **Clean and rebuild** the Android project
2. **Test image loading** in both debug and release builds
3. **Monitor network requests** in Android Studio or browser dev tools
4. **Verify CloudFront** distribution is working correctly
5. **Check backend** image upload and URL generation

## Contact Support

If issues persist after implementing these fixes:
1. Check Android Studio logs for specific error messages
2. Verify CloudFront distribution status
3. Test with a simple image URL to isolate the issue
4. Check if the issue is specific to certain Android versions
