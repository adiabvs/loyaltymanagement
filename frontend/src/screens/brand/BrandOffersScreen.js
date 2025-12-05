import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Simplified campaign creator placeholder.
// For MVP, we only capture the offer definitions conceptually.

export function BrandOffersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offers & Campaigns</Text>
      <Text style={styles.subtitle}>
        Example reward: &quot;Buy 5 Coffees, Get 1 Free&quot;.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Reward</Text>
        <Text style={styles.cardValue}>Buy 5 Coffees, Get 1 Free</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Requirement</Text>
        <Text style={styles.cardValue}>5 stamps on the loyalty card</Text>
      </View>
      <Text style={styles.helper}>
        Full CRUD and persistence can be added by wiring this screen to a
        backend collection of offers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    color: "#9CA3AF",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#020617",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 12,
  },
  cardLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: "white",
    fontSize: 15,
  },
  helper: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 12,
  },
});


