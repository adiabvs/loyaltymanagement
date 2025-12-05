/**
 * Database abstraction layer
 * 
 * This file provides a base interface for database operations.
 * Implement Firebase, Supabase, or any other database by extending these interfaces.
 */

import { User, Customer, Brand, Visit, Reward, Campaign } from "../types";

// Base repository interfaces
export interface IUserRepository {
  create(data: Partial<User>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmailOrPhone(phoneOrEmail: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
}

export interface ICustomerRepository {
  getById(id: string): Promise<Customer | null>;
  update(id: string, data: Partial<Customer>): Promise<Customer>;
  getAll(): Promise<Customer[]>;
}

export interface IBrandRepository {
  getById(id: string): Promise<Brand | null>;
  getAll(): Promise<Brand[]>;
}

export interface IVisitRepository {
  create(data: Omit<Visit, "id" | "timestamp">): Promise<Visit>;
  getByCustomer(customerId: string): Promise<Visit[]>;
  getByBrand(brandId: string): Promise<Visit[]>;
  getUniqueCustomersForBrand(brandId: string): Promise<string[]>;
}

export interface IRewardRepository {
  create(data: Omit<Reward, "id" | "createdAt">): Promise<Reward>;
  getByCustomer(customerId: string): Promise<Reward[]>;
  getUnredeemed(customerId: string): Promise<Reward[]>;
  redeem(id: string): Promise<Reward | null>;
}

export interface ICampaignRepository {
  create(data: Omit<Campaign, "id" | "createdAt">): Promise<Campaign>;
  getByBrand(brandId: string): Promise<Campaign[]>;
  getActive(brandId?: string): Promise<Campaign[]>;
  update(id: string, data: Partial<Campaign>): Promise<Campaign | null>;
  delete(id: string): Promise<boolean>;
}

// Database adapter interface
export interface IDatabaseAdapter {
  users: IUserRepository;
  customers: ICustomerRepository;
  brands: IBrandRepository;
  visits: IVisitRepository;
  rewards: IRewardRepository;
  campaigns: ICampaignRepository;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

// Example: In-memory implementation (current MVP)
// Replace this with Firebase/Supabase implementation
export class InMemoryDatabase implements IDatabaseAdapter {
  users: IUserRepository;
  customers: ICustomerRepository;
  brands: IBrandRepository;
  visits: IVisitRepository;
  rewards: IRewardRepository;
  campaigns: ICampaignRepository;

  constructor() {
    // Use existing models as repositories
    // In production, replace with actual database repositories
    this.users = {} as IUserRepository;
    this.customers = {} as ICustomerRepository;
    this.brands = {} as IBrandRepository;
    this.visits = {} as IVisitRepository;
    this.rewards = {} as IRewardRepository;
    this.campaigns = {} as ICampaignRepository;
  }

  async connect(): Promise<void> {
    // No-op for in-memory
  }

  async disconnect(): Promise<void> {
    // No-op for in-memory
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// Import database implementations
import { FirebaseDatabase } from './firebase';

// Database factory
let dbInstance: IDatabaseAdapter | null = null;

export function getDatabase(): IDatabaseAdapter {
  if (!dbInstance) {
    // Support both DB_TYPE and DATABASE_TYPE, with DB_TYPE taking precedence
    const dbType = process.env.DB_TYPE || process.env.DATABASE_TYPE || "memory";
    
    switch (dbType) {
      case "firebase":
        dbInstance = new FirebaseDatabase();
        break;
      case "supabase":
        // TODO: Import and return SupabaseDatabase
        // return new SupabaseDatabase();
        throw new Error("Supabase database not yet implemented");
      default:
        dbInstance = new InMemoryDatabase();
    }
  }
  
  return dbInstance;
}

