'use client';
import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '@/constants';
import { AuthContext } from '@/contexts/AuthContext';
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

const categories = ["قصص أطفال", "كتب دينية", "كتب تجارية", "كتب رومانسية", "كتب بوليسية", "أدب", "تاريخ", "علوم", "فلسفة", "تكنولوجيا", "سيرة ذاتية", "شعر", "فن", "طبخ", "روايات تاريخية", "خيال علمي", "فانتازيا", "تشويق وإثارة", "دراما", "كوميديا", "أدب كلاسيكي", "أدب معاصر", "تنمية بشرية", "علم نفس", "اجتماع", "اقتصاد", "سياسة", "قانون", "تربية", "صحة", "رياضة", "رحلات", "مذكرات", "فنون جميلة", "تصميم", "هندسة", "برمجة", "لغات", "فلك", "جغرافيا", "بيئة", "حيوان", "نبات", "طب بديل"];

const SuggestBookClient = () => {
  const { session, isLoggedIn } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    description: '',
    pages: '',
    publishYear: '',
    language: 'العربية',
    keywords: '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const coverInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'cover') setCoverFile(files[0]);
    else if (name === 'pdfFile') setPdfFile(files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!isLoggedIn || !session) {
      toast.error('يجب تسجيل الدخول لاقتراح كتاب.');
      setIsLoading(false);
      return;
    }

    // 1. Direct Upload Function
    const directUpload = async (file, bucket) => {
      if (!file) return null;
      const supabase = createSupabaseClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${bucket}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw new Error(`فشل رفع الملف: ${error.message}`);

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      if (!data.publicUrl) throw new Error('فشل في الحصول على رابط الملف.');
      
      return data.publicUrl;
    };

    try {
      // 2. Upload files concurrently
      const [coverUrl, pdfFileUrl] = await Promise.all([
        directUpload(coverFile, 'book-covers'),
        directUpload(pdfFile, 'book-pdfs'),
      ]);

      // 3. Prepare JSON data with URLs
      const bookData = {
        ...formData,
        pages: parseInt(formData.pages, 10) || 0,
        publishYear: parseInt(formData.publishYear, 10) || 0,
        keywords: formData.keywords.split(',').map(kw => kw.trim()).filter(Boolean),
        cover: coverUrl, // URL of the cover
        pdfFile: pdfFileUrl, // URL of the PDF
      };

      // 4. Submit JSON data to the server
      await axios.post(`${API_URL}/api/books/suggest`, bookData, {
        headers: {
          'Content-Type': 'application/json', // Send as JSON
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      toast.success('تم إرسال اقتراحك بنجاح!');
      // Clear form
      setFormData({ title: '', author: '', category: '', description: '', pages: '', publishYear: '', language: 'العربية', keywords: '' });
      setCoverFile(null);
      setPdfFile(null);
      if (coverInputRef.current) coverInputRef.current.value = '';
      if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';

    } catch (err) {
      console.error('Error suggesting book:', err);
      toast.error(err.response?.data?.message || err.message || 'فشل إرسال الاقتراح.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="suggest-book-page">
      <div className="form-container">
        <div className="suggest-header">
          <div>
            <p className="eyebrow">أضف كتابك المفضل</p>
            <h1>اقترح كتاباً</h1>
            <p className="lede">ساعدنا في إضافة كتب جديدة. نعتني بالرفع والبيانات، فقط أرسل التفاصيل.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="suggest-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">عنوان الكتاب</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="author">المؤلف</label>
              <input type="text" id="author" name="author" value={formData.author} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="category">التصنيف</label>
              <input type="text" id="category" name="category" list="category-options" placeholder="أدخل أو اختر تصنيف" value={formData.category} onChange={handleChange} required />
              <datalist id="category-options">{categories.map((cat) => (<option key={cat} value={cat} />))}</datalist>
            </div>
            <div className="form-group">
              <label htmlFor="language">اللغة</label>
              <select id="language" name="language" value={formData.language} onChange={handleChange}>
                <option value="العربية">العربية</option>
                <option value="الإنجليزية">الإنجليزية</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">الوصف</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="pages">عدد الصفحات</label>
              <input type="number" id="pages" name="pages" value={formData.pages} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="publishYear">سنة التأليف</label>
              <input type="number" id="publishYear" name="publishYear" value={formData.publishYear} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="keywords">كلمات مفتاحية (مفصولة بفاصلة)</label>
            <input type="text" id="keywords" name="keywords" value={formData.keywords} onChange={handleChange} className="suggest-form-input" />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="cover">صورة الغلاف (إجباري)</label>
              <label className="file-input-label">
                <span>{coverFile ? coverFile.name : 'اختر صورة...'}</span>
                <input type="file" id="cover" name="cover" accept="image/*" onChange={handleFileChange} ref={coverInputRef} required className="file-input" />
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="pdfFile">ملف الكتاب (PDF) (اختياري)</label>
              <label className="file-input-label">
                <span>{pdfFile ? pdfFile.name : 'اختر ملف PDF...'}</span>
                <input type="file" id="pdfFile" name="pdfFile" accept="application/pdf" onChange={handleFileChange} ref={pdfFileInputRef} className="file-input" />
              </label>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'جار الرفع والإرسال...' : 'إرسال الاقتراح'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuggestBookClient;
