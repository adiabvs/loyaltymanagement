import { Router } from "express";
import { BrandController } from "../controllers/BrandController";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { z } from "zod";

const router = Router();

// All brand routes require authentication and brand role
router.use(authenticate);
router.use(requireRole("brand"));

const processQRSchema = z.object({
  qrData: z.string().optional(),
  phoneNumber: z.string().optional(),
  amountSpent: z.number().positive().optional(),
}).refine(data => data.qrData || data.phoneNumber, {
  message: "Either qrData or phoneNumber is required",
});

const createCampaignSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["stamp", "points", "discount"]),
  value: z.number().positive(),
  endDate: z.string().optional(),
  qualificationType: z.enum(["visits", "money", "scan"]).optional(),
  requiredVisits: z.number().positive().optional(),
  requiredAmount: z.number().positive().optional(),
});

router.get("/dashboard", BrandController.getDashboard);
router.post("/scan", validate(processQRSchema), BrandController.processQR);
router.get("/campaigns", BrandController.getCampaigns);
router.post("/campaigns", validate(createCampaignSchema), BrandController.createCampaign);
router.put("/campaigns/:campaignId", BrandController.updateCampaign);
router.delete("/campaigns/:campaignId", BrandController.deleteCampaign);
router.get("/customers", BrandController.getCustomers);
router.get("/username/check", BrandController.checkUsername);
router.post("/username/update", BrandController.updateUsername);

export default router;

