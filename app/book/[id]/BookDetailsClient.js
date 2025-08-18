'use client';

import React, { useContext, useEffect, useState } from "react";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from 'react-toastify';
import Image from "next/image";
import { API_URL } from "@/constants";
import './BookDetailsPage.css';

const BookDetailsClient = ({ initialBook }) => {
  const { toggleFavorite, isFavorite } = useContext(FavoritesContext);
  const { isLoggedIn, user, session, setUser } = useContext(AuthContext);
  const [book, setBook] = useState(initialBook);
  const [isInReadingList, setIsInReadingList] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [bookComments, setBookComments] = useState([]);

  useEffect(() => {
    if (initialBook.comments) {
      setBookComments(initialBook.comments.map(comment => ({
        ...comment,
        userLiked: user && comment.likes && comment.likes.some(likeId => likeId.toString() === user.id.toString()),
        likes: comment.likes ? comment.likes.length : 0,
      })));
    }
  }, [initialBook.comments, user]);

  useEffect(() => {
    const currentReadingList = Array.isArray(user?.readingList) ? user.readingList : [];
    if (user) {
      const item = currentReadingList.find(item => item.book === initialBook.id);
      if (item) {
        setIsInReadingList(true);
        setIsRead(item.read);
      }
    }
  }, [user, initialBook.id]);

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
      const currentReadingList = Array.isArray(user?.readingList) ? user.readingList : [];
      let updatedReadingList = currentReadingList;
      let bookInReadingList = currentReadingList.find(item => item.book === book.id);

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
      const updatedReadingList = res.data;
      setUser({ ...user, readingList: updatedReadingList });
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
      const updatedReadingList = res.data;
      setUser({ ...user, readingList: updatedReadingList });
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

  const isLiked = isFavorite(book.id);

  return (
    <div className="book-details-container">
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
        <h1 className="book-title">{book.title}</h1>
        <p className="book-meta-item"><strong>المؤلف:</strong> <span>{book.author}</span></p>
        <p className="book-meta-item"><strong>التصنيف:</strong> {book.category}</p>
        <p className="book-meta-item"><strong>سنة النشر:</strong> {book.publishYear}</p>
        <p className="book-meta-item"><strong>عدد الصفحات:</strong> {book.pages}</p>
        <p className="book-meta-item"><strong>اللغة:</strong> {book.language}</p>
        <p className="book-meta-item"><strong>عدد القراءات:</strong> {book.readCount || 0}</p>
        <p className="book-meta-item"><strong>عدد الإعجابات:</strong> {book.favoriteCount || 0}</p>
        <h2 className="book-description-title">الوصف:</h2>
        <p className="book-description-text">{book.description}</p>

        {!isInReadingList && (
          <button
            onClick={handleAddToReadingList}
            className="book-action-button"
          >
            اقرأ الكتاب
          </button>
        )}

        {isInReadingList && (
          <div className="reading-list-buttons-group">
            <button
              onClick={handleToggleReadStatus}
              className="book-action-button"
              style={{ backgroundColor: isRead ? 'var(--secondary-color)' : 'var(--accent-color)' }}
            >
              {isRead ? "وضع علامة كغير مقروء" : "وضع علامة كمقروء"}
            </button>
            <button
              onClick={handleRemoveFromReadingList}
              className="book-action-button remove"
            >
              إزالة من قائمة القراءة
            </button>
          </div>
        )}

        <button
          onClick={handleToggleFavorite}
          className="book-action-button"
          style={{ backgroundColor: isLiked ? 'var(--secondary-color)' : 'var(--accent-color)' }}
        >
          {isLiked ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        </button>

        <div className="comments-section">
          <h2 className="comments-title">التعليقات</h2>
          {isLoggedIn ? (
            <>
              <textarea
                placeholder="اكتب تعليقك هنا..."
                rows="4"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="comment-textarea"
              ></textarea>
              <button
                onClick={handlePostComment}
                className="comment-post-button"
              >
                نشر تعليق
              </button>
            </>
          ) : (
            <p className="no-comments-message">
              يجب تسجيل الدخول لكتابة تعليق.
            </p>
          )}
          <div style={{ marginTop: "20px" }}>
            {bookComments.length > 0 ? (
              bookComments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <Image
                    src={comment.profiles?.profilepicture && (comment.profiles.profilepicture !== 'Untitled.jpg' && comment.profiles.profilepicture !== 'user.jpg') ? comment.profiles.profilepicture : '/imgs/user.jpg'}
                    alt={`صورة ملف ${comment.profiles?.username || 'مستخدم غير معروف'}`}
                    width={40}
                    height={40}
                    className="comment-user-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/user.jpg'; }}
                  />
                  <div className="comment-content">
                    <p className="comment-username">{comment.profiles?.username || 'مستخدم غير معروف'}</p>
                    <p className="comment-text">{comment.text}</p>
                    <p className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</p>
                    <div className="comment-actions">
                      <span
                        onClick={() => handleToggleLike(comment.id)}
                        className={`comment-like-button ${comment.userLiked ? 'liked' : ''}`}
                        style={{ color: comment.userLiked ? "red" : 'var(--primary-color)' }}
                      >
                        {comment.userLiked ? '❤️' : '♡'} <span style={{ fontSize: "0.8em" }}>({comment.likes})</span>
                      </span>
                    </div>
                  </div>
                  {(isLoggedIn && user && (user.id === comment.user_id || user.role === 'admin')) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="comment-delete-button"
                    >
                      حذف
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center" }}>لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsClient;
