import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../providers/AuthProvider";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { CustomerTabs } from "./customer/CustomerTabs";
import { BrandTabs } from "./brand/BrandTabs";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user && (
        <Stack.Screen name="Auth" component={AuthScreen} options={{}} />
      )}
      {user?.role === "customer" && (
        <Stack.Screen name="Customer" component={CustomerTabs} />
      )}
      {user?.role === "brand" && (
        <Stack.Screen name="Brand" component={BrandTabs} />
      )}
    </Stack.Navigator>
  );
}


