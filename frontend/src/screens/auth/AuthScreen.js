import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { authService } from "../../services/authService";

export function AuthScreen() {
  const { setUserFromOTP } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("customer");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.requestOTP(phoneNumber);
      if (response.success) {
        setOtpSent(true);
        Alert.alert("Success", "OTP sent to your phone number");
      } else {
        Alert.alert("Error", response.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("OTP request error:", error);
      Alert.alert(
        "Connection Error", 
        error.message || "Cannot connect to server. Please ensure the backend is running on port 3000."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.verifyOTP(phoneNumber, otp);
      if (response.success && response.token && response.user) {
        // User is authenticated, set user in context
        setUserFromOTP(response.user);
      } else {
        Alert.alert("Error", response.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to verify OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loyalty Pilot</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        placeholder="Phone Number"
        placeholderTextColor="#888"
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        editable={!otpSent}
      />
      
      {otpSent && (
        <TextInput
          placeholder="Enter 6-digit OTP"
          placeholderTextColor="#888"
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      )}

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

      <TouchableOpacity 
        style={[styles.cta, loading && styles.ctaDisabled]} 
        onPress={otpSent ? handleVerifyOTP : handleRequestOTP}
        disabled={loading}
      >
        <Text style={styles.ctaText}>
          {loading ? "Processing..." : otpSent ? "Verify OTP" : "Request OTP"}
        </Text>
      </TouchableOpacity>
      
      {otpSent && (
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => {
            setOtpSent(false);
            setOtp("");
          }}
        >
          <Text style={styles.secondaryButtonText}>Change Phone Number</Text>
        </TouchableOpacity>
      )}

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
  ctaDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#38BDF8",
    fontSize: 14,
  },
});


