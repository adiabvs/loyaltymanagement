import express, { Express } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { securityHeaders, sanitizeInput, requestSizeLimiter } from "./middleware/security";
import { apiRateLimiter, authRateLimiter } from "./middleware/rateLimiter";
import { getEnv } from "./utils/env";
import { logger } from "./utils/logger";
import { getDatabase } from "./database/base";

// Routes
import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import brandRoutes from "./routes/brand.routes";
import otpRoutes from "./routes/otp.routes";

const env = getEnv();
const app: Express = express();

// Security middleware (apply early)
app.use(securityHeaders);
app.use(requestSizeLimiter(5 * 1024 * 1024)); // 5MB limit
app.use(sanitizeInput);

// CORS configuration
const corsOptions = {
  origin: env.CORS_ORIGIN || "*",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Request logging
if (env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

// Health check (no rate limiting)
app.get("/health", async (req, res) => {
  try {
    const db = getDatabase();
    const dbHealthy = await db.healthCheck();
    
    res.json({
      status: "ok",
      message: "Loyalty Platform API is running",
      database: dbHealthy ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Service unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API Routes with rate limiting
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/customer", apiRateLimiter, customerRoutes);
app.use("/api/brand", apiRateLimiter, brandRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize database and start server
async function startServer() {
  try {
    const db = getDatabase();
    await db.connect();
    logger.info("Database connected");

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📋 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`🔐 Auth endpoints: /api/auth`);
      logger.info(`📱 OTP endpoints: /api/otp`);
      logger.info(`👤 Customer endpoints: /api/customer`);
      logger.info(`🏢 Brand endpoints: /api/brand`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  const db = getDatabase();
  await db.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  const db = getDatabase();
  await db.disconnect();
  process.exit(0);
});

startServer();

export default app;

