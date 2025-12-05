/**
 * Application Configuration
 * 
 * This file manages environment-specific settings.
 * 
 * Environment variables (prefixed with EXPO_PUBLIC_ for Expo):
 * - EXPO_PUBLIC_API_URL: Backend API URL (e.g., http://localhost:3000/api)
 * - EXPO_PUBLIC_ENV: Environment name (development, production, staging)
 */

// Import Expo Constants to access app config extra fields
let Constants = null;
try {
  Constants = require('expo-constants').default;
} catch (e) {
  // Fallback if expo-constants is not available
}

// Get environment from app config extra, process.env, or default to production for builds
const getEnv = () => {
  // First check app config extra (set by EAS build)
  if (Constants?.expoConfig?.extra?.env) {
    return Constants.expoConfig.extra.env;
  }
  // Then check environment variables
  if (process.env.EXPO_PUBLIC_ENV) {
    return process.env.EXPO_PUBLIC_ENV;
  }
  // For builds, default to production (check if we're in a production build)
  try {
    // __DEV__ is a global variable in React Native/Expo
    if (typeof __DEV__ !== 'undefined' && !__DEV__) {
      return 'production';
    }
  } catch (e) {
    // __DEV__ might not be available in all contexts
  }
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  // Otherwise development
  return 'development';
};

const ENV = getEnv();

// Determine if we're in production
const isProduction = ENV === 'production';
const isDevelopment = ENV === 'development' || !isProduction;

// Default API URLs for different environments
const DEFAULT_API_URLS = {
  development: 'http://localhost:3000/api',
  staging: 'https://loyaltymanagement.onrender.com/api',
  production: 'https://loyaltymanagement.onrender.com/api',
};

// Get API URL from app config extra, environment variable, or use default based on ENV
const getApiUrl = () => {
  // First check app config extra (set by EAS build)
  if (Constants?.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }
  // Then check for explicit API URL in environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Otherwise, use default based on environment
  return DEFAULT_API_URLS[ENV] || DEFAULT_API_URLS.production;
};

// Configuration object
const config = {
  // Environment
  env: ENV,
  isProduction,
  isDevelopment,
  
  // API Configuration
  api: {
    baseUrl: getApiUrl(),
    timeout: 30000, // 30 seconds
  },
  
  // App Configuration
  app: {
    name: 'Loyalty MVP',
    version: '0.1.0',
  },
  
  // Feature Flags (if needed)
  features: {
    // Add feature flags here as needed
  },
};

// Log configuration in development (without sensitive data)
if (isDevelopment) {
  console.log('🔧 App Configuration:', {
    env: config.env,
    apiUrl: config.api.baseUrl,
  });
}

export default config;

