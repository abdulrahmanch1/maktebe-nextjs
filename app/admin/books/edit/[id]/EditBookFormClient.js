'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '@/constants'; // Assuming API_URL is defined
import { createClient } from '@/utils/supabase/client'; // For client-side Supabase operations

const EditBookFormClient = ({ initialBook }) => {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    pages: '',
    language: '',
    cover_url: '',
    file_url: '',
    status: 'pending', // Default status
  });
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialBook) {
      setFormData({
        title: initialBook.title || '',
        author: initialBook.author || '',
        description: initialBook.description || '',
        category: initialBook.category || '',
        pages: initialBook.pages || '',
        language: initialBook.language || '',
        cover_url: initialBook.cover_url || '',
        file_url: initialBook.file_url || '',
        status: initialBook.status || 'pending',
      });
    }
  }, [initialBook]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.name === 'cover_file') {
      setCoverFile(e.target.files[0]);
    } else if (e.target.name === 'pdf_file') {
      setPdfFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file, bucketName) => {
    if (!file) return null;

    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);

    if (error) {
      console.error(`Error uploading ${bucketName} file:`, error);
      toast.error(`فشل تحميل ملف ${bucketName}.`);
      return null;
    }
    return `${API_URL}/storage/v1/object/public/${bucketName}/${data.path}`; // Adjust URL as per your Supabase setup
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let updatedCoverUrl = formData.cover_url;
      let updatedFileUrl = formData.file_url;

      if (coverFile) {
        updatedCoverUrl = await uploadFile(coverFile, 'book-covers');
        if (!updatedCoverUrl) throw new Error('Failed to upload cover image.');
      }
      if (pdfFile) {
        updatedFileUrl = await uploadFile(pdfFile, 'book-files');
        if (!updatedFileUrl) throw new Error('Failed to upload PDF file.');
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await axios.put(`${API_URL}/api/books/${initialBook.id}`, {
        ...formData,
        cover_url: updatedCoverUrl,
        file_url: updatedFileUrl,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        toast.success('تم تحديث الكتاب بنجاح!');
        router.push('/admin/books'); // Redirect to admin books list
      } else {
        toast.error('فشل تحديث الكتاب.');
      }
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث الكتاب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1>Edit Book: {initialBook?.title}</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label>
          Title:
          <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>
          Author:
          <input type="text" name="author" value={formData.author} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>
          Description:
          <textarea name="description" value={formData.description} onChange={handleChange} required style={{ width: '100%', padding: '8px', minHeight: '100px' }} />
        </label>
        <label>
          Category:
          <input type="text" name="category" value={formData.category} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>
          Pages:
          <input type="number" name="pages" value={formData.pages} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>
          Language:
          <input type="text" name="language" value={formData.language} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>
          Current Cover URL:
          <input type="text" name="cover_url" value={formData.cover_url} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>
          Upload New Cover Image:
          <input type="file" name="cover_file" accept="image/*" onChange={handleFileChange} style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>
          Current PDF File URL:
          <input type="text" name="file_url" value={formData.file_url} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>
          Upload New PDF File:
          <input type="file" name="pdf_file" accept="application/pdf" onChange={handleFileChange} style={{ width: '100%', padding: '8px' }} />
        </label>
        <label>
          Status:
          <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}>
          {loading ? 'Updating...' : 'Update Book'}
        </button>
      </form>
    </div>
  );
};

export default EditBookFormClient;
