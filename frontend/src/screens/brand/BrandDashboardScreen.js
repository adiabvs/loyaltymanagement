import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { useBrandDashboard } from "../../hooks/useBrandDashboard";

export function BrandDashboardScreen() {
  const { user } = useAuth();
  const { metrics, refresh } = useBrandDashboard(user?.id);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user?.name}</Text>
      <Text style={styles.subtitle}>Pilot overview</Text>

      <View style={styles.row}>
        <View style={styles.tile}>
          <Text style={styles.metricLabel}>Total Visits</Text>
          <Text style={styles.metricValue}>{metrics.totalVisits}</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.metricLabel}>Returning</Text>
          <Text style={styles.metricValue}>{metrics.returningCustomers}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.tile}>
          <Text style={styles.metricLabel}>Redemptions</Text>
          <Text style={styles.metricValue}>{metrics.redemptions}</Text>
        </View>
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
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9CA3AF",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: "#020617",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 16,
  },
  metricLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 8,
  },
  metricValue: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
});


