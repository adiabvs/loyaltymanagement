# Loyalty Platform Frontend

React Native (Expo) mobile application for the Loyalty Platform MVP.

## Architecture

**Feature-based structure:**

```
frontend/
├── src/
│   ├── navigation/       # Navigation setup (Customer & Brand flows)
│   ├── screens/          # UI screens
│   │   ├── auth/         # Authentication screens
│   │   ├── customer/     # Customer app screens
│   │   └── brand/        # Brand app screens
│   ├── services/         # API client & service abstractions
│   ├── providers/        # Global state (Auth context)
│   └── hooks/            # Reusable business logic hooks
├── App.js                # Root component
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Design Patterns

- **Context API**: Global auth state management
- **Custom Hooks**: Business logic separation (`useCustomerLoyalty`, `useBrandDashboard`)
- **Service Layer**: API abstraction (easy to swap implementations)
- **Navigation**: Role-based routing (Customer vs Brand)

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Setup

Create a `.env` file (optional):

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

In production, set this to your backend API URL.

### 3. Start Development Server

```bash
npm start
```

Then:
- Press `w` for web
- Scan QR with Expo Go on your phone
- Press `a` for Android emulator
- Press `i` for iOS simulator

## Features

### Customer App
- **Home**: Dashboard with QR code, visit progress, greeting
- **Rewards**: List of unlocked rewards
- **Promotions**: Active brand promotions
- **QR Check-in**: Display QR code for staff to scan

### Brand App
- **Dashboard**: Metrics (visits, customers, redemptions)
- **Scan**: QR scanner to credit customer visits
- **Offers**: Campaign management
- **Help**: Staff training guide

## API Integration

The frontend communicates with the backend API via:

- `src/services/apiClient.js` - HTTP client with token management
- `src/services/authService.js` - Authentication API calls
- `src/services/loyaltyService.js` - Loyalty business logic API calls

All API calls automatically include JWT tokens from the auth context.

## Authentication Flow

1. User signs in via `AuthScreen`
2. `AuthProvider` calls backend `/api/auth/signin`
3. Token stored in `apiClient`
4. User redirected to Customer or Brand app based on role
5. All subsequent API calls include token in headers

## Development

### Running on Different Platforms

```bash
npm start          # Start Expo dev server
npm run web        # Open in web browser
npm run android    # Open in Android emulator
npm run ios        # Open in iOS simulator
```

### Project Structure

- **Screens**: UI components for each feature
- **Navigation**: Tab navigators for Customer and Brand
- **Services**: API communication layer
- **Providers**: Global state (Auth)
- **Hooks**: Reusable data fetching logic

## Building for Production

### Web

```bash
npx expo export:web
```

### Mobile (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build
eas build --platform android
eas build --platform ios
```

## Environment Variables

- `EXPO_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:3000/api`)

## Troubleshooting

### API Connection Issues

1. Ensure backend is running on the configured port
2. Check `EXPO_PUBLIC_API_URL` matches backend URL
3. For mobile, use your computer's IP address instead of `localhost`

### Navigation Issues

- Ensure all screens are properly imported
- Check navigation stack configuration

### Build Issues

- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Next Steps

1. Add error boundaries for better error handling
2. Add offline support with caching
3. Add push notifications
4. Add analytics tracking
5. Optimize bundle size

