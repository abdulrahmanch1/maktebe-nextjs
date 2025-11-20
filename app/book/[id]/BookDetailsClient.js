'use client';

import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from 'react-toastify';
import Image from "next/image";
import { API_URL } from "@/constants";
import './BookDetailsPage.css';
import { FaTrash } from 'react-icons/fa';
import { useRouter } from "next/navigation";
import BookCard from "@/components/BookCard"; // Import BookCard

// A small component to safely render dates only on the client-side
const ClientOnlyDate = ({ dateString }) => {
  const formattedDate = useMemo(() => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [dateString]);

  return <span className="comment-date">{formattedDate}</span>;
};

// Custom Confirmation Toast Component
const ConfirmationToast = ({ message, toastId, onConfirm, onCancel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
    <div>{message}</div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
      <button
        onClick={() => { toast.dismiss(toastId); onConfirm(); }}
        style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--accent-color)', color: 'var(--primary-color)', cursor: 'pointer' }}
      >
        نعم
      </button>
      <button
        onClick={() => { toast.dismiss(toastId); onCancel(); }}
        style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', cursor: 'pointer' }}
      >
        إلغاء
      </button>
    </div>
  </div>
);

const BookDetailsClient = ({ initialBook }) => {
  const { toggleFavorite, isFavorite } = useContext(FavoritesContext);
  const { isLoggedIn, user, session, setUser } = useContext(AuthContext);
  const [book, setBook] = useState(initialBook);
  const [isInReadingList, setIsInReadingList] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [bookComments, setBookComments] = useState([]);
  const [isCommentBoxExpanded, setIsCommentBoxExpanded] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    if (initialBook && initialBook.id) {
      const HISTORY_KEY = 'recentlyViewedBooks';
      let history = [];
      try {
        const storedHistory = localStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
          history = JSON.parse(storedHistory);
        }
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
        // Clear corrupted history
        history = [];
      }

      // Remove current book ID if it already exists to move it to the top
      history = history.filter(id => id !== initialBook.id);

      // Add current book ID to the beginning
      history.unshift(initialBook.id);

      // Limit history to a certain number of items (e.g., 10)
      const MAX_HISTORY_ITEMS = 100;
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }

      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch (e) {
        console.error("Failed to save history to localStorage", e);
      }
    }
  }, [initialBook]);

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
    if (hasMounted && user) {
      const currentReadingList = Array.isArray(user?.readingList) ? user.readingList : [];
      const item = currentReadingList.find(item => item.book === initialBook.id);
      if (item) {
        setIsInReadingList(true);
        setIsRead(item.read);
      } else {
        setIsInReadingList(false);
        setIsRead(false);
      }
    } else if (hasMounted && !user) {
      setIsInReadingList(false);
      setIsRead(false);
    }
  }, [user, initialBook.id, hasMounted, setUser]);

  const handlePublishBook = async () => {
    if (!session) return toast.error('الرجاء تسجيل الدخول مرة أخرى.');
    if (window.confirm("هل أنت متأكد أنك تريد الموافقة على هذا الكتاب ونشره؟")) {
      try {
        const response = await axios.patch(`${API_URL}/api/books/${book.id}/approve`, {}, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.status === 200) {
          toast.success('تم نشر الكتاب بنجاح!');
          router.push('/admin/books');
        } else {
          toast.error('فشل نشر الكتاب.');
        }
      } catch (error) {
        console.error('Error publishing book:', error);
        toast.error('حدث خطأ أثناء نشر الكتاب.');
      }
    }
  };

  const handleRemoveBook = async () => {
    if (!session) return toast.error('الرجاء تسجيل الدخول مرة أخرى.');
    if (window.confirm("هل أنت متأكد أنك تريد إزالة هذا الكتاب؟")) {
      try {
        const response = await axios.delete(`${API_URL}/api/books/${book.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.status === 200) {
          toast.success('تمت إزالة الكتاب بنجاح!');
          router.push('/admin/books');
        } else {
          toast.error('فشل إزالة الكتاب.');
        }
      } catch (error) {
        console.error('Error removing book:', error);
        toast.error('حدث خطأ أثناء إزالة الكتاب.');
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (isProcessingAction) return;
    if (!user) {
      toast.error('الرجاء تسجيل الدخول لإضافة الكتاب إلى المفضلة');
      return;
    }
    setIsProcessingAction(true);
    const currentlyLiked = isFavorite(book.id);
    const originalCount = book?.favoritecount ?? 0;
    setBook(prevBook => ({
      ...prevBook,
      favoritecount: currentlyLiked
        ? Math.max(originalCount - 1, 0)
        : originalCount + 1,
    }));
    try {
      // The context handles the API call and its own toast notifications.
      const updatedFavoriteCount = await toggleFavorite(initialBook.id);
      if (typeof updatedFavoriteCount === 'number') {
        setBook(prevBook => ({ ...prevBook, favoritecount: updatedFavoriteCount }));
      }
    } catch (error) {
      console.error('خطأ في تحديث المفضلة:', error);
      // Rollback the optimistic UI update if the context API call fails.
      setBook(prevBook => ({ ...prevBook, favoritecount: originalCount }));
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleAddToReadingList = async () => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    if (!user) {
      // For guests, just open the book and don't do anything else.
      handleReadBook();
      setIsProcessingAction(false);
      return;
    }
    if (isInReadingList) {
      toast.info('الكتاب موجود بالفعل في قائمة القراءة.');
      setIsProcessingAction(false);
      return;
    }
    try {
      const response = await fetch(`/api/users/${user.id}/reading-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: initialBook.id }),
      });
      if (response.ok) {
        setIsInReadingList(true);
        toast.success('تمت إضافة الكتاب إلى قائمة القراءة بنجاح!');
        if (user && user.readingList) {
          setUser(prevUser => ({
            ...prevUser,
            readingList: [
              ...prevUser.readingList,
              {
                book: initialBook.id,
                read: false,
                progress: { page: 1, percentage: 0, updatedAt: new Date().toISOString() }
              }
            ]
          }));
        }
        // Also open the book for the logged-in user
        handleReadBook();
      } else {
        const errorData = await response.json();
        toast.error(`فشل في إضافة الكتاب إلى قائمة القراءة: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('خطأ في إضافة الكتاب إلى قائمة القراءة:', error);
      toast.error('حدث خطأ أثناء إضافة الكتاب إلى قائمة القراءة.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRemoveFromReadingList = async () => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    if (!user) {
      toast.error('الرجاء تسجيل الدخول لإزالة الكتاب من قائمة القراءة');
      setIsProcessingAction(false);
      return;
    }
    try {
      const response = await fetch(`/api/users/${user.id}/reading-list/${initialBook.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setIsInReadingList(false);
        setIsRead(false);
        toast.success('تمت إزالة الكتاب من قائمة القراءة بنجاح!');
        if (user && user.readingList) {
          setUser(prevUser => ({ ...prevUser, readingList: prevUser.readingList.filter(item => item.book !== initialBook.id) }));
        }
      } else {
        const errorData = await response.json();
        toast.error(`فشل في إزالة الكتاب من قائمة القراءة: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('خطأ في إزالة الكتاب من قائمة القراءة:', error);
      toast.error('حدث خطأ أثناء إزالة الكتاب من قائمة القراءة.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleMarkAsReadInList = async () => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    if (!user) {
      toast.error('الرجاء تسجيل الدخول لتحديث حالة الكتاب.');
      setIsProcessingAction(false);
      return;
    }
    try {
      const response = await fetch(`/api/users/${user.id}/reading-list/${initialBook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      if (response.ok) {
        setIsRead(true);
        toast.success('تم وضع علامة "مقروء" على الكتاب في قائمة القراءة!');
        // Update user context readingList
        if (user && user.readingList) {
          setUser(prevUser => ({
            ...prevUser,
            readingList: prevUser.readingList.map(item =>
              item.book === initialBook.id ? { ...item, read: true } : item
            ),
          }));
        }
      } else {
        const errorData = await response.json();
        toast.error(`فشل تحديث حالة الكتاب: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الكتاب:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الكتاب.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handlePostComment = async () => {
    if (!isLoggedIn || !user || !session) {
      toast.error("يجب تسجيل الدخول لنشر تعليق.");
      return;
    }
    if (!commentText.trim()) {
      toast.error("لا يمكن نشر تعليق.");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/books/${book.id}/comments`, { text: commentText }, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setBookComments([...bookComments, res.data]);
      setCommentText('');
      setIsCommentBoxExpanded(false);
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
    const confirmDelete = new Promise((resolve, reject) => {
      toast.warn(
        ({ toastProps }) => (
          <ConfirmationToast
            message="هل أنت متأكد أنك تريد حذف هذا التعليق؟"
            toastId={toastProps.id}
            onConfirm={() => resolve(true)}
            onCancel={() => reject(false)}
          />
        ),
        { autoClose: false, closeButton: false, closeOnClick: false, draggable: false }
      );
    });
    try {
      await confirmDelete;
      await axios.delete(`${API_URL}/api/books/${book.id}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setBookComments(bookComments.filter(comment => comment.id !== commentId));
      toast.success("تم حذف التعليق بنجاح!");
    } catch (err) {
      if (err === false) {
        toast.info("تم إلغاء حذف التعليق.");
      } else {
        console.error("Error deleting comment:", err);
        toast.error(err.response?.data?.message || "فشل حذف التعليق.");
      }
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
      toast.success(res.data.liked ? 'تم الإعجاب بالتعليق!' : 'تم إلغاء الإعجاب بالتعليق!');
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error(err.response?.data?.message || "فشل الإعجاب بالتعليق.");
    }
  };

  const handleReadBook = async () => {
    if (!book || !book.pdfFile) {
      toast.error('ملف الكتاب غير متوفر للقراءة.');
      return;
    }

    router.push(`/read/${book.id}`);

    if (!session?.access_token) {
      return;
    }

    try {
      const response = await axios.patch(
        `${API_URL}/api/books/${book.id}/increment-readcount`,
        {},
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      if (response.status === 200 && typeof response.data?.readcount === 'number') {
        setBook(prevBook => ({
          ...prevBook,
          readcount: response.data.readcount,
        }));
      } else if (response.status !== 200) {
        console.error('Failed to increment readcount:', response.statusText);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error('Error incrementing readcount:', error);
      }
    }
  };

  const isLiked = hasMounted ? isFavorite(book.id) : false;

  return (
    <article className="book-details-page-container">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="breadcrumb-nav" style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        <a href="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>الرئيسية</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{book.title}</span>
      </nav>

      <div className="book-details-layout">
        <aside className="left-column">
          <Image
            src={book.cover}
            alt={`غلاف كتاب ${book.title}`}
            width={300}
            height={450}
            className="book-cover-image"
            priority
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/imgs/no_cover_available.png"; }}
          />
          <div className="cover-meta-info">
            <div className="meta-stat">
              <span className="meta-stat-value">{book.publishYear || 'N/A'}</span>
              <span className="meta-stat-label">سنة التأليف</span>
            </div>
            <div className="meta-stat">
              <span className="meta-stat-value">{book.readcount || 0}</span>
              <span className="meta-stat-label">قرأوه</span>
            </div>
            <div className="meta-stat">
              <span className="meta-stat-value">{book.favoritecount || 0}</span>
              <span className="meta-stat-label">المفضلة</span>
            </div>
          </div>
        </aside>

        <section className="right-column">
          <h1 className="book-title">{book.title}</h1>
          <h2 className="book-author">بواسطة {book.author}</h2>
          <ul className="book-meta-list">
            <li className="book-meta-item"><strong>التصنيف:</strong> {book.category}</li>
            <li className="book-meta-item"><strong>عدد الصفحات:</strong> {book.pages}</li>
            <li className="book-meta-item"><strong>اللغة:</strong> {book.language}</li>
          </ul>

          {hasMounted && (
            <div className="book-actions">
              {user?.role === 'admin' && book.status === 'pending' && (
                <div className="admin-actions">
                  <button onClick={() => router.push(`/admin/books/edit/${initialBook.id}`)} className="book-action-button primary">تعديل الكتاب</button>
                  <button onClick={handlePublishBook} className="book-action-button primary">رفع الكتاب على العامه</button>
                  <button onClick={handleRemoveBook} className="book-action-button secondary">إزالة الكتاب</button>
                  <button onClick={handleReadBook} className="book-action-button primary">قراءة الكتاب</button>
                </div>
              )}
              {(!book.status || book.status !== 'pending') && (
                <>
                  {!isInReadingList && (<button onClick={handleAddToReadingList} className="book-action-button primary" disabled={isProcessingAction}>ابدأ القراءة</button>)}
                  {isInReadingList && (<button onClick={handleReadBook} className="book-action-button primary" disabled={isProcessingAction}>متابعة القراءة</button>)}
                  <a href={`/api/download?fileUrl=${encodeURIComponent(book.pdfFile)}`} className="book-action-button primary">تنزيل الكتاب</a>
                  {isInReadingList && !isRead && (<button onClick={handleMarkAsReadInList} className="book-action-button primary" disabled={isProcessingAction}>وضع علامة &quot;مقروء&quot;</button>)}
                  {isInReadingList && (<button onClick={handleRemoveFromReadingList} className="book-action-button secondary full-width-button" disabled={isProcessingAction}>إزالة من قائمة القراءة</button>)}
                  <button onClick={handleToggleFavorite} className="book-action-button secondary" disabled={isProcessingAction}>{isLiked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}</button>
                </>
              )}
            </div>
          )}

          <div>
            <h3 className="book-description-title">الوصف</h3>
            <p className="book-description-text">{book.description}</p>
          </div>
        </section>
      </div>

      {hasMounted && (
        <section className="comments-section">
          <h2 className="comments-title">التعليقات والمراجعات</h2>
          {isLoggedIn ? (
            <div className="comment-input-area">
              <Image src={user?.profile_picture || '/imgs/user.jpg'} alt="صورتك الشخصية" width={45} height={45} className="comment-user-avatar" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==" unoptimized />
              <div className="comment-input-box">
                <textarea placeholder="أضف تعليقًا..." value={commentText} onFocus={() => setIsCommentBoxExpanded(true)} onChange={(e) => setCommentText(e.target.value)} className={`comment-textarea ${isCommentBoxExpanded ? 'expanded' : ''}`}></textarea>
                {isCommentBoxExpanded && (
                  <div className="comment-buttons">
                    <button onClick={() => { setIsCommentBoxExpanded(false); setCommentText(''); }} className="comment-cancel-button">إلغاء</button>
                    <button onClick={handlePostComment} className="comment-post-button">نشر</button>
                  </div>
                )}
              </div>
            </div>
          ) : (<p>يجب تسجيل الدخول لكتابة تعليق.</p>)}

          <div className="comments-list">
            {bookComments.length > 0 ? (
              bookComments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <Image src={comment.profiles?.profilepicture && (comment.profiles.profilepicture !== 'Untitled.jpg' && comment.profiles.profilepicture !== 'user.jpg') ? comment.profiles.profilepicture : '/imgs/user.jpg'} alt={`صورة ملف ${comment.profiles?.username || 'مستخدم غير معروف'}`} width={45} height={45} className="comment-user-avatar" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==" unoptimized onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/user.jpg'; }} />
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-username">{comment.profiles?.username || 'مستخدم غير معروف'}</span>
                      <ClientOnlyDate dateString={comment.created_at} />
                    </div>
                    <p className="comment-text">{comment.text}</p>
                    <div className="comment-actions">
                      <span onClick={() => handleToggleLike(comment.id)} className={`comment-like-button ${comment.userLiked ? 'liked' : ''}`}>
                        <span className="like-icon" dangerouslySetInnerHTML={{ __html: comment.userLiked ? '&#x2764;' : '♡' }} /> {comment.likes}
                      </span>
                      {(isLoggedIn && user && (user.id === comment.user_id || user.role === 'admin')) && (<button onClick={() => handleDeleteComment(comment.id)} className="comment-delete-button" title="حذف التعليق"><FaTrash /></button>)}
                    </div>
                  </div>
                </div>
              ))
            ) : (<p>لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>)}
          </div>
        </section>
      )}

      {book.status === 'pending' && book.profiles && (
        <section className="suggester-info-section">
          <h2 className="suggester-info-title">معلومات المقترح</h2>
          <p><strong>اسم المستخدم:</strong> {book.profiles.username}</p>
          <p><strong>البريد الإلكتروني:</strong> {book.profiles.email}</p>
        </section>
      )}

      {/* {initialBook.relatedBooks && initialBook.relatedBooks.length > 0 && (
        <div className="related-books-section">
          <h2 className="related-books-title">كتب ذات صلة</h2>
          <div className="related-books-grid">
            {initialBook.relatedBooks.map(relatedBook => (
              <BookCard key={relatedBook.id} book={relatedBook} />
            ))}
          </div>
        </div>
      )} */}
    </article>
  );
};

export default BookDetailsClient;
