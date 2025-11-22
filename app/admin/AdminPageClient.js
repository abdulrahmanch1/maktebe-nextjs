'use client';
import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ThemeContext } from "@/contexts/ThemeContext";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from 'react-toastify';
import { API_URL } from "@/constants";
import './AdminPage.css';
import './add-book/AddBookPage.css';

import { createClient as createSupabaseClient } from "@/utils/supabase/client";

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomCounts(ratingTier) {
  let favoriteMin, favoriteMax, readMin, readMax;

  switch (ratingTier) {
    case 'medium':
      favoriteMin = 15; favoriteMax = 30;
      readMin = 10; readMax = 20;
      break;
    case 'excellent':
      favoriteMin = 30; favoriteMax = 45;
      readMin = 15; readMax = 25; // Excellent for reads
      break;
    case 'very_good': // Assuming this is a separate tier for reads
      favoriteMin = 50; favoriteMax = 70;
      readMin = 40; readMax = 55;
      break;
    case 'normal':
    default:
      favoriteMin = 5; favoriteMax = 15;
      readMin = 5; readMax = 10;
      break;
  }

  return {
    favoritecount: getRandomNumber(favoriteMin, favoriteMax),
    readcount: getRandomNumber(readMin, readMax)
  };
}

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
  const [likes, setLikes] = useState(0);
  const [reads, setReads] = useState(0);
  const [categories] = useState(["قصص أطفال", "كتب دينية", "كتب تجارية", "كتب رومانسية", "كتب بوليسية", "أدب", "تاريخ", "علوم", "فلسفة", "تكنولوجيا", "سيرة ذاتية", "شعر", "فن", "طبخ", "روايات تاريخية", "خيال علمي", "فانتازيا", "تشويق وإثارة", "دراما", "كوميديا", "أدب كلاسيكي", "أدب معاصر", "تنمية بشرية", "علم نفس", "اجتماع", "اقتصاد", "سياسة", "قانون", "تربية", "صحة", "رياضة", "رحلات", "مذكرات", "فنون جميلة", "تصميم", "هندسة", "برمجة", "لغات", "فلك", "جغرافيا", "بيئة", "حيوان", "نبات", "طب بديل"]);
  const [editingBook, setEditingBook] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);
  const [aiTitle, setAiTitle] = useState("");
  const [isFetchingAi, setIsFetchingAi] = useState(false);

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
    setLikes(0);
    setReads(0);
    setEditingBook(null);
    setExistingCoverUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
  }, []);

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
          setLikes(book.favoritecount || 0);
          setReads(book.readcount || 0);
          setExistingCoverUrl(book.cover);
        })
        .catch(error => {
          toast.error("الكتاب المراد تعديله غير موجود");
          router.push('/admin');
        });
    }
  }, [editBookId, router]);

  const handleAiFetch = async () => {
    if (!aiTitle) {
      toast.error("الرجاء إدخال عنوان الكتاب أولاً.");
      return;
    }
    setIsFetchingAi(true);
    try {
      const response = await axios.post(`${API_URL}/api/ai/book-info`, { title: aiTitle });
      const data = response.data;

      // Populate form fields with AI data
      setTitle(data.title || aiTitle);
      setAuthor(data.author || '');
      setCategory(data.category || '');
      setDescription(data.description || '');
      setPublishYear(data.publishYear || '');
      setLanguage(data.language || '');
      setKeywords(Array.isArray(data.keywords) ? data.keywords.join(', ') : '');

      toast.success("تم جلب معلومات الكتاب بنجاح!");
    } catch (error) {
      console.error("Error fetching AI book info:", error);
      toast.error("فشل في جلب معلومات الكتاب من الذكاء الاصطناعي.");
    } finally {
      setIsFetchingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // This is the new, unified upload function for direct-to-Supabase uploads.
    const directUpload = async (file, bucket) => {
      if (!file || !(file instanceof File)) return null;

      const supabase = createSupabaseClient();
      const fileExt = file.name.split('.').pop();
      // Create a more robust unique filename
      const fileName = `${bucket}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { upsert: false });

        if (uploadError) {
          throw new Error(`Supabase upload error: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        if (!urlData || !urlData.publicUrl) {
          throw new Error('Failed to get public URL.');
        }
        return `${urlData.publicUrl}?t=${Date.now()}`;
      } catch (error) {
        const errorMessage = error.message || 'Unknown upload error';
        throw new Error(`Failed to upload to bucket ${bucket}: ${errorMessage}`);
      }
    };

    try {
      // Use Promise.all to handle uploads concurrently for better performance.
      const [coverUrl, pdfFileUrl] = await Promise.all([
        directUpload(cover, 'book-covers'),
        directUpload(pdfFile, 'book-pdfs')
      ]);

      const bookData = {
        title,
        author,
        category,
        description,
        pages: parseInt(pages, 10) || 0,
        publishYear: parseInt(publishYear, 10) || 0,
        language,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        // Use newly uploaded URL or keep existing one if not changed
        cover: coverUrl || editingBook?.cover,
        pdfFile: pdfFileUrl || editingBook?.pdfFile,
        favoritecount: likes,
        readcount: reads,
      };

      const url = editingBook ? `${API_URL}/api/books/${editingBook.id}` : `${API_URL}/api/books`;
      const method = editingBook ? 'patch' : 'post';

      await axios({
        method,
        url,
        data: bookData,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      toast.success(editingBook ? "تم تحديث الكتاب بنجاح!" : "تم إضافة الكتاب بنجاح!");
      clearForm();
    } catch (error) {
      console.error("Error during book submission:", error);
      const errorMessage = error.response?.data?.message || error.message || 'فشل حفظ الكتاب.';
      toast.error(errorMessage);
    }
  };

  const handleGenerateRandomCounts = (tier) => {
    const { favoritecount, readcount } = generateRandomCounts(tier);
    setLikes(favoritecount);
    setReads(readcount);
    toast.success(`تم توليد أرقام عشوائية: إعجابات ${favoritecount}, قراءات ${readcount}`);
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
    <div className="add-book-container">
      {/* Back Button */}
      <Link href="/admin" className="back-button">
        ← العودة للوحة التحكم
      </Link>

      {/* Header */}
      <div className="add-book-header">
        <h1 className="add-book-title">{editingBook ? "تعديل الكتاب" : "إضافة كتاب جديد"}</h1>
        <p className="add-book-subtitle">
          {editingBook ? "قم بتعديل معلومات الكتاب أدناه" : "املأ النموذج أدناه لإضافة كتاب جديد للمكتبة"}
        </p>
      </div>

      <div className="book-form-container" style={{ backgroundColor: theme.secondary, color: theme.primary }}>

        {/* AI Fetch Section */}
        {!editingBook && (
          <div className="ai-section">
            <h3 className="ai-section-title">
              <span>🤖</span> إضافة سريعة بالذكاء الاصطناعي
            </h3>
            <p style={{ color: '#7c3aed', marginBottom: '1rem', fontSize: '0.95rem' }}>
              أدخل عنوان الكتاب وسنقوم بجلب معلوماته تلقائياً
            </p>
            <div className="ai-input-group">
              <input
                type="text"
                className="ai-input"
                placeholder="مثال: 'كبرياء وتحامل'"
                value={aiTitle}
                onChange={(e) => setAiTitle(e.target.value)}
              />
              <button
                type="button"
                className="ai-button"
                onClick={handleAiFetch}
                disabled={isFetchingAi}
              >
                {isFetchingAi ? 'جاري الجلب...' : 'جلب المعلومات'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="form-section">
            <h3 className="section-title">📖 المعلومات الأساسية</h3>
            <div className="form-grid">
              <div>
                <label className="form-label required">عنوان الكتاب</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="أدخل عنوان الكتاب"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label required">اسم الكاتب</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="أدخل اسم الكاتب"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label required">التصنيف</label>
                <input
                  type="text"
                  className="form-input"
                  list="category-options"
                  placeholder="أدخل أو اختر تصنيف"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
                <datalist id="category-options">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="form-label required">اللغة</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="أدخل اللغة"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label required">عدد الصفحات</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="أدخل عدد الصفحات"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label required">سنة التأليف</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="أدخل سنة التأليف"
                  value={publishYear}
                  onChange={(e) => setPublishYear(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group-full">
              <label className="form-label required">الوصف</label>
              <textarea
                className="form-textarea"
                placeholder="أدخل وصف الكتاب"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="form-group-full">
              <label className="form-label">الكلمات المفتاحية (افصل بينها بفاصلة)</label>
              <input
                type="text"
                className="form-input"
                placeholder="أدخل كلمات مفتاحية"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
          </div>

          {/* Files Section */}
          <div className="form-section">
            <h3 className="section-title">📁 الملفات</h3>
            <div className="form-grid">
              <div>
                <label className="form-label">صورة الغلاف</label>
                {existingCoverUrl && !cover && (
                  <div className="image-preview">
                    <Image src={existingCoverUrl} alt="Current Cover" width={100} height={150} />
                  </div>
                )}
                <input
                  type="file"
                  className="form-input form-file-input"
                  accept="image/*"
                  onChange={(e) => setCover(e.target.files[0])}
                  ref={coverInputRef}
                />
              </div>
              <div>
                <label className="form-label">ملف PDF</label>
                <input
                  type="file"
                  className="form-input form-file-input"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  ref={pdfFileInputRef}
                />
              </div>
            </div>
          </div>

          {/* Random Likes and Reads Generation */}
          <div className="random-counts-section">
            <h4 className="random-counts-title">🎲 توليد أرقام عشوائية للإعجابات والقراءات</h4>
            <div className="tier-buttons">
              <button type="button" onClick={() => handleGenerateRandomCounts('normal')} className="tier-button tier-normal">عادي</button>
              <button type="button" onClick={() => handleGenerateRandomCounts('medium')} className="tier-button tier-medium">متوسط</button>
              <button type="button" onClick={() => handleGenerateRandomCounts('excellent')} className="tier-button tier-excellent">ممتاز</button>
              <button type="button" onClick={() => handleGenerateRandomCounts('very_good')} className="tier-button tier-very-good">جيد جداً</button>
            </div>
            <div className="counts-grid">
              <div>
                <label className="form-label">الإعجابات</label>
                <input
                  type="number"
                  className="form-input"
                  value={likes}
                  onChange={(e) => setLikes(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="form-label">القراءات</label>
                <input
                  type="number"
                  className="form-input"
                  value={reads}
                  onChange={(e) => setReads(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="submit-section">
            <button type="submit" className="submit-button submit-primary">
              {editingBook ? "تحديث الكتاب" : "إضافة الكتاب"}
            </button>
            {editingBook && (
              <button type="button" onClick={clearForm} className="submit-button submit-secondary">
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPageClient;