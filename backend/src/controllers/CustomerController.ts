import { Response } from "express";
import { LoyaltyService } from "../services/LoyaltyService";
import { AuthRequest } from "../middleware/auth";

export class CustomerController {
  static async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.userId!;
      const dashboard = LoyaltyService.getCustomerDashboard(customerId);
      res.json(dashboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch dashboard" });
    }
  }

  static async getQRCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.userId!;
      const qrPayload = LoyaltyService.generateQRPayload(customerId);
      res.json({ qrPayload });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate QR code" });
    }
  }

  static async getRewards(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.userId!;
      const rewards = LoyaltyService.getCustomerRewards(customerId);
      res.json({ rewards });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch rewards" });
    }
  }

  static async redeemReward(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.userId!;
      const { rewardId } = req.body;

      if (!rewardId) {
        res.status(400).json({ error: "rewardId is required" });
        return;
      }

      const reward = LoyaltyService.redeemReward(rewardId, customerId);

      if (!reward) {
        res.status(404).json({ error: "Reward not found or already redeemed" });
        return;
      }

      res.json({ reward, message: "Reward redeemed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to redeem reward" });
    }
  }

  static async getPromotions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const promotions = LoyaltyService.getActivePromotions();
      res.json({ promotions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch promotions" });
    }
  }
}

