
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
  const [books, setBooks] = useState(initialBooks); // Start with initialBooks
  const [categories, setCategories] = useState(initialCategories); // Start with initialCategories

  const { data: fetchResponse, loading, error, refetch } = useFetch(null); // Pass null initially

  // Effect to trigger initial fetch on component mount
  useEffect(() => {
    const url = `${API_URL}/api/books?page=${defaultPage}&limit=${defaultLimit}`;
    refetch(url);
  }, [defaultPage, defaultLimit, refetch]); // Dependencies for initial fetch

  // Effect to handle fetched data, append books for pagination, and update total count
  useEffect(() => {
    if (fetchResponse) {
      const newBooks = fetchResponse.data;
      const totalCount = parseInt(fetchResponse.headers['x-total-count'], 10);

      setTotalBooksCount(totalCount);
      // Determine if there are more books to load
      setHasMore(currentPage * booksPerPage < totalCount);

      // Only update books if new data is available
      if (newBooks && newBooks.length > 0) {
        if (currentPage === 1) {
          // If it's the first page (new search or initial load), replace books
          setBooks(newBooks);
        } else {
          // For subsequent pages (load more), append books
          setBooks((prevBooks) => [...prevBooks, ...newBooks]);
        }
      } else if (currentPage === 1) {
        // If no new books and it's the first page, clear the list (e.g., no results for search)
        setBooks([]);
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
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      const url = `${API_URL}/api/books?page=${nextPage}&limit=${booksPerPage}`;
      if (debouncedSearchTerm) {
        url += `&query=${debouncedSearchTerm}`;
      }
      if (selectedCategory !== "الكل") {
        url += `&category=${selectedCategory}`;
      }
      refetch(url); // Trigger fetch for next page
    }
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    setCurrentPage(1); // Reset page when category changes
    const url = `${API_URL}/api/books?page=1&limit=${booksPerPage}`;
    if (debouncedSearchTerm) {
      url += `&query=${debouncedSearchTerm}`;
    }
    if (newCategory !== "الكل") {
      url += `&category=${newCategory}`;
    }
    refetch(url); // Trigger fetch for new category
  };

  // Trigger fetch when debouncedSearchTerm changes
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) { // Ensure it's not initial undefined
      const url = `${API_URL}/api/books?page=1&limit=${booksPerPage}`;
      if (debouncedSearchTerm) {
        url += `&query=${debouncedSearchTerm}`;
      }
      if (selectedCategory !== "الكل") {
        url += `&category=${selectedCategory}`;
      }
      refetch(url); // Trigger fetch for new search term
    }
  }, [debouncedSearchTerm, booksPerPage, selectedCategory, refetch]); // Add refetch to dependencies


  


  

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
