'use client';
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import BookCard from "@/components/BookCard";
import './HomePage.css';
import axios from "axios";
import { API_URL, BOOKS_PAGE_SIZE, BOOK_CATEGORIES } from "@/constants";

const HomePageClient = ({ initialBooks = [], initialTotalCount = 0 }) => {
  const normalizedInitialCount = Math.max(initialTotalCount || 0, initialBooks.length || 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [recentlyViewedBooksData, setRecentlyViewedBooksData] = useState([]);
  const [totalBookCount, setTotalBookCount] = useState(normalizedInitialCount);
  const [topFavoritedBooksData, setTopFavoritedBooksData] = useState([]);
  const [topReadBooksData, setTopReadBooksData] = useState([]);
  const [books, setBooks] = useState(initialBooks);
  const [hasMore, setHasMore] = useState((initialBooks?.length || 0) < normalizedInitialCount);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const loadMoreRef = useRef(null);
  const hasAppliedFiltersRef = useRef(false);
  const booksLengthRef = useRef(initialBooks.length || 0);
  const hasMoreRef = useRef((initialBooks?.length || 0) < normalizedInitialCount);
  const isFilteringRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    booksLengthRef.current = books.length;
  }, [books]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    isFilteringRef.current = isFiltering;
  }, [isFiltering]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    const normalizedCount = Math.max(initialTotalCount || 0, initialBooks.length || 0);
    setTotalBookCount(normalizedCount);
    setBooks(initialBooks);
    setHasMore((initialBooks?.length || 0) < normalizedCount);
    booksLengthRef.current = initialBooks.length || 0;
    hasMoreRef.current = (initialBooks?.length || 0) < normalizedCount;
  }, [initialBooks, initialTotalCount]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const HISTORY_KEY = 'recentlyViewedBooks';
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
      try {
        const bookIds = JSON.parse(storedHistory);
        if (bookIds.length > 0) {
          axios.get(`${API_URL}/api/books?ids=${bookIds.join(',')}`)
            .then(response => {
              const orderedBooks = bookIds
                .map(id => response.data.find(book => book.id === id))
                .filter(Boolean);
              setRecentlyViewedBooksData(orderedBooks);
            })
            .catch(error => {
              console.error("Error fetching recently viewed books:", error);
            });
        }
      } catch (e) {
        console.error("Failed to parse recently viewed books from localStorage", e);
        localStorage.removeItem(HISTORY_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (totalBookCount > 40 && topFavoritedBooksData.length === 0) {
      axios.get(`${API_URL}/api/books?topFavorited=true&limit=20`)
        .then(topBooksResponse => {
          setTopFavoritedBooksData(topBooksResponse.data);
        })
        .catch(error => {
          console.error("Error fetching top favorited books:", error);
        });
    }
  }, [totalBookCount, topFavoritedBooksData]);

  useEffect(() => {
    if (totalBookCount > 60 && topReadBooksData.length === 0) {
      axios.get(`${API_URL}/api/books?topRead=true&limit=20`)
        .then(topReadBooksResponse => {
          setTopReadBooksData(topReadBooksResponse.data);
        })
        .catch(error => {
          console.error("Error fetching top read books:", error);
        });
    }
  }, [totalBookCount, topReadBooksData]);

  const categories = useMemo(() => ["الكل", ...BOOK_CATEGORIES], []);

  const fetchBooks = useCallback(async (reset = false) => {
    if ((!hasMoreRef.current && !reset) || isLoadingMoreRef.current || isFilteringRef.current) {
      return;
    }

    const params = new URLSearchParams();
    params.set('limit', BOOKS_PAGE_SIZE.toString());
    const offsetValue = reset ? 0 : booksLengthRef.current;
    params.set('offset', offsetValue.toString());

    if (debouncedSearchTerm) {
      params.set('query', debouncedSearchTerm);
    }
    if (selectedCategory !== "الكل") {
      params.set('category', selectedCategory);
    }

    try {
      if (reset) {
        setIsFiltering(true);
        setBooks([]);
        setHasMore(true);
        booksLengthRef.current = 0;
        hasMoreRef.current = true;
      } else {
        setIsLoadingMore(true);
      }
      setFetchError(null);

      const response = await axios.get(`${API_URL}/api/books?${params.toString()}`);
      const fetchedBooks = Array.isArray(response.data) ? response.data : [];

      setBooks((prevBooks) => {
        const nextBooks = reset ? fetchedBooks : [...prevBooks, ...fetchedBooks];
        booksLengthRef.current = nextBooks.length;
        return nextBooks;
      });
      const canLoadMore = fetchedBooks.length === BOOKS_PAGE_SIZE;
      setHasMore(canLoadMore);
      hasMoreRef.current = canLoadMore;
    } catch (error) {
      console.error("Error fetching books:", error);
      setFetchError("حدث خطأ أثناء تحميل الكتب. حاول مرة أخرى.");
    } finally {
      if (reset) {
        setIsFiltering(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [debouncedSearchTerm, selectedCategory]);

  useEffect(() => {
    if (!hasAppliedFiltersRef.current) {
      hasAppliedFiltersRef.current = true;
      return;
    }
    fetchBooks(true);
  }, [debouncedSearchTerm, selectedCategory, fetchBooks]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchBooks();
      }
    }, { rootMargin: '200px' });

    const current = loadMoreRef.current;
    observer.observe(current);

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [fetchBooks]);

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

      {fetchError && (
        <div className="error-text" style={{ textAlign: "center", marginBottom: "1rem" }}>
          {fetchError}
        </div>
      )}

      <div className="books-display-container">
        {books.length > 0 ? (
          books.map((book, index) => (
            <React.Fragment key={book.id}>
              <BookCard book={book} isPriority={index < 4} />
              {index === 19 && totalBookCount >= 20 && recentlyViewedBooksData.length > 0 && (
                <div className="recently-viewed-section">
                  <h2 className="section-title">السجل</h2>
                  <div className="horizontal-scroll-container">
                    {recentlyViewedBooksData.slice(-20).map((rb) => (
                      <BookCard key={rb.id} book={rb} />
                    ))}
                  </div>
                </div>
              )}
              {index === 39 && topFavoritedBooksData.length > 0 && (
                <div className="recently-viewed-section">
                  <h2 className="section-title">أكثر الكتب إعجابًا</h2>
                  <div className="horizontal-scroll-container">
                    {topFavoritedBooksData.map((favBook) => (
                      <BookCard key={favBook.id} book={favBook} />
                    ))}
                  </div>
                </div>
              )}
              {index === 59 && topReadBooksData.length > 0 && (
                <div className="recently-viewed-section">
                  <h2 className="section-title">أكثر الكتب قراءة</h2>
                  <div className="horizontal-scroll-container">
                    {topReadBooksData.map((readBook) => (
                      <BookCard key={readBook.id} book={readBook} />
                    ))}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        ) : (
          <div style={{ textAlign: "center" }}>
            {isFiltering ? "جاري تحميل الكتب..." : "لا توجد كتب تطابق بحثك."}
          </div>
        )}
        {isFiltering && books.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>جاري تحديث النتائج...</div>
        )}
        {isLoadingMore && !isFiltering && books.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>جاري تحميل المزيد...</div>
        )}
        <div ref={loadMoreRef} style={{ height: 1 }} />
      </div>
    </div>
  );
};

export default HomePageClient;
