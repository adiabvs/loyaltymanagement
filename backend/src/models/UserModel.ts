import { v4 as uuidv4 } from "uuid";
import { User, Customer, Brand, UserRole } from "../types";

// In-memory storage for MVP (replace with database in production)
const users: Map<string, User> = new Map();
const customers: Map<string, Customer> = new Map();
const brands: Map<string, Brand> = new Map();

export class UserModel {
  static createUser(data: {
    email?: string;
    phone?: string;
    name: string;
    role: UserRole;
    businessName?: string;
  }): User {
    const id = uuidv4();
    const now = new Date();

    const user: User = {
      id,
      email: data.email,
      phone: data.phone,
      name: data.name,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    };

    users.set(id, user);

    if (data.role === "customer") {
      const customer: Customer = {
        ...user,
        role: "customer",
        totalVisits: 0,
        totalPoints: 0,
        currentStamps: 0,
        stampsToReward: 5, // Default: 5 stamps = 1 reward
      };
      customers.set(id, customer);
    } else if (data.role === "brand") {
      const brand: Brand = {
        ...user,
        role: "brand",
        businessName: data.businessName || data.name,
      };
      brands.set(id, brand);
    }

    return user;
  }

  static findById(id: string): User | undefined {
    return users.get(id);
  }

  static findByEmailOrPhone(phoneOrEmail: string): User | undefined {
    for (const user of users.values()) {
      if (user.email === phoneOrEmail || user.phone === phoneOrEmail) {
        return user;
      }
    }
    return undefined;
  }

  static getCustomer(id: string): Customer | undefined {
    return customers.get(id);
  }

  static getBrand(id: string): Brand | undefined {
    return brands.get(id);
  }

  static updateCustomer(id: string, updates: Partial<Customer>): Customer | undefined {
    const customer = customers.get(id);
    if (!customer) return undefined;

    const updated = { ...customer, ...updates, updatedAt: new Date() };
    customers.set(id, updated);
    users.set(id, updated);
    return updated;
  }

  static getAllCustomers(): Customer[] {
    return Array.from(customers.values());
  }

  static getAllBrands(): Brand[] {
    return Array.from(brands.values());
  }
}

