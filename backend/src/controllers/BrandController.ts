import { Response } from "express";
import { LoyaltyService } from "../services/LoyaltyService";
import { CampaignModel } from "../models/CampaignModel";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";

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

export class BrandController {
  static async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const brandId = req.userId!;
      const metrics = LoyaltyService.getBrandMetrics(brandId);
      res.json({ metrics });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch dashboard" });
    }
  }

  static async processQR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const brandId = req.userId!;
      const { qrData } = processQRSchema.parse(req.body);

      const result = LoyaltyService.processQRCheckIn(brandId, qrData);

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        visit: result.visit,
        customer: result.customer,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to process QR code" });
    }
  }

  static async getCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const brandId = req.userId!;
      const campaigns = CampaignModel.getBrandCampaigns(brandId);
      res.json({ campaigns });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch campaigns" });
    }
  }

  static async createCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const brandId = req.userId!;
      const data = createCampaignSchema.parse(req.body);

      const campaign = CampaignModel.createCampaign({
        brandId,
        title: data.title,
        description: data.description,
        type: data.type,
        value: data.value,
        startDate: new Date(),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });

      res.status(201).json({ campaign, message: "Campaign created successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create campaign" });
    }
  }

  static async updateCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const updates = req.body;

      const campaign = CampaignModel.updateCampaign(campaignId, updates);

      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      res.json({ campaign, message: "Campaign updated successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update campaign" });
    }
  }

  static async deleteCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const deleted = CampaignModel.deleteCampaign(campaignId);

      if (!deleted) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      res.json({ message: "Campaign deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete campaign" });
    }
  }
}

