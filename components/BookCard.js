'use client';
// Cache buster: v5-minimalist
import React, { useContext, useEffect, useState } from "react";
import Link from 'next/link';
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from 'react-toastify';
import Image from 'next/image';
import { getStorageUrl } from "@/utils/imageUtils";
import { NotesContext } from "@/contexts/NotesContext";
import { FaStickyNote } from 'react-icons/fa';
import { getNoteColor } from "@/utils/colors";
import './BookCard.css';



const BookCard = ({ book, isPriority = false }) => {
  const { isFavorite, toggleFavorite } = useContext(FavoritesContext);
  const { isLoggedIn } = useContext(AuthContext);
  const { getNote } = useContext(NotesContext);
  const note = isLoggedIn ? getNote(book.id) : null;
  const isLiked = book?.id ? isFavorite(book.id) : false;
  const [coverSrc, setCoverSrc] = useState(getStorageUrl(book.cover, 'book-covers') || '/imgs/no_cover_available.png');
  const [favoriteCount, setFavoriteCount] = useState(book.favoritecount || 0);
  const [noteColor, setNoteColor] = useState('#fff');

  useEffect(() => {
    if (note) {
      setNoteColor(getNoteColor(note));
    }
  }, [note]);


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
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
            className="book-card-image"
            quality={60}
            loading={isPriority ? 'eager' : 'lazy'}
            priority={isPriority}
            fetchPriority={isPriority ? 'high' : 'auto'}
            onError={() => setCoverSrc('/imgs/no_cover_available.png')}
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
            {note && (
              <div
                className="note-indicator-overlay full-width"
                title={note}
                style={{ backgroundColor: noteColor }}
              >
                <span className="note-snippet">{note.length > 30 ? note.substring(0, 30) + '...' : note}</span>
              </div>
            )}
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
    </Link >
  );
};

export default BookCard;
