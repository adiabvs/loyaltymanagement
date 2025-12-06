#!/bin/bash

# Build Production APK using React Native CLI
# This script generates native folders and builds APK for production

set -e

echo "🚀 Building Production APK with React Native CLI"
echo "=================================================="

# Step 1: Set production environment
export NODE_ENV=production
export EXPO_PUBLIC_ENV=production
export EXPO_PUBLIC_API_URL=https://loyaltymanagement.onrender.com/api

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔧 Step 2: Generating native Android project..."
npx expo prebuild --platform android --clean

echo ""
echo "📱 Step 3: Building production APK..."
cd android

# Build release APK
./gradlew assembleRelease

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 APK Location:"
echo "   android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "To install on device:"
echo "   adb install android/app/build/outputs/apk/release/app-release.apk"
echo ""

cd ..



