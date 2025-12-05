import { Request, Response } from "express";
import { OTPService } from "../services/OTPService";
import { z } from "zod";

const sendOTPSchema = z.object({
  phoneOrEmail: z.string().min(1),
});

const verifyOTPSchema = z.object({
  otpId: z.string().uuid(),
  code: z.string().length(6),
  phoneOrEmail: z.string().min(1),
});

export class OTPController {
  static async sendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { phoneOrEmail } = sendOTPSchema.parse(req.body);
      const result = await OTPService.sendOTP(phoneOrEmail);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to send OTP" });
    }
  }

  static async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const data = verifyOTPSchema.parse(req.body);
      const isValid = await OTPService.verifyOTP(
        data.otpId,
        data.code,
        data.phoneOrEmail
      );

      if (!isValid) {
        res.status(400).json({ error: "Invalid or expired OTP" });
        return;
      }

      res.json({ verified: true, message: "OTP verified successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to verify OTP" });
    }
  }
}

