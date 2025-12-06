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

      // Get customer user record to check for custom stampsToReward
      const customer = await db.users.findById(customerId);
      const stampsToReward = (customer as any)?.stampsToReward || 5; // Default to 5 if not set

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
        stampsToReward,
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
      console.log(`[getRewards] Customer ${customerId} has ${rewards.length} rewards:`, rewards.map(r => ({ id: r.id, title: r.title, campaignId: r.campaignId, isRedeemed: r.isRedeemed })));
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

      // Get customer details to check username
      const customer = await db.users.findById(customerId);
      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }

      // BRAND-CUSTOMER MAPPING: ALWAYS uses last 10 digits of phone number
      // 
      // Primary method: Match brands by last 10 digits of phone number
      // This is the main way customers are associated with brands
      //
      // Example: Customer phone "+1-555-123-4567" → last 10 digits "5551234567"
      //          Brand phone "+1-555-123-4567" → last 10 digits "5551234567"
      //          Result: Customer sees all campaigns from this brand
      
      const { User } = await import('../models/User');
      // Try multiple possible phone number fields
      const customerPhone = (customer as any).phoneNumber || (customer as any).phone || (customer as any).phoneOrEmail || '';
      
      // ALWAYS extract last 10 digits from customer phone number
      const customerPhoneLast10 = customerPhone ? User.extractUsername(customerPhone) : '';
      
      console.log('[getPromotions] Customer info:', {
        customerId,
        phone: customerPhone,
        phoneLast10: customerPhoneLast10,
      });

      // Get all brands the customer has visited (associated brands)
      const customerVisits = await db.visits.getByCustomer(customerId);
      const visitedBrandIds = new Set<string>();
      customerVisits.forEach(visit => {
        if (visit.brandId) {
          visitedBrandIds.add(visit.brandId);
        }
      });
      console.log('[getPromotions] Visited brand IDs:', Array.from(visitedBrandIds));

      // PRIMARY METHOD: Find brands by matching last 10 digits of phone number
      const associatedBrandIds = new Set<string>(visitedBrandIds);
      
      if (customerPhoneLast10) {
        try {
          const { getFirebaseFirestore } = await import('../config/firebase');
          const firestore = getFirebaseFirestore();
          
          // Get all brands and match by last 10 digits of phone number
          const allBrands = await firestore
            .collection('users')
            .where('role', '==', 'brand')
            .get();
          
          const phoneMatchedBrands: string[] = [];
          allBrands.forEach((doc: any) => {
            const brandData = doc.data();
            const brandPhone = brandData.phoneNumber || brandData.phone || '';
            
            if (brandPhone) {
              // Extract last 10 digits from brand phone
              const brandPhoneLast10 = User.extractUsername(brandPhone);
              
              // Match by last 10 digits
              if (brandPhoneLast10 === customerPhoneLast10 && doc.id) {
                associatedBrandIds.add(doc.id);
                phoneMatchedBrands.push(doc.id);
                console.log('[getPromotions] Phone-matched brand:', doc.id, {
                  customerPhoneLast10,
                  brandPhoneLast10,
                  brandPhone
                });
              }
            }
          });
          console.log('[getPromotions] Phone-matched brand IDs (last 10 digits):', phoneMatchedBrands);
        } catch (error) {
          console.error('[getPromotions] Error matching brands by phone (last 10 digits):', error);
        }
      } else {
        console.warn('[getPromotions] No customer phone number available for matching');
      }
      
      // Also include manually associated brands (for cases where phone numbers don't match)
      try {
        const { getFirebaseFirestore } = await import('../config/firebase');
        const firestore = getFirebaseFirestore();
        const associationsQuery = await firestore
          .collection('customerBrandAssociations')
          .where('customerId', '==', customerId)
          .get();
        
        associationsQuery.forEach((doc: any) => {
          const association = doc.data();
          if (association.brandId) {
            associatedBrandIds.add(association.brandId);
            console.log('[getPromotions] Manually associated brand:', association.brandId);
          }
        });
      } catch (error) {
        // Association collection might not exist yet, that's okay
        console.log('[getPromotions] No manual associations found (this is normal if not set up yet)');
      }
      
      console.log('[getPromotions] Total associated brand IDs:', Array.from(associatedBrandIds));

      // Get active campaigns from all associated brands (visited + phone-matched + manual)
      const allActiveCampaigns = await db.campaigns.getActive();
      console.log('[getPromotions] Total active campaigns:', allActiveCampaigns.length);
      
      const relevantCampaigns = allActiveCampaigns.filter(
        campaign => associatedBrandIds.has(campaign.brandId)
      );
      console.log('[getPromotions] Relevant campaigns for customer:', relevantCampaigns.length);
      
      // Log campaign details for debugging
      if (relevantCampaigns.length === 0 && allActiveCampaigns.length > 0) {
        console.log('[getPromotions] No matching campaigns found. Campaign brand IDs:', 
          allActiveCampaigns.map(c => c.brandId));
        console.log('[getPromotions] Associated brand IDs:', Array.from(associatedBrandIds));
      }

      // Get existing rewards for this customer to check for duplicates
      const existingRewards = await db.rewards.getByCustomer(customerId);

      // Enrich campaigns with brand information and customer progress
      // Also create rewards automatically when visits >= requiredVisits
      const promotionsWithBrands = await Promise.all(
        relevantCampaigns.map(async (campaign) => {
          const brand = await db.users.findById(campaign.brandId);
          
          // Calculate customer progress for this campaign
          const brandVisits = customerVisits.filter(v => v.brandId === campaign.brandId);
          const visitCount = brandVisits.length;
          const totalAmountSpent = brandVisits.reduce((sum, v) => sum + ((v.amountSpent || 0)), 0);
          
          // Calculate progress based on qualification type
          let progress = null;
          let progressText = null;
          
          if (campaign.qualificationType === "visits" && campaign.requiredVisits) {
            const visitsLeft = Math.max(0, campaign.requiredVisits - visitCount);
            progress = {
              current: visitCount,
              required: campaign.requiredVisits,
              remaining: visitsLeft,
              type: "visits",
            };
            progressText = visitsLeft > 0 
              ? `${visitsLeft} visit${visitsLeft > 1 ? 's' : ''} left`
              : "Qualified!";
            
            // Auto-create reward if visits >= requiredVisits and reward doesn't exist
            if (visitCount >= campaign.requiredVisits) {
              // Check if reward already exists for this campaign
              const rewardExists = existingRewards.some(r => 
                r.brandId === campaign.brandId && 
                !r.isRedeemed &&
                (r.campaignId === campaign.id || (r.title === campaign.title && r.brandId === campaign.brandId))
              );
              
              if (!rewardExists) {
                try {
                  // Create reward based on campaign type
                  let rewardTitle = campaign.title;
                  let rewardDescription = campaign.description;
                  let pointsRequired = 0;
                  let stampsRequired = 0;
                  
                  if (campaign.type === "points") {
                    pointsRequired = campaign.value;
                  } else if (campaign.type === "stamp") {
                    stampsRequired = campaign.value;
                  }
                  
                  await db.rewards.create({
                    customerId,
                    brandId: campaign.brandId,
                    campaignId: campaign.id,
                    title: rewardTitle,
                    description: rewardDescription,
                    pointsRequired,
                    stampsRequired,
                    isRedeemed: false,
                  });
                  
                  console.log(`✅ Auto-created reward for campaign ${campaign.id} - customer ${customerId} (visits: ${visitCount} >= ${campaign.requiredVisits})`);
                } catch (rewardError: any) {
                  console.error(`❌ Failed to create reward for campaign ${campaign.id}:`, rewardError);
                  // Continue even if reward creation fails
                }
              }
            }
          } else if (campaign.qualificationType === "money" && campaign.requiredAmount) {
            const amountLeft = Math.max(0, campaign.requiredAmount - totalAmountSpent);
            progress = {
              current: totalAmountSpent,
              required: campaign.requiredAmount,
              remaining: amountLeft,
              type: "money",
            };
            progressText = amountLeft > 0 
              ? `$${amountLeft.toFixed(2)} left to spend`
              : "Qualified!";
            
            // Auto-create reward if amount spent >= requiredAmount and reward doesn't exist
            if (totalAmountSpent >= campaign.requiredAmount) {
              const rewardExists = existingRewards.some(r => 
                r.brandId === campaign.brandId && 
                !r.isRedeemed &&
                (r.campaignId === campaign.id || (r.title === campaign.title && r.brandId === campaign.brandId))
              );
              
              if (!rewardExists) {
                try {
                  let pointsRequired = 0;
                  let stampsRequired = 0;
                  
                  if (campaign.type === "points") {
                    pointsRequired = campaign.value;
                  } else if (campaign.type === "stamp") {
                    stampsRequired = campaign.value;
                  }
                  
                  await db.rewards.create({
                    customerId,
                    brandId: campaign.brandId,
                    campaignId: campaign.id,
                    title: campaign.title,
                    description: campaign.description,
                    pointsRequired,
                    stampsRequired,
                    isRedeemed: false,
                  });
                  
                  console.log(`✅ Auto-created reward for campaign ${campaign.id} - customer ${customerId} (amount: $${totalAmountSpent} >= $${campaign.requiredAmount})`);
                } catch (rewardError: any) {
                  console.error(`❌ Failed to create reward for campaign ${campaign.id}:`, rewardError);
                }
              }
            }
          } else if (campaign.qualificationType === "scan") {
            // Scan-based campaigns are available immediately
            progress = {
              current: 1,
              required: 1,
              remaining: 0,
              type: "scan",
            };
            progressText = "Available now";
          }
          
          return {
            ...campaign,
            brand: brand ? {
              id: brand.id,
              name: (brand as any).businessName || (brand as any).firstName || (brand as any).phoneNumber || brand.name,
              businessName: (brand as any).businessName,
              phoneNumber: (brand as any).phoneNumber || brand.phone,
            } : null,
            progress,
            progressText,
          };
        })
      );

      console.log('[getPromotions] Returning promotions:', promotionsWithBrands.length);
      res.json({ promotions: promotionsWithBrands });
    } catch (error: any) {
      console.error("Error in getPromotions:", error);
      res.status(500).json({ error: error.message || "Failed to fetch promotions" });
    }
  }

  /**
   * Find brand by phone number (last 10 digits only)
   * Helper endpoint to find brandId from phone number
   */
  static async findBrandByPhone(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        res.status(400).json({ error: "phoneNumber is required" });
        return;
      }

      const { getFirebaseFirestore } = await import('../config/firebase');
      const firestore = getFirebaseFirestore();
      const { User } = await import('../models/User');
      const customerPhoneLast10 = User.extractUsername(phoneNumber);
      
      // Find brands by matching last 10 digits of phone number only
      const brands = await firestore
        .collection('users')
        .where('role', '==', 'brand')
        .get();
      
      const matchingBrands: any[] = [];
      brands.docs.forEach((doc: any) => {
        const brandData = doc.data();
        const brandPhone = brandData.phoneNumber || brandData.phone || '';
        
        if (brandPhone) {
          // Extract last 10 digits from brand phone number
          const brandPhoneLast10 = User.extractUsername(brandPhone);
          
          // Match by last 10 digits only (no username checks)
          if (brandPhoneLast10 === customerPhoneLast10) {
            matchingBrands.push({
              id: doc.id,
              phoneNumber: brandPhone,
              businessName: brandData.businessName,
              name: brandData.name || brandData.firstName,
            });
          }
        }
      });

      if (matchingBrands.length === 0) {
        res.status(404).json({ error: "No brand found with the provided phone number" });
        return;
      }

      res.json({ brands: matchingBrands });
    } catch (error: any) {
      console.error("Error in findBrandByPhone:", error);
      res.status(500).json({ error: error.message || "Failed to find brand" });
    }
  }

  /**
   * Manually associate a customer with a brand
   * This allows customers to see campaigns from brands even if phone numbers don't match
   */
  static async associateBrand(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.userId!;
      const { brandId, brandPhoneNumber } = req.body;
      const db = getDatabase();

      if (!brandId && !brandPhoneNumber) {
        res.status(400).json({ error: "Either brandId or brandPhoneNumber is required" });
        return;
      }

      let targetBrandId = brandId;

      // If brandPhoneNumber provided, find brand by phone (last 10 digits only)
      if (!targetBrandId && brandPhoneNumber) {
        const { getFirebaseFirestore } = await import('../config/firebase');
        const firestore = getFirebaseFirestore();
        const { User } = await import('../models/User');
        const providedPhoneLast10 = User.extractUsername(brandPhoneNumber);
        
        // Find brand by matching last 10 digits of phone number only
        const brands = await firestore
          .collection('users')
          .where('role', '==', 'brand')
          .get();
        
        for (const doc of brands.docs) {
          const brandData = doc.data();
          const brandPhone = brandData.phoneNumber || brandData.phone || '';
          
          if (brandPhone) {
            // Extract last 10 digits from brand phone number
            const brandPhoneLast10 = User.extractUsername(brandPhone);
            
            // Match by last 10 digits only (no username checks)
            if (brandPhoneLast10 === providedPhoneLast10) {
              targetBrandId = doc.id;
              break;
            }
          }
        }

        if (!targetBrandId) {
          res.status(404).json({ error: "Brand not found with the provided phone number" });
          return;
        }
      }

      // Verify brand exists
      const brand = await db.users.findById(targetBrandId);
      if (!brand || (brand as any).role !== 'brand') {
        res.status(404).json({ error: "Brand not found" });
        return;
      }

      // Create or update association
      const { getFirebaseFirestore } = await import('../config/firebase');
      const firestore = getFirebaseFirestore();
      const associationRef = firestore
        .collection('customerBrandAssociations')
        .doc(`${customerId}_${targetBrandId}`);
      
      await associationRef.set({
        customerId,
        brandId: targetBrandId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      res.json({ 
        success: true, 
        message: "Brand associated successfully",
        customerId,
        brandId: targetBrandId
      });
    } catch (error: any) {
      console.error("Error in associateBrand:", error);
      res.status(500).json({ error: error.message || "Failed to associate brand" });
    }
  }
}

