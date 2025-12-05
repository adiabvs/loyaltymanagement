import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useAuth } from "../../providers/AuthProvider";
import { useBrandDashboard } from "../../hooks/useBrandDashboard";

export function BrandScannerScreen() {
  const { user } = useAuth();
  const { processQr } = useBrandDashboard(user?.id);
  const [hasPermission, setHasPermission] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleScanned = async ({ data }) => {
    setScanning(false);
    try {
      const result = await processQr(data);
      setLastResult({
        success: true,
        visits: result.customer.visits,
      });
    } catch (e) {
      setLastResult({
        success: false,
        error: e.message,
      });
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>
          Camera access is required to scan customer QR codes.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Customer QR</Text>
      <Text style={styles.subtitle}>
        Point the camera at the customer&apos;s QR to credit a visit.
      </Text>

      <View style={styles.scannerFrame}>
        {scanning ? (
          <BarCodeScanner
            style={StyleSheet.absoluteFillObject}
            onBarCodeScanned={handleScanned}
          />
        ) : (
          <View style={styles.idleBox}>
            <Text style={styles.idleText}>Tap &quot;Start Scan&quot;</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.cta}
        onPress={() => setScanning((prev) => !prev)}
      >
        <Text style={styles.ctaText}>
          {scanning ? "Stop Scan" : "Start Scan"}
        </Text>
      </TouchableOpacity>

      {lastResult && (
        <View
          style={[
            styles.resultBox,
            lastResult.success ? styles.resultSuccess : styles.resultError,
          ]}
        >
          {lastResult.success ? (
            <Text style={styles.resultText}>
              Visit added. Customer now has {lastResult.visits} visits.
            </Text>
          ) : (
            <Text style={styles.resultText}>
              Failed to process QR: {lastResult.error}
            </Text>
          )}
        </View>
      )}
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
  },
  subtitle: {
    color: "#9CA3AF",
    marginBottom: 16,
  },
  scannerFrame: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 16,
  },
  idleBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
  },
  idleText: {
    color: "#6B7280",
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
  },
  resultBox: {
    padding: 12,
    borderRadius: 10,
  },
  resultSuccess: {
    backgroundColor: "#022C22",
  },
  resultError: {
    backgroundColor: "#450A0A",
  },
  resultText: {
    color: "white",
  },
  centered: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: {
    color: "white",
    textAlign: "center",
  },
});


