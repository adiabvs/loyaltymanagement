// Updated loyalty service to use backend API
import { apiClient } from "./apiClient";

// Fallback in-memory data for offline/development
let fallbackData = {
  customers: {},
  brands: {},
  visits: [],
  rewards: {},
  campaigns: [],
};

export const loyaltyService = {
  // Customer methods
  async getCustomerSnapshot(customerId) {
    try {
      const response = await apiClient.get(`/customer/dashboard`);
      return {
        visits: response.visits || 0,
        totalPoints: response.points || 0,
        currentStamps: response.stamps || 0,
        stampsToReward: response.stampsToReward || 5,
        rewardsUnlocked: response.rewards || [],
      };
    } catch (error) {
      console.warn("API call failed, using fallback:", error);
      // Fallback to in-memory
      const customer = fallbackData.customers[customerId] || {
        visits: 0,
        totalPoints: 0,
        currentStamps: 0,
        stampsToReward: 5,
        rewardsUnlocked: [],
      };
      return customer;
    }
  },

  async buildQrPayload(customerId) {
    if (!customerId) {
      return null;
    }
    try {
      const response = await apiClient.get(`/customer/qr`);
      return response.qrPayload || null;
    } catch (error) {
      console.warn("API call failed, using fallback:", error);
      // Fallback - only if we have a customerId
      if (customerId) {
        return JSON.stringify({
          type: "visit",
          customerId,
          issuedAt: Date.now(),
        });
      }
      return null;
    }
  },

  async getCustomerRewards(customerId) {
    try {
      const response = await apiClient.get(`/customer/rewards`);
      return response.rewards || [];
    } catch (error) {
      console.warn("API call failed, using fallback:", error);
      return fallbackData.rewards[customerId] || [];
    }
  },

  async redeemReward(rewardId, customerId) {
    try {
      const response = await apiClient.post(`/customer/rewards/redeem`, {
        rewardId,
      });
      return response.reward;
    } catch (error) {
      console.warn("API call failed:", error);
      throw error;
    }
  },

  async getActivePromotions() {
    try {
      const response = await apiClient.get(`/customer/promotions`);
      return response.promotions || [];
    } catch (error) {
      console.warn("API call failed, using fallback:", error);
      return fallbackData.campaigns.filter((c) => c.isActive);
    }
  },

  // Brand methods
  async getBrandSnapshot(brandId) {
    try {
      const response = await apiClient.get(`/brand/dashboard`);
      return {
        totalVisits: response.metrics?.totalVisits || 0,
        returningCustomers: response.metrics?.returningCustomers || 0,
        redemptions: response.metrics?.redemptions || 0,
        activeCampaigns: response.metrics?.activeCampaigns || 0,
        totalCustomers: response.metrics?.totalCustomers || 0,
      };
    } catch (error) {
      console.warn("API call failed, using fallback:", error);
      // Fallback
      return {
        totalVisits: 0,
        returningCustomers: 0,
        redemptions: 0,
        activeCampaigns: 0,
        totalCustomers: 0,
      };
    }
  },

  async processVisitFromQr({ brandId, qrData }) {
    try {
      const response = await apiClient.post(`/brand/scan`, { qrData });
      return {
        success: response.success,
        message: response.message,
        visit: response.visit,
        customer: response.customer,
      };
    } catch (error) {
      console.warn("API call failed:", error);
      throw error;
    }
  },

  async getBrandCampaigns(brandId) {
    try {
      const response = await apiClient.get(`/brand/campaigns`);
      return response.campaigns || [];
    } catch (error) {
      console.warn("API call failed, using fallback:", error);
      return fallbackData.campaigns.filter((c) => c.brandId === brandId);
    }
  },

  async createCampaign(brandId, campaignData) {
    try {
      const response = await apiClient.post(`/brand/campaigns`, campaignData);
      return response.campaign;
    } catch (error) {
      console.warn("API call failed:", error);
      throw error;
    }
  },
};
