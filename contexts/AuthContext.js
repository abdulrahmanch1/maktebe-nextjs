"use client";
import React, { createContext, useState, useMemo, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from 'react-toastify';

export const AuthContext = createContext({
  isLoggedIn: false,
  user: null,
  session: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async (session) => {
      if (session?.user) {
        const authUser = session.user;

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
        setSession(session);
        setIsLoggedIn(true);
      } else {
        setSession(null);
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserProfile(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("تم تسجيل الدخول بنجاح!");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.message || "فشل تسجيل الدخول.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("تم تسجيل الخروج بنجاح!");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error(error.message || "فشل تسجيل الخروج.");
    } finally {
      setIsLoading(false);
    }
  };

  const authContextValue = useMemo(
    () => ({
      isLoggedIn,
      user,
      session,
      login,
      logout,
      setUser,
      isLoading,
    }),
    [isLoggedIn, user, session, login, logout, isLoading]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};