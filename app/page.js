'use client';
import React, { useContext, useState, useEffect } from "react";
import BookCard from "@/components/BookCard";
import { ThemeContext } from "@/contexts/ThemeContext";
import useFetch from "@/hooks/useFetch";
import { API_URL } from "@/constants";
import './HomePage.css';

const HomePage = () => {
  const { theme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState(["الكل"]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data: booksData, loading, error } = useFetch(`${API_URL}/api/books?search=${debouncedSearchTerm}`);

  useEffect(() => {
    if (booksData) {
      setBooks(booksData);
      const uniqueCategories = ["الكل", ...new Set(booksData.map(book => book.category))];
      setCategories(uniqueCategories);
    }
  }, [booksData]);

  if (loading) {
    return <div className="homepage-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>جاري تحميل الكتب...</div>;
  }

  if (error) {
    return <div className="homepage-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>حدث خطأ أثناء تحميل الكتب.</div>;
  }

  const filteredBooks = books.filter((book) => {
    const matchesCategory = selectedCategory === "الكل" || book.category === selectedCategory;
    return matchesCategory;
  });

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
          style={{
            border: `1px solid ${theme.secondary}`,
            backgroundColor: theme.background,
            color: theme.primary,
          }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
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
      <div className="books-display-container">
        {filteredBooks.map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;