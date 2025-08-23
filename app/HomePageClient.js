'use client';
import React, { useState, useMemo, useEffect } from "react";
import BookCard from "@/components/BookCard";
import './HomePage.css';
import axios from "axios";
import { API_URL } from "@/constants";

const HomePageClient = ({ initialBooks = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [recentlyViewedBooksData, setRecentlyViewedBooksData] = useState([]);
  const [totalBookCount, setTotalBookCount] = useState(0);
  const [topFavoritedBooksData, setTopFavoritedBooksData] = useState([]);
  const [topReadBooksData, setTopReadBooksData] = useState([]);
  
  // The initial list of books is now passed as a prop
  const [books, setBooks] = useState(initialBooks);

  useEffect(() => {
    const HISTORY_KEY = 'recentlyViewedBooks';
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
      try {
        const bookIds = JSON.parse(storedHistory);
        if (bookIds.length > 0) {
          axios.get(`${API_URL}/api/books?ids=${bookIds.join(',')}`)
            .then(response => {
              // Ensure the order matches the history order
              const orderedBooks = bookIds.map(id => response.data.find(book => book.id === id)).filter(Boolean);
              setRecentlyViewedBooksData(orderedBooks);
            })
            .catch(error => {
              console.error("Error fetching recently viewed books:", error);
            });
        }
      } catch (e) {
        console.error("Failed to parse recently viewed books from localStorage", e);
        localStorage.removeItem(HISTORY_KEY); // Clear corrupted data
      }
    }

    // Fetch total book count and top favorited books
    axios.get(`${API_URL}/api/books`)
      .then(response => {
        const count = response.data.length;
        setTotalBookCount(count);
        if (count > 40) {
          axios.get(`${API_URL}/api/books?topFavorited=true&limit=20`)
            .then(topBooksResponse => {
              setTopFavoritedBooksData(topBooksResponse.data);
            })
            .catch(error => {
              console.error("Error fetching top favorited books:", error);
            });
        }
        if (count > 60) {
          axios.get(`${API_URL}/api/books?topRead=true&limit=20`)
            .then(topReadBooksResponse => {
              setTopReadBooksData(topReadBooksResponse.data);
            })
            .catch(error => {
              console.error("Error fetching top read books:", error);
            });
        }
      })
      .catch(error => {
        console.error("Error fetching total book count:", error);
      });
  }, []);

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

      {recentlyViewedBooksData.length >= 20 && (
        <div className="recently-viewed-section">
          <h2 className="section-title">السجل</h2>
          <div className="horizontal-scroll-container">
            {recentlyViewedBooksData.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}

      {totalBookCount > 40 && topFavoritedBooksData.length > 0 && (
        <div className="top-favorited-section recently-viewed-section"> {/* Re-use styling */}
          <h2 className="section-title">أكثر 20 كتابًا مفضلاً</h2>
          <div className="horizontal-scroll-container">
            {topFavoritedBooksData.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}

      {totalBookCount > 60 && topReadBooksData.length > 0 && (
        <div className="top-read-section recently-viewed-section"> {/* Re-use styling */}
          <h2 className="section-title">أكثر 20 كتابًا مقروءًا</h2>
          <div className="horizontal-scroll-container">
            {topReadBooksData.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
      
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
