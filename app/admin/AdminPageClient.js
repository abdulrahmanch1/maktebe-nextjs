'use client';
import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import './AdminPage.css';

const AdminPageClient = () => {
  const { theme } = useContext(ThemeContext);
  const { user, session, isLoggedIn } = useContext(AuthContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pages, setPages] = useState("");
  const [publishYear, setPublishYear] = useState("");
  const [language, setLanguage] = useState("");
  const [keywords, setKeywords] = useState("");
  const [categories] = useState(["قصص أطفال", "كتب دينية", "كتب تجارية", "كتب رومانسية", "كتب بوليسية", "أدب", "تاريخ", "علوم", "فلسفة", "تكنولوجيا", "سيرة ذاتية", "شعر", "فن", "طبخ"]);
  const [editingBook, setEditingBook] = useState(null);

  const coverInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);

  const editBookId = searchParams.get('edit');

  const clearForm = useCallback(() => {
    setTitle("");
    setAuthor("");
    setCategory("");
    setDescription("");
    setCover(null);
    setPdfFile(null);
    setPages("");
    setPublishYear("");
    setLanguage("");
    setKeywords("");
    setEditingBook(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
    router.push('/admin');
  }, [router]);

  useEffect(() => {
    if (editBookId) {
      axios.get(`${API_URL}/api/books/${editBookId}`)
        .then(response => {
          const book = response.data;
          setEditingBook(book);
          setTitle(book.title);
          setAuthor(book.author);
          setCategory(book.category);
          setDescription(book.description);
          setPages(book.pages);
          setPublishYear(book.publishYear);
          setLanguage(book.language);
          setKeywords(book.keywords ? book.keywords.join(', ') : '');
        })
        .catch(error => {
          toast.error("الكتاب المراد تعديله غير موجود");
          router.push('/admin');
        });
    } else {
      clearForm();
    }
  }, [editBookId, router, clearForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let coverUrl = editingBook?.cover;
    let pdfFileUrl = editingBook?.pdfFile;

    const uploadFile = async (file, type) => {
      if (!file) return null;

      // Check file size (4.5 MB limit for Vercel Hobby plan)
      if (file.size > 4.5 * 1024 * 1024) {
        throw new Error(`حجم الملف كبير جدًا. الحد الأقصى هو 4.5 ميجابايت.`);
      }

      const formData = new FormData();
      formData.append("file", file);
      try {
        let uploadUrl = "";
        if (type === 'cover') {
          uploadUrl = "/api/upload-book-cover"; // Use the new endpoint for covers
        } else if (type === 'pdf') {
          uploadUrl = "/api/upload-blob"; // Keep existing for PDF for now, or create a new one if needed
        } else {
          throw new Error("Unknown file type for upload.");
        }

        const response = await axios.post(uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data.newUrl; // The new endpoint returns 'newUrl'
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        const detailedError = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;
        throw new Error(`Failed to upload ${type} file: ${detailedError}`);
      }
    };

    try {
      if (cover) {
        try {
          coverUrl = await uploadFile(cover, 'cover');
        } catch (uploadError) {
          console.error("Error uploading cover:", uploadError);
          toast.error(`فشل رفع صورة الغلاف: ${uploadError.message}`);
          return; // Stop execution if cover upload fails
        }
      }
      if (pdfFile) {
        try {
          pdfFileUrl = await uploadFile(pdfFile, 'pdf');
        } catch (uploadError) {
          console.error("Error uploading PDF:", uploadError);
          toast.error(`فشل رفع ملف PDF: ${uploadError.message}`);
          return; // Stop execution if PDF upload fails
        }
      }

      const bookData = {
        title,
        author,
        category,
        description,
        pages: parseInt(pages),
        publishYear: parseInt(publishYear),
        language,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k !== ''),
        cover: coverUrl,
        pdfFile: pdfFileUrl,
      };

      const url = editingBook ? `${API_URL}/api/books/${editingBook.id}` : `${API_URL}/api/books`;
      const method = editingBook ? 'patch' : 'post';
      await axios({
        method,
        url,
        data: bookData, // Send as JSON
        headers: {
          'Content-Type': 'application/json', // Specify JSON content type
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      toast.success(editingBook ? "تم تحديث الكتاب بنجاح!" : "تم إضافة الكتاب بنجاح!");
      clearForm();
      if (coverInputRef.current) coverInputRef.current.value = '';
      if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
    } catch (error) {
      console.error("Error saving book:", error);
      const errorMessage = error.response?.data?.error || error.message || 'فشل حفظ الكتاب.';
      toast.error(errorMessage);
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
      <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px'}}>
        <Link href="/admin/books" style={{ backgroundColor: theme.accent, color: theme.primary, padding: "10px 20px", borderRadius: "5px", textDecoration: "none" }}>
          عرض كل الكتب
        </Link>
        <Link href="/admin/contact-messages" style={{ backgroundColor: theme.accent, color: theme.primary, padding: "10px 20px", borderRadius: "5px", textDecoration: "none" }}>
          عرض رسائل التواصل
        </Link>
      </div>

      <div className="admin-form-container" style={{ backgroundColor: theme.secondary, color: theme.primary }}>
        <h2 className="admin-form-title">{editingBook ? "تعديل الكتاب" : "إضافة كتاب جديد"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>عنوان الكتاب</label>
            <input type="text" placeholder="أدخل عنوان الكتاب" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }} />
          </div>
          <div className="admin-form-group">
            <label>اسم الكاتب</label>
            <input type="text" placeholder="أدخل اسم الكاتب" value={author} onChange={(e) => setAuthor(e.target.value)} required style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }} />
          </div>
          <div className="admin-form-group">
            <label>التصنيف</label>
            <input
              type="text"
              list="category-options"
              placeholder="أدخل أو اختر تصنيف"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }}
            />
            <datalist id="category-options">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div className="admin-form-group">
            <label>الوصف</label>
            <textarea placeholder="أدخل وصف الكتاب" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }}></textarea>
          </div>
          <div className="admin-form-group">
            <label>عدد الصفحات</label>
            <input type="number" placeholder="أدخل عدد الصفحات" value={pages} onChange={(e) => setPages(e.target.value)} required style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }} />
          </div>
          <div className="admin-form-group">
            <label>سنة النشر</label>
            <input type="number" placeholder="أدخل سنة النشر" value={publishYear} onChange={(e) => setPublishYear(e.target.value)} required style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }} />
          </div>
          <div className="admin-form-group">
            <label>اللغة</label>
            <input type="text" placeholder="أدخل اللغة" value={language} onChange={(e) => setLanguage(e.target.value)} required style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }} />
          </div>
          <div className="admin-form-group">
            <label>صورة الغلاف</label>
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0])} ref={coverInputRef} style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }} />
          </div>
          <div className="admin-form-group">
            <label>ملف PDF</label>
            <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} ref={pdfFileInputRef} style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }} />
          </div>
          <div className="admin-form-group">
            <label>الكلمات المفتاحية (افصل بينها بفاصلة)</label>
            <input type="text" placeholder="أدخل كلمات مفتاحية" value={keywords} onChange={(e) => setKeywords(e.target.value)} style={{ border: `1px solid ${theme.accent}`, backgroundColor: theme.background, color: theme.primary }} />
          </div>
          <button type="submit" className="admin-form-button" style={{ backgroundColor: theme.accent, color: theme.primary }}>{editingBook ? "تحديث الكتاب" : "إضافة الكتاب"}</button>
          {editingBook && (
            <button type="button" onClick={clearForm} className="admin-form-button cancel" style={{ backgroundColor: theme.secondary, color: theme.primary }}>إلغاء التعديل</button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminPageClient;