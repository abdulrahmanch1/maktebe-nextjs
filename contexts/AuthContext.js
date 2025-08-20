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

  const refreshUserProfile = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const authUser = currentSession.user;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
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
          readingList: Array.isArray(profile.readinglist) ? profile.readinglist : [], // Ensure readingList is an array
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
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      refreshUserProfile(session); // Use the new function
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      refreshUserProfile(session); // Use the new function
    });

    return () => subscription.unsubscribe();
  }, [supabase, refreshUserProfile]); // Added refreshUserProfile to dependencies

  const login = async (email, password) => {
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
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("تم تسجيل الخروج بنجاح!");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error(error.message || "فشل تسجيل الخروج.");
    }
  };

  const authContextValue = useMemo(() => {
    return {
      isLoggedIn,
      user,
      session,
      login,
      logout,
      setUser,
      refreshUserProfile, // Exposed the new function
    };
  }, [isLoggedIn, user, session, login, logout, setUser, refreshUserProfile]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};