import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export class OTPController {
  /**
   * Request OTP for phone number verification
   */
  static async requestOTP(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body;
      const result = await AuthService.requestOTP(phoneNumber);
      res.json(result);
    } catch (error: any) {
      console.error('OTP request error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to send OTP" 
      });
    }
  }

  /**
   * Verify OTP and authenticate user
   */
  static async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, otp } = req.body;
      
      const result = await AuthService.verifyOTP(phoneNumber, otp);
      
      if (!result.success) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid or expired OTP" 
        });
        return;
      }

      res.json({
        success: true,
        message: "OTP verified successfully",
        token: result.token,
        user: result.user
      });
    } catch (error: any) {
      console.error('OTP verification error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to verify OTP" 
      });
    }
  }
}

