import jwt from "jsonwebtoken";
import twilio from "twilio";
import { User } from "../models/User";
import type { UserRole } from "../types";

// UserRole values as constants
const USER_ROLE = {
  CUSTOMER: "customer" as const,
  BRAND: "brand" as const
};

// Initialize Twilio client lazily with proper error handling
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio | null {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      try {
        twilioClient = twilio(accountSid, authToken);
      } catch (error) {
        console.error('Failed to initialize Twilio client:', error);
        return null;
      }
    } else {
      console.warn('Twilio credentials not found. SMS functionality will be disabled.');
    }
  }
  
  return twilioClient;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  private static readonly JWT_EXPIRES_IN = "7d";
  // OTP expiry is handled in the User model

  static generateToken(phoneOrEmail: string, role: UserRole): string {
    return jwt.sign(
      { phoneOrEmail, role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  static verifyToken(token: string): { phoneOrEmail: string; role: UserRole } {
    return jwt.verify(token, this.JWT_SECRET) as { phoneOrEmail: string; role: UserRole };
  }

  static async requestOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      // Generate random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Find or create user
      let user = await User.findByPhone(phoneNumber);
      
      if (!user) {
        // Create a new user with default role CUSTOMER if not exists
        const userId = await User.create({
          phoneNumber,
role: USER_ROLE.CUSTOMER,
        });
        user = await User.findById(userId);
      }

      if (!user || !user.id) {
        throw new Error('Failed to create or find user');
      }

      // Set OTP and expiry
      await User.setOtp(user.id, otp);

      // Send the OTP via SMS using Twilio if available
      const client = getTwilioClient();
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      if (client && twilioPhoneNumber) {
        try {
          await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: twilioPhoneNumber,
            to: phoneNumber,
          });
          console.log(`OTP sent via Twilio to ${phoneNumber}`);
        } catch (twilioError) {
          console.error('Twilio error:', twilioError);
          // Fallback to console log if Twilio fails
          console.log(`[FALLBACK] OTP for ${phoneNumber}: ${otp}`);
        }
      } else {
        // Development mode or Twilio not configured
        console.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);
      }

      return { success: true, message: "OTP sent successfully" };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP');
    }
  }

  static async registerUser(phoneNumber: string, role: UserRole, name?: string, businessName?: string): Promise<{ success: boolean; userId?: string; message: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findByPhone(phoneNumber);
      if (existingUser) {
        return { success: false, message: "User already exists" };
      }

      // Create new user
      const userId = await User.create({
        phoneNumber,
        role,
        ...(name && { firstName: name }),
        ...(businessName && { businessName }),
      });

      return { success: true, userId, message: "User registered successfully" };
    } catch (error) {
      console.error("Error in registerUser:", error);
      return { success: false, message: "Failed to register user" };
    }
  }

  static async verifyOTP(phoneNumber: string, otp: string): Promise<{ 
    success: boolean; 
    token?: string; 
    user?: {
      id: string;
      phoneNumber: string;
      role: UserRole;
      name?: string;
      businessName?: string;
    };
    message: string 
  }> {
    try {
      const user = await User.findByPhone(phoneNumber);
      if (!user || !user.id) {
        return { success: false, message: "User not found" };
      }

      // Verify the OTP
      console.log('[AuthService] Verifying OTP:', { userId: user.id, phoneNumber, otp });
      const isValidOtp = await User.verifyOtp(user.id, otp);
      if (!isValidOtp) {
        console.log('[AuthService] OTP verification failed');
        return { success: false, message: "Invalid or expired OTP" };
      }
      console.log('[AuthService] OTP verified successfully');

      // Generate JWT token
      const token = this.generateToken(phoneNumber, user.role);

      return { 
        success: true, 
        token, 
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role,
          name: user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
          businessName: user.businessName
        },
        message: "OTP verified successfully" 
      };
    } catch (error) {
      console.error("Error in verifyOtp:", error);
      return { success: false, message: "Failed to verify OTP" };
    }
  }

  static async getCurrentUser(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        name: user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
        businessName: user.businessName,
        isVerified: user.isVerified
      };
    } catch (error) {
      console.error("Error in getCurrentUser:", error);
      throw new Error("Failed to fetch user details");
    }
  }
}