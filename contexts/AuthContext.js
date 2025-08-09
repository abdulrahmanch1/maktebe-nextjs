"use client";
import React, { createContext, useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";

export const AuthContext = createContext({
  isLoggedIn: false,
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  setUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/login`, { email, password });
      const { user: userData, token: userToken } = response.data;
      setIsLoggedIn(true);
      setUser(userData);
      setToken(userToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
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
      token,
      login,
      logout,
      setUser,
    }),
    [isLoggedIn, user, token, logout]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
