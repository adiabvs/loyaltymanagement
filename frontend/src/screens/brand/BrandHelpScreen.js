import React from "react";
import { View, Text, StyleSheet } from "react-native";

export function BrandHelpScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Training</Text>
      <Text style={styles.subtitle}>
        Quick guide for your team to use the loyalty pilot.
      </Text>

      <View style={styles.step}>
        <Text style={styles.stepTitle}>1. Ask customer to open the app</Text>
        <Text style={styles.stepBody}>
          They should be on the Home tab and show their QR code.
        </Text>
      </View>

      <View style={styles.step}>
        <Text style={styles.stepTitle}>2. Open the Scan tab</Text>
        <Text style={styles.stepBody}>
          Tap &quot;Start Scan&quot; and point the camera at the QR.
        </Text>
      </View>

      <View style={styles.step}>
        <Text style={styles.stepTitle}>3. Confirm the visit</Text>
        <Text style={styles.stepBody}>
          You&apos;ll see a confirmation and updated visit count.
        </Text>
      </View>

      <Text style={styles.footer}>
        A link to a short training video or PDF can be added here later.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    color: "#9CA3AF",
    marginBottom: 20,
  },
  step: {
    marginBottom: 16,
  },
  stepTitle: {
    color: "white",
    fontWeight: "600",
    marginBottom: 4,
  },
  stepBody: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  footer: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 16,
  },
});


