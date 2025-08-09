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
        const responses = await Promise.all(
          favorites.map((id) => axios.get(`${API_URL}/api/books/${id}`))
        );
        const fetchedBooks = responses.map((res) => res.data);
        setFavoriteBooksData(fetchedBooks);
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
      <div className="favorites-login-prompt" style={{ backgroundColor: theme.background, color: theme.primary }}>
        <h1 className="favorites-title" style={{ color: theme.primary }}>الكتب المفضلة</h1>
        <p style={{ fontSize: "1.2em", marginBottom: "20px" }}>يجب تسجيل الدخول لإضافة الكتب إلى المفضلة وعرضها هنا.</p>
        <div className="favorites-login-buttons">
          <Link href="/login" className="favorites-login-button" style={{ backgroundColor: theme.accent, color: theme.primary }}>تسجيل الدخول</Link>
          <Link href="/register" className="favorites-login-button" style={{ backgroundColor: theme.secondary, color: theme.background }}>إنشاء حساب</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <h1 className="favorites-title" style={{ color: theme.primary }}>الكتب المفضلة</h1>
      <div className="favorites-books-display">
        {favoriteBooksData.length > 0 ? (
          favoriteBooksData.map((book) => (
            <BookCard key={book._id} book={book} />
          ))
        ) : (
          <p className="no-favorites-message">لم تقم بإضافة أي كتب إلى المفضلة بعد.</p>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
