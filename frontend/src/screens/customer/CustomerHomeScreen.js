import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../providers/AuthProvider";
import { useCustomerLoyalty } from "../../hooks/useCustomerLoyalty";

export function CustomerHomeScreen() {
  const { user } = useAuth();
  const { visits, stampsToReward, qrPayload, refresh } = useCustomerLoyalty(
    user?.id
  );

  useEffect(() => {
    refresh();
  }, []);

  const remaining = Math.max(stampsToReward - visits, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Hi {user?.name}!{" "}
        <Text style={styles.highlight}>
          You&apos;re {remaining} visits away from a reward!
        </Text>
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your QR Check‑In</Text>
        <Text style={styles.cardSubtitle}>
          Show this code at the counter to earn a stamp.
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
        <Text style={styles.progressText}>
          Visits: {visits} / {stampsToReward}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20,
  },
  greeting: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
  },
  highlight: {
    color: "#38BDF8",
  },
  card: {
    backgroundColor: "#020617",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 20,
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
    marginBottom: 16,
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
  progressText: {
    color: "#E5E7EB",
    textAlign: "center",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
});


