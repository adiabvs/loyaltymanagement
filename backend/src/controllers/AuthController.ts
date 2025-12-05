import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { z } from "zod";

const signInSchema = z.object({
  phoneOrEmail: z.string().min(1),
  role: z.enum(["customer", "brand"]),
});

const signUpSchema = z.object({
  phoneOrEmail: z.string().min(1),
  role: z.enum(["customer", "brand"]),
  name: z.string().optional(),
  businessName: z.string().optional(),
});

export class AuthController {
  static async signIn(req: Request, res: Response): Promise<void> {
    try {
      const { phoneOrEmail, role, otpId, otpCode } = signInSchema.parse(req.body);
      const result = await AuthService.signIn(phoneOrEmail, role, otpId, otpCode);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Sign in failed" });
    }
  }

  static async signUp(req: Request, res: Response): Promise<void> {
    try {
      const { otpId, otpCode, ...data } = signUpSchema.parse(req.body);
      const result = await AuthService.signUp(data, otpId, otpCode);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Sign up failed" });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: "No token provided" });
        return;
      }

      const token = authHeader.substring(7);
      const user = AuthService.getUserFromToken(token);

      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      res.json({ user });
    } catch (error: any) {
      res.status(401).json({ error: error.message || "Authentication failed" });
    }
  }
}

