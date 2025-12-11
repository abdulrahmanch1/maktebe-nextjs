'use client';
import React from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import Link from 'next/link';
import { FaTrash, FaBookOpen } from 'react-icons/fa';

const OfflinePage = () => {
  const { downloadedBooks, storageUsage, removeBook } = useOffline();

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="offline-page" style={{ padding: '80px 20px', minHeight: '100vh', direction: 'rtl' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '15px', fontWeight: '800' }}>مكتبتي المحملة</h1>
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            fontSize: '1rem',
            color: 'var(--text-color)'
          }}>
            مساحة التخزين المستخدمة: <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{formatSize(storageUsage)}</span>
          </div>
        </header>

        {downloadedBooks.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--placeholder-color)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '20px' }}>لم تقم بتحميل أي كتب بعد.</p>
            <p>قم بتحميل الكتب عندما يكون لديك إنترنت لتقرأها هنا لاحقاً.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {downloadedBooks.map((book) => (
              <div key={book.id} className="offline-book-card" style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ padding: '20px', flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-color)' }}>{book.title}</h3>
                  <p style={{ color: 'var(--placeholder-color)', fontSize: '0.9rem' }}>{book.author}</p>
                  <div style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--accent-color)' }}>
                    الحجم: {formatSize(book.size)}
                  </div>
                </div>

                <div style={{
                  padding: '15px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <Link href={`/book/${book.id}`} style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    backgroundColor: 'var(--accent-color)',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    <FaBookOpen /> قراءة
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('حذف الكتاب؟')) removeBook(book.id);
                    }}
                    style={{
                      padding: '10px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--error-color, #ef4444)',
                      color: 'var(--error-color, #ef4444)',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflinePage;
