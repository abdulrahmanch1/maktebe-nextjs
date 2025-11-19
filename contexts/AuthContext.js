"use client";
import React, { createContext, useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from 'react-toastify';

export const AuthContext = createContext({
  isLoggedIn: false,
  user: null,
  session: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // <-- ADDED

  const normalizeReadingList = useCallback((list) => {
    if (!Array.isArray(list)) return [];
    return list.map(item => ({
      ...item,
      progress: item.progress || { page: 1, percentage: 0, updatedAt: new Date().toISOString() },
    }));
  }, []);

  const refreshUserProfile = useCallback(async () => {
    setLoading(true); // <-- ADDED
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        const authUser = currentSession.user;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*, role')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          setUser({ ...authUser, username: authUser.user_metadata?.username });
        } else {
          const fullUser = {
            ...authUser,
            ...profile,
            profilePicture: profile.profilepicture, // Map db lowercase to camelCase for frontend
            favorites: Array.isArray(profile.favorites) ? profile.favorites : [], // Ensure favorites is an array
            readingList: normalizeReadingList(profile.readinglist), // Ensure readingList is an array with progress
          };
          setUser(fullUser);
        }
        setSession(currentSession);
        setIsLoggedIn(true);
      } else {
        setSession(null);
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (e) {
        console.error("Error refreshing profile:", e);
        setSession(null);
        setUser(null);
        setIsLoggedIn(false);
    } finally {
        setLoading(false); // <-- ADDED
    }
  }, [normalizeReadingList, supabase]);

  useEffect(() => {
    refreshUserProfile(); // Initial fetch

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      refreshUserProfile(); // Refresh on auth state change
    });

    return () => subscription.unsubscribe();
  }, [supabase, refreshUserProfile]);

  const login = useCallback(async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("تم تسجيل الدخول بنجاح!");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.message || "فشل تسجيل الدخول.");
      return false;
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("تم تسجيل الخروج بنجاح!");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error(error.message || "فشل تسجيل الخروج.");
    }
  }, [supabase]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google login failed:", error);
      toast.error(error.message || "فشل تسجيل الدخول عبر جوجل.");
    }
  }, [supabase]);

  const authContextValue = useMemo(() => {
    return {
      isLoggedIn,
      user,
      session,
      loading, // <-- ADDED
      login,
      logout,
      loginWithGoogle, // <-- ADDED
      setUser,
      refreshUserProfile, // Exposed the new function
    };
  }, [isLoggedIn, user, session, loading, login, logout, loginWithGoogle, setUser, refreshUserProfile]); // <-- ADDED loading

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
