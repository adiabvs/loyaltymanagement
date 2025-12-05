import { useMemo, useState, useEffect } from "react";
import { loyaltyService } from "../services/loyaltyService";

// Encapsulates customer-side loyalty logic (visits, progress, rewards).

export function useCustomerLoyalty(customerId) {
  const [state, setState] = useState({
    visits: 0,
    stampsToReward: 5,
    rewardsUnlocked: [],
  });
  const [qrPayload, setQrPayload] = useState(null);

  const refresh = async () => {
    if (!customerId) return;
    const data = await loyaltyService.getCustomerSnapshot(customerId);
    setState(data);
  };

  useEffect(() => {
    const loadQrPayload = async () => {
      if (!customerId) {
        setQrPayload(null);
        return;
      }
      try {
        const payload = await loyaltyService.buildQrPayload(customerId);
        setQrPayload(payload);
      } catch (error) {
        console.error("Failed to load QR payload:", error);
        setQrPayload(null);
      }
    };
    loadQrPayload();
  }, [customerId]);

  return {
    ...state,
    qrPayload,
    refresh,
  };
}


