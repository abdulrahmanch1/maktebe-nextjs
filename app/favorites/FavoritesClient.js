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
import '@/components/SkeletonLoader.css';

// Skeleton Loader Component
const SkeletonGrid = () => (
  <div className="favorites-books-grid">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="favorites-book-wrapper">
        <div className="skeleton-card">
          <div className="skeleton-cover"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text short"></div>
        </div>
      </div>
    ))}
  </div>
);

const FavoritesClient = () => {
  const { theme } = useContext(ThemeContext);
  const { favorites } = useContext(FavoritesContext);
  const [favoriteBooksData, setFavoriteBooksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn, loading: authLoading } = useContext(AuthContext);

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

    if (!authLoading && isLoggedIn && favorites.length > 0) {
      fetchFavoriteBookDetails();
    } else if (!authLoading && (!isLoggedIn || favorites.length === 0)) {
      setFavoriteBooksData([]);
      setLoading(false);
    }
  }, [favorites, isLoggedIn, authLoading]);



  if (authLoading || (loading && isLoggedIn && favorites.length > 0)) {
    return (
      <div className="favorites-container">
        <div className="favorites-header">
          <h1 className="favorites-title">الكتب المفضلة</h1>
          <p className="favorites-subtitle">جاري تحميل مكتبتك...</p>
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  if (error) {
    return <div className="favorites-container">{error}</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="favorites-container">
        <div className="favorites-login-prompt">
          <span className="favorites-empty-state-icon" role="img" aria-label="Lock">🔒</span>
          <h2>الوصول مقيد</h2>
          <p>يجب تسجيل الدخول لعرض كتبك المفضلة.</p>
          <div className="favorites-action-buttons">
            <Link href="/login" className="favorites-action-button">تسجيل الدخول</Link>
            <Link href="/register" className="favorites-action-button">إنشاء حساب</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-container fade-in-page">
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
        <div className="favorites-empty-state">
          <span className="favorites-empty-state-icon" role="img" aria-label="Heart">❤️</span>
          <h2>قائمة المفضلة فارغة</h2>
          <p>لم تقم بإضافة أي كتب إلى المفضلة بعد. ابدأ بتصفح المكتبة!</p>
          <Link href="/" className="favorites-action-button">تصفح الكتب</Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
