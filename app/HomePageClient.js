'use client';
import React, { useState, useMemo, useEffect } from "react";
import BookCard from "@/components/BookCard";
import BookCardSkeleton from "@/components/BookCardSkeleton";
import './HomePage.css';
import { BOOK_CATEGORIES } from "@/constants";
import { useBooksQuery } from "@/hooks/useBooksQuery";
import { useInView } from "react-intersection-observer";

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const HomePageClient = ({ initialBooks = [], initialTotalCount = 0 }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useBooksQuery(debouncedSearchTerm, selectedCategory === "الكل" ? "" : selectedCategory);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const books = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);

  const categories = useMemo(() => ["الكل", ...BOOK_CATEGORIES], []);

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">البحث عن الكتب</h1>

      <div className="search-filter-container">
        <label htmlFor="search-input" className="visually-hidden">البحث عن الكتب</label>
        <input
          type="text"
          id="search-input"
          placeholder="ابحث بالاسم أو المؤلف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <label htmlFor="category-select" className="visually-hidden">فلترة حسب التصنيف</label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="error-text" style={{ textAlign: "center", marginBottom: "1rem" }}>
          حدث خطأ أثناء تحميل الكتب. حاول مرة أخرى.
        </div>
      )}

      <div className="books-display-container">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <BookCardSkeleton key={`skeleton-${index}`} />
          ))
        ) : books.length > 0 ? (
          books.map((book, index) => (
            <BookCard key={`${book.id}-${index}`} book={book} isPriority={index === 0} />
          ))
        ) : (
          <div style={{ textAlign: "center" }}>لا توجد كتب تطابق بحثك.</div>
        )}
        {isFetchingNextPage && books.length > 0 && (
          Array.from({ length: 4 }).map((_, index) => (
            <BookCardSkeleton key={`skeleton-more-${index}`} />
          ))
        )}
        <div ref={ref} style={{ height: 1 }} />
      </div>
    </div>
  );
};

export default HomePageClient;
