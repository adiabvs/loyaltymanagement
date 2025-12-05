import jwt from "jsonwebtoken";
import { UserModel } from "../models/UserModel";
import { OTPService } from "./OTPService";
import { User, UserRole, AuthRequest, AuthResponse } from "../types";
import { getEnv } from "../utils/env";

export class AuthService {
  private static get JWT_SECRET(): string {
    return getEnv().JWT_SECRET;
  }

  private static get JWT_EXPIRES_IN(): string {
    return getEnv().JWT_EXPIRES_IN;
  }

  static async signIn(
    phoneOrEmail: string,
    role: UserRole,
    otpId?: string,
    otpCode?: string
  ): Promise<AuthResponse> {
    // If OTP provided, verify it first
    if (otpId && otpCode) {
      const isValid = await OTPService.verifyOTP(otpId, otpCode, phoneOrEmail);
      if (!isValid) {
        throw new Error("Invalid or expired OTP");
      }
    }

    let user = UserModel.findByEmailOrPhone(phoneOrEmail);

    if (!user) {
      // Auto-create user for MVP (replace with proper signup flow later)
      const name = role === "customer" ? "Customer" : "Brand";
      user = UserModel.createUser({
        phone: phoneOrEmail.includes("@") ? undefined : phoneOrEmail,
        email: phoneOrEmail.includes("@") ? phoneOrEmail : undefined,
        name,
        role,
        businessName: role === "brand" ? name : undefined,
      });
    }

    if (user.role !== role) {
      throw new Error("User role mismatch");
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user,
      token,
    };
  }

  static async signUp(
    data: AuthRequest,
    otpId?: string,
    otpCode?: string
  ): Promise<AuthResponse> {
    const existingUser = UserModel.findByEmailOrPhone(data.phoneOrEmail);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // If OTP provided, verify it first
    if (otpId && otpCode) {
      const isValid = await OTPService.verifyOTP(otpId, otpCode, data.phoneOrEmail);
      if (!isValid) {
        throw new Error("Invalid or expired OTP");
      }
    }

    const user = UserModel.createUser({
      phone: data.phoneOrEmail.includes("@") ? undefined : data.phoneOrEmail,
      email: data.phoneOrEmail.includes("@") ? data.phoneOrEmail : undefined,
      name: data.name || (data.role === "customer" ? "Customer" : "Brand"),
      role: data.role,
      businessName: data.businessName || data.name,
    });

    const token = this.generateToken(user.id, user.role);

    return {
      user,
      token,
    };
  }

  static generateToken(userId: string, role: UserRole): string {
    return jwt.sign(
      { userId, role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  static verifyToken(token: string): { userId: string; role: UserRole } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; role: UserRole };
      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  static getUserFromToken(token: string): User | undefined {
    try {
      const { userId } = this.verifyToken(token);
      return UserModel.findById(userId);
    } catch {
      return undefined;
    }
  }
}

