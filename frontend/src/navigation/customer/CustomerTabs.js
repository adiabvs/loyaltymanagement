import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CustomerHomeScreen } from "../../screens/customer/CustomerHomeScreen";
import { CustomerRewardsScreen } from "../../screens/customer/CustomerRewardsScreen";
import { CustomerPromotionsScreen } from "../../screens/customer/CustomerPromotionsScreen";
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

export function CustomerTabs() {
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
      <Tab.Screen name="Home" component={CustomerHomeScreen} />
      <Tab.Screen name="Rewards" component={CustomerRewardsScreen} />
      <Tab.Screen name="Promotions" component={CustomerPromotionsScreen} />
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


