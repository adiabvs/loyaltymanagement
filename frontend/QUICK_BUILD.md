# Quick Build Guide - Production APK

## Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

## Step 2: Login to Expo
```bash
eas login
```

## Step 3: Configure EAS Project (first time only)
```bash
cd frontend
eas build:configure
```

## Step 4: Build Production APK
```bash
npm run build:android
```

This will:
- ✅ Use production configuration
- ✅ Set API endpoint to: `https://loyaltymanagement.onrender.com/api`
- ✅ Generate APK file
- ✅ Upload to Expo servers

## Step 5: Download APK

After build completes, you'll get a download link. Or check:
- Expo Dashboard: https://expo.dev
- Build will appear in your project's builds section

## Alternative: Build Locally

If you have Android SDK installed:
```bash
npm run build:android:local
```

## Configuration Files

- `app.config.js` - App configuration (uses production by default)
- `eas.json` - EAS build profiles
- `src/config/index.js` - Runtime config (reads from app.config.js)

## Production Settings

- **Environment:** `production`
- **API URL:** `https://loyaltymanagement.onrender.com/api`
- **Build Type:** APK

All set! The APK will use production endpoints automatically.

