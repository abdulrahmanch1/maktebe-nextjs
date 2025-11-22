'use client';
import React, { useContext, useState, useMemo } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import useFetch from "@/hooks/useFetch";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import './ContactMessagesPage.css';

const ContactMessagesPage = () => {
  const { theme } = useContext(ThemeContext);
  const { user, session, isLoggedIn } = useContext(AuthContext);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const authHeaders = useMemo(() => {
    if (!session?.access_token) return undefined;
    return { headers: { Authorization: `Bearer ${session.access_token}` } };
  }, [session?.access_token]);

  const { data: contactMessages, loading: messagesLoading, error: messagesError } = useFetch(
    session?.access_token ? `${API_URL}/api/contact/messages` : null,
    authHeaders,
    [refreshTrigger, session?.access_token]
  );

  const handleDeleteMessage = async (id) => {
    if (!session?.access_token) return toast.error('الرجاء تسجيل الدخول مرة أخرى.');
    try {
      await axios.delete(`${API_URL}/api/contact/messages/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      toast.success("تم حذف الرسالة بنجاح!");
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error(error.response?.data?.message || "فشل حذف الرسالة.");
    }
  };

  const getMessageType = (subject) => {
    if (subject.includes('[AI-SPY]')) return 'ai-spy';
    if (subject.includes('[BOOK-REQUEST]')) return 'book-request';
    if (subject.includes('AI Assistant')) return 'user-report';
    return 'normal';
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'ai-spy': return '🕵️‍♂️';
      case 'book-request': return '📚';
      case 'user-report': return '🤖';
      default: return '✉️';
    }
  };

  const getMessageLabel = (type) => {
    switch (type) {
      case 'ai-spy': return 'تقرير الجاسوس الأبيض';
      case 'book-request': return 'طلب كتاب';
      case 'user-report': return 'بلاغ مستخدم';
      default: return 'رسالة عادية';
    }
  };

  const isUserRegistered = (message) => {
    return message.user_id && message.user_id !== null;
  };

  const getUserInitial = (username) => {
    return username ? username.charAt(0).toUpperCase() : '؟';
  };

  const getCleanSubject = (subject) => {
    // Subjects are now already in clean Arabic, just add prefix for book requests
    if (subject.includes('[BOOK-REQUEST]')) {
      const bookTitle = subject.replace('[BOOK-REQUEST]', '').trim();
      return `طلب إضافة كتاب: ${bookTitle}`;
    }
    // For new format, check if it's a book title (doesn't contain common Arabic words for issues)
    if (!subject.includes('صعوبة') && !subject.includes('بلاغ') && !subject.includes('طلب') && !subject.includes('شكوى')) {
      return `طلب إضافة كتاب: ${subject}`;
    }
    return subject;
  };

  if (!isLoggedIn || user?.role !== 'admin') {
    return (
      <div className="messages-container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h1>غير مصرح لك بالوصول لهذه الصفحة</h1>
          <p className="empty-text">يجب أن تكون مسؤولاً لعرض هذه الصفحة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1 className="messages-title">📬 رسائل التواصل</h1>
        <p className="messages-subtitle">
          {contactMessages?.length > 0 ? `لديك ${contactMessages.length} رسالة` : 'لا توجد رسائل'}
        </p>
      </div>

      {messagesLoading ? (
        <div className="loading-state">
          <p>⏳ جاري تحميل الرسائل...</p>
        </div>
      ) : messagesError ? (
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <p className="empty-text">فشل تحميل الرسائل: {messagesError.message}</p>
        </div>
      ) : (contactMessages && contactMessages.length > 0) ? (
        <div className="messages-grid">
          {contactMessages.map((message) => {
            const messageType = getMessageType(message.subject);
            const isRegistered = isUserRegistered(message);

            return (
              <div key={message.id} className="message-card">
                <div className={`message-type-badge badge-${messageType}`}>
                  <span>{getMessageIcon(messageType)}</span>
                  <span>{getMessageLabel(messageType)}</span>
                </div>

                <div className="message-header">
                  <h2 className="message-subject">{getCleanSubject(message.subject)}</h2>
                  <span className="message-date">
                    📅 {new Date(message.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="message-body">
                  <p className="message-text">{message.message}</p>
                </div>

                <div className="message-user-info">
                  <div className="user-avatar">
                    {getUserInitial(message.username)}
                  </div>
                  <div className="user-details">
                    <p className="user-name">
                      {message.username || 'مستخدم غير معروف'}
                    </p>
                    {isRegistered ? (
                      <p className="user-email">📧 {message.email}</p>
                    ) : (
                      <p className="user-email">👤 غير مسجل</p>
                    )}
                  </div>
                  <div className={`user-status ${isRegistered ? 'status-registered' : 'status-guest'}`}>
                    {isRegistered ? '✓ مسجل' : '○ زائر'}
                  </div>
                </div>

                <div className="message-actions">
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="action-btn btn-delete"
                  >
                    🗑️ حذف الرسالة
                  </button>
                  {isRegistered && message.email && (
                    <a
                      href={`mailto:${message.email}`}
                      className="action-btn btn-reply"
                    >
                      📧 رد على المستخدم
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p className="empty-text">لا توجد رسائل تواصل.</p>
        </div>
      )}
    </div>
  );
};

export default ContactMessagesPage;
