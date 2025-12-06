import { database } from '../database';
import { UserRole } from '../types';

export interface IUser {
  id?: string;
  phoneNumber: string;
  username?: string;
  email?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isVerified?: boolean;
  otp?: string;
  otpExpiry?: Date;
}

export class User {
  static collection = 'users';

  static async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt' | 'isVerified'>): Promise<string> {
    const now = new Date();
    const user = {
      ...userData,
      // If username not provided, extract from phone number (last 10 digits)
      username: userData.username || this.extractUsername(userData.phoneNumber),
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    };
    
    return await database.create<IUser>(this.collection, user);
  }

  static async findById(id: string): Promise<IUser | null> {
    return await database.get<IUser>(this.collection, id);
  }

  static async findByPhone(phoneNumber: string): Promise<IUser | null> {
    const users = await database.query<IUser>(this.collection, [
      ['phoneNumber', '==', phoneNumber]
    ], 1);
    
    return users[0] || null;
  }

  static async findByUsername(username: string): Promise<IUser | null> {
    const users = await database.query<IUser>(this.collection, [
      ['username', '==', username]
    ], 1);
    
    return users[0] || null;
  }

  static extractUsername(phoneNumber: string): string {
    // Extract last 10 digits as username
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.slice(-10);
  }

  static async updateUser(id: string, updates: Partial<IUser>): Promise<void> {
    await database.update<IUser>(this.collection, id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  static async setOtp(userId: string, otp: string): Promise<void> {
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // OTP expires in 5 minutes
    
    // Ensure OTP is stored as string
    const otpString = String(otp).trim();
    
    console.log('[User.setOtp] Setting OTP:', { userId, otp: otpString, otpExpiry: otpExpiry.toISOString() });
    
    await database.update<IUser>(this.collection, userId, {
      otp: otpString,
      otpExpiry: otpExpiry.toISOString(), // Store as ISO string for Firebase compatibility
      updatedAt: new Date().toISOString()
    });
    
    console.log('[User.setOtp] OTP set successfully');
  }

  static async verifyOtp(userId: string, otp: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || !user.otp || !user.otpExpiry) {
      console.log('[OTP Verification] User or OTP not found:', { 
        userId, 
        hasUser: !!user, 
        hasOtp: !!user?.otp, 
        hasOtpExpiry: !!user?.otpExpiry 
      });
      return false;
    }

    // Convert OTP to string for comparison (handle number/string mismatch)
    const storedOtp = String(user.otp).trim();
    const providedOtp = String(otp).trim();
    
    // Handle date comparison - Firebase might return Timestamp objects or ISO strings
    let expiryDate: Date;
    if (user.otpExpiry instanceof Date) {
      expiryDate = user.otpExpiry;
    } else if (user.otpExpiry && typeof user.otpExpiry === 'object' && 'toDate' in user.otpExpiry) {
      // Firestore Timestamp
      expiryDate = (user.otpExpiry as any).toDate();
    } else if (typeof user.otpExpiry === 'string') {
      // ISO string or date string
      expiryDate = new Date(user.otpExpiry);
      if (isNaN(expiryDate.getTime())) {
        console.error('[OTP Verification] Invalid date format:', user.otpExpiry);
        return false;
      }
    } else if (user.otpExpiry && typeof user.otpExpiry === 'object' && '_seconds' in user.otpExpiry) {
      // Firestore Timestamp (alternative format)
      expiryDate = new Date((user.otpExpiry as any)._seconds * 1000);
    } else {
      expiryDate = new Date(user.otpExpiry as any);
      if (isNaN(expiryDate.getTime())) {
        console.error('[OTP Verification] Invalid date format:', user.otpExpiry);
        return false;
      }
    }

    const now = new Date();
    
    console.log('[OTP Verification] Comparing:', {
      storedOtp,
      providedOtp,
      match: storedOtp === providedOtp,
      expiryDate: expiryDate.toISOString(),
      now: now.toISOString(),
      isExpired: expiryDate < now,
      timeRemaining: expiryDate.getTime() - now.getTime()
    });

    if (storedOtp !== providedOtp) {
      console.log('[OTP Verification] OTP mismatch');
      return false;
    }

    if (expiryDate < now) {
      console.log('[OTP Verification] OTP expired');
      return false;
    }

    // Clear OTP after successful verification
    await this.updateUser(userId, {
      isVerified: true,
      otp: undefined,
      otpExpiry: undefined
    });

    console.log('[OTP Verification] OTP verified successfully');
    return true;
  }

  static async deleteUser(id: string): Promise<void> {
    await database.delete(this.collection, id);
  }
}
