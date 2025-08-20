'use client';
import React, { useState, useEffect, useContext } from "react";
import BookCard from "@/components/BookCard";
import { ThemeContext } from "@/contexts/ThemeContext";
import useFetch from "@/hooks/useFetch";
import { API_URL } from "@/constants";
import './HomePage.css';

const HomePageClient = () => {
  console.log('HomePageClient is rendering!'); // Debugging line
  const { theme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState(["الكل"]);

  const fetchUrl = `${API_URL}/api/books`;
  console.log('Fetching books from:', fetchUrl);

  const { data: booksData, loading, error } = useFetch(fetchUrl);

  useEffect(() => {
    if (booksData) {
      setBooks(booksData);
      const uniqueCategories = ["الكل"].concat(Array.from(new Set(booksData.map(book => book.category))));
      setCategories(uniqueCategories);
    }
  }, [booksData]);

  console.log('Current books state:', books);

  const displayLoading = loading;
  const displayError = error;

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">البحث عن الكتب</h1>
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="ابحث عن كتاب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      {displayLoading ? (
        <div style={{ textAlign: "center" }}>جاري تحميل الكتب...</div>
      ) : displayError ? (
        <div style={{ textAlign: "center" }}>حدث خطأ أثناء تحميل الكتب.</div>
      ) : (
        <div className="books-display-container">
          {books.map((book, index) => {
            return <BookCard key={book.id} book={book} isPriority={index < 4} />;
          })}
        </div>
      )}
    </div>
  );
};

export default HomePageClient;