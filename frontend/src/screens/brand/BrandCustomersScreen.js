import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { loyaltyService } from "../../services/loyaltyService";

export function BrandCustomersScreen() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalVisits: 0,
    avgVisitsPerCustomer: 0,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await loyaltyService.getBrandCustomers(user?.id);
      const customersData = response || [];
      
      setCustomers(customersData);
      
      // Calculate stats from real data
      const totalVisits = customersData.reduce((sum, c) => sum + (c.visits || 0), 0);
      const activeCount = customersData.filter(c => c.status === "active").length;
      const avgVisits = customersData.length > 0 
        ? Math.round(totalVisits / customersData.length) 
        : 0;
      
      setStats({
        totalCustomers: customersData.length,
        activeCustomers: activeCount,
        totalVisits: totalVisits,
        avgVisitsPerCustomer: avgVisits,
      });
    } catch (error) {
      console.error("Failed to load customers:", error);
      // Set empty state on error
      setCustomers([]);
      setStats({
        totalCustomers: 0,
        activeCustomers: 0,
        totalVisits: 0,
        avgVisitsPerCustomer: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Customers</Text>
        <Text style={styles.subtitle}>You Own the Data - Full access to your customer list</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalCustomers}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeCustomers}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalVisits}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.avgVisitsPerCustomer}</Text>
          <Text style={styles.statLabel}>Avg Visits</Text>
        </View>
      </View>

      {/* Customer List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer List</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading customers...</Text>
        ) : customers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No customers yet</Text>
            <Text style={styles.emptySubtext}>
              Start scanning QR codes to build your customer base
            </Text>
          </View>
        ) : (
          customers.map((customer) => (
            <View key={customer.id} style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerPhone}>{customer.phone}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  customer.status === "active" ? styles.statusActive : styles.statusInactive
                ]}>
                  <Text style={styles.statusText}>
                    {customer.status === "active" ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
              <View style={styles.customerStats}>
                <View style={styles.customerStat}>
                  <Text style={styles.customerStatValue}>{customer.visits}</Text>
                  <Text style={styles.customerStatLabel}>Visits</Text>
                </View>
                <View style={styles.customerStat}>
                  <Text style={styles.customerStatValue}>{customer.lastVisit}</Text>
                  <Text style={styles.customerStatLabel}>Last Visit</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Data Ownership Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔐 You Own the Data</Text>
        <Text style={styles.infoText}>
          Get full access to your customer list. Understand what keeps them coming back and use insights to improve retention.
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    color: "#38BDF8",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  customerCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 16,
    marginBottom: 12,
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  customerPhone: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  customerStats: {
    flexDirection: "row",
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  customerStat: {
    flex: 1,
  },
  customerStatValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  customerStatLabel: {
    color: "#9CA3AF",
    fontSize: 12,
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

