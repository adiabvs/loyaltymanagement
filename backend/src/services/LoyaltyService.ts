import { UserModel } from "../models/UserModel";
import { VisitModel } from "../models/VisitModel";
import { RewardModel } from "../models/RewardModel";
import { CampaignModel } from "../models/CampaignModel";
import { QRPayload, Customer, BrandMetrics, Reward, Campaign } from "../types";

export class LoyaltyService {
  static generateQRPayload(customerId: string): string {
    const payload: QRPayload = {
      type: "visit",
      customerId,
      issuedAt: Date.now(),
    };
    return JSON.stringify(payload);
  }

  static processQRCheckIn(brandId: string, qrData: string): {
    success: boolean;
    message: string;
    visit?: any;
    customer?: Customer;
  } {
    try {
      const payload: QRPayload = JSON.parse(qrData);

      if (payload.type !== "visit") {
        return { success: false, message: "Invalid QR code type" };
      }

      const customer = UserModel.getCustomer(payload.customerId);
      if (!customer) {
        return { success: false, message: "Customer not found" };
      }

      // Check if QR is too old (e.g., > 1 hour)
      const qrAge = Date.now() - payload.issuedAt;
      const oneHour = 60 * 60 * 1000;
      if (qrAge > oneHour) {
        return { success: false, message: "QR code expired. Please refresh." };
      }

      // Create visit
      const pointsEarned = 10; // Default points per visit
      const stampsEarned = 1; // Default 1 stamp per visit

      const visit = VisitModel.createVisit({
        customerId: payload.customerId,
        brandId,
        pointsEarned,
        stampsEarned,
      });

      // Update customer stats
      const updatedCustomer = UserModel.updateCustomer(payload.customerId, {
        totalVisits: customer.totalVisits + 1,
        totalPoints: customer.totalPoints + pointsEarned,
        currentStamps: customer.currentStamps + stampsEarned,
      });

      // Check if customer earned a reward
      if (updatedCustomer && updatedCustomer.currentStamps >= updatedCustomer.stampsToReward) {
        const stampsUsed = updatedCustomer.stampsToReward;
        RewardModel.createReward({
          customerId: payload.customerId,
          brandId,
          title: "Free Reward",
          description: `You've earned a free reward after ${stampsUsed} visits!`,
          pointsRequired: 0,
          stampsRequired: stampsUsed,
        });

        // Reset stamps
        UserModel.updateCustomer(payload.customerId, {
          currentStamps: updatedCustomer.currentStamps - stampsUsed,
        });
      }

      return {
        success: true,
        message: `Visit recorded! Customer now has ${updatedCustomer?.totalVisits || 0} visits.`,
        visit,
        customer: updatedCustomer,
      };
    } catch (error) {
      return { success: false, message: "Invalid QR code format" };
    }
  }

  static getCustomerDashboard(customerId: string): {
    customer: Customer | undefined;
    visits: number;
    points: number;
    stamps: number;
    stampsToReward: number;
    rewards: Reward[];
    qrPayload: string;
  } {
    const customer = UserModel.getCustomer(customerId);
    const visits = VisitModel.getCustomerVisits(customerId);
    const rewards = RewardModel.getUnredeemedRewards(customerId);
    const qrPayload = this.generateQRPayload(customerId);

    return {
      customer,
      visits: visits.length,
      points: customer?.totalPoints || 0,
      stamps: customer?.currentStamps || 0,
      stampsToReward: customer?.stampsToReward || 5,
      rewards,
      qrPayload,
    };
  }

  static getBrandMetrics(brandId: string): BrandMetrics {
    const visits = VisitModel.getBrandVisits(brandId);
    const uniqueCustomers = VisitModel.getUniqueCustomersForBrand(brandId);
    const campaigns = CampaignModel.getActiveCampaigns(brandId);
    const allCustomers = UserModel.getAllCustomers();
    const brandCustomers = allCustomers.filter((c) =>
      visits.some((v) => v.customerId === c.id)
    );

    // Count redemptions (rewards redeemed for this brand)
    const allRewards = brandCustomers.flatMap((c) =>
      RewardModel.getCustomerRewards(c.id)
    );
    const redemptions = allRewards.filter((r) => r.isRedeemed && r.brandId === brandId).length;

    return {
      totalVisits: visits.length,
      returningCustomers: uniqueCustomers.length,
      redemptions,
      activeCampaigns: campaigns.length,
      totalCustomers: brandCustomers.length,
    };
  }

  static getCustomerRewards(customerId: string): Reward[] {
    return RewardModel.getCustomerRewards(customerId);
  }

  static redeemReward(rewardId: string, customerId: string): Reward | null {
    const reward = RewardModel.redeemReward(rewardId);
    if (!reward || reward.customerId !== customerId) {
      return null;
    }
    return reward;
  }

  static getActivePromotions(brandId?: string): Campaign[] {
    if (brandId) {
      return CampaignModel.getActiveCampaigns(brandId);
    }
    return CampaignModel.getAllActiveCampaigns();
  }
}

