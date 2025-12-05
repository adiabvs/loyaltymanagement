# Configuration Guide

## Overview

The frontend uses a centralized configuration system located in `src/config/index.js`. This allows you to easily manage different backend URLs for development, staging, and production environments.

## Quick Start

### For Local Development

1. Create a `.env` file in the `frontend` directory:
```env
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

2. Start the app:
```bash
npm start
```

### For Production

1. Set environment variables:
```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

2. Build the app:
```bash
eas build --platform android
eas build --platform ios
```

## Configuration Methods

### Method 1: Environment Variables (Recommended)

Create a `.env` file with:
```env
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Advantages:**
- Easy to switch between environments
- No code changes needed
- Can be different per developer

### Method 2: Config File

Edit `src/config/index.js` and update the `DEFAULT_API_URLS` object:

```javascript
const DEFAULT_API_URLS = {
  development: 'http://localhost:3000/api',
  staging: 'https://staging-api.yourdomain.com/api',
  production: 'https://api.yourdomain.com/api',
};
```

**Note:** Environment variables take precedence over config file defaults.

## Mobile Device Testing

When testing on a physical device, you need to use your computer's IP address instead of `localhost`.

### Find Your IP Address

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
# Look for inet address (not 127.0.0.1)
```

### Update .env

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

Replace `192.168.1.100` with your actual IP address.

## Environment Detection

The config automatically detects the environment:

1. Checks `EXPO_PUBLIC_ENV` environment variable
2. Falls back to `NODE_ENV`
3. Defaults to `development`

## Available Settings

### API Configuration

- `config.api.baseUrl` - Backend API base URL
- `config.api.timeout` - Request timeout (default: 30 seconds)

### Environment Info

- `config.env` - Current environment name
- `config.isProduction` - Boolean for production check
- `config.isDevelopment` - Boolean for development check

## Example Usage

```javascript
import config from './config';

// Use API URL
const apiUrl = config.api.baseUrl;

// Check environment
if (config.isDevelopment) {
  console.log('Running in development mode');
}

// Access app info
console.log(config.app.name); // "Loyalty MVP"
```

## Troubleshooting

### API Connection Fails

1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check `.env` file exists and has correct URL
3. For mobile: Ensure IP address is correct and devices are on same network
4. Check firewall isn't blocking port 3000

### Environment Not Detected

- Ensure `.env` file is in `frontend/` directory
- Restart Expo dev server after changing `.env`
- Check variable names start with `EXPO_PUBLIC_`

### Config Not Updating

- Clear Expo cache: `npx expo start -c`
- Restart Metro bundler
- Rebuild app if using production build

