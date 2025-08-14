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
  const { isLoggedIn, user, token, setUser } = useContext(AuthContext);

  const favorites = useMemo(() => user?.favorites || [], [user]);

  const toggleFavorite = useCallback(async (bookId) => {
    if (!isLoggedIn || !user || !user.id || !session) {
      toast.error("يجب تسجيل الدخول لإضافة الكتاب للمفضلة.");
      return;
    }

    try {
      let updatedFavorites;
      if (favorites.includes(bookId)) {
        const res = await axios.delete(`${API_URL}/api/users/${user.id}/favorites/${bookId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        updatedFavorites = res.data.favorites;
        toast.success("تمت إزالة الكتاب من المفضلة.");
      } else {
        const res = await axios.post(`${API_URL}/api/users/${user.id}/favorites`, { bookId }, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        updatedFavorites = res.data.favorites;
        toast.success("تمت إضافة الكتاب إلى المفضلة.");
      }
      setUser({ ...user, favorites: updatedFavorites });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error(error.response?.data?.message || "فشل تحديث المفضلة.");
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
