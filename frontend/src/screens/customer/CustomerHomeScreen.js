import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../providers/AuthProvider";
import { useCustomerLoyalty } from "../../hooks/useCustomerLoyalty";
import { loyaltyService } from "../../services/loyaltyService";
import { authService } from "../../services/authService";
import { UsernameSetupModal } from "../../components/UsernameSetupModal";

export function CustomerHomeScreen() {
  const { user } = useAuth();
  const { qrPayload, refresh } = useCustomerLoyalty(user?.id);
  const [qualifiedOffers, setQualifiedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);

  useEffect(() => {
    checkUsername();
    refresh();
    loadQualifiedOffers();
  }, []);

  const checkUsername = async () => {
    try {
      const response = await authService.checkUsername("customer");
      if (response.needsSetup && !usernameChecked) {
        setShowUsernameModal(true);
        setUsernameChecked(true);
      }
    } catch (error) {
      console.error("Failed to check username:", error);
    }
  };

  const loadQualifiedOffers = async () => {
    try {
      setLoading(true);
      const promotions = await loyaltyService.getActivePromotions();
      // Filter for qualified offers (scan-based are always qualified, or visits/money requirements met)
      const qualified = promotions.filter(p => {
        if (p.qualificationType === "scan") {
          return true; // Scan-based campaigns are always available
        }
        // For visits or money-based, check if remaining is 0 (qualified)
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
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi {user?.name}!</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your QR Check‑In</Text>
        <Text style={styles.cardSubtitle}>
          Show this code at the counter to earn rewards.
        </Text>
        <View style={styles.qrWrapper}>
          {qrPayload ? (
            <View style={styles.qrContainer}>
              <QRCode 
                value={qrPayload} 
                size={200} 
                backgroundColor="#FFFFFF"
                color="#000000"
                logo={null}
                ecl="M"
              />
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading QR code...</Text>
            </View>
          )}
        </View>
      </View>

      {qualifiedOffers.length > 0 && (
        <View style={styles.offersSection}>
          <Text style={styles.sectionTitle}>Active Offers</Text>
          {qualifiedOffers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <View style={styles.qualifiedBadge}>
                  <Text style={styles.qualifiedText}>✓ Active</Text>
                </View>
              </View>
              <Text style={styles.offerBrand}>
                {getBrandName(offer)}
              </Text>
              <Text style={styles.offerDescription}>{offer.description}</Text>
              <View style={styles.offerFooter}>
                <Text style={styles.offerValue}>
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
          ))}
        </View>
      )}

      {!loading && qualifiedOffers.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active offers yet</Text>
          <Text style={styles.emptySubtext}>
            Visit brands and complete requirements to unlock offers!
          </Text>
        </View>
      )}

      <UsernameSetupModal
        visible={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        role="customer"
        phoneNumber={user?.phoneNumber || user?.phone || ""}
      />
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
  greeting: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardSubtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 24,
  },
  qrWrapper: {
    alignSelf: "center",
  },
  qrContainer: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
  offersSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  offerCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 16,
    marginBottom: 12,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  offerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
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
  offerBrand: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  offerDescription: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  offerValue: {
    color: "#38BDF8",
    fontSize: 16,
    fontWeight: "700",
  },
  qualificationInfo: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginTop: 20,
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
});



