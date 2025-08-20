'use client';
import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '@/constants';
import { AuthContext } from '@/contexts/AuthContext'; // Assuming AuthContext is needed for API calls

const categories = ["قصص أطفال", "كتب دينية", "كتب تجارية", "كتب رومانسية", "كتب بوليسية", "أدب", "تاريخ", "علوم", "فلسفة", "تكنولوجيا", "سيرة ذاتية", "شعر", "فن", "طبخ"];

const SuggestBookClient = () => {
  const { session, isLoggedIn } = useContext(AuthContext); // Get session for auth header

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    description: '',
    pages: '',
    publishYear: 0,
    language: 'العربية', // Default language
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
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'cover') {
      setCoverFile(files[0]);
    } else if (name === 'pdfFile') {
      setPdfFile(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!isLoggedIn || !session) {
      setError('يجب تسجيل الدخول لاقتراح كتاب.');
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    for (const key in formData) {
      if (key === 'keywords' && formData[key]) {
        data.append(key, JSON.stringify(formData[key].split(',').map(kw => kw.trim())));
      } else {
        data.append(key, formData[key]);
      }
    }
    if (coverFile) {
      data.append('cover', coverFile);
    }
    if (pdfFile) {
      data.append('pdfFile', pdfFile);
    }

    try {
      // Assuming a new API endpoint for suggesting books
      const response = await axios.post(`${API_URL}/api/books/suggest`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      setMessage('تم إرسال اقتراحك بنجاح!');
      // Clear form
      setFormData({
        title: '',
        author: '',
        category: '',
        description: '',
        pages: '',
        publishYear: '',
        language: 'العربية',
        keywords: '',
      });
      setCoverFile(null);
      setPdfFile(null);
      if (coverInputRef.current) coverInputRef.current.value = '';
      if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';

    } catch (err) {
      console.error('Error suggesting book:', err);
      setError(err.response?.data?.message || 'فشل إرسال الاقتراح.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>اقترح كتاباً</h1>
      <p>شكراً لمساهمتك في إثراء المكتبة. يرجى ملء معلومات الكتاب أدناه.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">عنوان الكتاب</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="author">المؤلف</label>
          <input type="text" id="author" name="author" value={formData.author} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="category">التصنيف</label>
          <input
            type="text"
            id="category"
            name="category"
            list="category-options" // Add list attribute
            placeholder="أدخل أو اختر تصنيف" // Add placeholder
            value={formData.category}
            onChange={handleChange}
            required
          />
          <datalist id="category-options">{/* Add datalist */}
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label htmlFor="description">الوصف</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="pages">عدد الصفحات</label>
          <input type="number" id="pages" name="pages" value={formData.pages} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="publishYear">سنة التأليف</label>
          <input type="number" id="publishYear" name="publishYear" value={formData.publishYear} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="language">اللغة</label>
          <select id="language" name="language" value={formData.language} onChange={handleChange}>
            <option value="العربية">العربية</option>
            <option value="الإنجليزية">الإنجليزية</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="keywords">كلمات مفتاحية (مفصولة بفاصلة)</label>
          <input type="text" id="keywords" name="keywords" value={formData.keywords} onChange={handleChange} className="suggest-form-input" />
        </div>
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

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'جار الرفع والإرسال...' : 'إرسال الاقتراح'}
        </button>
      </form>
    </div>
  );
};

export default SuggestBookClient;