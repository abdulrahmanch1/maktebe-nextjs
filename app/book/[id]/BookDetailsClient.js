'use client';

import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { AuthContext } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";
import axios from "axios";
import { toast } from 'react-toastify';
import Image from "next/image";
import { API_URL } from "@/constants";
import './BookDetailsPage.css';
import { FaTrash, FaShare, FaExclamationTriangle, FaWhatsapp, FaFacebook, FaTwitter, FaTelegram, FaCopy } from 'react-icons/fa';
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookCard from "@/components/BookCard";
import DownloadButton from "@/components/DownloadButton";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getStorageUrl } from "@/utils/imageUtils";
import dynamic from 'next/dynamic';

const BookNoteModal = dynamic(() => import('@/components/BookNoteModal'), { ssr: false });
const ShareModal = dynamic(() => import('@/components/ShareModal'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/ReportModal'), { ssr: false });
import { FaPlus, FaStickyNote } from 'react-icons/fa';
import { getNoteColor } from "@/utils/colors";
import Breadcrumbs from '@/components/Breadcrumbs';


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

// Helper function to determine profile picture source
const getProfilePictureSrc = (profilePicture) => {
  if (profilePicture && profilePicture.trim() !== '' && profilePicture !== 'Untitled.jpg' && profilePicture !== 'user.jpg') {
    return profilePicture;
  }
  return '/imgs/user.jpg';
};

// Helper function to format numbers (e.g., 1000 -> 1أ)
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'م';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'أ';
  }
  return num.toString();
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

const reportReasons = [
  { value: 'spam', label: 'محتوى إعلاني/مزعج' },
  { value: 'broken', label: 'رابط التحميل أو القراءة لا يعمل' },
  { value: 'missing', label: 'صفحات ناقصة أو ملف تالف' },
  { value: 'wrong_info', label: 'معلومات خاطئة (عنوان/مؤلف/تصنيف)' },
  { value: 'copyright', label: 'مشكلة حقوق نشر' },
  { value: 'inappropriate', label: 'محتوى غير لائق' },
  { value: 'other', label: 'سبب آخر' },
];



const BookDetailsClient = ({ initialBook }) => {
  const { toggleFavorite, isFavorite } = useContext(FavoritesContext);
  const { isLoggedIn, user, session, setUser } = useContext(AuthContext);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [book, setBook] = useState(initialBook);
  const [coverSrc, setCoverSrc] = useState(getStorageUrl(initialBook.cover, 'book-covers') || '/imgs/no_cover_available.png');
  const [isInReadingList, setIsInReadingList] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [bookComments, setBookComments] = useState([]);
  const [isCommentBoxExpanded, setIsCommentBoxExpanded] = useState(false);
  const { trackBookView, trackBookRead } = useAnalytics();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Track book view on mount
  useEffect(() => {
    if (initialBook?.id) {
      trackBookView(initialBook.id, {
        title: initialBook.title,
        author: initialBook.author,
      });
    }
  }, [initialBook?.id, initialBook.title, initialBook.author, trackBookView]);

  useEffect(() => {
    setHasMounted(true);

    if (user && initialBook?.id) {
      const supabase = axios.create(); // Placeholder, actually we use global supabase client or fetch
      // But we have `session` from context which has token.
      // Supabase client is better.
      // Let's use simple fetch to Supabase direct or assume createClient usage.
      // Since I imported createClient in Modal but not here, I should probably use `createBrowserClient` or just use the passed `supabase` from context if available?
      // AuthContext exposes `supabase`? No, it exposes `user` and `session`.
      // I'll use a direct select via REST or just assume I can add the fetch here.

      // Actually, I'll fetch it using the `API_URL` / rest or better, import `createClient`.
    }


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

  // Note Logic
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [userNote, setUserNote] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchNote = async () => {
      if (user && initialBook?.id) {
        const { data } = await supabase
          .from('book_notes')
          .select('note')
          .eq('book_id', initialBook.id)
          .eq('user_id', user.id)
          .single();
        if (data) setUserNote(data.note);
      }
    };
    fetchNote();
  }, [user, initialBook?.id]);

  useEffect(() => {
    setCoverSrc(getStorageUrl(book?.cover, 'book-covers') || '/imgs/no_cover_available.png');
  }, [book?.cover]);

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



  const handleSaveNote = async (noteText) => {
    if (!user) return;
    try {
      const supabase = createClient();
      if (!userNote) {
        // Create new note
        const { error } = await supabase
          .from('user_book_notes')
          .insert({
            user_id: user.id,
            book_id: book.id,
            note: noteText,
            color: '#fbf8cc' // Default color
          });
        if (error) throw error;
        toast.success("تم حفظ الملاحظة بنجاح!");
      } else {
        // Update existing note
        const { error } = await supabase
          .from('user_book_notes')
          .update({ note: noteText })
          .eq('user_id', user.id)
          .eq('book_id', book.id);
        if (error) throw error;
        toast.success("تم تحديث الملاحظة بنجاح!");
      }
      setUserNote(noteText);
      setIsNoteModalOpen(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("حدث خطأ أثناء حفظ الملاحظة.");
    }
  };

  const handleDeleteNote = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_book_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', book.id);

      if (error) throw error;
      setUserNote(null);
      setIsNoteModalOpen(false);
      toast.success("تم حذف الملاحظة بنجاح.");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("حدث خطأ أثناء حذف الملاحظة.");
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

  const handleShareBook = async () => {
    setIsShareModalOpen(true);
  };

  const handleReportBook = async (reason, details) => {
    if (!isLoggedIn) {
      toast.error('يجب تسجيل الدخول للإبلاغ عن كتاب.');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/contact`, {
        subject: `بلاغ عن كتاب: ${book.title}`,
        message: `الكتاب: ${book.title}\nالمؤلف: ${book.author}\nالسبب: ${reportReasons.find(r => r.value === reason)?.label || reason}\nالتفاصيل: ${details || 'لا يوجد'}\nمعرّف الكتاب: ${book.id}`,
        email: user?.email || 'guest@dar-alquraa.com',
        username: user?.username || user?.user_metadata?.username || 'مستخدم',
      });
      toast.success('تم إرسال البلاغ بنجاح. شكراً لمساعدتك!');
      setIsReportModalOpen(false);
    } catch (err) {
      console.error('Error reporting book:', err);
      toast.error('فشل إرسال البلاغ.');
    }
  };

  const isLiked = hasMounted ? isFavorite(book.id) : false;

  return (
    <article className="book-details-page-container">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: book.category || 'الكتب', href: `/?category=${encodeURIComponent(book.category || '')}` },
        { label: book.title }
      ]} />

      <div className="book-details-layout">
        <aside className="left-column">
          <div className="cover-card">
            <Image
              src={coverSrc}
              alt={`غلاف كتاب ${book.title}`}
              width={400}
              height={600}
              className="book-cover-image"
              priority
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
              onError={() => setCoverSrc('/imgs/no_cover_available.png')}
              unoptimized
            />
            <div className="cover-actions floating-actions">
              <button onClick={handleShareBook} className="icon-button share-button" title="مشاركة الكتاب">
                <FaShare />
              </button>
              <button onClick={() => setIsReportModalOpen(true)} className="icon-button report-button" title="الإبلاغ عن الكتاب">
                <FaExclamationTriangle />
              </button>
            </div>

            {/* Note Interaction Overlay */}
            {user && (
              <div
                className="note-overlay-container"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none', // Allow clicks to pass through to image/share icons unless on note
                  zIndex: 4
                }}
              >
                {!userNote ? (
                  <button
                    onClick={() => setIsNoteModalOpen(true)}
                    className="icon-button add-note-btn"
                    title="إضافة ملاحظة"
                  >
                    <FaPlus size={14} />
                  </button>
                ) : (
                  <div
                    onClick={() => setIsNoteModalOpen(true)}
                    className="note-indicator-overlay full-width"
                    title="انقر لتعديل الملاحظة"
                    style={{
                      backgroundColor: getNoteColor(userNote),
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      width: '100%',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      // Reuse styling from BookCard.css if possible, or inline similar styles
                      color: '#333',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      borderBottomLeftRadius: '12px',
                      borderBottomRightRadius: '12px',
                      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                      zIndex: 20,
                      textAlign: 'center'
                    }}
                  >
                    <span style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%'
                    }}>
                      {userNote}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="cover-meta-info">
            {/* Note Interaction Overlay */}


            <div className="meta-stat">
              <span className="meta-stat-value">{book.publishYear || 'N/A'}</span>
              <span className="meta-stat-label">سنة التأليف</span>
            </div>
            <div className="meta-stat">
              <span className="meta-stat-value">{formatNumber(book.readcount)}</span>
              <span className="meta-stat-label">قرأوه</span>
            </div>
            <div className="meta-stat">
              <span className="meta-stat-value">{formatNumber(book.favoritecount)}</span>
              <span className="meta-stat-label">المفضلة</span>
            </div>
          </div>
        </aside>

        <section className="right-column">
          <h1 className="details-title">{book.title}</h1>
          <h2 className="details-author">بواسطة {book.author}</h2>
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
                  <DownloadButton book={book} pdfUrl={book.pdfFile} coverUrl={book.cover} />
                  <a href={`/api/download?fileUrl=${encodeURIComponent(book.pdfFile)}`} className="book-action-button primary">تنزيل الملف (PDF)</a>
                  {isInReadingList && !isRead && (<button onClick={handleMarkAsReadInList} className="book-action-button primary" disabled={isProcessingAction}>وضع علامة &quot;مقروء&quot;</button>)}
                  {isInReadingList && (<button onClick={handleRemoveFromReadingList} className="book-action-button secondary" disabled={isProcessingAction}>إزالة من قائمة القراءة</button>)}
                  <button onClick={handleToggleFavorite} className="book-action-button secondary" disabled={isProcessingAction}>{isLiked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}</button>

                </>
              )}
            </div>
          )}

          <BookNoteModal
            isOpen={isNoteModalOpen}
            onClose={() => setIsNoteModalOpen(false)}
            bookId={book.id}
            initialNote={userNote}
            onSave={(newNote) => setUserNote(newNote)}
          />

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
                  <Image
                    src={getProfilePictureSrc(comment.profiles?.profilepicture)}
                    alt={`صورة ملف ${comment.profiles?.username || 'مستخدم غير معروف'}`}
                    width={45}
                    height={45}
                    className="comment-user-avatar"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
                    unoptimized
                    onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/user.jpg'; }}
                  />
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-username">{comment.profiles?.username || 'مستخدم غير معروف'}</span>
                      <ClientOnlyDate dateString={comment.created_at} />
                    </div>
                    <div className="comment-text-with-actions">
                      <p className="comment-text">{comment.text}</p>
                      <div className="comment-actions">
                        {(isLoggedIn && user && (user.id === comment.user_id || user.role === 'admin')) && (<button onClick={() => handleDeleteComment(comment.id)} className="comment-delete-button" title="حذف التعليق"><FaTrash /></button>)}
                        <span onClick={() => handleToggleLike(comment.id)} className={`comment-like-button ${comment.userLiked ? 'liked' : ''}`}>
                          <span className="like-icon">{comment.userLiked ? '❤' : '♡'}</span> {comment.likes}
                        </span>
                      </div>
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

      {initialBook.relatedBooks && initialBook.relatedBooks.length > 0 && (
        <div className="related-books-section">
          <h2 className="related-books-title">كتب ذات صلة</h2>
          <div className="related-books-grid">
            {initialBook.relatedBooks.map(relatedBook => (
              <BookCard key={relatedBook.id} book={relatedBook} />
            ))}
          </div>
        </div>
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        bookTitle={book.title}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportBook}
      />

      <BookNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        bookId={book.id}
        initialNote={userNote}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />
    </article>
  );
};

export default BookDetailsClient;
