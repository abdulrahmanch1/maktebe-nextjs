'use client';
import React, { useState, useEffect } from "react";
import BookCard from "@/components/BookCard";
import { ThemeContext } from "@/contexts/ThemeContext";
import useFetch from "@/hooks/useFetch";
import { API_URL } from "@/constants";
const API_URL_DEBUG = "http://localhost:3000"; // Temporary for debugging
import './HomePage.css';

const HomePageClient = () => { // No props received
  console.log('HomePageClient is rendering!'); // Debugging line
  const { theme } = React.useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  // Initial state for books and categories will be empty, then populated by useFetch
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState(["الكل"]); // Keep "الكل" as initial category

  useEffect(() => {
    console.log('The API_URL is:', API_URL); // Debugging line
    const fetchBooks = async () => {
      setIsLoading(true);

  const fetchUrl = `${API_URL_DEBUG}/api/books`;
  console.log('Fetching books from:', fetchUrl); // Debugging line

  const { data: booksData, loading, error } = useFetch(fetchUrl);
  console.log('booksData from useFetch:', booksData);

  useEffect(() => {
    if (booksData) {
      setBooks(booksData);
      // Extract unique categories from the fetched books
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