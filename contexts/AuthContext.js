"use client";
import React, { createContext, useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const AuthContext = createContext({
  isLoggedIn: false,
  user: null,
  login: async () => {},
  logout: () => {},
  setUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setIsLoggedIn(false);
      setUser(null);
      toast.success("تم تسجيل الخروج بنجاح!");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error(error.message || "فشل تسجيل الخروج.");
    }
  }, []);

  // Initial check for user data (assuming user data is returned with login and stored in context)
  // For HttpOnly cookies, the token is not accessible here, so we rely on API calls to determine auth status
  useEffect(() => {
    // This useEffect is primarily for re-hydrating user state if the page refreshes
    // and the cookie is still valid. A simple way is to try fetching user data.
    // In a real app, you might have a /me endpoint or similar.
    const checkAuthStatus = async () => {
      try {
        // Attempt to fetch user data, which will succeed if the cookie is valid
        const response = await axios.get(`${API_URL}/api/users/me`); // Assuming a /me endpoint exists or can be created
        setUser(response.data.user);
        setIsLoggedIn(true);
      } catch (error) {
        // If fetching user data fails (e.g., 401), then user is not logged in
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Only logout if the user was previously logged in to avoid infinite loops
          if (isLoggedIn) {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout, isLoggedIn]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/login`, { email, password });
      const { user: userData } = response.data; // Token is now in HttpOnly cookie
      setIsLoggedIn(true);
      setUser(userData);
      toast.success("تم تسجيل الدخول بنجاح!");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.response?.data?.message || "فشل تسجيل الدخول.");
      return false;
    }
  };

  const authContextValue = useMemo(
    () => ({
      isLoggedIn,
      user,
      login,
      logout,
      setUser,
    }),
    [isLoggedIn, user, login, logout]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
