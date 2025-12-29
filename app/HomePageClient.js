'use client';
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import BookCard from "@/components/BookCard";
import BookCardSkeleton from "@/components/BookCardSkeleton";
import HeroSection from "@/components/HeroSection";
import AuthorsSection from "@/components/AuthorsSection";
import './HomePage.css';
import { BOOK_CATEGORIES } from "@/constants";
import { useBooksQuery } from "@/hooks/useBooksQuery";
import { useInView } from "react-intersection-observer";
import { createClient } from "@/utils/supabase/client";

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

const HomePageClient = ({ initialBooks = [], initialAuthors = [], initialTotalCount = 0 }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const initialSearch = searchParams.get('search') || "";
  const initialCategory = searchParams.get('category') || "الكل";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Use SSR authors instead of fetching client-side
  const [randomAuthors] = useState(initialAuthors);

  const { ref, inView } = useInView();

  // Pass initialData to query if we are on the default view (no search/filter)
  const isDefaultView = !debouncedSearchTerm && (selectedCategory === "الكل" || !selectedCategory);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useBooksQuery(
    debouncedSearchTerm,
    selectedCategory === "الكل" ? "" : selectedCategory,
    isDefaultView ? initialBooks : null
  );

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Offline Redirection
  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      router.replace('/offline');
    }
    const handleOffline = () => router.replace('/offline');
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [router]);

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearchTerm) {
      params.set('search', debouncedSearchTerm);
    } else {
      params.delete('search');
    }

    if (selectedCategory && selectedCategory !== 'الكل') {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }

    // Only push if params changed to avoid redundant history entries
    const newSearchString = params.toString();
    const currentSearchString = searchParams.toString();

    if (newSearchString !== currentSearchString) {
      router.replace(`${pathname}?${newSearchString}`, { scroll: false });
    }
  }, [debouncedSearchTerm, selectedCategory, pathname, router, searchParams]);



  const books = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);

  const categories = useMemo(() => ["الكل", ...BOOK_CATEGORIES], []);

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 8 }).map((_, index) => (
        <BookCardSkeleton key={`skeleton-${index}`} />
      ));
    }

    if (books.length === 0) {
      return <div style={{ textAlign: "center", width: "100%" }}>لا توجد كتب تطابق بحثك.</div>;
    }

    const content = [];
    books.forEach((book, index) => {
      content.push(<BookCard key={`${book.id}-${index}`} book={book} isPriority={index < 4} />);

      // Insert authors section every 40 books
      if ((index + 1) % 40 === 0) {
        const sectionIndex = (index + 1) / 40 - 1;
        // Get 20 unique authors for this section
        const start = sectionIndex * 20;
        const end = start + 20;
        // Wrap around if we run out of authors
        const sectionAuthors = randomAuthors.slice(start % randomAuthors.length, end % randomAuthors.length || undefined);

        // Handle case where slice wraps around or is empty
        let displayAuthors = sectionAuthors;
        if (start >= randomAuthors.length && randomAuthors.length > 0) {
          // If we exceeded the list, just pick random 20 again or loop
          const loopStart = (sectionIndex * 20) % randomAuthors.length;
          displayAuthors = randomAuthors.slice(loopStart, loopStart + 20);
        }

        if (displayAuthors.length > 0) {
          content.push(
            <AuthorsSection key={`authors-section-${sectionIndex}`} authors={displayAuthors} />
          );
        }
      }
    });

    return content;
  };

  return (
    <div className="homepage-container">
      <HeroSection />

      <div className="search-filter-wrapper-floating">
        <div className="search-filter-container glass-panel">
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
      </div>


      {
        isError && (
          <div className="error-text" style={{ textAlign: "center", marginBottom: "1rem" }}>
            حدث خطأ أثناء تحميل الكتب. حاول مرة أخرى.
          </div>
        )
      }

      <div className="books-display-container">
        {renderContent()}

        {isFetchingNextPage && books.length > 0 && (
          Array.from({ length: 4 }).map((_, index) => (
            <BookCardSkeleton key={`skeleton-more-${index}`} />
          ))
        )}
        <div ref={ref} style={{ height: 1, width: '100%' }} />
      </div>
    </div >
  );
};

export default HomePageClient;
