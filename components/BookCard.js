'use client';
// Cache buster: v5-minimalist
import React, { useContext, useEffect, useState } from "react";
import Link from 'next/link';
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from 'react-toastify';
import Image from 'next/image';
import './BookCard.css';



const BookCard = ({ book, isPriority = false }) => {
  const { isFavorite, toggleFavorite } = useContext(FavoritesContext);
  const { isLoggedIn } = useContext(AuthContext);
  const isLiked = book?.id ? isFavorite(book.id) : false;
  const [coverSrc, setCoverSrc] = useState(book.cover || '/imgs/no_cover_available.png');
  const [favoriteCount, setFavoriteCount] = useState(book.favoritecount || 0);


  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("يجب تسجيل الدخول لإضافة الكتاب للمفضلة.");
      return;
    }

    // Optimistically update the count
    const wasLiked = isFavorite(book.id);
    setFavoriteCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    // Call the API
    const newCount = await toggleFavorite(book.id);

    // Update with the actual count from the server if available
    if (newCount !== undefined) {
      setFavoriteCount(newCount);
    }
  };

  return (
    <Link href={`/book/${book.id}`} className="book-card-link" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="book-card">
        <div className="book-card-cover">
          <Image
            src={coverSrc}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 38vw, (max-width: 1024px) 18vw, 220px"
            className="book-card-image"
            quality={60}
            loading={isPriority ? 'eager' : 'lazy'}
            priority={isPriority}
            fetchPriority={isPriority ? 'high' : 'auto'}
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
            onError={() => setCoverSrc('/imgs/no_cover_available.png')}
            unoptimized={!!coverSrc && !coverSrc.startsWith('/')}
          />
          <div className="book-card-overlay">
            <button
              onClick={handleFavoriteClick}
              className={`favorite-btn ${isLiked ? 'liked' : ''}`}
              aria-label={isLiked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="book-card-info">
          <p className="book-title" title={book.title}>{book.title}</p>
          {book.author && <p className="book-author">{book.author}</p>}

          {/* Progress Bar (Only if progress exists) */}
          {book.progress && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${book.progress.percentage || 0}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {book.progress.percentage ? `%${book.progress.percentage}` : 'بدأ للتو'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BookCard;
