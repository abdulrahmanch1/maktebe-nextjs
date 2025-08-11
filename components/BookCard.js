'use client';
import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import { ThemeContext } from "@/contexts/ThemeContext";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from 'react-toastify';
import Image from 'next/image';
import './BookCard.css';

const BookCard = ({ book }) => {
  const { theme } = useContext(ThemeContext);
  const { isFavorite, toggleFavorite } = useContext(FavoritesContext);
  const { isLoggedIn } = useContext(AuthContext);
  const router = useRouter();
  const isLiked = book?.id ? isFavorite(book.id) : false;

  const handleReadClick = () => {
    router.push(`/book/${book.id}`);
  };

  return (
    <div className="book-card" style={{
      backgroundColor: theme.background,
      color: theme.primary,
      border: `1px solid ${theme.secondary}`,
    }}>
      <Image
        src={book.cover}
        alt={`غلاف كتاب ${book.title}`}
        width={200}
        height={300}
        className="book-card-image"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/imgs/no_cover_available.png";
        }}
      />
      <h2 className="book-card-title" style={{ color: theme.accent }}>
        {book.title}
      </h2>
      <div className="book-card-actions">
        <button
            onClick={handleReadClick}
            className="read-button"
            style={{
              backgroundColor: theme.accent,
              color: theme.primary,
            }}
          >
            اقرأ
          </button>
        <span
          onClick={() => {
            if (!isLoggedIn) {
              toast.error("يجب تسجيل الدخول لإضافة الكتاب للمفضلة.");
              return;
            }
            toggleFavorite(book.id);
          }}
          className={`favorite-icon ${isLiked ? 'liked' : ''}`}
          style={{
            backgroundColor: theme.primary,
          }}
        >
          {isLiked ? '❤️' : '♡'}
        </span>
      </div>
    </div>
  );
};

export default BookCard;
