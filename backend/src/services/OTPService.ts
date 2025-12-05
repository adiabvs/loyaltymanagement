import { v4 as uuidv4 } from "uuid";

// In-memory OTP storage (replace with Redis/database in production)
const otpStore: Map<string, { code: string; expiresAt: number; phoneOrEmail: string }> = new Map();

export class OTPService {
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly OTP_LENGTH = 6;

  /**
   * Generate a random 6-digit OTP
   */
  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to phone/email
   * In production, integrate with SMS/Email service (Twilio, SendGrid, etc.)
   */
  static async sendOTP(phoneOrEmail: string): Promise<{ otpId: string; message: string }> {
    const otp = this.generateOTP();
    const otpId = uuidv4();
    const expiresAt = Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000;

    otpStore.set(otpId, {
      code: otp,
      expiresAt,
      phoneOrEmail,
    });

    // In production, send actual SMS/Email here
    // For MVP, log it (remove in production!)
    console.log(`[OTP] ${phoneOrEmail}: ${otp} (expires in ${this.OTP_EXPIRY_MINUTES} minutes)`);

    return {
      otpId,
      message: `OTP sent to ${phoneOrEmail}. Check console for development OTP.`,
    };
  }

  /**
   * Verify OTP
   */
  static async verifyOTP(otpId: string, code: string, phoneOrEmail: string): Promise<boolean> {
    const stored = otpStore.get(otpId);

    if (!stored) {
      return false;
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(otpId);
      return false;
    }

    // Check phone/email match
    if (stored.phoneOrEmail !== phoneOrEmail) {
      return false;
    }

    // Check code match
    if (stored.code !== code) {
      return false;
    }

    // OTP verified, remove it
    otpStore.delete(otpId);
    return true;
  }

  /**
   * Clean up expired OTPs (run periodically)
   */
  static cleanupExpiredOTPs(): void {
    const now = Date.now();
    for (const [otpId, data] of otpStore.entries()) {
      if (now > data.expiresAt) {
        otpStore.delete(otpId);
      }
    }
  }
}

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  OTPService.cleanupExpiredOTPs();
}, 5 * 60 * 1000);

