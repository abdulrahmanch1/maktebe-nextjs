"use client";
import React, { createContext, useMemo, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";

export const FavoritesContext = createContext({
  favorites: [],
  toggleFavorite: (bookId) => {},
  isFavorite: (bookId) => false,
});

export const FavoritesProvider = ({ children }) => {
  const { isLoggedIn, user, session, setUser } = useContext(AuthContext);

  const favorites = useMemo(() => user?.favorites || [], [user]);

  const toggleFavorite = useCallback(async (bookId) => {
    if (!isLoggedIn || !user || !user.id || !session) {
      toast.error("يجب تسجيل الدخول لإضافة الكتاب للمفضلة.");
      return;
    }

    const isCurrentlyFavorite = favorites.includes(bookId);
    const previousFavorites = [...favorites]; // Capture current state

    // Optimistic update
    let newOptimisticFavorites;
    if (isCurrentlyFavorite) {
      newOptimisticFavorites = favorites.filter((id) => id !== bookId);
      toast.success("تمت إزالة الكتاب من المفضلة."); // Show success immediately
    } else {
      newOptimisticFavorites = [...favorites, bookId];
      toast.success("تمت إضافة الكتاب إلى المفضلة."); // Show success immediately
    }
    setUser({ ...user, favorites: newOptimisticFavorites }); // Update AuthContext immediately

    try {
      if (isCurrentlyFavorite) {
        await axios.delete(`${API_URL}/api/users/${user.id}/favorites/${bookId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } else {
        await axios.post(`${API_URL}/api/users/${user.id}/favorites`, { bookId }, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      // No need to update setUser again here, as it was done optimistically
      // The API response might return the updated list, but we already updated it.
      // If the API returns a different list, we might need to reconcile,
      // but for simple toggle, optimistic update is usually sufficient.
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("فشل تحديث المفضلة. يرجى المحاولة مرة أخرى.");
      // Rollback on error
      setUser({ ...user, favorites: previousFavorites });
    }
  }, [favorites, isLoggedIn, user, session, setUser]);

  const isFavorite = useCallback((bookId) => {
    return favorites.includes(bookId);
  }, [favorites]);

  const contextValue = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
    }),
    [favorites, toggleFavorite, isFavorite]
  );

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
};
