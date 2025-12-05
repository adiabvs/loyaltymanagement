import { apiClient } from "./apiClient";

export const authService = {
  async signIn(phoneOrEmail, role) {
    const response = await apiClient.post("/auth/signin", {
      phoneOrEmail,
      role,
    });
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
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

