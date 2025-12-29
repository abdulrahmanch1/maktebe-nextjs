'use client';
import React from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import Link from 'next/link';
import { FaTrash, FaBookOpen, FaFileDownload } from 'react-icons/fa';
import Image from 'next/image';
import '@/components/BookCard.css'; // Import standard BookCard styles

const OfflinePage = () => {
  const { downloadedBooks, storageUsage, removeBook } = useOffline();

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper to get cover URL from blob or string
  const getCoverUrl = (book) => {
    // If we saved a blob url or similar in the offline context, use it.
    // However, the offline context usually saves blobs in IndexedDB.
    // We need to create object URLs for them in the component if they are blobs,
    // but 'downloadedBooks' from context usually returns the metadata + blobs.
    // We'll trust the context/db utility returns something usable or we handle it here.
    // Actually, getAllOfflineBooks returns the object from IDB.
    if (book.coverBlob) {
      return URL.createObjectURL(book.coverBlob);
    }
    return book.cover || '/imgs/no_cover_available.png';
  };

  return (
    <div className="offline-page" style={{ padding: '40px 20px', minHeight: '100vh', direction: 'rtl' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <header style={{
          textAlign: 'center',
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'var(--primary-color)' }}>مكتبتي المحملة</h1>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 20px',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: '20px',
            fontSize: '0.9rem',
            color: 'var(--primary-color)'
          }}>
            مساحة التخزين المستخدمة: <span style={{ fontWeight: 'bold', marginRight: '5px', color: 'var(--accent-color)' }}>{formatSize(storageUsage)}</span>
          </div>
        </header>

        {downloadedBooks.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>📚</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>مكتبتك فارغة</h3>
            <p>قم بتحميل الكتب المفضلة لديك لقراءتها في أي وقت وأي مكان.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', // Match BookList grid
            gap: '24px',
            padding: '10px'
          }}>
            {downloadedBooks.map((book) => {
              const coverUrl = getCoverUrl(book);

              return (
                <div key={book.id} className="book-card">
                  <Link href={`/offline-reader?id=${book.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%' }}>
                    <div className="book-card-cover">
                      <Image
                        src={coverUrl}
                        alt={book.title}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
                        className="book-card-image"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/imgs/no_cover_available.png'; }}
                        unoptimized={!!book.coverBlob} // Don't optimize blob URLs
                      />
                      <div className="book-card-overlay">
                        {book.pdfBlob && (
                          <a
                            href={URL.createObjectURL(book.pdfBlob)}
                            download={`${book.title}.pdf`}
                            onClick={(e) => e.stopPropagation()}
                            className="favorite-btn"
                            style={{ backgroundColor: '#4caf50', borderColor: '#4caf50', marginLeft: '8px' }}
                            title="حفظ في الجهاز (تنزيل)"
                          >
                            <FaFileDownload style={{ color: 'white', width: '16px', height: '16px' }} />
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm('هل أنت متأكد من حذف هذا الكتاب من الجهاز؟')) {
                              removeBook(book.id);
                            }
                          }}
                          className="favorite-btn"
                          style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                          title="حذف من المتصفح"
                        >
                          <FaTrash style={{ color: 'white', width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>

                    <div className="book-card-info">
                      <p className="book-title" title={book.title}>{book.title}</p>
                      <p className="book-author">{book.author}</p>
                      <div className="progress-container" style={{ marginTop: '5px' }}>
                        <div className="progress-bar" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                          <div className="progress-fill" style={{ width: '100%', backgroundColor: '#4caf50' }}></div>
                        </div>
                        <span className="progress-text" style={{ color: '#4caf50' }}>متوفر</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflinePage;
