'use client';
import React, { useContext, useState, useEffect } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import useFetch from "@/hooks/useFetch";
import BookCard from "@/components/BookCard";
import Link from "next/link";
import { API_URL } from "@/constants";
import './ReadingListPage.css';

const ReadingListPage = () => {
  const { theme } = useContext(ThemeContext);
  const { user, isLoggedIn, token } = useContext(AuthContext);
  const [showReadBooks, setShowReadBooks] = useState(false);
  const [readingListBooks, setReadingListBooks] = useState([]);

  const { data: userData, loading, error } = useFetch(
    isLoggedIn && user && user._id ? `${API_URL}/api/users/${user._id}` : null,
    [isLoggedIn, user, token]
  );

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (userData && userData.readingList) {
        const bookDetailsPromises = userData.readingList.map(async (item) => {
          try {
            const bookResponse = await axios.get(`${API_URL}/api/books/${item.book}`);
            return { ...bookResponse.data, read: item.read };
          } catch (bookError) {
            console.error(`Error fetching book ${item.book}:`, bookError);
            return null;
          }
        });
        const fetchedBooks = (await Promise.all(bookDetailsPromises)).filter(Boolean);
        setReadingListBooks(fetchedBooks);
      } else {
        setReadingListBooks([]);
      }
    };

    if (isLoggedIn) {
        fetchBookDetails();
    }
  }, [userData, isLoggedIn]);

  const booksToDisplay = readingListBooks.filter(book => book.read === showReadBooks);

  if (loading) {
    return <div className="reading-list-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>جاري تحميل قائمة القراءة...</div>;
  }

  if (error) {
    return <div className="reading-list-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>{error.message}</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="reading-list-login-prompt" style={{ backgroundColor: theme.background, color: theme.primary }}>
        <h1 className="reading-list-title" style={{ color: theme.primary }}>قائمة القراءة</h1>
        <p style={{ fontSize: "1.2em", marginBottom: "20px" }}>يجب تسجيل الدخول لإدارة قائمة القراءة الخاصة بك.</p>
        <div className="reading-list-login-buttons">
          <Link href="/login" className="reading-list-login-button" style={{ backgroundColor: theme.accent, color: theme.primary }}>تسجيل الدخول</Link>
          <Link href="/register" className="reading-list-login-button" style={{ backgroundColor: theme.secondary, color: theme.background }}>إنشاء حساب</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-list-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <h1 className="reading-list-title" style={{ color: theme.primary }}>قائمة القراءة</h1>

      <div className="reading-list-toggle-buttons">
        <button
          onClick={() => setShowReadBooks(false)}
          className="reading-list-toggle-button"
          style={{
            backgroundColor: !showReadBooks ? theme.accent : theme.secondary,
            color: theme.primary,
          }}
        >
          الكتب التي لم تتم قراءتها
        </button>
        <button
          onClick={() => setShowReadBooks(true)}
          className="reading-list-toggle-button"
          style={{
            backgroundColor: showReadBooks ? theme.accent : theme.secondary,
            color: theme.primary,
          }}
        >
          الكتب التي تم قراءتها
        </button>
      </div>

      <div className="reading-list-books-display">
        {booksToDisplay.length > 0 ? (
          booksToDisplay.map((book) => (
            <BookCard key={book._id} book={book} />
          ))
        ) : (
          <p>لا توجد كتب في هذه القائمة.</p>
        )}
      </div>
    </div>
  );
};

export default ReadingListPage;
