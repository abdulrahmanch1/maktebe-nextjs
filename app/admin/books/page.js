'use client';
import React, { useContext, useState, useCallback, useMemo } from "react"; // Add useMemo
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
  const { user, session, isLoggedIn } = useContext(AuthContext);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term

  

  const { data: books, loading, error } = useFetch(`${API_URL}/api/books`, {}, [refreshTrigger]);

  // New: Filtered books based on search term
  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [books, searchTerm]);

  const handleDelete = async (id) => {
    if (!session?.access_token) return toast.error('الرجاء تسجيل الدخول مرة أخرى.');
    if (window.confirm("هل أنت متأكد أنك تريد حذف هذا الكتاب؟")) {
        try {
          await axios.delete(`${API_URL}/api/books/${id}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
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
    router.push(`/admin/books/edit/${bookId}`);
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

      {/* New: Search Input */}
      <input
        type="text"
        placeholder="ابحث عن كتاب..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '5px',
          border: `1px solid ${theme.primary}`,
          backgroundColor: theme.background,
          color: theme.primary,
        }}
      />

      {loading ? (
        <p style={{ textAlign: "center", color: theme.primary }}>جاري تحميل الكتب...</p>
      ) : error ? (
        <p style={{ textAlign: "center", color: "red" }}>{`فشل تحميل الكتب: ${error.message}`}</p>
      ) : filteredBooks && filteredBooks.length > 0 ? ( // Use filteredBooks here
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {filteredBooks.map((book) => ( // Use filteredBooks here
            <div key={book.id} className="admin-book-item" style={{ backgroundColor: theme.secondary }}>
              <p style={{ color: theme.background }}>{book.title} - {book.author}</p>
              <div style={{ color: theme.background, fontSize: '0.9em', marginTop: '5px' }}>
                <span>الإعجابات: {book.favoritecount || 0}</span>
                <span style={{ marginLeft: '15px' }}>القراءات: {book.readcount || 0}</span>
              </div>
              <div>
                <button onClick={() => handleEdit(book.id)} style={{ backgroundColor: theme.accent, color: theme.primary, marginLeft: '10px' }}>تعديل</button>
                <button onClick={() => handleDelete(book.id)} className="delete">حذف</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: theme.primary }}>لا توجد كتب مطابقة.</p> // Updated message
      )}
    </div>
  );
};

export default AdminBooksPage;
