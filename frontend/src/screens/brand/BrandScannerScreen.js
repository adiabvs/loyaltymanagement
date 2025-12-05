import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
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
      // On web, we'll use file input instead of camera
      if (Platform.OS === 'web') {
        setHasPermission(true); // Web doesn't need camera permission
        return;
      }
      
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleScanned = async ({ data }) => {
    if (!scanning) return; // Prevent multiple scans
    setScanning(false);
    try {
      const result = await processQr(data);
      setLastResult({
        success: true,
        visits: result.customer.visits,
      });
      // Clear result after 3 seconds
      setTimeout(() => setLastResult(null), 3000);
    } catch (e) {
      setLastResult({
        success: false,
        error: e.message,
      });
      // Clear error after 5 seconds
      setTimeout(() => setLastResult(null), 5000);
    }
  };

  const handleWebManualInput = () => {
    // For web, use browser prompt
    if (Platform.OS === 'web') {
      const qrData = window.prompt("Enter QR Code Data (paste the QR code JSON string here):");
      if (qrData && qrData.trim()) {
        handleScanned({ data: qrData.trim() });
      }
    } else {
      // For mobile, Alert.prompt may not be available in all React Native versions
      // Use a simple Alert with input field simulation
      Alert.alert(
        "Manual QR Entry",
        "This feature requires a text input. Please use the web version or scan with camera.",
        [{ text: "OK" }]
      );
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
        Point the camera at the customer&apos;s QR code to credit a visit. Zero integration hassle - just scan and start rewarding.
      </Text>

      <View style={styles.scannerFrame}>
        {Platform.OS === 'web' ? (
          <View style={styles.webScannerContainer}>
            <Text style={styles.webScannerText}>
              Web Scanner
            </Text>
            <Text style={styles.webScannerSubtext}>
              Use one of the options below to scan QR codes
            </Text>
            <TouchableOpacity
              style={styles.webButton}
              onPress={handleWebManualInput}
            >
              <Text style={styles.webButtonText}>Enter QR Code Manually</Text>
            </TouchableOpacity>
            <Text style={styles.webHelpText}>
              Paste the QR code JSON data in the prompt that appears
            </Text>
          </View>
        ) : scanning ? (
          <BarCodeScanner
            style={StyleSheet.absoluteFillObject}
            onBarCodeScanned={scanning ? handleScanned : undefined}
            barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
          />
        ) : (
          <View style={styles.idleBox}>
            <Text style={styles.idleText}>Tap &quot;Start Scan&quot;</Text>
          </View>
        )}
      </View>

      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            setScanning((prev) => !prev);
            setLastResult(null); // Clear previous result when starting new scan
          }}
        >
          <Text style={styles.ctaText}>
            {scanning ? "Stop Scan" : "Start Scan"}
          </Text>
        </TouchableOpacity>
      )}

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
  webScannerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#111827",
  },
  webScannerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  webScannerSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  webButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  webHelpText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  webButtonText: {
    color: "#020617",
    fontWeight: "600",
    fontSize: 14,
  },
});


