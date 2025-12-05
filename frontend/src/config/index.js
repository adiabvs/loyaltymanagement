/**
 * Application Configuration
 * 
 * This file manages environment-specific settings.
 * 
 * Environment variables (prefixed with EXPO_PUBLIC_ for Expo):
 * - EXPO_PUBLIC_API_URL: Backend API URL (e.g., http://localhost:3000/api)
 * - EXPO_PUBLIC_ENV: Environment name (development, production, staging)
 */

// Get environment from process.env or default to development
const ENV = process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV || 'development';

// Determine if we're in production
const isProduction = ENV === 'production';
const isDevelopment = ENV === 'development' || !isProduction;

// Default API URLs for different environments
const DEFAULT_API_URLS = {
  development: 'http://localhost:3000/api',
  staging: 'https://staging-api.yourdomain.com/api',
  production: 'https://api.yourdomain.com/api',
};

// Get API URL from environment variable or use default based on ENV
const getApiUrl = () => {
  // First, check for explicit API URL in environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Otherwise, use default based on environment
  return DEFAULT_API_URLS[ENV] || DEFAULT_API_URLS.development;
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

