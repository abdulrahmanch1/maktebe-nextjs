'use client';
import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import useFetch from "@/hooks/useFetch";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import '../AdminPage.css';

const AdminBooksPage = () => {
  const { theme } = useContext(ThemeContext);
  const { user, token, isLoggedIn } = useContext(AuthContext);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  const { data: books, loading, error } = useFetch(`${API_URL}/api/books`, [refreshTrigger]);

  const handleDelete = async (id) => {
    if (!token) return toast.error('الرجاء تسجيل الدخول مرة أخرى.');
    if (window.confirm("هل أنت متأكد أنك تريد حذف هذا الكتاب؟")) {
        try {
          await axios.delete(`${API_URL}/api/books/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          toast.success("تم حذف الكتاب بنجاح!");
          setRefreshTrigger(prev => prev + 1);
        } catch (error) {
          console.error("Error deleting book:", error);
          toast.error(error.response?.data?.message || "فشل حذف الكتاب.");
        }
    }
  };

  const handleEdit = (bookId) => {
    router.push(`/admin?edit=${bookId}`);
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
      <h1 className="admin-page-title" style={{ color: theme.primary }}>قائمة الكتب</h1>
      {loading ? (
        <p style={{ textAlign: "center", color: theme.primary }}>جاري تحميل الكتب...</p>
      ) : error ? (
        <p style={{ textAlign: "center", color: "red" }}>{`فشل تحميل الكتب: ${error.message}`}</p>
      ) : books && books.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {books.map((book) => (
            <div key={book._id} className="admin-book-item" style={{ backgroundColor: theme.secondary }}>
              <p style={{ color: theme.background }}>{book.title} - {book.author}</p>
              <div>
                <button onClick={() => handleEdit(book._id)} style={{ backgroundColor: theme.accent, color: theme.primary, marginLeft: '10px' }}>تعديل</button>
                <button onClick={() => handleDelete(book._id)} className="delete">حذف</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: theme.primary }}>لا توجد كتب.</p>
      )}
    </div>
  );
};

export default AdminBooksPage;
