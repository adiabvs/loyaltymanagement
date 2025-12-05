import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BrandDashboardScreen } from "../../screens/brand/BrandDashboardScreen";
import { BrandScannerScreen } from "../../screens/brand/BrandScannerScreen";
import { BrandOffersScreen } from "../../screens/brand/BrandOffersScreen";
import { BrandCustomersScreen } from "../../screens/brand/BrandCustomersScreen";
import { BrandHelpScreen } from "../../screens/brand/BrandHelpScreen";
import { useAuth } from "../../providers/AuthProvider";

const Tab = createBottomTabNavigator();

function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );
}

// OffersStack is handled within BrandOffersScreen itself

export function BrandTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#020617",
          borderBottomColor: "#1E293B",
          borderBottomWidth: 1,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerRight: () => <LogoutButton />,
        tabBarStyle: {
          backgroundColor: "#020617",
          borderTopColor: "#111827",
        },
        tabBarActiveTintColor: "#38BDF8",
        tabBarInactiveTintColor: "#6B7280",
      }}
    >
      <Tab.Screen name="Dashboard" component={BrandDashboardScreen} />
      <Tab.Screen name="Scan" component={BrandScannerScreen} />
      <Tab.Screen name="Offers" component={BrandOffersScreen} />
      <Tab.Screen name="Customers" component={BrandCustomersScreen} />
      <Tab.Screen name="Help" component={BrandHelpScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1E293B",
  },
  logoutText: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "600",
  },
});


