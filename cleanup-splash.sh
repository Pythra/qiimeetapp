#!/bin/bash

echo "🧹 Cleaning up splash screen configurations..."

# Remove bootsplash package
echo "📦 Removing react-native-bootsplash package..."
npm uninstall react-native-bootsplash

# Clean npm cache
echo "🗑️ Cleaning npm cache..."
npm cache clean --force

# Remove node_modules and reinstall
echo "🗂️ Removing node_modules..."
rm -rf node_modules
rm -rf package-lock.json

# Reinstall dependencies
echo "📥 Reinstalling dependencies..."
npm install

echo "✅ Cleanup complete! Custom splash screen is now active."
echo "🚀 The app will now show a custom splash screen until Home.js initialization is complete."
