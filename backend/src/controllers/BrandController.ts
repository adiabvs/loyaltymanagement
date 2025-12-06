import { Response } from "express";
import { getDatabase } from "../database/base";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { Campaign } from "../types";

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
      const db = getDatabase();

      // Get all visits for this brand
      const visits = await db.visits.getByBrand(brandId);
      const totalVisits = visits.length;

      // Get unique customers who have visited this brand
      const uniqueCustomerIds = await db.visits.getUniqueCustomersForBrand(brandId);
      const returningCustomers = uniqueCustomerIds.length;

      // Get all customers who have visited this brand
      const allCustomers = await Promise.all(
        uniqueCustomerIds.map(id => db.users.findById(id))
      );
      const totalCustomers = allCustomers.filter(c => c !== null).length;

      // Get active campaigns
      const activeCampaigns = await db.campaigns.getActive(brandId);
      const activeCampaignsCount = activeCampaigns.length;

      // Count redemptions (rewards redeemed for this brand)
      let redemptions = 0;
      for (const customerId of uniqueCustomerIds) {
        const customerRewards = await db.rewards.getByCustomer(customerId);
        const brandRedemptions = customerRewards.filter(
          r => r.brandId === brandId && r.isRedeemed
        );
        redemptions += brandRedemptions.length;
      }

      const metrics = {
        totalVisits,
        returningCustomers,
        redemptions,
        activeCampaigns: activeCampaignsCount,
        totalCustomers,
      };

      res.json({ metrics });
    } catch (error: any) {
      console.error("Error in getDashboard:", error);
      res.status(500).json({ error: error.message || "Failed to fetch dashboard" });
    }
  }

  static async processQR(req: AuthRequest, res: Response): Promise<void> {
    try {
      const brandId = req.userId!;
      const { qrData, phoneNumber } = req.body;
      const db = getDatabase();

      let customerId: string | null = null;
      let customer = null;

      // Support both QR code and phone number lookup
      if (phoneNumber) {
        // Find customer by matching last 10 digits of phone number
        const { getFirebaseFirestore } = await import('../config/firebase');
        const firestore = getFirebaseFirestore();
        const { User } = await import('../models/User');
        const providedPhoneLast10 = User.extractUsername(phoneNumber);
        
        // Get all customers and match by last 10 digits of phone number
        const customers = await firestore
          .collection('users')
          .where('role', '==', 'customer')
          .get();
        
        for (const doc of customers.docs) {
          const customerData = doc.data();
          const customerPhone = customerData.phoneNumber || customerData.phone || '';
          
          if (customerPhone) {
            // Extract last 10 digits from customer phone number
            const customerPhoneLast10 = User.extractUsername(customerPhone);
            
            // Match by last 10 digits
            if (customerPhoneLast10 === providedPhoneLast10) {
              customer = {
                id: doc.id,
                ...customerData
              } as any;
              break;
            }
          }
        }
        
        if (!customer || !customer.id) {
          res.status(404).json({ error: "Customer not found with the provided phone number." });
          return;
        }
        customerId = customer.id;
      } else if (qrData) {
        // Parse QR payload (original method)
        try {
          const payload = JSON.parse(qrData);
          if (payload.type !== "visit") {
            res.status(400).json({ error: "Invalid QR code type" });
            return;
          }

          // Check if QR is too old (e.g., > 1 hour)
          const qrAge = Date.now() - payload.issuedAt;
          const oneHour = 60 * 60 * 1000;
          if (qrAge > oneHour) {
            res.status(400).json({ error: "QR code expired. Please refresh." });
            return;
          }

          // Find customer by customerId from QR
          if (payload.customerId) {
            customer = await db.users.findById(payload.customerId);
          }
          
          if (!customer || !customer.id) {
            res.status(404).json({ error: "Customer not found" });
            return;
          }
          customerId = customer.id;
        } catch (parseError) {
          res.status(400).json({ error: "Invalid QR code format" });
          return;
        }
      } else {
        res.status(400).json({ error: "Either qrData or phoneNumber is required" });
        return;
      }

      // Create visit
      const pointsEarned = 10; // Default points per visit
      const stampsEarned = 1; // Default 1 stamp per visit

      const visitData: any = {
        customerId,
        brandId,
        pointsEarned,
        stampsEarned,
      };

      // Include amountSpent if provided (for money-based campaigns)
      if (req.body.amountSpent) {
        visitData.amountSpent = req.body.amountSpent;
      }

      const visit = await db.visits.create(visitData);

      // Get customer's current visits count
      const customerVisits = await db.visits.getByCustomer(customerId);
      const visitCount = customerVisits.length;

      // Check and auto-create rewards for campaigns if customer qualifies
      try {
        const activeCampaigns = await db.campaigns.getActive(brandId);
        const existingRewards = await db.rewards.getByCustomer(customerId);
        const brandVisits = customerVisits.filter(v => v.brandId === brandId);
        const brandVisitCount = brandVisits.length;
        const totalAmountSpent = brandVisits.reduce((sum, v) => sum + ((v.amountSpent || 0)), 0);

        for (const campaign of activeCampaigns) {
          // Check if reward already exists for this campaign
          const rewardExists = existingRewards.some(r => 
            r.brandId === campaign.brandId && 
            !r.isRedeemed &&
            (r.campaignId === campaign.id || (r.title === campaign.title && r.brandId === campaign.brandId))
          );

          if (rewardExists) {
            console.log(`Reward already exists for campaign ${campaign.id} - customer ${customerId}`);
            continue;
          }

          // Check if customer qualifies for visits-based campaign
          if (campaign.qualificationType === "visits" && campaign.requiredVisits) {
            console.log(`Checking visits campaign ${campaign.id}: customer has ${brandVisitCount} visits, needs ${campaign.requiredVisits}`);
            if (brandVisitCount >= campaign.requiredVisits) {
              let pointsRequired = 0;
              let stampsRequired = 0;
              
              if (campaign.type === "points") {
                pointsRequired = campaign.value;
              } else if (campaign.type === "stamp") {
                stampsRequired = campaign.value;
              }
              
              try {
                const reward = await db.rewards.create({
                  customerId,
                  brandId: campaign.brandId,
                  campaignId: campaign.id,
                  title: campaign.title,
                  description: campaign.description,
                  pointsRequired,
                  stampsRequired,
                  isRedeemed: false,
                });
                
                console.log(`✅ Auto-created reward for campaign ${campaign.id} - customer ${customerId} (visits: ${brandVisitCount} >= ${campaign.requiredVisits})`, reward);
              } catch (createError: any) {
                console.error(`❌ Failed to create reward for campaign ${campaign.id}:`, createError);
              }
            }
          }
          // Check if customer qualifies for money-based campaign
          else if (campaign.qualificationType === "money" && campaign.requiredAmount) {
            console.log(`Checking money campaign ${campaign.id}: customer spent $${totalAmountSpent}, needs $${campaign.requiredAmount}`);
            if (totalAmountSpent >= campaign.requiredAmount) {
              let pointsRequired = 0;
              let stampsRequired = 0;
              
              if (campaign.type === "points") {
                pointsRequired = campaign.value;
              } else if (campaign.type === "stamp") {
                stampsRequired = campaign.value;
              }
              
              try {
                const reward = await db.rewards.create({
                  customerId,
                  brandId: campaign.brandId,
                  campaignId: campaign.id,
                  title: campaign.title,
                  description: campaign.description,
                  pointsRequired,
                  stampsRequired,
                  isRedeemed: false,
                });
                
                console.log(`✅ Auto-created reward for campaign ${campaign.id} - customer ${customerId} (amount: $${totalAmountSpent} >= $${campaign.requiredAmount})`, reward);
              } catch (createError: any) {
                console.error(`❌ Failed to create reward for campaign ${campaign.id}:`, createError);
              }
            }
          }
        }
      } catch (rewardError: any) {
        // Log error but don't fail the visit creation
        console.error("Error checking/creating rewards after visit:", rewardError);
      }

      res.json({
        success: true,
        message: `Visit recorded! Customer now has ${visitCount} visits.`,
        visit,
        customer: {
          id: customer.id,
          phoneNumber: customer.phoneNumber,
          name: customer.firstName || customer.lastName 
            ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() 
            : undefined,
          visits: visitCount,
        },
      });
    } catch (error: any) {
      console.error("Error in processQR:", error);
      res.status(400).json({ error: error.message || "Failed to process QR code" });
    }
  }

  static async getCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const brandId = req.userId!;
      const db = getDatabase();
      const campaigns = await db.campaigns.getByBrand(brandId);
      res.json({ campaigns });
    } catch (error: any) {
      console.error("Error in getCampaigns:", error);
      res.status(500).json({ error: error.message || "Failed to fetch campaigns" });
    }
  }

  static async createCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const brandId = req.userId!;
      const data = createCampaignSchema.parse(req.body);
      const db = getDatabase();

      const campaignData: any = {
        brandId,
        title: data.title,
        description: data.description,
        type: data.type,
        value: data.value,
        isActive: true,
        startDate: new Date(),
        qualificationType: data.qualificationType || "scan", // Default to "scan" if not specified
      };

      // Only include endDate if provided
      if (data.endDate) {
        campaignData.endDate = new Date(data.endDate);
      }

      // Include qualification requirements if specified
      if (data.qualificationType === "visits" && data.requiredVisits) {
        campaignData.requiredVisits = data.requiredVisits;
      }
      if (data.qualificationType === "money" && data.requiredAmount) {
        campaignData.requiredAmount = data.requiredAmount;
      }

      const campaign = await db.campaigns.create(campaignData);

      res.status(201).json({ campaign, message: "Campaign created successfully" });
    } catch (error: any) {
      console.error("Error in createCampaign:", error);
      res.status(400).json({ error: error.message || "Failed to create campaign" });
    }
  }

  static async updateCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const updates = req.body;
      const db = getDatabase();

      const campaign = await db.campaigns.update(campaignId, updates);

      if (!campaign) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      res.json({ campaign, message: "Campaign updated successfully" });
    } catch (error: any) {
      console.error("Error in updateCampaign:", error);
      res.status(400).json({ error: error.message || "Failed to update campaign" });
    }
  }

  static async deleteCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const db = getDatabase();

      const deleted = await db.campaigns.delete(campaignId);

      if (!deleted) {
        res.status(404).json({ error: "Campaign not found" });
        return;
      }

      res.json({ message: "Campaign deleted successfully" });
    } catch (error: any) {
      console.error("Error in deleteCampaign:", error);
      res.status(500).json({ error: error.message || "Failed to delete campaign" });
    }
  }

  static async getCustomers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const brandId = req.userId!;
      const db = getDatabase();

      // Get unique customers who have visited this brand
      const uniqueCustomerIds = await db.visits.getUniqueCustomersForBrand(brandId);
      
      // Get customer details
      const customers = await Promise.all(
        uniqueCustomerIds.map(async (customerId) => {
          const user = await db.users.findById(customerId);
          if (!user) return null;

          const visits = await db.visits.getByCustomer(customerId);
          const brandVisits = visits.filter(v => v.brandId === brandId);
          
          // Get last visit date
          const lastVisit = brandVisits.length > 0 
            ? brandVisits.sort((a, b) => {
                const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
                const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
                return dateB.getTime() - dateA.getTime();
              })[0]
            : null;

          const lastVisitDate = lastVisit 
            ? (lastVisit.timestamp instanceof Date 
                ? lastVisit.timestamp 
                : new Date(lastVisit.timestamp))
            : null;

          // Calculate days since last visit
          let lastVisitText = "Never";
          if (lastVisitDate) {
            const daysAgo = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysAgo === 0) lastVisitText = "Today";
            else if (daysAgo === 1) lastVisitText = "1 day ago";
            else if (daysAgo < 7) lastVisitText = `${daysAgo} days ago`;
            else if (daysAgo < 30) lastVisitText = `${Math.floor(daysAgo / 7)} weeks ago`;
            else lastVisitText = `${Math.floor(daysAgo / 30)} months ago`;
          }

          return {
            id: user.id,
            name: user.firstName || user.lastName 
              ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
              : user.phoneNumber,
            phone: user.phoneNumber,
            email: user.email,
            visits: brandVisits.length,
            lastVisit: lastVisitText,
            status: lastVisitDate && (Date.now() - lastVisitDate.getTime()) < 30 * 24 * 60 * 60 * 1000 
              ? "active" 
              : "inactive",
          };
        })
      );

      const validCustomers = customers.filter(c => c !== null);

      res.json({ 
        customers: validCustomers,
        total: validCustomers.length,
        active: validCustomers.filter(c => c.status === "active").length,
      });
    } catch (error: any) {
      console.error("Error in getCustomers:", error);
      res.status(500).json({ error: error.message || "Failed to fetch customers" });
    }
  }

}

