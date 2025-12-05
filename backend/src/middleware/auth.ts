import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { User } from "../models/User";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: "customer" | "brand";
  userPhoneOrEmail?: string; // Keep phoneOrEmail for backward compatibility
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);

    // Get user from database to get the actual user ID
    const user = await User.findByPhone(decoded.phoneOrEmail);
    if (!user || !user.id) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.userId = user.id; // Use actual user ID from database
    req.userPhoneOrEmail = decoded.phoneOrEmail; // Keep for backward compatibility
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

