'use client';
import React, { useContext, useState, useMemo } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import BookCard from "@/components/BookCard";
import Link from "next/link";
import './ReadingListPage.css';
import '@/components/SkeletonLoader.css';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '@/constants';
import BookCardSkeleton from '@/components/BookCardSkeleton';

// Skeleton Loader Component (moved outside to avoid creating during render)
const SkeletonGrid = () => (
  <div className="reading-list-books-grid">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="skeleton-wrapper">
        <BookCardSkeleton />
      </div>
    ))}
  </div>
);

const ReadingListClient = () => {
  const { user, isLoggedIn, loading: authLoading } = useContext(AuthContext);
  const [showReadBooks, setShowReadBooks] = useState(false);

  // Fetch reading list entries
  const {
    data: readingListData = [],
    isLoading: listLoading,
    error: listError
  } = useQuery({
    queryKey: ['readingList', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await axios.get(`${API_URL}/api/users/${user.id}/reading-list`);
      return data;
    },
    enabled: !!user?.id && isLoggedIn,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Extract book IDs
  const readingListBookIds = useMemo(() => {
    if (!Array.isArray(readingListData) || readingListData.length === 0) return null;
    return readingListData.map(item => item.book).join(',');
  }, [readingListData]);

  // Fetch book details
  const {
    data: fetchedBooks = [],
    isLoading: booksLoading,
    error: booksError,
  } = useQuery({
    queryKey: ['books', 'ids', readingListBookIds],
    queryFn: async () => {
      if (!readingListBookIds) return [];
      const { data } = await axios.get(`${API_URL}/api/books?ids=${readingListBookIds}`);
      return data;
    },
    enabled: !!readingListBookIds,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Merge reading list data with book details
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

  // Filter by read status
  const booksToDisplay = useMemo(() => {
    const filtered = readingListBooks.filter(book => book.read === showReadBooks);
    return filtered
      .slice()
      .sort((a, b) => {
        const aProg = a?.progress?.percentage ?? 0;
        const bProg = b?.progress?.percentage ?? 0;
        return bProg - aProg;
      });
  }, [readingListBooks, showReadBooks]);

  const combinedLoading = listLoading || booksLoading;
  const combinedError = listError || booksError;

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
    return <div className="reading-list-container">حدث خطأ أثناء تحميل قائمة القراءة.</div>;
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

export default ReadingListClient;
