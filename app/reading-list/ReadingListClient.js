'use client';
import React, { useContext, useState, useMemo } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import useFetch from "@/hooks/useFetch";
import BookCard from "@/components/BookCard";
import Link from "next/link";
import { API_URL } from "@/constants";
import './ReadingListPage.css';
import '@/components/SkeletonLoader.css';

// Skeleton Loader Component
const SkeletonGrid = () => (
  <div className="reading-list-books-grid">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="reading-list-book-wrapper">
        <div className="skeleton-card">
          <div className="skeleton-cover"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text short"></div>
        </div>
      </div>
    ))}
  </div>
);

const ReadingListClient = () => {
  const { theme } = useContext(ThemeContext);
  const { user, isLoggedIn, loading: authLoading } = useContext(AuthContext);
  const [showReadBooks, setShowReadBooks] = useState(false);
  const { data: readingListData, loading, error } = useFetch(
    !authLoading && isLoggedIn && user?.id ? `${API_URL}/api/users/${user.id}/reading-list` : null,
    undefined,
    [isLoggedIn, user?.id, authLoading]
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



  if (authLoading || (combinedLoading && isLoggedIn)) {
    return (
      <div className="reading-list-container">
        <div className="reading-list-header">
          <h1 className="reading-list-title">قائمة القراءة</h1>
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  if (combinedError) {
    return <div className="reading-list-container">{combinedError.message}</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="reading-list-container">
        <div className="reading-list-login-prompt">
          <span className="reading-list-empty-state-icon" role="img" aria-label="Lock">🔒</span>
          <h2>الوصول مقيد</h2>
          <p>يجب تسجيل الدخول لإدارة قائمة القراءة الخاصة بك.</p>
          <div className="reading-list-action-buttons">
            <Link href="/login" className="reading-list-action-button">تسجيل الدخول</Link>
            <Link href="/register" className="reading-list-action-button">إنشاء حساب</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-list-container fade-in-page">
      <div className="reading-list-header">
        <h1 className="reading-list-title">قائمة القراءة</h1>
        <div className="reading-list-toggles">
          <button
            onClick={() => setShowReadBooks(false)}
            className={`reading-list-toggle-button ${!showReadBooks ? 'active' : ''}`}
          >
            لم تقرأ
          </button>
          <button
            onClick={() => setShowReadBooks(true)}
            className={`reading-list-toggle-button ${showReadBooks ? 'active' : ''}`}
          >
            مقروءة
          </button>
        </div>
      </div>

      {booksToDisplay.length > 0 ? (
        <div className="reading-list-books-grid">
          {booksToDisplay.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="reading-list-empty-state">
          <span className="reading-list-empty-state-icon" role="img" aria-label="Books">📚</span>
          <h2>لا توجد كتب في هذه القائمة</h2>
          <p>قائمة القراءة الخاصة بك فارغة حاليًا. ابدأ بتصفح المكتبة!</p>
        </div>
      )}
    </div>
  );
};

export default ReadingListPage;
