'use client';
import React from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { FaDownload, FaCheck, FaSpinner } from 'react-icons/fa';

const DownloadButton = ({ book, pdfUrl, coverUrl }) => {
    const { downloadBook, isBookDownloaded, isDownloading, removeBook } = useOffline();

    const isDownloaded = isBookDownloaded(book.id);
    const loading = isDownloading(book.id);

    const handleClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (loading) return;

        if (isDownloaded) {
            if (confirm('هل تريد حذف هذا الكتاب من الجهاز؟')) {
                await removeBook(book.id);
            }
        } else {
            await downloadBook(book, pdfUrl, coverUrl);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`download-btn ${isDownloaded ? 'downloaded' : ''}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                backgroundColor: isDownloaded ? '#4caf50' : 'var(--accent-color)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                marginTop: '10px'
            }}
        >
            {loading ? (
                <>
                    <FaSpinner className="spin" /> جاري التحميل...
                </>
            ) : isDownloaded ? (
                <>
                    <FaCheck /> تم التحميل
                </>
            ) : (
                <>
                    <FaDownload /> تحميل للقراءة بدون نت
                </>
            )}

            <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </button>
    );
};

export default DownloadButton;
