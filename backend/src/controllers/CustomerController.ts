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

      // Get customer user record to check for custom stampsToReward and username
      const customer = await db.users.findById(customerId);
      const stampsToReward = (customer as any)?.stampsToReward || 5; // Default to 5 if not set

      // Generate QR payload
      const qrPayload = JSON.stringify({
        type: "visit",
        customerId,
        username: (customer as any)?.username,
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
      const db = getDatabase();
      const customer = await db.users.findById(customerId);
      
      // Get username (use last 10 digits if not set)
      const { User } = await import('../models/User');
      const username = (customer as any)?.username || User.extractUsername((customer as any)?.phoneNumber || '');
      
      const qrPayload = JSON.stringify({
        type: "visit",
        customerId,
        username,
        issuedAt: Date.now(),
      });
      res.json({ qrPayload });
    } catch (error: any) {
      console.error("Error in getQRCode:", error);
      res.status(500).json({ error: error.message || "Failed to generate QR code" });
    }
  }

  static async checkUsername(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const db = getDatabase();
      const user = await db.users.findById(userId);
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { User } = await import('../models/User');
      const phoneNumber = (user as any)?.phoneNumber || (user as any)?.phone || '';
      const username = (user as any)?.username;
      const autoUsername = phoneNumber ? User.extractUsername(phoneNumber) : '';
      const hasExplicitUsername = username && username !== autoUsername;
      
      res.json({
        hasUsername: !!username,
        hasExplicitUsername,
        username: username || autoUsername,
        phoneNumber,
        needsSetup: !hasExplicitUsername,
      });
    } catch (error: any) {
      console.error("Error in checkUsername:", error);
      res.status(500).json({ error: error.message || "Failed to check username" });
    }
  }

  /**
   * Update username for authenticated customer
   */
  static async updateUsername(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { username } = req.body;
      const db = getDatabase();

      if (!username) {
        res.status(400).json({ error: "Username is required" });
        return;
      }

      // Validate username
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        res.status(400).json({ error: "Username must be 3-20 characters, alphanumeric and underscore only" });
        return;
      }

      // Check if username is already taken by another user
      const { User } = await import('../models/User');
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ error: "Username already taken" });
        return;
      }

      // Get current user
      const user = await db.users.findById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Update username
      console.log('[updateUsername] Updating username for user:', { userId, username });
      await db.users.update(userId, { username } as any);
      
      // Verify update
      const updatedUser = await db.users.findById(userId);
      if (!updatedUser || (updatedUser as any).username !== username) {
        console.error('[updateUsername] Username not saved correctly');
        res.status(500).json({ error: "Failed to save username. Please try again." });
        return;
      }

      console.log('[updateUsername] Username updated successfully:', { userId, username });
      res.json({
        success: true,
        message: "Username updated successfully",
        username: (updatedUser as any).username,
      });
    } catch (error: any) {
      console.error("Error in updateUsername:", error);
      res.status(500).json({ error: error.message || "Failed to update username" });
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

      // Get customer details to check username
      const customer = await db.users.findById(customerId);
      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }

      // BRAND-CUSTOMER MAPPING: Uses last 10 digits of phone number
      // 
      // How it works:
      // 1. Extract customer's username (explicit username OR last 10 digits of phone)
      // 2. Find brands with matching username (last 10 digits match = same phone pattern)
      // 3. Show campaigns from all matched brands
      //
      // Example: Customer phone "+1-555-123-4567" → username "5551234567"
      //          Brand phone "+1-555-123-4567" → username "5551234567"
      //          Result: Customer sees all campaigns from this brand
      
      const { User } = await import('../models/User');
      // Try multiple possible phone number fields
      const customerPhone = (customer as any).phoneNumber || (customer as any).phone || (customer as any).phoneOrEmail || '';
      // Get username - check if explicitly set, otherwise extract last 10 digits from phone
      let customerUsername = (customer as any).username;
      if (!customerUsername && customerPhone) {
        customerUsername = User.extractUsername(customerPhone); // Extracts last 10 digits
      }
      
      console.log('[getPromotions] Customer info:', {
        customerId,
        phone: customerPhone,
        username: customerUsername,
        hasExplicitUsername: !!(customer as any).username
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

      // Also find brands by username matching (last 10 digits or explicit username)
      // This allows customers to see campaigns from brands with matching phone numbers
      const associatedBrandIds = new Set<string>(visitedBrandIds);
      
      // Find all brands with matching username (last 10 digits of phone number)
      if (customerUsername) {
        try {
          // Use Firebase directly to query brands by username
          const { getFirebaseFirestore } = await import('../config/firebase');
          const firestore = getFirebaseFirestore();
          
          // Try querying with both username and role
          let brandsQuery;
          try {
            brandsQuery = await firestore
              .collection('users')
              .where('username', '==', customerUsername)
              .where('role', '==', 'brand')
              .get();
          } catch (queryError: any) {
            // If composite index error, try separate queries
            if (queryError.message?.includes('index') || queryError.code === 'failed-precondition') {
              console.log('[getPromotions] Composite index missing, trying separate queries');
              const allBrandsQuery = await firestore
                .collection('users')
                .where('role', '==', 'brand')
                .get();
              
              brandsQuery = {
                docs: allBrandsQuery.docs.filter(doc => {
                  const data = doc.data();
                  const brandUsername = data.username || User.extractUsername(data.phoneNumber || data.phone || '');
                  return brandUsername === customerUsername;
                }),
                forEach: function(callback: any) {
                  this.docs.forEach(callback);
                }
              } as any;
            } else {
              throw queryError;
            }
          }
          
          const usernameMatchedBrands: string[] = [];
          brandsQuery.forEach((doc: any) => {
            const brandData = doc.data();
            if (doc.id && brandData) {
              associatedBrandIds.add(doc.id);
              usernameMatchedBrands.push(doc.id);
            }
          });
          console.log('[getPromotions] Username-matched brand IDs:', usernameMatchedBrands);
        } catch (error) {
          console.error('[getPromotions] Error finding brands by username:', error);
          // Fallback: try finding single brand by username
          try {
            const brandByUsername = await User.findByUsername(customerUsername);
            if (brandByUsername && brandByUsername.id && (brandByUsername as any).role === 'brand') {
              associatedBrandIds.add(brandByUsername.id);
              console.log('[getPromotions] Fallback found brand:', brandByUsername.id);
            }
          } catch (fallbackError) {
            console.error('[getPromotions] Fallback username lookup also failed:', fallbackError);
          }
        }
      } else {
        console.warn('[getPromotions] No customer username available for matching');
      }
      
      // Also try matching by phone number (in case username extraction differs)
      if (customerPhone) {
        try {
          const { getFirebaseFirestore } = await import('../config/firebase');
          const firestore = getFirebaseFirestore();
          const phoneMatchedBrands = await firestore
            .collection('users')
            .where('role', '==', 'brand')
            .get();
          
          const customerPhoneDigits = customerPhone.replace(/\D/g, '').slice(-10);
          phoneMatchedBrands.forEach((doc: any) => {
            const brandData = doc.data();
            const brandPhone = brandData.phoneNumber || brandData.phone || '';
            // If phone numbers match (or last 10 digits match), associate the brand
            if (brandPhone) {
              const brandPhoneDigits = brandPhone.replace(/\D/g, '').slice(-10);
              if (customerPhoneDigits === brandPhoneDigits && doc.id) {
                associatedBrandIds.add(doc.id);
                console.log('[getPromotions] Phone-matched brand:', doc.id, 'phone:', brandPhoneDigits);
              }
            }
          });
        } catch (error) {
          console.error('[getPromotions] Error matching by phone:', error);
        }
      }
      
      // MANUAL ASSOCIATION: Find brands by explicit phone number lookup
      // This allows customers to see campaigns from specific brands even if phone numbers don't match
      // You can set explicit usernames on both customer and brand to the same value for manual association
      // Or use the associateBrand endpoint to manually link them
      
      // Check if customer has manually associated brand IDs stored
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

      // Get active campaigns from all associated brands (visited + username-matched)
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
                (r.title === campaign.title || (r as any).campaignId === campaign.id)
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
                    title: rewardTitle,
                    description: rewardDescription,
                    pointsRequired,
                    stampsRequired,
                    isRedeemed: false,
                  });
                  
                  // Add campaignId to reward if possible (for future reference)
                  // Note: This might require updating the Reward type to include campaignId
                  console.log(`Auto-created reward for campaign ${campaign.id} - customer ${customerId}`);
                } catch (rewardError: any) {
                  console.error(`Failed to create reward for campaign ${campaign.id}:`, rewardError);
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
                (r.title === campaign.title || (r as any).campaignId === campaign.id)
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
                    title: campaign.title,
                    description: campaign.description,
                    pointsRequired,
                    stampsRequired,
                    isRedeemed: false,
                  });
                  
                  console.log(`Auto-created reward for campaign ${campaign.id} - customer ${customerId}`);
                } catch (rewardError: any) {
                  console.error(`Failed to create reward for campaign ${campaign.id}:`, rewardError);
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
   * Find brand by phone number (last 10 digits)
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
      const brandUsername = User.extractUsername(phoneNumber);
      
      // Find brand by username (last 10 digits)
      const brands = await firestore
        .collection('users')
        .where('role', '==', 'brand')
        .get();
      
      const matchingBrands: any[] = [];
      brands.docs.forEach((doc: any) => {
        const brandData = doc.data();
        const brandPhone = brandData.phoneNumber || brandData.phone || '';
        const brandUsernameFromPhone = brandData.username || User.extractUsername(brandPhone);
        
        if (brandUsernameFromPhone === brandUsername || 
            User.extractUsername(brandPhone) === brandUsername) {
          matchingBrands.push({
            id: doc.id,
            phoneNumber: brandPhone,
            username: brandUsernameFromPhone,
            businessName: brandData.businessName,
            name: brandData.name || brandData.firstName,
          });
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

      // If brandPhoneNumber provided, find brand by phone
      if (!targetBrandId && brandPhoneNumber) {
        const { getFirebaseFirestore } = await import('../config/firebase');
        const firestore = getFirebaseFirestore();
        const { User } = await import('../models/User');
        const brandUsername = User.extractUsername(brandPhoneNumber);
        
        // Find brand by username (last 10 digits)
        const brands = await firestore
          .collection('users')
          .where('role', '==', 'brand')
          .get();
        
        for (const doc of brands.docs) {
          const brandData = doc.data();
          const brandPhone = brandData.phoneNumber || brandData.phone || '';
          const brandUsernameFromPhone = brandData.username || User.extractUsername(brandPhone);
          
          if (brandUsernameFromPhone === brandUsername || 
              User.extractUsername(brandPhone) === brandUsername) {
            targetBrandId = doc.id;
            break;
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

