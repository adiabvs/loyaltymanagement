import { Router } from "express";
import { OTPController } from "../controllers/OTPController";
import { validate } from "../middleware/validation";
import { z } from "zod";

const router = Router();

const sendOTPSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["customer", "brand"]).optional(), // Optional role for new users
});

const verifyOTPSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  role: z.enum(["customer", "brand"]).optional(), // Optional role to update existing user
});

// Request OTP for login/signup
router.post("/request", validate(sendOTPSchema), OTPController.requestOTP);

// Verify OTP and authenticate user
router.post("/verify", validate(verifyOTPSchema), OTPController.verifyOTP);

export default router;

