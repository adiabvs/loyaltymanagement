import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { loyaltyService } from "../../services/loyaltyService";

export function CustomerRewardsScreen() {
  const { user } = useAuth();
  const [qualifiedOffers, setQualifiedOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQualifiedOffers();
  }, []);

  const loadQualifiedOffers = async () => {
    try {
      setLoading(true);
      const promotions = await loyaltyService.getActivePromotions();
      // Filter for qualified offers: visits >= requiredVisits, money >= requiredAmount, or scan-based
      const qualified = promotions.filter(p => {
        if (p.qualificationType === "scan") {
          return true; // Scan-based campaigns are always available
        }
        // For visits or money-based, check if remaining is 0 (qualified)
        // remaining === 0 means visits >= requiredVisits or money >= requiredAmount
        return p.progress && p.progress.remaining === 0;
      });
      setQualifiedOffers(qualified);
    } catch (error) {
      console.error("Failed to load qualified offers:", error);
      setQualifiedOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCampaignValue = (campaign) => {
    if (campaign.type === "discount") {
      return `${campaign.value}% off`;
    } else if (campaign.type === "stamp") {
      return `${campaign.value} stamp${campaign.value > 1 ? 's' : ''}`;
    } else if (campaign.type === "points") {
      return `${campaign.value} point${campaign.value > 1 ? 's' : ''}`;
    }
    return "";
  };

  const getBrandName = (campaign) => {
    if (campaign.brand) {
      return campaign.brand.businessName || campaign.brand.name || "Brand";
    }
    return "Brand";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Rewards</Text>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading rewards...</Text>
      ) : qualifiedOffers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No rewards yet</Text>
          <Text style={styles.emptySubtext}>
            Complete campaign requirements to unlock rewards!
          </Text>
        </View>
      ) : (
        qualifiedOffers.map((offer) => (
          <View key={offer.id} style={styles.rewardCard}>
            <View style={styles.rewardHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.rewardTitle}>{offer.title}</Text>
                <Text style={styles.rewardBrand}>
                  {getBrandName(offer)}
                </Text>
              </View>
              <View style={styles.qualifiedBadge}>
                <Text style={styles.qualifiedText}>✓ Qualified!</Text>
              </View>
            </View>
            <Text style={styles.rewardDescription}>{offer.description}</Text>
            <View style={styles.rewardFooter}>
              <Text style={styles.rewardValue}>
                {formatCampaignValue(offer)}
              </Text>
              {offer.qualificationType === "visits" && offer.progress && (
                <Text style={styles.qualificationInfo}>
                  {offer.progress.current} / {offer.progress.required} visits ✓
                </Text>
              )}
              {offer.qualificationType === "money" && offer.progress && (
                <Text style={styles.qualificationInfo}>
                  ${offer.progress.current.toFixed(2)} / ${offer.progress.required.toFixed(2)} spent ✓
                </Text>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 20,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  loadingText: {
    color: "#9CA3AF",
    textAlign: "center",
    padding: 20,
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
  },
  rewardCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 12,
  },
  rewardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  rewardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  rewardBrand: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "500",
  },
  qualifiedBadge: {
    backgroundColor: "#022C22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qualifiedText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "600",
  },
  rewardDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  rewardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  rewardValue: {
    color: "#38BDF8",
    fontSize: 16,
    fontWeight: "700",
  },
  qualificationInfo: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
});


