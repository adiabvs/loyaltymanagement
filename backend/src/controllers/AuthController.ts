// backend/src/controllers/AuthController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { z } from "zod";

const requestOtpSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const signUpSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  name: z.string().optional(),
  businessName: z.string().optional(),
  role: z.enum(["customer", "brand"]).default("customer"),
});

const setUsernameSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric and underscore only"),
  role: z.enum(["customer", "brand"]).optional(),
});

export class AuthController {
  static async requestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = requestOtpSchema.parse(req.body);
      const result = await AuthService.requestOTP(phoneNumber);
      res.json(result);
    } catch (error: any) {
      console.error("Error in requestOtp:", error);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to send OTP" 
      });
    }
  }

  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, otp } = verifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOTP(phoneNumber, otp);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error in verifyOtp:", error);
      res.status(400).json({ 
        success: false, 
        message: error.message || "OTP verification failed" 
      });
    }
  }

  static async signIn(req: Request, res: Response): Promise<void> {
  try {
    const { phoneNumber, otp } = verifyOtpSchema.parse(req.body);
    const result = await AuthService.verifyOTP(phoneNumber, otp);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // verifyOTP already returns the user, so we can use it directly
    res.json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error: any) {
    console.error("Error in signIn:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message || "Sign in failed" 
    });
  }
}

  static async signUp(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, role, name, businessName } = signUpSchema.parse(req.body);
      
      // Check if user exists by phone number
      const { User } = await import("../models/User");
      const existingUser = await User.findByPhone(phoneNumber);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "User already exists" 
        });
      }

      // Create user
      const result = await AuthService.registerUser(phoneNumber, role, name, businessName);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      // Get the full user details
      const user = await AuthService.getCurrentUser(result.userId!);
      
      res.json({
        success: true,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role,
          name: user.firstName || user.lastName 
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
            : undefined,
          businessName: user.businessName,
          isVerified: user.isVerified
        },
        message: "User registered successfully"
      });
    } catch (error: any) {
      console.error("Error in signUp:", error);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Registration failed" 
      });
    }
  }

  static async setUsername(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, username, role } = setUsernameSchema.parse(req.body);
      const result = await AuthService.setUsername(phoneNumber, username, role);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error in setUsername:", error);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to set username" 
      });
    }
  }

  static async me(req: any, res: Response): Promise<void> {
    try {
      // Get user by phone number from JWT token (phoneOrEmail field)
      const { User } = await import("../models/User");
      const phoneNumber = req.userId || req.user?.phoneOrEmail;
      if (!phoneNumber) {
        return res.status(400).json({ error: "User identifier not found in token" });
      }
      const user = await User.findByPhone(phoneNumber);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          username: user.username,
          email: user.email,
          role: user.role,
          name: user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
          businessName: user.businessName,
          isVerified: user.isVerified
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to fetch user" });
    }
  }
}