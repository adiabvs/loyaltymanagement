import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { validate } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const signInSchema = z.object({
  phoneOrEmail: z.string().min(1),
  role: z.enum(["customer", "brand"]),
  otpId: z.string().uuid().optional(), // Optional OTP verification
  otpCode: z.string().length(6).optional(),
});

const signUpSchema = z.object({
  phoneOrEmail: z.string().min(1),
  role: z.enum(["customer", "brand"]),
  name: z.string().optional(),
  businessName: z.string().optional(),
  otpId: z.string().uuid().optional(), // Optional OTP verification
  otpCode: z.string().length(6).optional(),
});

router.post("/signin", validate(signInSchema), AuthController.signIn);
router.post("/signup", validate(signUpSchema), AuthController.signUp);
router.get("/me", authenticate, AuthController.me);

export default router;

