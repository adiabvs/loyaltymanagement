import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { authService } from "../services/authService";
import { useAuth } from "../providers/AuthProvider";

export function UsernameSetupModal({ visible, onClose, role, phoneNumber }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, setUserFromOTP } = useAuth();

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const handleSetUsername = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    if (!validateUsername(username)) {
      Alert.alert(
        "Invalid Username",
        "Username must be 3-20 characters, alphanumeric and underscore only"
      );
      return;
    }

    try {
      setLoading(true);
      
      // Try using the new update endpoint first (for authenticated users)
      let response;
      try {
        const endpoint = role === "brand" ? "/brand/username/update" : "/customer/username/update";
        response = await authService.updateUsername(username, endpoint);
      } catch (updateError) {
        // Fallback to old setUsername endpoint if update fails (for unauthenticated users)
        console.log("Update endpoint failed, trying setUsername:", updateError);
        response = await authService.setUsername(phoneNumber, username, role);
      }
      
      if (response.success) {
        Alert.alert("Success", "Username set successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Update user in context if available
              if (user) {
                setUserFromOTP({ ...user, username });
              }
              setUsername("");
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.message || response.error || "Failed to set username");
      }
    } catch (error) {
      console.error("Set username error:", error);
      Alert.alert("Error", error.message || "Failed to set username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Set Your Username</Text>
          <Text style={styles.description}>
            A username helps brands find you and show you relevant campaigns.
            Use 3-20 characters (letters, numbers, and underscore only).
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={(text) => {
              // Only allow alphanumeric and underscore
              const cleaned = text.replace(/[^a-zA-Z0-9_]/g, "");
              setUsername(cleaned);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Skip for Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSetUsername}
              disabled={loading || username.length < 3}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Setting..." : "Set Username"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  description: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 12,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#374151",
  },
  cancelButtonText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#38BDF8",
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

