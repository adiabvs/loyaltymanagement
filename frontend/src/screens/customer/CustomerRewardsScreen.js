import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { useCustomerLoyalty } from "../../hooks/useCustomerLoyalty";

export function CustomerRewardsScreen() {
  const { user } = useAuth();
  const { rewardsUnlocked, refresh } = useCustomerLoyalty(user?.id);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Rewards</Text>
      {rewardsUnlocked.length === 0 ? (
        <Text style={styles.empty}>No rewards yet. Keep visiting!</Text>
      ) : (
        <FlatList
          data={rewardsUnlocked}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.rewardCard}>
              <Text style={styles.rewardText}>{item}</Text>
              <Text style={styles.rewardMeta}>Show this screen to redeem.</Text>
            </View>
          )}
        />
      )}
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
  empty: {
    color: "#6B7280",
  },
  rewardCard: {
    backgroundColor: "#020617",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 12,
  },
  rewardText: {
    color: "white",
    fontSize: 16,
    marginBottom: 4,
  },
  rewardMeta: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});


