'use client';
import React, { useState, useEffect, useRef, useContext } from 'react';
import Image from 'next/image'; // Add this import
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '@/constants';
import { AuthContext } from '@/contexts/AuthContext';
import '@/app/suggest-book/SuggestBookPage.css'; // Re-use the same CSS

const categories = ["قصص أطفال", "كتب دينية", "كتب تجارية", "كتب رومانسية", "كتب بوليسية", "أدب", "تاريخ", "علوم", "فلسفة", "تكنولوجيا", "سيرة ذاتية", "شعر", "فن", "طبخ"];

const EditBookFormClient = ({ initialBook }) => {
  const router = useRouter();
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    description: '',
    pages: '',
    publishYear: '',
    language: 'العربية',
    keywords: '',
    status: 'pending',
    cover: '',
    pdfFile: '',
    favoritecount: 0,
    readcount: 0,
  });
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const coverInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  useEffect(() => {
    if (initialBook) {
      setFormData({
        title: initialBook.title || '',
        author: initialBook.author || '',
        category: initialBook.category || '',
        description: initialBook.description || '',
        pages: initialBook.pages || '',
        publishYear: initialBook.publishYear || '',
        language: initialBook.language || 'العربية',
        keywords: Array.isArray(initialBook.keywords) ? initialBook.keywords.join(', ') : '',
        status: initialBook.status || 'pending',
        cover: initialBook.cover || '',
        pdfFile: initialBook.pdfFile || '',
        favoritecount: initialBook.favoritecount || 0,
        readcount: initialBook.readcount || 0,
      });
    }
  }, [initialBook]);

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
    setLoading(true);

    try {
      const updatedData = { ...formData };
      // Ensure numeric fields are parsed correctly, defaulting to 0 if invalid
      updatedData.pages = parseInt(formData.pages, 10) || 0;
      updatedData.publishYear = parseInt(formData.publishYear, 10) || 0;
      updatedData.favoritecount = parseInt(formData.favoritecount, 10) || 0;
      updatedData.readcount = parseInt(formData.readcount, 10) || 0;
      updatedData.keywords = updatedData.keywords.split(',').map(kw => kw.trim()).filter(Boolean);
      
      if (coverFile) {
        const coverFormData = new FormData();
        coverFormData.append('file', coverFile);
        // Add the old cover URL if it exists
        if (initialBook.cover) {
          coverFormData.append('oldCoverUrl', initialBook.cover);
        }
        const res = await axios.post(`${API_URL}/api/upload-book-cover`, coverFormData, { headers: { Authorization: `Bearer ${session.access_token}` } });
        updatedData.cover = res.data.newUrl;
      }

      // Handle PDF file upload
      if (pdfFile) {
        const pdfFormData = new FormData();
        pdfFormData.append('file', pdfFile);
        // Add the old PDF URL if it exists
        if (initialBook.pdfFile) {
          pdfFormData.append('oldPdfUrl', initialBook.pdfFile);
        }
        const pdfRes = await axios.post(`${API_URL}/api/upload-book-pdf`, pdfFormData, { headers: { Authorization: `Bearer ${session.access_token}` } });
        updatedData.pdfFile = pdfRes.data.newUrl;
      }

      await axios.put(`${API_URL}/api/books/${initialBook.id}`, updatedData, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      toast.success('تم تحديث الكتاب بنجاح!');
      router.push('/admin/books');
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء تحديث الكتاب.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRandomCounts = (tier) => {
    const { favoritecount, readcount } = generateRandomCounts(tier);
    setFormData((prevData) => ({
      ...prevData,
      favoritecount: favoritecount,
      readcount: readcount,
    }));
  };

  return (
    <div className="form-container">
      <h1>تعديل الكتاب: {initialBook?.title}</h1>
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
          <input type="text" id="category" name="category" list="category-options" placeholder="أدخل أو اختر تصنيف" value={formData.category} onChange={handleChange} required />
          <datalist id="category-options">
            {categories.map((cat) => (<option key={cat} value={cat} />))}
          </datalist>
        </div>
        <div className="form-group">
          <label htmlFor="description">الوصف</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
        </div>

        <div className="form-row">
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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="favoritecount">الإعجابات</label>
            <input type="number" id="favoritecount" name="favoritecount" value={formData.favoritecount} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="readcount">القراءات</label>
            <input type="number" id="readcount" name="readcount" value={formData.readcount} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="keywords">كلمات مفتاحية (مفصولة بفاصلة)</label>
          <input type="text" id="keywords" name="keywords" value={formData.keywords} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>صورة الغلاف الحالية</label>
          {formData.cover && (
            <Image
              src={formData.cover}
              alt="Cover"
              width={100} // Specify width
              height={150} // Specify height (adjust as needed for aspect ratio)
              style={{ display: 'block', marginBottom: '10px' }} // Apply other styles
            />
          )}
          <label className="file-input-label">
            <span>{coverFile ? coverFile.name : 'اختر صورة جديدة لتغييرها...'}</span>
            <input type="file" id="cover" name="cover" accept="image/*" onChange={handleFileChange} ref={coverInputRef} className="file-input" />
          </label>
        </div>
        <div className="form-group">
          <label>ملف الـ PDF الحالي</label>
          {formData.pdfFile && (
            <p><a href={formData.pdfFile} target="_blank" rel="noopener noreferrer">عرض ملف الـ PDF الحالي</a></p>
          )}
          <label className="file-input-label">
            <span>{pdfFile ? pdfFile.name : 'اختر ملف PDF جديد لتغييره...'}</span>
            <input type="file" id="pdfFile" name="pdfFile" accept="application/pdf" onChange={handleFileChange} ref={pdfInputRef} className="file-input" />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'جاري التحديث...' : 'حفظ التغييرات'}
        </button>
      </form>
    </div>
  );
};

export default EditBookFormClient;
