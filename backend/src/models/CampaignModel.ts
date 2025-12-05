import { v4 as uuidv4 } from "uuid";
import { Campaign } from "../types";

const campaigns: Map<string, Campaign> = new Map();
const campaignsByBrand: Map<string, Campaign[]> = new Map();

export class CampaignModel {
  static createCampaign(data: {
    brandId: string;
    title: string;
    description: string;
    type: "stamp" | "points" | "discount";
    value: number;
    startDate: Date;
    endDate?: Date;
    qualificationType?: "visits" | "money" | "scan";
    requiredVisits?: number;
    requiredAmount?: number;
  }): Campaign {
    const campaign: Campaign = {
      id: uuidv4(),
      brandId: data.brandId,
      title: data.title,
      description: data.description,
      type: data.type,
      value: data.value,
      isActive: true,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date(),
      qualificationType: data.qualificationType,
      requiredVisits: data.requiredVisits,
      requiredAmount: data.requiredAmount,
    };

    campaigns.set(campaign.id, campaign);

    const brandCampaigns = campaignsByBrand.get(data.brandId) || [];
    brandCampaigns.push(campaign);
    campaignsByBrand.set(data.brandId, brandCampaigns);

    return campaign;
  }

  static getBrandCampaigns(brandId: string): Campaign[] {
    return campaignsByBrand.get(brandId) || [];
  }

  static getActiveCampaigns(brandId: string): Campaign[] {
    const now = new Date();
    return this.getBrandCampaigns(brandId).filter(
      (c) =>
        c.isActive &&
        c.startDate <= now &&
        (!c.endDate || c.endDate >= now)
    );
  }

  static getAllActiveCampaigns(): Campaign[] {
    const now = new Date();
    return Array.from(campaigns.values()).filter(
      (c) =>
        c.isActive &&
        c.startDate <= now &&
        (!c.endDate || c.endDate >= now)
    );
  }

  static updateCampaign(id: string, updates: Partial<Campaign>): Campaign | undefined {
    const campaign = campaigns.get(id);
    if (!campaign) return undefined;

    const updated = { ...campaign, ...updates };
    campaigns.set(id, updated);
    return updated;
  }

  static deleteCampaign(id: string): boolean {
    return campaigns.delete(id);
  }
}

