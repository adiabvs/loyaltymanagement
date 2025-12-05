import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../providers/AuthProvider";
import { loyaltyService } from "../../services/loyaltyService";

export function BrandCampaignCreatorScreen({ onBack }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    offerName: "",
    discount: "",
    description: "",
    type: "discount", // discount, stamp, points
    value: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
  });

  const handleCreate = async () => {
    if (!formData.offerName.trim() || !formData.description.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const campaign = await loyaltyService.createCampaign(user?.id, {
        title: formData.offerName,
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.discount) || 0,
        isActive: true,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });
      
      // Close the creator screen first
      onBack?.();
      
      // Then show success message and navigate to Offers tab
      setTimeout(() => {
        Alert.alert(
          "✅ Campaign Created!", 
          `"${campaign?.title || formData.offerName}" has been created successfully. Your customers will now see this promotion!`,
          [
            { 
              text: "View Campaigns", 
              onPress: () => {
                // Ensure we're on the Offers tab
                navigation?.navigate('Offers');
              }
            }
          ]
        );
      }, 100);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Offer/Campaign Creator</Text>
        <Text style={styles.subtitle}>
          Launch flash deals, personalized offers, and seasonal campaigns in minutes
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Offer Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 10% Off Next Visit"
            placeholderTextColor="#6B7280"
            value={formData.offerName}
            onChangeText={(text) => setFormData({ ...formData, offerName: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Discount/Value *</Text>
          <View style={styles.discountRow}>
            <TextInput
              style={[styles.input, styles.discountInput]}
              placeholder="16"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              value={formData.discount}
              onChangeText={(text) => setFormData({ ...formData, discount: text })}
            />
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>%</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Valid for gold members on their next purchase."
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Campaign Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === "discount" && styles.typeButtonActive
              ]}
              onPress={() => setFormData({ ...formData, type: "discount" })}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === "discount" && styles.typeButtonTextActive
              ]}>
                Discount
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === "stamp" && styles.typeButtonActive
              ]}
              onPress={() => setFormData({ ...formData, type: "stamp" })}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === "stamp" && styles.typeButtonTextActive
              ]}>
                Stamps
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === "points" && styles.typeButtonActive
              ]}
              onPress={() => setFormData({ ...formData, type: "points" })}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === "points" && styles.typeButtonTextActive
              ]}>
                Points
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? "Creating..." : "Create Campaign"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Campaign Tips</Text>
        <Text style={styles.infoText}>
          • Use clear, compelling offer names{'\n'}
          • Set realistic discount percentages{'\n'}
          • Add end dates to create urgency{'\n'}
          • Test different campaign types to see what works best
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
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "white",
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discountInput: {
    flex: 1,
  },
  percentBadge: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  percentText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "600",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  typeButtonActive: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  typeButtonText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  typeButtonTextActive: {
    color: "#020617",
  },
  createButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: "#020617",
    fontWeight: "700",
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: "#022C22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
    padding: 16,
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

