'use client';
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
      <div className="book-image-wrapper">
        <Image
          src={book.cover || '/imgs/no_cover_available.png'}
          alt={`غلاف كتاب ${book.title}`}
          width={200}
          height={300}
          className="book-card-image"
          priority={isPriority}
          loading={isPriority ? 'eager' : 'lazy'}
          unoptimized={true}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/imgs/no_cover_available.png";
          }}
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