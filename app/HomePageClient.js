'use client';
import React, { useState, useMemo } from "react";
import BookCard from "@/components/BookCard";
import './HomePage.css';

const HomePageClient = ({ initialBooks = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  
  // The initial list of books is now passed as a prop
  const [books, setBooks] = useState(initialBooks);

  // Derive categories from the initial books list
  const categories = useMemo(() => {
    if (!initialBooks) return ["الكل"];
    return ["الكل", ...Array.from(new Set(initialBooks.map(book => book.category)))];
  }, [initialBooks]);

  // Filter books based on search term and category
  const filteredBooks = useMemo(() => {
    return books
      .filter(book => 
        selectedCategory === "الكل" || book.category === selectedCategory
      )
      .filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [books, searchTerm, selectedCategory]);

  // Note: The original useFetch and useEffect for fetching are removed.

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">البحث عن الكتب</h1>
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="ابحث بالاسم أو المؤلف..."
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
      
      <div className="books-display-container">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book, index) => (
            <BookCard key={book.id} book={book} isPriority={index < 4} />
          ))
        ) : (
          <div style={{ textAlign: "center" }}>لا توجد كتب تطابق بحثك.</div>
        )}
      </div>
    </div>
  );
};

export default HomePageClient;
