import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../providers/AuthProvider";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { CustomerTabs } from "./customer/CustomerTabs";
import { BrandTabs } from "./brand/BrandTabs";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, loading } = useAuth();

  // Debug logging
  console.log('[RootNavigator] Current state:', { 
    hasUser: !!user, 
    userRole: user?.role, 
    loading,
    userObject: user 
  });

  // Show loading screen while checking auth
  if (loading) {
    return null; // Or a loading component
  }

  return (
    <Stack.Navigator
      key={user?.role || 'auth'} // Force re-render when role changes
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : user.role === "customer" ? (
        <Stack.Screen name="Customer" component={CustomerTabs} />
      ) : user.role === "brand" ? (
        <Stack.Screen name="Brand" component={BrandTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}


