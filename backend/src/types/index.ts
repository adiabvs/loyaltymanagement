export type UserRole = "customer" | "brand";

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer extends User {
  role: "customer";
  totalVisits: number;
  totalPoints: number;
  currentStamps: number;
  stampsToReward: number;
}

export interface Brand extends User {
  role: "brand";
  businessName: string;
  businessType?: string;
  location?: string;
}

export interface Visit {
  id: string;
  customerId: string;
  brandId: string;
  timestamp: Date;
  pointsEarned: number;
  stampsEarned: number;
  amountSpent?: number; // Optional: amount spent during this visit
}

export interface Reward {
  id: string;
  customerId: string;
  brandId: string;
  campaignId?: string; // Link to the campaign that generated this reward
  title: string;
  description: string;
  pointsRequired: number;
  stampsRequired: number;
  isRedeemed: boolean;
  redeemedAt?: Date;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  type: "stamp" | "points" | "discount";
  value: number;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  qualificationType?: "visits" | "money" | "scan"; // How customer qualifies for this campaign
  requiredVisits?: number; // Required visits if qualificationType is "visits"
  requiredAmount?: number; // Required money spent if qualificationType is "money"
}

export interface QRPayload {
  type: "visit";
  customerId: string;
  issuedAt: number;
}

export interface BrandMetrics {
  totalVisits: number;
  returningCustomers: number;
  redemptions: number;
  activeCampaigns: number;
  totalCustomers: number;
}

export interface AuthRequest {
  phoneOrEmail: string;
  role: UserRole;
  name?: string;
  businessName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

