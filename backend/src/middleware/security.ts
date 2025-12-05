import { Request, Response, NextFunction } from "express";

/**
 * Security middleware
 * - Input sanitization
 * - XSS protection
 * - Request size limits
 */

// Basic input sanitization (remove script tags, etc.)
export const sanitizeInput = (_req: Request, _res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (_req.body) {
    _req.body = sanitize(_req.body);
  }
  if (_req.query) {
    _req.query = sanitize(_req.query);
  }
  if (_req.params) {
    _req.params = sanitize(_req.params);
  }

  next();
};

// Request size limit middleware
export const requestSizeLimiter = (maxSize: number = 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    
    if (contentLength > maxSize) {
      res.status(413).json({
        error: `Request too large. Maximum size: ${maxSize / 1024}KB`,
      });
      return;
    }

    next();
  };
};

// Security headers
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Remove X-Powered-By header
  res.removeHeader("X-Powered-By");
  
  next();
};

