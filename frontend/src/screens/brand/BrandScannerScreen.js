import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, TextInput } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useAuth } from "../../providers/AuthProvider";
import { useBrandDashboard } from "../../hooks/useBrandDashboard";
import { loyaltyService } from "../../services/loyaltyService";

export function BrandScannerScreen() {
  const { user } = useAuth();
  const { processQr } = useBrandDashboard(user?.id);
  const [hasPermission, setHasPermission] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [inputMode, setInputMode] = useState(null); // 'phone' or 'camera'

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
    setShowPhoneInput(true);
    setInputMode('phone');
  };

  const handleWebCameraInput = () => {
    setShowPhoneInput(false);
    setInputMode('camera');
    setScanning(true);
  };

  const handleFileUpload = () => {
    // Create a file input element for QR code image upload
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          // For now, we'll show an alert - in a real app, you'd use a QR code reader library
          Alert.alert(
            "File Upload",
            "QR code image upload detected. Please enter the phone number or use camera scanning instead.",
            [{ text: "OK" }]
          );
        }
      };
      input.click();
    }
  };

  const handlePhoneNumberInput = async (phoneNum) => {
    const phoneToProcess = phoneNum || phoneNumber;
    if (!phoneToProcess || !phoneToProcess.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }
    
    setScanning(false);
    setShowPhoneInput(false);
    try {
      // Call API with phone number instead of QR data
      const result = await loyaltyService.processVisitFromPhone(user?.id, phoneToProcess.trim());
      setLastResult({
        success: true,
        visits: result.customer?.visits || 0,
      });
      setPhoneNumber(""); // Clear input
      setTimeout(() => setLastResult(null), 3000);
    } catch (e) {
      setLastResult({
        success: false,
        error: e.message || "Failed to process phone number",
      });
      // On error, allow user to try camera scanning
      if (Platform.OS !== 'web' && hasPermission) {
        Alert.alert(
          "Phone Entry Failed",
          e.message || "Customer not found. Would you like to try scanning a QR code instead?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Try Camera", onPress: () => {
              setInputMode('camera');
              setScanning(true);
            }}
          ]
        );
      }
      setTimeout(() => setLastResult(null), 5000);
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
              Choose how you want to process the visit
            </Text>
            
            {showPhoneInput ? (
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter last 10 digits of phone number"
                  placeholderTextColor="#6B7280"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
                <View style={styles.phoneInputButtons}>
                  <TouchableOpacity
                    style={[styles.webButton, styles.webButtonSecondary]}
                    onPress={() => {
                      setShowPhoneInput(false);
                      setPhoneNumber("");
                    }}
                  >
                    <Text style={styles.webButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.webButton}
                    onPress={() => handlePhoneNumberInput()}
                  >
                    <Text style={styles.webButtonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : inputMode === 'camera' && scanning ? (
              <View style={styles.cameraContainer}>
                <Text style={styles.webScannerSubtext}>
                  Camera scanning is not available on web. Please use phone number entry or try on a mobile device.
                </Text>
                <TouchableOpacity
                  style={styles.webButton}
                  onPress={() => {
                    setScanning(false);
                    setInputMode(null);
                  }}
                >
                  <Text style={styles.webButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.webOptionsContainer}>
                <TouchableOpacity
                  style={styles.webButton}
                  onPress={handleWebManualInput}
                >
                  <Text style={styles.webButtonText}>Enter Phone Number</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.webButton, styles.webButtonSecondary]}
                  onPress={handleWebCameraInput}
                >
                  <Text style={styles.webButtonText}>Try Camera Scan</Text>
                </TouchableOpacity>
                <Text style={styles.webHelpText}>
                  Enter the last 10 digits of the customer's phone number, or use camera scanning on mobile devices
                </Text>
              </View>
            )}
          </View>
        ) : scanning ? (
          <BarCodeScanner
            style={StyleSheet.absoluteFillObject}
            onBarCodeScanned={scanning ? handleScanned : undefined}
            barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
          />
        ) : (
          <View style={styles.idleBox}>
            <Text style={styles.idleText}>Tap &quot;Start Scan&quot; to scan QR code</Text>
            {hasPermission && (
              <TouchableOpacity
                style={[styles.webButton, { marginTop: 16, minWidth: 200 }]}
                onPress={handleWebManualInput}
              >
                <Text style={styles.webButtonText}>Or Enter Phone Number</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            setScanning((prev) => !prev);
            setLastResult(null); // Clear previous result when starting new scan
            setInputMode(scanning ? null : 'camera');
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
  webButtonSecondary: {
    backgroundColor: "#1E293B",
    marginLeft: 8,
  },
  phoneInputContainer: {
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  phoneInput: {
    backgroundColor: "#1E293B",
    color: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  phoneInputButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  webOptionsContainer: {
    width: "100%",
    alignItems: "center",
  },
  cameraContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
});


