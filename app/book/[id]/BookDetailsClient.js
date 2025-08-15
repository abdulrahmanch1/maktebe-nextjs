'use client';

import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from 'react-toastify';
import useFetch from "@/hooks/useFetch";
import Image from "next/image";
import { API_URL } from "@/constants";
import { useRouter } from "next/navigation"; // Import useRouter
import './BookDetailsPage.css';

const BookDetailsClient = ({ params }) => {
  const router = useRouter();
  const id = router.pathname.split('/').pop(); // Extract ID from pathname
  const { theme } = useContext(ThemeContext);
  const { toggleFavorite, isFavorite } = useContext(FavoritesContext);
  const { isLoggedIn, user, session, setUser } = useContext(AuthContext);
  const { data: bookData, loading, error } = useFetch(`${API_URL}/api/books/${id}`, [id]);
  const [book, setBook] = useState(null);
  const [isInReadingList, setIsInReadingList] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [bookComments, setBookComments] = useState([]);

  useEffect(() => {
    if (bookData) {
      setBook(bookData);
      setBookComments(bookData.comments.map(comment => ({
        ...comment,
        userLiked: user && comment.likes.some(likeId => likeId.toString() === user.id.toString()),
        likes: comment.likes.length,
      })) || []);
      if (user && user.readingList) {
        const item = user.readingList.find(item => item.book === id);
        if (item) {
          setIsInReadingList(true);
          setIsRead(item.read);
        }
      }
    }
  }, [bookData, user, id]);

  const handleToggleFavorite = () => {
    if (!isLoggedIn) {
      toast.error("يجب تسجيل الدخول لإضافة الكتاب للمفضلة.");
      return;
    }
    toggleFavorite(book.id);
  };

  const handleAddToReadingList = async () => {
    if (book && book.pdfFile) {
      window.open(book.pdfFile, '_blank');
    } else {
      toast.error("ملف الكتاب غير متوفر.");
      return;
    }

    if (!isLoggedIn) {
      toast.info("تم فتح الكتاب للقراءة. لتتبع تقدمك وإضافة تعليقات، يرجى تسجيل الدخول.");
      return;
    }

    try {
      let updatedReadingList = user.readingList;
      let bookInReadingList = user.readingList.find(item => item.book === book.id);

      if (!bookInReadingList) {
        const addRes = await axios.post(`${API_URL}/api/users/${user.id}/reading-list`, { bookId: book.id }, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        updatedReadingList = addRes.data;
        setIsInReadingList(true);
        toast.success("تمت إضافة الكتاب إلى قائمة القراءة.");
      }

      const currentBookItem = updatedReadingList.find(item => item.book === book.id);

      if (currentBookItem && !currentBookItem.read) {
        const patchRes = await axios.patch(`${API_URL}/api/users/${user.id}/reading-list/${book.id}`, { read: true }, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        updatedReadingList = patchRes.data;
        setIsRead(true);
      }

      setUser({ ...user, readingList: updatedReadingList });
    } catch (err) {
      console.error("Error handling reading list:", err);
      toast.error(err.response?.data?.message || "فشل تحديث قائمة القراءة.");
    }
  };

  const handleToggleReadStatus = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await axios.patch(`${API_URL}/api/users/${user.id}/reading-list/${book.id}`, { read: !isRead }, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setUser({ ...user, readingList: res.data });
      setIsRead(!isRead);
      toast.success(`تم وضع علامة على الكتاب كـ ${!isRead ? "مقروء" : "غير مقروء"}.`);
    } catch (err) {
      console.error("Error toggling read status:", err);
      toast.error(err.response?.data?.message || "فشل تحديث حالة الكتاب.");
    }
  };

  const handleRemoveFromReadingList = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await axios.delete(`${API_URL}/api/users/${user.id}/reading-list/${book.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setUser({ ...user, readingList: res.data });
      setIsInReadingList(false);
      setIsRead(false);
      toast.success("تمت إزالة الكتاب من قائمة القراءة.");
    } catch (err) {
      console.error("Error removing from reading list:", err);
      toast.error(err.response?.data?.message || "فشل إزالة الكتاب من قائمة القراءة.");
    }
  };

  const handlePostComment = async () => {
    if (!isLoggedIn || !user || !session) {
      toast.error("يجب تسجيل الدخول لنشر تعليق.");
      return;
    }
    if (!commentText.trim()) {
      toast.error("لا يمكن نشر تعليق فارغ.");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/books/${book.id}/comments`, { text: commentText }, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setBookComments([...bookComments, res.data]);
      setCommentText('');
      toast.success("تم نشر التعليق بنجاح!");
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error(err.response?.data?.message || "فشل نشر التعليق.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!isLoggedIn || !user || !session) {
      toast.error("يجب تسجيل الدخول لحذف تعليق.");
      return;
    }
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا التعليق؟")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/books/${book.id}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setBookComments(bookComments.filter(comment => comment.id !== commentId));
      toast.success("تم حذف التعليق بنجاح!");
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error(err.response?.data?.message || "فشل حذف التعليق.");
    }
  };

  const handleToggleLike = async (commentId) => {
    if (!isLoggedIn || !user || !session) {
      toast.error("يجب تسجيل الدخول للإعجاب بالتعليقات.");
      return;
    }

    try {
      const res = await axios.patch(`${API_URL}/api/books/${book.id}/comments/${commentId}`, {}, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setBookComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? { ...comment, likes: res.data.likes, userLiked: res.data.liked }
            : comment
        )
      );
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error(err.response?.data?.message || "فشل الإعجاب بالتعليق.");
    }
  };

  if (loading) {
    return <div style={{ backgroundColor: theme.background, color: theme.primary, padding: "20px", textAlign: "center" }}>جاري تحميل تفاصيل الكتاب...</div>;
  }

  if (error) {
    return <div style={{ backgroundColor: theme.background, color: theme.primary, padding: "20px", textAlign: "center", }}>{error.message}</div>;
  }

  if (!book) {
    return <div style={{ backgroundColor: theme.background, color: theme.primary, padding: "20px", textAlign: "center" }}>الكتاب غير موجود</div>;
  }

  const isLiked = isFavorite(book.id);

  return (
    <div style={{ backgroundColor: theme.background, color: theme.primary }} className="book-details-container">
      <div className="book-cover-section">
        <Image
          src={book.cover}
          alt={`غلاف كتاب ${book.title}`}
          width={300}
          height={450}
          className="book-cover-image"
          loading="lazy"
        />
      </div>
      <div className="book-info-section">
        <h1 className="book-title" style={{ color: theme.primary, borderBottomColor: theme.accent }}>{book.title}</h1>
        <p className="book-meta-item"><strong>المؤلف:</strong> <span style={{ color: theme.accent }}>{book.author}</span></p>
        <p className="book-meta-item"><strong>التصنيف:</strong> {book.category}</p>
        <p className="book-meta-item"><strong>سنة النشر:</strong> {book.publishYear}</p>
        <p className="book-meta-item"><strong>عدد الصفحات:</strong> {book.pages}</p>
        <p className="book-meta-item"><strong>اللغة:</strong> {book.language}</p>
        <p className="book-meta-item"><strong>عدد القراءات:</strong> {book.readCount || 0}</p>
        <p className="book-meta-item"><strong>عدد الإعجابات:</strong> {book.favoriteCount || 0}</p>
        <h2 className="book-description-title" style={{ color: theme.primary, borderTopColor: theme.secondary }}>الوصف:</h2>
        <p className="book-description-text">{book.description}</p>

        {!isInReadingList && (
          <button
            onClick={handleAddToReadingList}
            className="book-action-button"
            style={{ backgroundColor: theme.accent, color: theme.primary }}
          >
            اقرأ الكتاب
          </button>
        )}

        {isInReadingList && (
          <div className="reading-list-buttons-group">
            <button
              onClick={handleToggleReadStatus}
              className="book-action-button"
              style={{ backgroundColor: isRead ? theme.secondary : theme.accent, color: theme.primary }}
            >
              {isRead ? "وضع علامة كغير مقروء" : "وضع علامة كمقروء"}
            </button>
            <button
              onClick={handleRemoveFromReadingList}
              className="book-action-button remove"
              style={{ color: theme.primary }}
            >
              إزالة من قائمة القراءة
            </button>
          </div>
        )}

        <button
          onClick={handleToggleFavorite}
          className="book-action-button"
          style={{ backgroundColor: isLiked ? theme.secondary : theme.accent, color: theme.primary }}
        >
          {isLiked ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        </button>

        <div className="comments-section" style={{ borderTopColor: theme.secondary }}>
          <h2 className="comments-title" style={{ color: theme.primary }}>التعليقات</h2>
          {isLoggedIn ? (
            <>
              <textarea
                placeholder="اكتب تعليقك هنا..."
                rows="4"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="comment-textarea"
                style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }}
              ></textarea>
              <button
                onClick={handlePostComment}
                className="comment-post-button"
                style={{ backgroundColor: theme.accent, color: theme.primary }}
              >
                نشر تعليق
              </button>
            </>
          ) : (
            <p className="no-comments-message" style={{ color: theme.primary }}>
              يجب تسجيل الدخول لكتابة تعليق.
            </p>
          )}
          <div style={{ marginTop: "20px" }}>
            {bookComments.length > 0 ? (
              bookComments.map((comment) => (
                <div key={comment.id} className="comment-item" style={{ backgroundColor: theme.secondary }}>
                  <Image
                    src={comment.user.profilePicture && (comment.user.profilePicture !== 'Untitled.jpg' && comment.user.profilePicture !== 'user.jpg') ? comment.user.profilePicture : '/imgs/user.jpg'}
                    alt={`صورة ملف ${comment.user.username}`}
                    width={40}
                    height={40}
                    className="comment-user-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/user.jpg'; }}
                  />
                  <div className="comment-content">
                    <p className="comment-username" style={{ color: theme.primary }}>{comment.user.username}</p>
                    <p className="comment-text" style={{ color: theme.primary }}>{comment.text}</p>
                    <p className="comment-date" style={{ color: theme.primary }}>{new Date(comment.createdAt).toLocaleDateString()}</p>
                    <div className="comment-actions">
                      <span
                        onClick={() => handleToggleLike(comment.id)}
                        className={`comment-like-button ${comment.userLiked ? 'liked' : ''}`}
                        style={{ color: comment.userLiked ? "red" : theme.primary }}
                      >
                        {comment.userLiked ? '❤️' : '♡'} <span style={{ fontSize: "0.8em" }}>({comment.likes})</span>
                      </span>
                    </div>
                  </div>
                  {(isLoggedIn && user && (user.id === comment.user_id || user.role === 'admin')) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="comment-delete-button"
                      style={{ backgroundColor: '#dc3545' }}
                    >
                      حذف
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: theme.primary, textAlign: "center" }}>لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsClient;