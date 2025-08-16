
'use client';
import React, { useState, useEffect, useCallback } from "react";
import BookCard from "@/components/BookCard";
import { ThemeContext } from "@/contexts/ThemeContext";
import useFetch from "@/hooks/useFetch";
import { API_URL } from "@/constants";
import './HomePage.css';

const HomePageClient = ({ initialBooks, initialCategories, defaultPage, defaultLimit }) => {
  const { theme } = React.useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [books, setBooks] = useState(initialBooks);
  const [categories, setCategories] = useState(initialCategories);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [booksPerPage] = useState(defaultLimit);
  const [totalBooksCount, setTotalBooksCount] = useState(0); // Will be updated from X-Total-Count header
  const [hasMore, setHasMore] = useState(true);

  // Debounce search term to limit API calls while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset page to 1 when search term changes
    }, 500); // 500ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Memoized URL construction for useFetch hook, includes pagination and filters
  const fetchUrl = useCallback(() => {
    let url = `${API_URL}/api/books?page=${currentPage}&limit=${booksPerPage}`;
    if (debouncedSearchTerm) {
      url += `&query=${debouncedSearchTerm}`;
    }
    if (selectedCategory !== "الكل") {
      url += `&category=${selectedCategory}`;
    }
    return url;
  }, [currentPage, booksPerPage, debouncedSearchTerm, selectedCategory]);

  const { data: fetchResponse, loading, error } = useFetch(fetchUrl());

  // Effect to handle fetched data, append books for pagination, and update total count
  useEffect(() => {
    if (fetchResponse) {
      const newBooks = fetchResponse.data;
      // Extract total count from response headers for pagination
      const totalCount = parseInt(fetchResponse.headers['x-total-count'], 10);

      setTotalBooksCount(totalCount);
      // Determine if there are more books to load
      setHasMore(currentPage * booksPerPage < totalCount);

      if (currentPage === 1) {
        setBooks(newBooks);
      } else {
        setBooks((prevBooks) => [...prevBooks, ...newBooks]);
      }

      // Update categories based on fetched books (only if not actively searching)
      // This ensures category list updates with available categories for current filter
      if (!debouncedSearchTerm) {
        const uniqueCategories = ["الكل", ...new Set(newBooks.map(book => book.category))];
        setCategories(uniqueCategories);
      }
    }
  }, [fetchResponse, currentPage, booksPerPage, debouncedSearchTerm]);


  


  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1); // Reset page when category changes
  };

  return (
    <div className="homepage-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <h1 className="homepage-title" style={{ color: theme.primary }}>البحث عن الكتب</h1>
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="ابحث عن كتاب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          aria-label="البحث عن كتاب"
          style={{
            border: `1px solid ${theme.secondary}`,
            backgroundColor: theme.background,
            color: theme.primary,
          }}
        />
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="category-select"
          aria-label="اختر فئة الكتاب"
          style={{
            border: `1px solid ${theme.secondary}`,
            backgroundColor: theme.background,
            color: theme.primary,
          }}
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      {loading && currentPage === 1 ? ( // Show loading only for first page load
        <div style={{ textAlign: "center" }}>جاري تحميل الكتب...</div>
      ) : error ? (
        <div style={{ textAlign: "center" }}>حدث خطأ أثناء تحميل الكتب.</div>
      ) : (
        <>
          <div className="books-display-container">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="load-more-button"
              style={{
                backgroundColor: theme.accent,
                color: theme.primary,
                border: `1px solid ${theme.secondary}`,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default HomePageClient;
