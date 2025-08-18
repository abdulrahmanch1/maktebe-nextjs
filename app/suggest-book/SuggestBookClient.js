'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

const SuggestBookClient = () => {
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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const coverInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'cover') {
      setCoverFile(files[0]);
    } else if (name === 'pdfFile') {
      setPdfFile(files[0]);
    }
  };

  const clearForm = () => {
    setFormData({ title: '', author: '', category: '', description: '', pages: '', publishYear: '', language: 'العربية', keywords: '' });
    setCoverFile(null);
    setPdfFile(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!coverFile) {
      setError('يرجى اختيار صورة غلاف للكتاب.');
      setIsLoading(false);
      return;
    }

    const uploadFile = async (file, type) => {
      if (!file) return null;
      const supabase = createSupabaseClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      let publicUrl = "";

      try {
        if (type === 'cover') {
          const formData = new FormData();
          formData.append("file", file);
          const response = await axios.post("/api/upload-book-cover", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          publicUrl = response.data.newUrl;
        } else if (type === 'pdf') {
          const filePath = `book-pdfs/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('book-pdfs').upload(filePath, file, { upsert: true });
          if (uploadError) throw new Error(`Supabase PDF upload error: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from('book-pdfs').getPublicUrl(filePath);
          if (!urlData || !urlData.publicUrl) throw new Error('Failed to get public URL for PDF.');
          publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }
        return publicUrl;
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        throw new Error(`Failed to upload ${type} file: ${errorMessage}`);
      }
    };

    try {
      let coverUrl = null;
      let pdfFileUrl = null;

      toast.info('بدأ رفع صورة الغلاف...');
      coverUrl = await uploadFile(coverFile, 'cover');
      toast.success('تم رفع صورة الغلاف بنجاح!');

      if (pdfFile) {
        toast.info('بدأ رفع ملف الكتاب...');
        pdfFileUrl = await uploadFile(pdfFile, 'pdf');
        toast.success('تم رفع ملف الكتاب بنجاح!');
      }

      const bookData = {
        ...formData,
        pages: parseInt(formData.pages, 10),
        publishYear: parseInt(formData.publishYear, 10),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        cover: coverUrl,
        pdfFile: pdfFileUrl,
      };

      const response = await fetch('/api/books/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'حدث خطأ ما أثناء إرسال البيانات.');

      setMessage('شكراً لاقتراحك! ستتم مراجعة الكتاب من قبل الإدارة.');
      clearForm();

    } catch (err) {
      console.error("Submit Error:", err);
      setError(err.message);
      toast.error(`فشل: ${err.message}`);
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
          <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} required />
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
          <label htmlFor="publishYear">سنة النشر</label>
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
          <input type="text" id="keywords" name="keywords" value={formData.keywords} onChange={handleChange} />
        </div>
        <div class="form-group">
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