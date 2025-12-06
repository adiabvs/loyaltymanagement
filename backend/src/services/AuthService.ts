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

  static generateToken(phoneOrEmail: string, role: UserRole, username?: string): string {
    return jwt.sign(
      { phoneOrEmail, role, username },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  static verifyToken(token: string): { phoneOrEmail: string; role: UserRole; username?: string } {
    return jwt.verify(token, this.JWT_SECRET) as { phoneOrEmail: string; role: UserRole; username?: string };
  }

  static async requestOTP(phoneNumber: string, role?: UserRole): Promise<{ success: boolean; message: string; needsUsername?: boolean }> {
    try {
      // Generate random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Find or create user
      let user = await User.findByPhone(phoneNumber);
      
      if (!user) {
        // Create a new user with specified role or default to CUSTOMER
        const userRole = (role as UserRole) || USER_ROLE.CUSTOMER;
        console.log('[AuthService.requestOTP] Creating new user with role:', userRole);
        const userId = await User.create({
          phoneNumber,
          role: userRole,
        });
        user = await User.findById(userId);
        console.log('[AuthService.requestOTP] Created user:', { id: user?.id, role: user?.role });
      } else if (role && user.role !== role) {
        // Update existing user's role if different role is specified
        console.log('[AuthService.requestOTP] Updating user role from', user.role, 'to', role);
        await User.updateUser(user.id!, { role: role as UserRole });
        user = await User.findById(user.id!);
        console.log('[AuthService.requestOTP] Updated user role:', user?.role);
      } else {
        console.log('[AuthService.requestOTP] Using existing user with role:', user.role);
      }

      if (!user || !user.id) {
        throw new Error('Failed to create or find user');
      }

      // Check if username is needed
      if (!user.username) {
        return { 
          success: true, 
          message: "Username required", 
          needsUsername: true 
        };
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

  static async setUsername(phoneNumber: string, username: string, role?: UserRole): Promise<{ success: boolean; message: string }> {
    try {
      // Validate username: 3-20 characters, alphanumeric and underscore only
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return { success: false, message: "Username must be 3-20 characters, alphanumeric and underscore only" };
      }

      // Check if username already exists (excluding current user)
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.phoneNumber !== phoneNumber) {
        return { success: false, message: "Username already taken" };
      }

      // Find user by phone
      let user = await User.findByPhone(phoneNumber);
      if (!user || !user.id) {
        // Create new user if doesn't exist
        const userRole = (role as UserRole) || USER_ROLE.CUSTOMER;
        const userId = await User.create({
          phoneNumber,
          username,
          role: userRole,
        });
        user = await User.findById(userId);
        console.log('[AuthService.setUsername] Created new user with username:', { userId, username });
      } else {
        // Update existing user with username
        console.log('[AuthService.setUsername] Updating user:', { userId: user.id, username });
        await User.updateUser(user.id, { username });
        user = await User.findById(user.id);
        console.log('[AuthService.setUsername] User updated, verifying:', { userId: user?.id, savedUsername: (user as any)?.username });
      }

      if (!user || !user.id) {
        throw new Error('Failed to create or update user');
      }

      // Verify username was saved
      const verifyUser = await User.findById(user.id);
      if (!verifyUser || (verifyUser as any).username !== username) {
        console.error('[AuthService.setUsername] Username not saved correctly:', {
          expected: username,
          actual: (verifyUser as any)?.username
        });
        return { success: false, message: "Username was not saved. Please try again." };
      }

      // Return success (don't send OTP - that's confusing)
      return { 
        success: true, 
        message: "Username set successfully",
        user: {
          id: user.id,
          username: (user as any).username,
          phoneNumber: user.phoneNumber
        }
      };
    } catch (error: any) {
      console.error('Error setting username:', error);
      return { success: false, message: error.message || "Failed to set username" };
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

  static async verifyOTP(phoneNumber: string, otp: string, role?: UserRole): Promise<{ 
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

      // Update user role if provided and different
      if (role && user.role !== role) {
        console.log('[AuthService.verifyOTP] Updating user role from', user.role, 'to', role);
        await User.updateUser(user.id, { role: role as UserRole });
        // Refresh user data
        const updatedUser = await User.findById(user.id);
        if (updatedUser) {
          user = updatedUser;
          console.log('[AuthService.verifyOTP] User role updated to:', user.role);
        }
      }

      // Verify the OTP
      console.log('[AuthService] Verifying OTP:', { userId: user.id, phoneNumber, otp, role: user.role });
      const isValidOtp = await User.verifyOtp(user.id, otp);
      if (!isValidOtp) {
        console.log('[AuthService] OTP verification failed');
        return { success: false, message: "Invalid or expired OTP" };
      }
      console.log('[AuthService] OTP verified successfully');

      // Generate JWT token
      const token = this.generateToken(phoneNumber, user.role, user.username);

      return { 
        success: true, 
        token, 
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          username: user.username,
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