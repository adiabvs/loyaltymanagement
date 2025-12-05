import { Request, Response, NextFunction } from "express";

// Simple in-memory rate limiter (replace with Redis in production)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = "Too many requests, please try again later",
    keyGenerator = (req) => req.ip || "unknown",
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = store[key];

    // Clean up expired records
    if (record && now > record.resetTime) {
      delete store[key];
    }

    const current = store[key];

    if (!current) {
      // First request in window
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    if (current.count >= max) {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      });
      return;
    }

    // Increment count
    current.count++;
    next();
  };
};

// Pre-configured rate limiters
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: "Too many authentication attempts, please try again later",
});

export const apiRateLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: "Too many API requests, please slow down",
});

export const otpRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 OTP requests per 15 minutes
  message: "Too many OTP requests, please try again later",
  keyGenerator: (req) => {
    const phoneOrEmail = req.body?.phoneOrEmail || req.ip;
    return `otp:${phoneOrEmail}`;
  },
});

