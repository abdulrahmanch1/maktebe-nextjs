'use client';

import React, { useContext, useEffect, useState, useCallback } from "react";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from 'react-toastify';
import Image from "next/image";
import { API_URL } from "@/constants";
import './BookDetailsPage.css';
import { FaTrash } from 'react-icons/fa';
import { useRouter } from "next/navigation"; // Import useRouter

// A small component to safely render dates only on the client-side
const ClientOnlyDate = ({ dateString }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This effect runs only on the client, after hydration
    setFormattedDate(new Date(dateString).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, [dateString]);

  return <span className="comment-date">{formattedDate}</span>;
};

// Custom Confirmation Toast Component
const ConfirmationToast = ({ message, toastId, onConfirm, onCancel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
    <div>{message}</div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
      <button
        onClick={() => {
          toast.dismiss(toastId);
          onConfirm();
        }}
        style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--accent-color)', color: 'var(--primary-color)', cursor: 'pointer' }}
      >
        نعم
      </button>
      <button
        onClick={() => {
          toast.dismiss(toastId);
          onCancel();
        }}
        style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)', cursor: 'pointer' }}
      >
        إلغاء
      </button>
    </div>
  </div>
);

const BookDetailsClient = ({ initialBook }) => {
  const { toggleFavorite, isFavorite } = useContext(FavoritesContext);
  const { isLoggedIn, user, session, setUser, refreshUserProfile } = useContext(AuthContext);
  const [book, setBook] = useState(initialBook);
  const [isInReadingList, setIsInReadingList] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false); // New state for action processing
  const router = useRouter(); // Initialize useRouter

  const handlePublishBook = async () => {
    if (!session) return toast.error('الرجاء تسجيل الدخول مرة أخرى.');
    if (window.confirm("هل أنت متأكد أنك تريد الموافقة على هذا الكتاب ونشره؟")) {
      try {
        // Assuming an API endpoint for publishing books
        const response = await axios.post(`${API_URL}/api/books/${book.id}/approve`, {}, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.status === 200) {
          toast.success('تم نشر الكتاب بنجاح!');
          router.push('/admin/books'); // Redirect to admin books list
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
        // Assuming an API endpoint for removing books
        const response = await axios.delete(`${API_URL}/api/books/${book.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.status === 200) {
          toast.success('تمت إزالة الكتاب بنجاح!');
          router.push('/admin/books'); // Redirect to admin books list
        } else {
          toast.error('فشل إزالة الكتاب.');
        }
      } catch (error) {
        console.error('Error removing book:', error);
        toast.error('حدث خطأ أثناء إزالة الكتاب.');
      }
    }
  };

  

  

  // Function to re-fetch book details
  const fetchBookDetails = useCallback(async () => {
    if (!book || !book.id) { // Add this check
      console.warn("Book or Book ID is not available for fetching details.");
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/books/${book.id}`); // Assuming this API exists and returns full book details
      setBook(res.data);
    } catch (error) {
      console.error("Error re-fetching book details:", error);
      toast.error("فشل تحديث تفاصيل الكتاب.");
    }
  }, [book]);
  const [commentText, setCommentText] = useState('');
  const [bookComments, setBookComments] = useState([]);
  const [isCommentBoxExpanded, setIsCommentBoxExpanded] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    } else if (hasMounted && !user) { // Reset state if user logs out
      setIsInReadingList(false);
      setIsRead(false);
    }
  }, [user, initialBook.id, hasMounted, setUser]); // Added setUser to dependency array

  const handleToggleFavorite = async () => {
    if (isProcessingAction) return; // Prevent multiple clicks
    setIsProcessingAction(true); // Set processing state

    if (!user) {
      toast.error('الرجاء تسجيل الدخول لإضافة الكتاب إلى المفضلة');
      setIsProcessingAction(false); // Reset processing state
      return;
    }

    try {
      await toggleFavorite(initialBook.id); // Await toggleFavorite to ensure API call completes
      fetchBookDetails(); // Call to refresh book details to update favoritecount
      toast.success(isLiked ? 'تمت إزالة الكتاب من المفضلة!' : 'تمت إضافة الكتاب إلى المفضلة بنجاح!');
    } catch (error) {
      console.error('خطأ في تحديث المفضلة:', error);
      toast.error('حدث خطأ أثناء تحديث المفضلة.'); // Keep this error toast for network/other errors
    } finally {
      setIsProcessingAction(false); // Always reset processing state
    }
  };

  const handleAddToReadingList = async () => {
    if (isProcessingAction) return; // Prevent multiple clicks
    setIsProcessingAction(true); // Set processing state

    if (!user) {
      toast.error('الرجاء تسجيل الدخول لإضافة الكتاب إلى قائمة القراءة');
      setIsProcessingAction(false); // Reset processing state
      return;
    }
    if (isInReadingList) { // If already in reading list, do nothing or show a message
      toast.info('الكتاب موجود بالفعل في قائمة القراءة.');
      setIsProcessingAction(false); // Reset processing state
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}/reading-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId: initialBook.id }),
      });

      if (response.ok) {
        setIsInReadingList(true);
        toast.success('تمت إضافة الكتاب إلى قائمة القراءة بنجاح!');
        // Optionally, update user's readingList in AuthContext if available
        if (user && user.readingList) {
          setUser(prevUser => ({
            ...prevUser,
            readingList: [...prevUser.readingList, { book: initialBook.id, read: false }]
          }));
        }
        fetchBookDetails(); // Call to refresh book details
      } else {
        const errorData = await response.json();
        toast.error(`فشل في إضافة الكتاب إلى قائمة القراءة: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('خطأ في إضافة الكتاب إلى قائمة القراءة:', error);
      toast.error('حدث خطأ أثناء إضافة الكتاب إلى قائمة القراءة.');
    } finally {
      setIsProcessingAction(false); // Always reset processing state
    }
  };

  const handleRemoveFromReadingList = async () => {
    if (isProcessingAction) return; // Prevent multiple clicks
    setIsProcessingAction(true); // Set processing state

    if (!user) {
      toast.error('الرجاء تسجيل الدخول لإزالة الكتاب من قائمة القراءة');
      setIsProcessingAction(false); // Reset processing state
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}/reading-list/${initialBook.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsInReadingList(false);
        setIsRead(false); // Reset isRead when removed
        toast.success('تمت إزالة الكتاب من قائمة القراءة بنجاح!');
        // Optionally, update user's readingList in AuthContext if available
        if (user && user.readingList) {
          setUser(prevUser => ({
            ...prevUser,
            readingList: prevUser.readingList.filter(item => item.book !== initialBook.id)
          }));
        }
        fetchBookDetails(); // Call to refresh book details
      } else {
        const errorData = await response.json();
        toast.error(`فشل في إزالة الكتاب من قائمة القراءة: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('خطأ في إزالة الكتاب من قائمة القراءة:', error);
      toast.error('حدث خطأ أثناء إزالة الكتاب من قائمة القراءة.');
    } finally {
      setIsProcessingAction(false); // Always reset processing state
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
        {
          autoClose: false,
          closeButton: false,
          closeOnClick: false,
          draggable: false,
        }
      );
    });

    try {
      await confirmDelete; // Wait for user confirmation
      // If confirmed, proceed with deletion
      await axios.delete(`${API_URL}/api/books/${book.id}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setBookComments(bookComments.filter(comment => comment.id !== commentId));
      toast.success("تم حذف التعليق بنجاح!");
    } catch (err) {
      if (err === false) { // User cancelled
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

  const isLiked = hasMounted ? isFavorite(book.id) : false;

  return (
    <div className="book-details-page-container">
      <div className="book-details-layout">
        <div className="left-column">
          <Image
            src={book.cover}
            alt={`غلاف كتاب ${book.title}`}
            width={300}
            height={450}
            className="book-cover-image"
            priority
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/imgs/no_cover_available.png";
            }}
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
        </div>

        <div className="right-column">
          <h1 className="book-title">{book.title}</h1>
          <h2 className="book-author">بواسطة {book.author}</h2>
          
          <ul className="book-meta-list">
            <li className="book-meta-item"><strong>التصنيف:</strong> {book.category}</li>
            <li className="book-meta-item"><strong>عدد الصفحات:</strong> {book.pages}</li>
            <li className="book-meta-item"><strong>اللغة:</strong> {book.language}</li>
          </ul>

          {hasMounted && (
            <div className="book-actions">
              {/* Admin actions for pending books */}
              {user?.role === 'admin' && book.status === 'pending' && (
                <div className="admin-actions">
                  {console.log('Admin actions block is rendering!')} {/* New log */}
                  <button onClick={() => router.push(`/admin/books/edit/${book.id}`)} className="book-action-button primary">
                    تعديل الكتاب
                  </button>
                  <button onClick={handlePublishBook} className="book-action-button primary">
                    رفع الكتاب على العامه
                  </button>
                  <button onClick={handleRemoveBook} className="book-action-button secondary">
                    إزالة الكتاب
                  </button>
                  <button onClick={() => {
                    if (book && book.pdfFile) {
                      window.open(book.pdfFile, '_blank');
                    } else {
                      toast.error('ملف الكتاب غير متوفر للقراءة.');
                    }
                  }} className="book-action-button primary">
                    قراءة الكتاب
                  </button>
                </div>
              )}

              {/* User actions for non-pending books */}
              {(!book.status || book.status !== 'pending') && (
                <>
                  {!isInReadingList && (
                    <button onClick={handleAddToReadingList} className="book-action-button primary" disabled={isProcessingAction}>
                      ابدأ القراءة
                    </button>
                  )}
                  {isInReadingList && (
                    <button onClick={() => {
                      if (book && book.pdfFile) {
                        window.open(book.pdfFile, '_blank');
                      } else {
                        toast.error('ملف الكتاب غير متوفر للقراءة.');
                      }
                    }} className="book-action-button primary" disabled={isProcessingAction}>
                      متابعة القراءة
                    </button>
                  )}
                  {isInReadingList && (
                    <button onClick={handleRemoveFromReadingList} className="book-action-button secondary full-width-button" disabled={isProcessingAction}>
                      إزالة من قائمة القراءة
                    </button>
                  )}
                  <button onClick={handleToggleFavorite} className="book-action-button secondary" disabled={isProcessingAction}>
                    {isLiked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                  </button>
                </>
              )}
            </div>
          )}

          <div>
            <h3 className="book-description-title">الوصف</h3>
            <p className="book-description-text">{book.description}</p>
          </div>
        </div>
      </div>

      {hasMounted && (
        <div className="comments-section">
          <h2 className="comments-title">التعليقات والمراجعات</h2>
          
          {isLoggedIn ? (
            <div className="comment-input-area">
              <Image 
                src={user?.profile_picture || '/imgs/user.jpg'} 
                alt="صورتك الشخصية" 
                width={45} 
                height={45} 
                className="comment-user-avatar"
                unoptimized
              />
              <div className="comment-input-box">
                <textarea
                  placeholder="أضف تعليقًا..."
                  value={commentText}
                  onFocus={() => setIsCommentBoxExpanded(true)}
                  onChange={(e) => setCommentText(e.target.value)}
                  className={`comment-textarea ${isCommentBoxExpanded ? 'expanded' : ''}`}
                ></textarea>
                {isCommentBoxExpanded && (
                  <div className="comment-buttons">
                    <button onClick={() => {
                      setIsCommentBoxExpanded(false);
                      setCommentText('');
                    }} className="comment-cancel-button">إلغاء</button>
                    <button onClick={handlePostComment} className="comment-post-button">نشر</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p>يجب تسجيل الدخول لكتابة تعليق.</p>
          )}

          <div className="comments-list">
            {bookComments.length > 0 ? (
              bookComments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <Image
                    src={comment.profiles?.profilepicture && (comment.profiles.profilepicture !== 'Untitled.jpg' && comment.profiles.profilepicture !== 'user.jpg') ? comment.profiles.profilepicture : '/imgs/user.jpg'}
                    alt={`صورة ملف ${comment.profiles?.username || 'مستخدم غير معروف'}`}
                    width={45} 
                    height={45} 
                    className="comment-user-avatar"
                    unoptimized
                    onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/user.jpg'; }}
                  />
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-username">{comment.profiles?.username || 'مستخدم غير معروف'}</span>
                      <ClientOnlyDate dateString={comment.created_at} />
                    </div>
                    <p className="comment-text">{comment.text}</p>
                    <div className="comment-actions">
                      <span onClick={() => handleToggleLike(comment.id)} className={`comment-like-button ${comment.userLiked ? 'liked' : ''}`}>
                        <span className="like-icon">{comment.userLiked ? '❤️' : '♡'}</span> {comment.likes}
                      </span>
                      {(isLoggedIn && user && (user.id === comment.user_id || user.role === 'admin')) && (
                        <button onClick={() => handleDeleteComment(comment.id)} className="comment-delete-button" title="حذف التعليق">
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>
            )}
          </div>
        </div>
      )}

      {book.status === 'pending' && book.profiles && (
        <div className="suggester-info-section">
          <h2 className="suggester-info-title">معلومات المقترح</h2>
          <p><strong>اسم المستخدم:</strong> {book.profiles.username}</p>
          <p><strong>البريد الإلكتروني:</strong> {book.profiles.email}</p>
        </div>
      )}
    </div>
  );
};

export default BookDetailsClient;
