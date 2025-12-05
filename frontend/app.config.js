/**
 * Expo App Configuration
 * This file dynamically configures the app based on environment
 */

const ENV = process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV || 'production';

// API URLs for different environments
const API_URLS = {
  development: 'http://localhost:3000/api',
  staging: 'https://loyaltymanagement.onrender.com/api',
  production: 'https://loyaltymanagement.onrender.com/api',
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || API_URLS[ENV] || API_URLS.production;

export default {
  expo: {
    name: "Loyalty MVP",
    slug: "loyalty-mvp",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#05060A"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.loyaltymvp.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#05060A"
      },
      package: "com.loyaltymvp.app",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      bundler: "metro",
      favicon: "./assets/icon.png"
    },
    plugins: [
      "expo-asset",
      [
        "expo-barcode-scanner",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera to scan QR codes."
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.0.21",
            gradleProperties: {
              "kotlin.version": "2.0.21"
            }
          }
        }
      ]
    ],
    extra: {
      apiUrl: API_URL,
      env: ENV,
      eas: {
        projectId: "27c95806-3bb2-4691-b7be-9f0a790d0a17"
      }
    }
  }
};

