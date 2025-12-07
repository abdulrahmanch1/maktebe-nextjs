'use client';
import React, { useContext, useMemo } from "react";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import BookCard from "@/components/BookCard";
import { AuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
import './FavoritesPage.css';
import '@/components/SkeletonLoader.css';
import '@/app/styles/AuthRequired.css';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '@/constants';

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
  const { favorites } = useContext(FavoritesContext);
  const { isLoggedIn, user, loading: authLoading } = useContext(AuthContext);

  const favoriteIds = useMemo(() => favorites.join(','), [favorites]);

  const {
    data: favoriteBooksData = [],
    isLoading: isQueryLoading,
    error
  } = useQuery({
    queryKey: ['favoriteBooks', favoriteIds],
    queryFn: async () => {
      if (!favoriteIds) return [];
      const { data } = await axios.get(`${API_URL}/api/books?ids=${favoriteIds}`);
      return data;
    },
    enabled: !!favoriteIds && isLoggedIn,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const isLoading = authLoading || (isLoggedIn && isQueryLoading);

  if (isLoading) {
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
    return <div className="favorites-container">حدث خطأ أثناء تحميل المفضلة.</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="favorites-container">
        <div className="auth-required-card">
          <div className="auth-required-content">
            <div className="auth-icon-wrapper">
              <div className="auth-icon-circle">
                <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <div className="auth-icon-glow"></div>
            </div>

            <h2 className="auth-title">كتبك المفضلة</h2>
            <p className="auth-description">
              سجّل الدخول لتتمكن من حفظ كتبك المفضلة والوصول إليها في أي وقت
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <span className="feature-icon">❤️</span>
                <span className="feature-text">احفظ كتبك المفضلة</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">🔄</span>
                <span className="feature-text">مزامنة عبر الأجهزة</span>
              </div>
              <div className="auth-feature">
                <span className="feature-icon">⚡</span>
                <span className="feature-text">وصول سريع</span>
              </div>
            </div>

            <div className="auth-buttons">
              <Link href="/login" className="auth-btn auth-btn-primary">
                <span>تسجيل الدخول</span>
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/register" className="auth-btn auth-btn-secondary">
                <span>إنشاء حساب جديد</span>
              </Link>
            </div>

            <Link href="/books" className="auth-browse-link">
              أو تصفح الكتب بدون تسجيل →
            </Link>
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

export default FavoritesClient;
