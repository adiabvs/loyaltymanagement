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
  qrData: z.string().min(1),
});

const createCampaignSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["stamp", "points", "discount"]),
  value: z.number().positive(),
  endDate: z.string().optional(),
});

router.get("/dashboard", BrandController.getDashboard);
router.post("/scan", validate(processQRSchema), BrandController.processQR);
router.get("/campaigns", BrandController.getCampaigns);
router.post("/campaigns", validate(createCampaignSchema), BrandController.createCampaign);
router.put("/campaigns/:campaignId", BrandController.updateCampaign);
router.delete("/campaigns/:campaignId", BrandController.deleteCampaign);

export default router;

