import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { loyaltyService } from "../../services/loyaltyService";

export function CustomerPromotionsScreen() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await loyaltyService.getActivePromotions();
      setPromotions(data || []);
    } catch (error) {
      console.error("Failed to load promotions:", error);
      setPromotions([]);
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

  const formatCampaignType = (type) => {
    if (type === "discount") return "💰 Discount";
    if (type === "stamp") return "🎫 Stamps";
    if (type === "points") return "⭐ Points";
    return type;
  };

  const getBrandName = (campaign) => {
    if (campaign.brand) {
      return campaign.brand.businessName || campaign.brand.name || "Brand";
    }
    return "Brand";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Promotions</Text>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading promotions...</Text>
      ) : promotions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active promotions</Text>
          <Text style={styles.emptySubtext}>
            Check back later for exciting offers and deals!
          </Text>
        </View>
      ) : (
        promotions.map((promotion) => (
          <View key={promotion.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.cardTitle}>{promotion.title}</Text>
                {promotion.brand && (
                  <Text style={styles.brandName}>by {getBrandName(promotion)}</Text>
                )}
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {formatCampaignType(promotion.type)}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>{promotion.description}</Text>
            
            {/* Progress indicator for visits/money based campaigns */}
            {promotion.progress && promotion.progress.remaining > 0 && (
              <View style={styles.progressContainer}>
                {promotion.progress.type === "visits" && (
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${(promotion.progress.current / promotion.progress.required) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {promotion.progress.current} / {promotion.progress.required} visits • {promotion.progressText}
                    </Text>
                  </View>
                )}
                {promotion.progress.type === "money" && (
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${Math.min(100, (promotion.progress.current / promotion.progress.required) * 100)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      ${promotion.progress.current.toFixed(2)} / ${promotion.progress.required.toFixed(2)} spent • {promotion.progressText}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {promotion.progress && promotion.progress.remaining === 0 && (
              <View style={styles.qualifiedBadge}>
                <Text style={styles.qualifiedText}>✓ Qualified!</Text>
              </View>
            )}
            
            <View style={styles.cardFooter}>
              <Text style={styles.cardValue}>
                {formatCampaignValue(promotion)}
              </Text>
              {promotion.endDate && (
                <Text style={styles.cardMeta}>
                  Valid until {new Date(promotion.endDate).toLocaleDateString()}
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
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  brandName: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "#022C22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "600",
  },
  cardDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  cardValue: {
    color: "#38BDF8",
    fontSize: 16,
    fontWeight: "700",
  },
  cardMeta: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#1E293B",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#38BDF8",
    borderRadius: 4,
  },
  progressText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "600",
  },
  qualifiedBadge: {
    backgroundColor: "#022C22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  qualifiedText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
});


