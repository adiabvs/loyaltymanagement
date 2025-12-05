import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../providers/AuthProvider";
import { useBrandDashboard } from "../../hooks/useBrandDashboard";

export function BrandDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { metrics, refresh } = useBrandDashboard(user?.id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await refresh();
    setLoading(false);
  };

  // Calculate customer retention percentage (mock calculation)
  const customerRetention = metrics.totalCustomers > 0 
    ? Math.round((metrics.returningCustomers / metrics.totalCustomers) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Brand Dashboard</Text>
        <Text style={styles.subtitle}>Real-Time Insights & Analytics</Text>
      </View>

      {/* Customer Retention Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Customer Retention</Text>
          <Text style={styles.retentionValue}>{customerRetention}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${customerRetention}%` }]} />
        </View>
        <Text style={styles.cardSubtext}>
          {metrics.returningCustomers} returning out of {metrics.totalCustomers || metrics.returningCustomers} total customers
        </Text>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricTile}>
          <Text style={styles.metricLabel}>Total Visits</Text>
          <Text style={styles.metricValue}>{metrics.totalVisits || 0}</Text>
          <Text style={styles.metricChange}>+12% this month</Text>
        </View>
        <View style={styles.metricTile}>
          <Text style={styles.metricLabel}>Returning Customers</Text>
          <Text style={styles.metricValue}>{metrics.returningCustomers || 0}</Text>
          <Text style={styles.metricChange}>+8% this month</Text>
        </View>
        <View style={styles.metricTile}>
          <Text style={styles.metricLabel}>Redemptions</Text>
          <Text style={styles.metricValue}>{metrics.redemptions || 0}</Text>
          <Text style={styles.metricChange}>Active rewards</Text>
        </View>
        <View style={styles.metricTile}>
          <Text style={styles.metricLabel}>Active Campaigns</Text>
          <Text style={styles.metricValue}>{metrics.activeCampaigns || 0}</Text>
          <Text style={styles.metricChange}>Running now</Text>
        </View>
      </View>

      {/* Sales Trends Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sales Trends</Text>
        <View style={styles.trendContainer}>
          <View style={styles.trendBar} />
          <View style={[styles.trendBar, { height: 60 }]} />
          <View style={[styles.trendBar, { height: 80 }]} />
          <View style={[styles.trendBar, { height: 50 }]} />
          <View style={[styles.trendBar, { height: 70 }]} />
          <View style={[styles.trendBar, { height: 90 }]} />
        </View>
        <Text style={styles.cardSubtext}>Last 6 days performance</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation?.navigate('Offers')}
        >
          <Text style={styles.actionButtonText}>Create Campaign</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation?.navigate('Customers')}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            View Customers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pilot Program Info */}
      <View style={styles.pilotCard}>
        <Text style={styles.pilotTitle}>🎯 Pilot Program Active</Text>
        <Text style={styles.pilotText}>
          You're currently on the 60-day free pilot. Track your results and see the impact on customer retention.
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
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  retentionValue: {
    color: "#38BDF8",
    fontSize: 32,
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#1E293B",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#38BDF8",
    borderRadius: 4,
  },
  cardSubtext: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricTile: {
    width: "48%",
    backgroundColor: "#111827",
    borderRadius: 12,
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
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricChange: {
    color: "#10B981",
    fontSize: 11,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 100,
    marginVertical: 16,
  },
  trendBar: {
    width: 30,
    height: 40,
    backgroundColor: "#38BDF8",
    borderRadius: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#38BDF8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  actionButtonText: {
    color: "#020617",
    fontWeight: "700",
    fontSize: 14,
  },
  actionButtonTextSecondary: {
    color: "#38BDF8",
  },
  pilotCard: {
    backgroundColor: "#022C22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
    padding: 16,
    marginBottom: 20,
  },
  pilotTitle: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  pilotText: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 18,
  },
});


