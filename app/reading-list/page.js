'use client';
import React, { useContext, useState, useMemo } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import useFetch from "@/hooks/useFetch";
import BookCard from "@/components/BookCard";
import Link from "next/link";
import { API_URL } from "@/constants";
import './ReadingListPage.css';

const ReadingListPage = () => {
  const { theme } = useContext(ThemeContext);
  const { user, isLoggedIn } = useContext(AuthContext);
  const [showReadBooks, setShowReadBooks] = useState(false);
  const { data: readingListData, loading, error } = useFetch(
    isLoggedIn && user?.id ? `${API_URL}/api/users/${user.id}/reading-list` : null,
    undefined,
    [isLoggedIn, user?.id]
  );

  const readingListBookIds = useMemo(() => {
    if (!Array.isArray(readingListData) || readingListData.length === 0) return null;
    return readingListData.map(item => item.book).join(',');
  }, [readingListData]);

  const {
    data: fetchedBooks,
    loading: booksLoading,
    error: booksError,
  } = useFetch(
    readingListBookIds ? `${API_URL}/api/books?ids=${readingListBookIds}` : null,
    undefined,
    [readingListBookIds]
  );

  const readingListBooks = useMemo(() => {
    if (!Array.isArray(readingListData) || !Array.isArray(fetchedBooks)) return [];
    const fetchedBooksMap = new Map(fetchedBooks.map(book => [book.id, book]));
    return readingListData
      .map(item => {
        const book = fetchedBooksMap.get(item.book);
        return book ? { ...book, read: item.read, progress: item.progress } : null;
      })
      .filter(Boolean);
  }, [fetchedBooks, readingListData]);

  const booksToDisplay = useMemo(
    () => readingListBooks.filter(book => book.read === showReadBooks),
    [readingListBooks, showReadBooks]
  );

  const combinedLoading = loading || booksLoading;
  const combinedError = error || booksError;

  if (combinedLoading) {
    return <div className="reading-list-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>جاري تحميل قائمة القراءة...</div>;
  }

  if (combinedError) {
    return <div className="reading-list-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>{combinedError.message}</div>;
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
            <div key={book.id} className="reading-list-book-wrapper">
              <BookCard book={book} />
              {book.progress && (
                <div className="reading-list-progress-badge">
                  {book.progress.percentage !== null && book.progress.percentage !== undefined
                    ? `تمت قراءة ${book.progress.percentage}%`
                    : `آخر صفحة: ${book.progress.page || 1}`}
                </div>
              )}
            </div>
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
