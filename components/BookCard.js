'use client';
// Cache buster: v4
import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from 'react-toastify';
import Image from 'next/image';
import './BookCard.css';

const BookCard = ({ book, isPriority }) => {
  const { isFavorite, toggleFavorite } = useContext(FavoritesContext);
  const { isLoggedIn } = useContext(AuthContext);
  const router = useRouter();
  const isLiked = book?.id ? isFavorite(book.id) : false;

  const handleReadClick = () => {
    router.push(`/book/${book.id}`);
  };

  return (
    <div className="book-card">
      <div className="book-card-image-container">
        <Image
          src={book.cover || '/imgs/no_cover_available.png'}
          alt={book.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="book-card-image"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
        />
        <button
          onClick={() => {
            if (!isLoggedIn) {
              toast.error("يجب تسجيل الدخول لإضافة الكتاب للمفضلة.");
              return;
            }
            toggleFavorite(book.id);
          }}
          className={`favorite-icon ${isLiked ? 'liked' : ''}`}
          aria-label={isLiked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
        >
          {isLiked ? '❤️' : '♡'}
        </button>
      </div>
      <h2 className="book-card-title">
        {book.title}
      </h2>
      <div className="book-card-actions">
        <button
          onClick={handleReadClick}
          className="read-button"
        >
          اقرأ
        </button>
      </div>
    </div>
  );
};

export default BookCard;