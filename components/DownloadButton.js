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
            className={`book-action-button ${isDownloaded ? 'downloaded' : 'primary'}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                // Override background color if downloaded, otherwise 'primary' class handles it
                backgroundColor: isDownloaded ? '#4caf50' : undefined,
                color: 'var(--primary-color)', // Ensure text color is consistent with other buttons if needed, or keeping it strictly white/primary
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
