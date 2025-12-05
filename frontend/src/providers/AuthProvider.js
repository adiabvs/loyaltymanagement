import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.user) {
          setUser(response.user);
        }
      } catch (error) {
        // No valid token, user needs to sign in
        // Only log if it's not a 401 (expected when no token)
        if (error.status !== 401 && !error.message.includes("Unauthorized")) {
          console.error("Auth check failed:", error);
        }
        // Silently handle 401 - it's expected when there's no token
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signIn = async ({ phoneOrEmail, role }) => {
    try {
      // This is a legacy method - for OTP flow, use requestOTP and verifyOTP directly
      const response = await authService.signIn(phoneOrEmail, role);
      if (response.user) {
        setUser(response.user);
        return response.user;
      }
      // If response requires OTP, return it
      return response;
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const setUserFromOTP = (user) => {
    console.log('[AuthProvider] Setting user from OTP:', user);
    console.log('[AuthProvider] User role:', user?.role);
    setUser(user);
  };

  const signUp = async (data) => {
    try {
      const response = await authService.signUp(data);
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error("Sign up failed:", error);
      throw error;
    }
  };

  const signOut = () => {
    authService.signOut();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      setUserFromOTP,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}


