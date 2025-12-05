# Loyalty Platform MVP

A two-sided QR-based loyalty platform for F&B brands in Bangalore. Built with React Native (Expo) frontend and TypeScript/Express backend.

## 📁 Project Structure

```
PromotionsManagement/
├── backend/              # TypeScript Express API
│   ├── src/
│   │   ├── types/        # TypeScript definitions
│   │   ├── models/       # Data models (in-memory for MVP)
│   │   ├── services/     # Business logic
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, validation, errors
│   │   └── server.ts     # Express app
│   ├── package.json
│   └── README.md
│
└── frontend/             # React Native (Expo) Frontend
    ├── src/
    │   ├── navigation/   # Navigation setup
    │   ├── screens/      # Customer & Brand screens
    │   ├── services/     # API client & services
    │   ├── providers/    # Auth context
    │   └── hooks/        # Custom hooks
    ├── App.js            # Root component
    ├── app.json          # Expo config
    └── package.json      # Frontend dependencies
```

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   ```

4. **Start backend server:**
   ```bash
   npm run dev
   ```

   Backend will run on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set API URL (optional, defaults to localhost:3000):**
   Create `.env` file in `frontend/` folder:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   ```

4. **Start Expo:**
   ```bash
   npm start
   ```

5. **Open app:**
   - Press `w` for web
   - Scan QR with Expo Go on your phone
   - Or use Android/iOS emulator

## 🏗️ Architecture

### Backend (TypeScript/Express)

**Modular, layered architecture:**

- **Types**: TypeScript interfaces for type safety
- **Models**: Data access layer (currently in-memory, easy to swap with database)
- **Services**: Business logic (auth, loyalty, QR processing)
- **Controllers**: HTTP request handlers
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, validation (Zod), error handling

**Design Patterns:**
- Repository Pattern (models abstract data)
- Service Layer (business logic separation)
- Middleware Chain (auth → validation → handler)

### Frontend (React Native/Expo)

**Feature-based structure:**

- **Navigation**: Role-based routing (Customer vs Brand)
- **Screens**: UI components for each feature
- **Services**: API client and service abstractions
- **Providers**: Global state (Auth context)
- **Hooks**: Reusable business logic hooks

**Design Patterns:**
- Context API for auth state
- Custom hooks for data fetching
- Service layer abstraction (easy to swap implementations)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signup` - Sign up
- `GET /api/auth/me` - Get current user

### OTP Verification
- `POST /api/otp/send` - Send OTP
- `POST /api/otp/verify` - Verify OTP

### Customer (requires `customer` role)
- `GET /api/customer/dashboard` - Dashboard data
- `GET /api/customer/qr` - Generate QR code
- `GET /api/customer/rewards` - Get rewards
- `POST /api/customer/rewards/redeem` - Redeem reward
- `GET /api/customer/promotions` - Get promotions

### Brand (requires `brand` role)
- `GET /api/brand/dashboard` - Brand metrics
- `POST /api/brand/scan` - Process QR check-in
- `GET /api/brand/campaigns` - Get campaigns
- `POST /api/brand/campaigns` - Create campaign
- `PUT /api/brand/campaigns/:id` - Update campaign
- `DELETE /api/brand/campaigns/:id` - Delete campaign

## 🔐 Authentication

All protected endpoints require JWT token:

```
Authorization: Bearer <token>
```

Tokens are automatically stored and sent by the frontend API client.

## 🧪 Testing the Flow

1. **Start backend:** `cd backend && npm run dev`
2. **Start frontend:** `cd frontend && npm start`
3. **Sign in as Customer:**
   - Enter phone/email
   - Select "Customer"
   - See dashboard with QR code
4. **Sign in as Brand:**
   - Enter phone/email
   - Select "Brand"
   - Use "Scan" tab to scan customer QR
   - See metrics update

## 🔄 Moving to Production

### Backend
1. Replace in-memory models with database (Firebase/Supabase)
2. Add environment-specific configs
3. Add rate limiting
4. Add request logging
5. Deploy (Railway, Render, AWS, etc.)

### Frontend
1. Update `EXPO_PUBLIC_API_URL` to production backend
2. Add error boundaries
3. Add offline support
4. Build and deploy (Expo EAS, App Store, Play Store)

## 📝 Notes

- **Data Storage**: Currently in-memory (resets on server restart)
- **Security**: Basic JWT auth (add OTP/email verification for production)
- **QR Codes**: Valid for 1 hour, then expire
- **Rewards**: Auto-created when customer reaches stamp threshold

## 🛠️ Development

### Root Level Scripts

```bash
# Install all dependencies
npm run install:all

# Start backend
npm run backend:dev

# Start frontend
npm run frontend:start
```

### Individual Services

- Backend: `cd backend && npm run dev` (hot reload)
- Frontend: `cd frontend && npm start` (hot reload)
- Type checking: `cd backend && npm run type-check`

## 📚 Documentation

- **Backend API**: See `backend/README.md`
- **Frontend App**: See `frontend/README.md`
- **Deployment**: See `backend/DEPLOYMENT.md`
- **Production Features**: See `PRODUCTION_FEATURES.md`

## 🎯 Features

### ✅ Implemented
- Customer app (QR display, rewards, promotions)
- Brand app (dashboard, QR scanner, campaigns)
- Backend API with authentication
- OTP verification system
- Rate limiting and security middleware
- Docker support
- Deployment configurations

### 🚧 Next Steps
- Database integration (Firebase/Supabase)
- OTP SMS/Email integration
- Push notifications
- Analytics dashboard
- Admin panel

---

**Built for MVP pilot. Ready to scale with database integration.**
