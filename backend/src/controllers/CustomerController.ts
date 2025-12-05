import { Response } from "express";
import { getDatabase } from "../database/base";
import { AuthRequest } from "../middleware/auth";

export class CustomerController {
  static async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.userId!;
      const db = getDatabase();

      // Get customer visits
      const visits = await db.visits.getByCustomer(customerId);
      const visitCount = visits.length;

      // Calculate total points and stamps from visits
      const totalPoints = visits.reduce((sum, v) => sum + (v.pointsEarned || 0), 0);
      const totalStamps = visits.reduce((sum, v) => sum + (v.stampsEarned || 0), 0);

      // Get unredeemed rewards
      const rewards = await db.rewards.getUnredeemed(customerId);

      // Generate QR payload
      const qrPayload = JSON.stringify({
        type: "visit",
        customerId,
        issuedAt: Date.now(),
      });

      res.json({
        visits: visitCount,
        points: totalPoints,
        stamps: totalStamps,
        stampsToReward: 5, // Default, can be made configurable
        rewards,
        qrPayload,
      });
    } catch (error: any) {
      console.error("Error in getDashboard:", error);
      res.status(500).json({ error: error.message || "Failed to fetch dashboard" });
    }
  }

  static async getQRCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.userId!;
      const qrPayload = JSON.stringify({
        type: "visit",
        customerId,
        issuedAt: Date.now(),
      });
      res.json({ qrPayload });
    } catch (error: any) {
      console.error("Error in getQRCode:", error);
      res.status(500).json({ error: error.message || "Failed to generate QR code" });
    }
  }

  static async getRewards(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.userId!;
      const db = getDatabase();
      const rewards = await db.rewards.getByCustomer(customerId);
      res.json({ rewards });
    } catch (error: any) {
      console.error("Error in getRewards:", error);
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

      const db = getDatabase();
      const reward = await db.rewards.redeem(rewardId);

      if (!reward || reward.customerId !== customerId) {
        res.status(404).json({ error: "Reward not found or already redeemed" });
        return;
      }

      res.json({ reward, message: "Reward redeemed successfully" });
    } catch (error: any) {
      console.error("Error in redeemReward:", error);
      res.status(500).json({ error: error.message || "Failed to redeem reward" });
    }
  }

  static async getPromotions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.userId!;
      const db = getDatabase();

      // Get all brands the customer has visited
      const customerVisits = await db.visits.getByCustomer(customerId);
      const visitedBrandIds = new Set<string>();
      customerVisits.forEach(visit => {
        if (visit.brandId) {
          visitedBrandIds.add(visit.brandId);
        }
      });

      // Get active campaigns from brands the customer has visited
      const allActiveCampaigns = await db.campaigns.getActive();
      const relevantCampaigns = allActiveCampaigns.filter(
        campaign => visitedBrandIds.has(campaign.brandId)
      );

      // Enrich campaigns with brand information
      const promotionsWithBrands = await Promise.all(
        relevantCampaigns.map(async (campaign) => {
          const brand = await db.users.findById(campaign.brandId);
          return {
            ...campaign,
            brand: brand ? {
              id: brand.id,
              name: brand.businessName || brand.firstName || brand.phoneNumber,
              businessName: brand.businessName,
              phoneNumber: brand.phoneNumber,
            } : null,
          };
        })
      );

      res.json({ promotions: promotionsWithBrands });
    } catch (error: any) {
      console.error("Error in getPromotions:", error);
      res.status(500).json({ error: error.message || "Failed to fetch promotions" });
    }
  }
}

