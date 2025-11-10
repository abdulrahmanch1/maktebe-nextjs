'use client';
import React, { useContext, useState } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import useFetch from "@/hooks/useFetch";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import '../AdminPage.css';

const ContactMessagesPage = () => {
  const { theme } = useContext(ThemeContext);
  const { user, session, isLoggedIn } = useContext(AuthContext); // Use session instead of token
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Use session?.access_token and ensure it only runs when the token is available
  const { data: contactMessages, loading: messagesLoading, error: messagesError } = useFetch(
    session?.access_token ? `${API_URL}/api/contact/messages` : null,
    { headers: { Authorization: `Bearer ${session?.access_token}` } }, // Argument 2: options
    [refreshTrigger, session] // Argument 3: dependencies
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

  if (!isLoggedIn || user?.role !== 'admin') {
    return (
      <div className="admin-page-container" style={{ backgroundColor: theme.background, color: theme.primary, textAlign: "center" }}>
        <h1 style={{ color: theme.primary }}>غير مصرح لك بالوصول لهذه الصفحة</h1>
        <p>يجب أن تكون مسؤولاً لعرض هذه الصفحة.</p>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <h1 className="admin-page-title" style={{ color: theme.primary }}>رسائل التواصل</h1>
      {messagesLoading ? (
        <p style={{ textAlign: "center", color: theme.primary }}>جاري تحميل الرسائل...</p>
      ) : messagesError ? (
        <p style={{ textAlign: "center", color: "red" }}>فشل تحميل الرسائل: {messagesError.message}</p>
      ) : (contactMessages && contactMessages.length > 0) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {contactMessages.map((message) => (
            <div key={message.id} className="admin-book-item" style={{ backgroundColor: theme.secondary }}>
              <div>
                <p style={{ color: theme.primary }}><strong>الموضوع:</strong> {message.subject}</p>
                <p style={{ color: theme.primary }}><strong>الرسالة:</strong> {message.message}</p>
                <p style={{ color: theme.primary }}><strong>المرسل:</strong> {message.username} ({message.email})</p>
                <p style={{ color: theme.primary }}><strong>التاريخ:</strong> {new Date(message.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <button onClick={() => handleDeleteMessage(message.id)} className="delete">حذف الرسالة</button>
                <a href={`mailto:${message.email}`} className="reply-button">رد على المستخدم</a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: theme.primary }}>لا توجد رسائل تواصل.</p>
      )}
    </div>
  );
};

export default ContactMessagesPage;
