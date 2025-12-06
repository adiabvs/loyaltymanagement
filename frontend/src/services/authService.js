import { apiClient } from "./apiClient";

export const authService = {
  // Request OTP for phone number
  async requestOTP(phoneNumber, role) {
    const response = await apiClient.post("/otp/request", {
      phoneNumber,
      role, // Include role when requesting OTP
    });
    return response;
  },

  // Set username for user
  async setUsername(phoneNumber, username, role) {
    const response = await apiClient.post("/auth/set-username", {
      phoneNumber,
      username,
      role,
    });
    return response;
  },

  // Verify OTP and sign in
  async verifyOTP(phoneNumber, otp, role) {
    const response = await apiClient.post("/otp/verify", {
      phoneNumber,
      otp,
      role, // Include role when verifying OTP (to update if needed)
    });
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  // Legacy signIn method - now uses OTP flow
  async signIn(phoneOrEmail, role) {
    // For now, treat phoneOrEmail as phoneNumber and request OTP
    // In a full implementation, you'd first request OTP, then verify it
    // This is a simplified flow for MVP
    try {
      // Request OTP first
      const otpResponse = await this.requestOTP(phoneOrEmail);
      // Return the OTP response with a flag indicating OTP was sent
      return {
        ...otpResponse,
        requiresOTP: true,
        phoneNumber: phoneOrEmail,
      };
    } catch (error) {
      // If request fails, try the old signin endpoint as fallback
      const response = await apiClient.post("/auth/signin", {
        phoneNumber: phoneOrEmail,
        role,
      });
      if (response.token) {
        apiClient.setToken(response.token);
      }
      return response;
    }
  },

  async signUp(data) {
    const response = await apiClient.post("/auth/signup", data);
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  async getCurrentUser() {
    return apiClient.get("/auth/me");
  },

  signOut() {
    apiClient.clearToken();
  },
};

