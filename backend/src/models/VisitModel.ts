import { v4 as uuidv4 } from "uuid";
import { Visit } from "../types";

const visits: Map<string, Visit> = new Map();
const visitsByCustomer: Map<string, Visit[]> = new Map();
const visitsByBrand: Map<string, Visit[]> = new Map();

export class VisitModel {
  static createVisit(data: {
    customerId: string;
    brandId: string;
    pointsEarned: number;
    stampsEarned: number;
  }): Visit {
    const visit: Visit = {
      id: uuidv4(),
      customerId: data.customerId,
      brandId: data.brandId,
      timestamp: new Date(),
      pointsEarned: data.pointsEarned,
      stampsEarned: data.stampsEarned,
    };

    visits.set(visit.id, visit);

    // Index by customer
    const customerVisits = visitsByCustomer.get(data.customerId) || [];
    customerVisits.push(visit);
    visitsByCustomer.set(data.customerId, customerVisits);

    // Index by brand
    const brandVisits = visitsByBrand.get(data.brandId) || [];
    brandVisits.push(visit);
    visitsByBrand.set(data.brandId, brandVisits);

    return visit;
  }

  static getCustomerVisits(customerId: string): Visit[] {
    return visitsByCustomer.get(customerId) || [];
  }

  static getBrandVisits(brandId: string): Visit[] {
    return visitsByBrand.get(brandId) || [];
  }

  static getVisitById(id: string): Visit | undefined {
    return visits.get(id);
  }

  static getUniqueCustomersForBrand(brandId: string): string[] {
    const brandVisits = this.getBrandVisits(brandId);
    const uniqueCustomerIds = new Set(brandVisits.map((v) => v.customerId));
    return Array.from(uniqueCustomerIds);
  }
}

