'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    cover: '',
    pdfFile: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    // Basic validation
    for (const key in formData) {
      if (formData[key] === '' && key !== 'keywords' && key !== 'cover' && key !== 'pdfFile') {
        setError(`يرجى ملء حقل "${key}"`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/books/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pages: parseInt(formData.pages, 10),
          publishYear: parseInt(formData.publishYear, 10),
          keywords: formData.keywords.split(',').map(k => k.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ ما');
      }

      setMessage('شكراً لاقتراحك! ستتم مراجعة الكتاب من قبل الإدارة.');
      setFormData({
        title: '', author: '', category: '', description: '', pages: '', 
        publishYear: '', language: 'العربية', keywords: '', cover: '', pdfFile: ''
      });
      // Optional: redirect after a delay
      // setTimeout(() => router.push('/'), 3000);

    } catch (err) {
      setError(err.message);
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
        <div className="form-group">
          <label htmlFor="cover">رابط صورة الغلاف (اختياري)</label>
          <input type="url" id="cover" name="cover" value={formData.cover} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="pdfFile">رابط ملف الكتاب (PDF) (اختياري)</label>
          <input type="url" id="pdfFile" name="pdfFile" value={formData.pdfFile} onChange={handleChange} />
        </div>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'جار الإرسال...' : 'إرسال الاقتراح'}
        </button>
      </form>
    </div>
  );
};

export default SuggestBookClient;
