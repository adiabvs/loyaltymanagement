import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Static placeholder for MVP – can be backed by offers collection later.

export function CustomerPromotionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Promotions</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Buy 5 Coffees, Get 1 Free</Text>
        <Text style={styles.cardMeta}>Valid at participating cafés in Bangalore.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Happy Hour: 2x Stamps</Text>
        <Text style={styles.cardMeta}>Weekdays, 4–6 PM.</Text>
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
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#020617",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 12,
  },
  cardTitle: {
    color: "white",
    fontSize: 16,
    marginBottom: 4,
  },
  cardMeta: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});


