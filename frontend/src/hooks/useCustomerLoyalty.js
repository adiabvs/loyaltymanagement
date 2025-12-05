import { useMemo, useState } from "react";
import { loyaltyService } from "../services/loyaltyService";

// Encapsulates customer-side loyalty logic (visits, progress, rewards).

export function useCustomerLoyalty(customerId) {
  const [state, setState] = useState({
    visits: 0,
    stampsToReward: 5,
    rewardsUnlocked: [],
  });

  const refresh = async () => {
    const data = await loyaltyService.getCustomerSnapshot(customerId);
    setState(data);
  };

  const qrPayload = useMemo(
    () => loyaltyService.buildQrPayload({ customerId }),
    [customerId]
  );

  return {
    ...state,
    qrPayload,
    refresh,
  };
}


