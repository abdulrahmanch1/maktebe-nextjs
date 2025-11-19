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

    // Get the latest favorites from the user object directly
    const originalFavorites = user?.favorites || [];
    const isCurrentlyFavorite = originalFavorites.includes(bookId);

    // Optimistically update the UI using a functional update for setUser
    const newOptimisticFavorites = isCurrentlyFavorite
      ? originalFavorites.filter((id) => id !== bookId)
      : [...originalFavorites, bookId];
    setUser(prevUser => ({ ...prevUser, favorites: newOptimisticFavorites }));

    try {
      let res = null; // Initialize res to null
      // Perform the API call in the background
      if (isCurrentlyFavorite) {
        res = await axios.delete(`${API_URL}/api/users/${user.id}/favorites/${bookId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } else {
        res = await axios.post(`${API_URL}/api/users/${user.id}/favorites/${bookId}`, {}, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
      // Return the favoriteCount from the API response
      return res?.data?.favoriteCount; // Use optional chaining
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      console.error("Error details:", error);
      toast.error("فشل تحديث المفضلة. يرجى المحاولة مرة أخرى.");
      // If the API call fails, revert the UI to its original state using a functional update
      setUser(prevUser => ({ ...prevUser, favorites: originalFavorites }));
      return undefined; // Return undefined on error
    }
  }, [isLoggedIn, user, session, setUser]); // Removed 'favorites' from dependency array

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
