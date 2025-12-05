import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../../providers/AuthProvider";

export function AuthScreen() {
  const { signIn } = useAuth();
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [role, setRole] = useState("customer");

  const handleLogin = async () => {
    if (!phoneOrEmail.trim()) return;
    await signIn({ phoneOrEmail, role });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loyalty Pilot</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        placeholder="Phone or Email"
        placeholderTextColor="#888"
        style={styles.input}
        value={phoneOrEmail}
        onChangeText={setPhoneOrEmail}
        keyboardType="default"
      />

      <View style={styles.roleSwitch}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "customer" && styles.roleButtonActive,
          ]}
          onPress={() => setRole("customer")}
        >
          <Text
            style={[
              styles.roleText,
              role === "customer" && styles.roleTextActive,
            ]}
          >
            Customer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "brand" && styles.roleButtonActive,
          ]}
          onPress={() => setRole("brand")}
        >
          <Text
            style={[
              styles.roleText,
              role === "brand" && styles.roleTextActive,
            ]}
          >
            Brand
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cta} onPress={handleLogin}>
        <Text style={styles.ctaText}>Continue</Text>
      </TouchableOpacity>

      <Text style={styles.helper}>
        OTP and email verification can be wired later via Firebase/Supabase.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05060A",
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#AAA",
    fontSize: 16,
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#111320",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "white",
    borderWidth: 1,
    borderColor: "#23263A",
    marginBottom: 16,
  },
  roleSwitch: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#23263A",
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#1E293B",
    borderColor: "#38BDF8",
  },
  roleText: {
    color: "#888",
    fontWeight: "500",
  },
  roleTextActive: {
    color: "white",
  },
  cta: {
    backgroundColor: "#38BDF8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaText: {
    color: "#020617",
    fontWeight: "700",
    fontSize: 16,
  },
  helper: {
    color: "#6B7280",
    fontSize: 12,
  },
});


