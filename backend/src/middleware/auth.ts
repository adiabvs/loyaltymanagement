import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: "customer" | "brand";
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);

    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireRole = (role: "customer" | "brand") => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.userRole !== role) {
      res.status(403).json({ error: `Access denied. ${role} role required.` });
      return;
    }
    next();
  };
};

