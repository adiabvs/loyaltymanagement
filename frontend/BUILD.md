# Building APK for Production

This guide explains how to build a production APK file with production API endpoints.

## Prerequisites

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo account:**
   ```bash
   eas login
   ```

3. **Configure EAS project (if not already done):**
   ```bash
   eas build:configure
   ```

## Building the APK

### Option 1: Build on EAS servers (Recommended)

This builds the APK on Expo's cloud servers:

```bash
cd frontend
npm run build:android
```

This will:
- Use production configuration
- Set API URL to: `https://loyaltymanagement.onrender.com/api`
- Generate an APK file
- Upload it to Expo servers for download

### Option 2: Build locally

If you want to build on your local machine:

```bash
cd frontend
npm run build:android:local
```

**Note:** Local builds require Android SDK and build tools to be installed.

### Option 3: Preview build (for testing)

Build a preview APK with production config:

```bash
cd frontend
npm run build:android:preview
```

## Configuration

The production build uses the following configuration:

- **Environment:** `production`
- **API URL:** `https://loyaltymanagement.onrender.com/api`
- **Build Type:** APK (Android Package)

These settings are defined in:
- `eas.json` - EAS build configuration
- `app.config.js` - Expo app configuration
- `src/config/index.js` - Runtime configuration

## After Build

Once the build completes:

1. **Download the APK:**
   - EAS will provide a download link
   - Or check your Expo dashboard: https://expo.dev

2. **Install on Android device:**
   ```bash
   adb install path/to/app.apk
   ```

   Or transfer the APK file to your Android device and install it manually.

## Troubleshooting

### Build fails with "Project ID not found"
- Run `eas build:configure` to set up the project
- Or manually set `EAS_PROJECT_ID` in `app.config.js`

### API URL not updating
- Check that `EXPO_PUBLIC_API_URL` is set in `eas.json` production profile
- Verify `app.config.js` is reading from `extra.apiUrl`
- Rebuild after making config changes

### Build takes too long
- Use `--local` flag for faster local builds (requires Android SDK)
- Or use EAS servers but expect 10-20 minute build times

## Environment Variables

The build process uses these environment variables (set in `eas.json`):

- `EXPO_PUBLIC_ENV=production`
- `EXPO_PUBLIC_API_URL=https://loyaltymanagement.onrender.com/api`

These are automatically injected during the build process.

