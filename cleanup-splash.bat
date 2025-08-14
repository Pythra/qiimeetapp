@echo off
echo 🧹 Cleaning up splash screen configurations...

REM Remove bootsplash package
echo 📦 Removing react-native-bootsplash package...
npm uninstall react-native-bootsplash

REM Clean npm cache
echo 🗑️ Cleaning npm cache...
npm cache clean --force

REM Remove node_modules and reinstall
echo 🗂️ Removing node_modules...
rmdir /s /q node_modules
del package-lock.json

REM Reinstall dependencies
echo 📥 Reinstalling dependencies...
npm install

echo ✅ Cleanup complete! Custom splash screen is now active.
echo 🚀 The app will now show a custom splash screen until Home.js initialization is complete.
pause
