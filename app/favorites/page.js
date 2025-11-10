'use client';
import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import BookCard from "@/components/BookCard";
import axios from "axios";
import { AuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
import { API_URL } from "@/constants";
import './FavoritesPage.css';

const FavoritesPage = () => {
  const { theme } = useContext(ThemeContext);
  const { favorites } = useContext(FavoritesContext);
  const [favoriteBooksData, setFavoriteBooksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    const fetchFavoriteBookDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const ids = favorites.join(',');
        const response = await axios.get(`${API_URL}/api/books?ids=${ids}`);
        setFavoriteBooksData(response.data);
      } catch (err) {
        console.error("Failed to fetch favorite book details:", err);
        setError("Failed to load favorite books.");
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn && favorites.length > 0) {
      fetchFavoriteBookDetails();
    } else {
      setFavoriteBooksData([]);
      setLoading(false);
    }
  }, [favorites, isLoggedIn]);

  if (loading) {
    return <div className="favorites-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>جاري تحميل الكتب المفضلة...</div>;
  }

  if (error) {
    return <div className="favorites-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>{error}</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="favorites-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
        <div className="favorites-login-prompt" style={{ backgroundColor: theme.secondary }}>
          <span className="favorites-empty-state-icon" role="img" aria-label="Lock">🔒</span>
          <h2 style={{ color: theme.primary }}>الوصول مقيد</h2>
          <p style={{ color: theme.primary }}>يجب تسجيل الدخول لعرض كتبك المفضلة.</p>
          <div className="favorites-action-buttons">
            <Link href="/login" className="favorites-action-button" style={{ backgroundColor: theme.accent, color: theme.primary }}>تسجيل الدخول</Link>
            <Link href="/register" className="favorites-action-button" style={{ backgroundColor: theme.primary, color: theme.background }}>إنشاء حساب</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <div className="favorites-header">
        <h1 className="favorites-title">الكتب المفضلة</h1>
        <p className="favorites-subtitle">
          {favoriteBooksData.length > 0
            ? `لديك ${favoriteBooksData.length} كتاب في قائمتك`
            : 'تصفح وأضف كتبك التي تحبها هنا'}
        </p>
      </div>

      {favoriteBooksData.length > 0 ? (
        <div className="favorites-books-grid">
          {favoriteBooksData.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="favorites-empty-state" style={{ backgroundColor: theme.secondary }}>
          <span className="favorites-empty-state-icon" role="img" aria-label="Heart">❤️</span>
          <h2 style={{ color: theme.primary }}>قائمة المفضلة فارغة</h2>
          <p style={{ color: theme.primary }}>لم تقم بإضافة أي كتب إلى المفضلة بعد. ابدأ بتصفح المكتبة!</p>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
