'use client';
// Cache buster: v5-minimalist
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from 'react-toastify';
import Image from 'next/image';
import './BookCard.css';

const BookCard = ({ book }) => {
  const { isFavorite, toggleFavorite } = useContext(FavoritesContext);
  const { isLoggedIn } = useContext(AuthContext);
  const router = useRouter();
  const isLiked = book?.id ? isFavorite(book.id) : false;
  const [coverSrc, setCoverSrc] = useState(book.cover || '/imgs/no_cover_available.png');

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCoverSrc(book.cover || '/imgs/no_cover_available.png');
  }, [book.cover]);

  const handleCardClick = () => {
    router.push(`/book/${book.id}`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("يجب تسجيل الدخول لإضافة الكتاب للمفضلة.");
      return;
    }
    toggleFavorite(book.id);
  };

  return (
    <div className="book-card" onClick={handleCardClick}>
      <div className="book-card-cover">
        <Image
          src={coverSrc}
          alt={book.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          className="book-card-image"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
          onError={() => setCoverSrc('/imgs/no_cover_available.png')}
          unoptimized
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
        <h3 className="book-title" title={book.title}>{book.title}</h3>
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
  );
};

export default BookCard;
