import { v4 as uuidv4 } from "uuid";
import { Reward } from "../types";

const rewards: Map<string, Reward> = new Map();
const rewardsByCustomer: Map<string, Reward[]> = new Map();

export class RewardModel {
  static createReward(data: {
    customerId: string;
    brandId: string;
    title: string;
    description: string;
    pointsRequired: number;
    stampsRequired: number;
  }): Reward {
    const reward: Reward = {
      id: uuidv4(),
      customerId: data.customerId,
      brandId: data.brandId,
      title: data.title,
      description: data.description,
      pointsRequired: data.pointsRequired,
      stampsRequired: data.stampsRequired,
      isRedeemed: false,
      createdAt: new Date(),
    };

    rewards.set(reward.id, reward);

    const customerRewards = rewardsByCustomer.get(data.customerId) || [];
    customerRewards.push(reward);
    rewardsByCustomer.set(data.customerId, customerRewards);

    return reward;
  }

  static getCustomerRewards(customerId: string): Reward[] {
    return rewardsByCustomer.get(customerId) || [];
  }

  static getUnredeemedRewards(customerId: string): Reward[] {
    return this.getCustomerRewards(customerId).filter((r) => !r.isRedeemed);
  }

  static redeemReward(rewardId: string): Reward | undefined {
    const reward = rewards.get(rewardId);
    if (!reward || reward.isRedeemed) return undefined;

    reward.isRedeemed = true;
    reward.redeemedAt = new Date();
    return reward;
  }
}

