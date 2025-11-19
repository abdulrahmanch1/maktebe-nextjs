'use client';
import React, { useContext, useState } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import useFetch from "@/hooks/useFetch";
import axios from "axios";
import { toast } from 'react-toastify';
import BookCard from "@/components/BookCard"; // Import BookCard
import './SuggestedBooksPage.css'; // Assuming you have a CSS file for this page

const AdminSuggestedBooksPage = () => {
  const { theme } = useContext(ThemeContext);
  const { user, session, isLoggedIn } = useContext(AuthContext);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: suggestedBooks, loading, error } = useFetch(
    isLoggedIn && user?.role === 'admin' ? `/api/suggested-books` : null,
    undefined,
    [refreshTrigger, isLoggedIn, user?.role]
  );

  const handleApprove = async (bookId) => {
    if (!session) return toast.error('الرجاء تسجيل الدخول مرة أخرى.');
    if (window.confirm("هل أنت متأكد أنك تريد الموافقة على هذا الكتاب؟")) {
      try {
        await axios.patch(`/api/suggested-books/${bookId}`, { status: 'approved' }, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        toast.success("تمت الموافقة على الكتاب بنجاح!");
        setRefreshTrigger(prev => prev + 1);
      } catch (err) {
        console.error("Error approving book:", err);
        toast.error(err.response?.data?.message || "فشل الموافقة على الكتاب.");
      }
    }
  };

  const handleReject = async (bookId) => {
    if (!session) return toast.error('الرجاء تسجيل الدخول مرة أخرى.');
    if (window.confirm("هل أنت متأكد أنك تريد رفض هذا الكتاب وحذفه؟")) {
      try {
        await axios.delete(`/api/suggested-books/${bookId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        toast.success("تم رفض الكتاب وحذفه بنجاح!");
        setRefreshTrigger(prev => prev + 1);
      } catch (err) {
        console.error("Error rejecting book:", err);
        toast.error(err.response?.data?.message || "فشل رفض الكتاب.");
      }
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
      <h1 className="admin-page-title" style={{ color: theme.primary }}>الكتب المقترحة للمراجعة</h1>
      {loading ? (
        <p style={{ textAlign: "center", color: theme.primary }}>جاري تحميل الكتب المقترحة...</p>
      ) : error ? (
        <p style={{ textAlign: "center", color: "red" }}>{`فشل تحميل الكتب المقترحة: ${error.message}`}</p>
      ) : suggestedBooks && suggestedBooks.length > 0 ? (
        <div className="admin-suggested-books-grid">
          {suggestedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: theme.primary }}>لا توجد كتب مقترحة للمراجعة.</p>
      )}
    </div>
  );
};

export default AdminSuggestedBooksPage;
