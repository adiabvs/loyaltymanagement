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
        console.log("No existing session");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signIn = async ({ phoneOrEmail, role }) => {
    try {
      const response = await authService.signIn(phoneOrEmail, role);
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
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


