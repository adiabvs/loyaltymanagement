import { useState } from "react";
import { loyaltyService } from "../services/loyaltyService";

// Encapsulates brand-side analytics and QR processing.

export function useBrandDashboard(brandId) {
  const [metrics, setMetrics] = useState({
    totalVisits: 0,
    returningCustomers: 0,
    redemptions: 0,
    activeCampaigns: 0,
    totalCustomers: 0,
  });

  const refresh = async () => {
    const data = await loyaltyService.getBrandSnapshot(brandId);
    setMetrics(data);
  };

  const processQr = async (qrData) => {
    return loyaltyService.processVisitFromQr({ brandId, qrData });
  };

  return {
    metrics,
    refresh,
    processQr,
  };
}


