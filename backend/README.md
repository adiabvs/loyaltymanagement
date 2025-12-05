# Loyalty Platform Backend API

TypeScript backend API for the Loyalty Platform MVP.

## Architecture

This backend follows a **modular, layered architecture**:

```
backend/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── models/         # Data models (in-memory for MVP)
│   ├── services/       # Business logic layer
│   ├── controllers/    # Request handlers
│   ├── routes/         # API route definitions
│   ├── middleware/     # Auth, validation, error handling
│   └── server.ts       # Express app entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Design Patterns

- **Repository Pattern**: Models abstract data access (easy to swap with database)
- **Service Layer**: Business logic separated from controllers
- **Middleware Chain**: Authentication, validation, error handling
- **Type Safety**: Full TypeScript with Zod validation

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file (copy from `.env.example`):

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### 3. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/signin` - Sign in (customer or brand)
  - Optional: Include `otpId` and `otpCode` for OTP verification
- `POST /api/auth/signup` - Sign up (customer or brand)
  - Optional: Include `otpId` and `otpCode` for OTP verification
- `GET /api/auth/me` - Get current user (requires Bearer token)

### OTP Verification (`/api/otp`)

- `POST /api/otp/send` - Send OTP to phone/email
- `POST /api/otp/verify` - Verify OTP code

### Customer Endpoints (`/api/customer`)

All require authentication with `customer` role.

- `GET /api/customer/dashboard` - Get customer dashboard (visits, points, stamps, QR)
- `GET /api/customer/qr` - Generate QR code payload
- `GET /api/customer/rewards` - Get customer rewards
- `POST /api/customer/rewards/redeem` - Redeem a reward
- `GET /api/customer/promotions` - Get active promotions

### Brand Endpoints (`/api/brand`)

All require authentication with `brand` role.

- `GET /api/brand/dashboard` - Get brand metrics
- `POST /api/brand/scan` - Process QR code check-in
- `GET /api/brand/campaigns` - Get brand campaigns
- `POST /api/brand/campaigns` - Create new campaign
- `PUT /api/brand/campaigns/:campaignId` - Update campaign
- `DELETE /api/brand/campaigns/:campaignId` - Delete campaign

## Request/Response Examples

### Sign In

```bash
POST /api/auth/signin
Content-Type: application/json

{
  "phoneOrEmail": "customer@example.com",
  "role": "customer"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "name": "Customer",
    "role": "customer",
    ...
  },
  "token": "jwt-token-here"
}
```

### Get Customer Dashboard

```bash
GET /api/customer/dashboard
Authorization: Bearer <token>
```

### Process QR Check-In (Brand)

```bash
POST /api/brand/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "qrData": "{\"type\":\"visit\",\"customerId\":\"...\",\"issuedAt\":1234567890}"
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Data Storage

Currently uses **in-memory storage** (Maps) for MVP. To move to production:

1. Replace `models/*.ts` with database queries (Firebase/Firestore, Supabase/Postgres, etc.)
2. Update `services/*.ts` to use async database calls
3. Add connection pooling and migrations

## Error Handling

All errors are handled by middleware and return JSON:

```json
{
  "error": "Error message here"
}
```

Status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (wrong role)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

## Development

- `npm run dev` - Start with hot reload (tsx watch)
- `npm run build` - Compile TypeScript
- `npm run type-check` - Type check without building
- `npm start` - Run compiled JavaScript

## Production Features

✅ **Implemented:**
- OTP/Email verification system
- Rate limiting (auth, API, OTP endpoints)
- Security middleware (input sanitization, XSS protection, security headers)
- Request logging with configurable levels
- Environment variable validation
- Database abstraction layer (ready for Firebase/Supabase)
- Docker support with multi-stage builds
- Deployment configs (Railway, Docker Compose)
- Health check endpoint with database status
- Graceful shutdown handling

## Next Steps

1. **Database Integration:**
   - Implement Firebase adapter in `src/database/firebase.ts`
   - Implement Supabase adapter in `src/database/supabase.ts`
   - Update `getDatabase()` factory to use real database

2. **OTP Service:**
   - Integrate with SMS provider (Twilio, AWS SNS)
   - Integrate with Email provider (SendGrid, AWS SES)
   - Replace in-memory storage with Redis

3. **Rate Limiting:**
   - Replace in-memory rate limiter with Redis
   - Add distributed rate limiting for multi-instance deployments

4. **Monitoring:**
   - Add structured logging (Winston/Pino)
   - Integrate error tracking (Sentry)
   - Add metrics collection (Prometheus)

5. **Testing:**
   - Add unit tests (Jest)
   - Add integration tests
   - Add E2E tests

6. **Documentation:**
   - Add Swagger/OpenAPI documentation
   - Add API usage examples
   - Add architecture diagrams

