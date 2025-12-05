import { Router } from "express";
import { OTPController } from "../controllers/OTPController";
import { validate } from "../middleware/validation";
import { z } from "zod";

const router = Router();

const sendOTPSchema = z.object({
  phoneOrEmail: z.string().min(1),
});

const verifyOTPSchema = z.object({
  otpId: z.string().uuid(),
  code: z.string().length(6),
  phoneOrEmail: z.string().min(1),
});

router.post("/send", validate(sendOTPSchema), OTPController.sendOTP);
router.post("/verify", validate(verifyOTPSchema), OTPController.verifyOTP);

export default router;

