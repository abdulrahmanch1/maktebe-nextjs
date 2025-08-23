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

  const { data: readingListData, loading, error } = useFetch(
    isLoggedIn && user && user.id ? `${API_URL}/api/users/${user.id}/reading-list` : null,
    [isLoggedIn, user, token]
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setReadingListBooks([]);
      return;
    }
    if (readingListData && readingListData.length > 0) { // readingListData is now the array directly
      const bookIds = readingListData.map(item => item.book).join(',');
      axios.get(`${API_URL}/api/books?ids=${bookIds}`)
        .then(response => {
          const fetchedBooksMap = new Map(response.data.map(book => [book.id, book]));
          const mergedBooks = readingListData.map(item => { // Use readingListData here
            const book = fetchedBooksMap.get(item.book);
            return book ? { ...book, read: item.read } : null;
          }).filter(Boolean);
          setReadingListBooks(mergedBooks);
        })
        .catch(bookError => {
          console.error("Error fetching reading list books:", bookError);
          setReadingListBooks([]);
        });
    } else if (readingListData && readingListData.length === 0) {
        // If reading list is empty, clear the books
        setReadingListBooks([]);
    }
  }, [readingListData, isLoggedIn]);

  const booksToDisplay = readingListBooks.filter(book => book.read === showReadBooks);

  if (loading) {
    return <div className="reading-list-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>جاري تحميل قائمة القراءة...</div>;
  }

  if (error) {
    return <div className="reading-list-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>{error.message}</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="reading-list-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
        <div className="reading-list-login-prompt" style={{ backgroundColor: theme.secondary }}>
          <span className="reading-list-empty-state-icon" role="img" aria-label="Lock">🔒</span>
          <h2 style={{ color: theme.primary }}>الوصول مقيد</h2>
          <p style={{ color: theme.primary }}>يجب تسجيل الدخول لإدارة قائمة القراءة الخاصة بك.</p>
          <div className="reading-list-action-buttons">
            <Link href="/login" className="reading-list-action-button" style={{ backgroundColor: theme.accent, color: theme.primary }}>تسجيل الدخول</Link>
            <Link href="/register" className="reading-list-action-button" style={{ backgroundColor: theme.primary, color: theme.background }}>إنشاء حساب</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-list-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <div className="reading-list-header">
        <h1 className="reading-list-title">قائمة القراءة</h1>
      </div>

      <div className="reading-list-toggles">
        <button
          onClick={() => setShowReadBooks(false)}
          className={`reading-list-toggle-button ${!showReadBooks ? 'active' : ''}`}
          style={!showReadBooks ? { backgroundColor: theme.accent, color: theme.primary, borderColor: theme.accent } : { backgroundColor: theme.secondary, color: theme.primary }}
        >
          لم تقرأ
        </button>
        <button
          onClick={() => setShowReadBooks(true)}
          className={`reading-list-toggle-button ${showReadBooks ? 'active' : ''}`}
          style={showReadBooks ? { backgroundColor: theme.accent, color: theme.primary, borderColor: theme.accent } : { backgroundColor: theme.secondary, color: theme.primary }}
        >
          مقروءة
        </button>
      </div>

      {booksToDisplay.length > 0 ? (
        <div className="reading-list-books-grid">
          {booksToDisplay.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="reading-list-empty-state" style={{ backgroundColor: theme.secondary }}>
          <span className="reading-list-empty-state-icon" role="img" aria-label="Books">📚</span>
          <h2 style={{ color: theme.primary }}>لا توجد كتب في هذه القائمة</h2>
          <p style={{ color: theme.primary }}>قائمة القراءة الخاصة بك فارغة حاليًا. ابدأ بتصفح المكتبة!</p>
        </div>
      )}
    </div>
  );
};

export default ReadingListPage;
