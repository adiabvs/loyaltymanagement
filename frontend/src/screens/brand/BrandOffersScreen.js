import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { loyaltyService } from "../../services/loyaltyService";
import { BrandCampaignCreatorScreen } from "./BrandCampaignCreatorScreen";

export function BrandOffersScreen() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await loyaltyService.getBrandCampaigns(user?.id);
      setCampaigns(data || []);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
      // Fallback to empty array
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  if (showCreator) {
    return (
      <BrandCampaignCreatorScreen 
        onBack={() => {
          setShowCreator(false);
          loadCampaigns();
        }} 
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Offers & Campaigns</Text>
        <Text style={styles.subtitle}>
          Create targeted campaigns in minutes. Launch flash deals, personalized offers, and seasonal campaigns.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreator(true)}
      >
        <Text style={styles.createButtonText}>+ Create New Campaign</Text>
      </TouchableOpacity>

      {loading ? (
        <Text style={styles.loadingText}>Loading campaigns...</Text>
      ) : campaigns.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No campaigns yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first campaign to start engaging customers
          </Text>
        </View>
      ) : (
        <View style={styles.campaignsList}>
          {campaigns.map((campaign) => (
            <View key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <View style={[
                  styles.statusBadge,
                  campaign.isActive ? styles.statusActive : styles.statusInactive
                ]}>
                  <Text style={styles.statusText}>
                    {campaign.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
              <Text style={styles.campaignDescription}>{campaign.description}</Text>
              <View style={styles.campaignMeta}>
                <Text style={styles.campaignType}>
                  {campaign.type === "discount" && "💰 Discount"}
                  {campaign.type === "stamp" && "🎫 Stamps"}
                  {campaign.type === "points" && "⭐ Points"}
                </Text>
                <Text style={styles.campaignValue}>
                  {campaign.type === "discount" && `${campaign.value}% off`}
                  {campaign.type === "stamp" && `${campaign.value} stamps`}
                  {campaign.type === "points" && `${campaign.value} points`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🎁 Campaign Benefits</Text>
        <Text style={styles.infoText}>
          • Increase footfall with check-in rewards{'\n'}
          • Boost visibility on customer dashboard{'\n'}
          • Turn one-time visitors into repeat regulars{'\n'}
          • Track campaign performance in real-time
        </Text>
      </View>
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
  header: {
    marginBottom: 24,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  createButtonText: {
    color: "#020617",
    fontWeight: "700",
    fontSize: 16,
  },
  loadingText: {
    color: "#9CA3AF",
    textAlign: "center",
    padding: 20,
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
  campaignsList: {
    marginBottom: 20,
  },
  campaignCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 16,
    marginBottom: 12,
  },
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  campaignTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusActive: {
    backgroundColor: "#022C22",
  },
  statusInactive: {
    backgroundColor: "#1E293B",
  },
  statusText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "600",
  },
  campaignDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  campaignMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  campaignType: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "600",
  },
  campaignValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#022C22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 20,
  },
});


