'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveBookToOffline, deleteOfflineBook, getAllOfflineBooks, getStorageUsage } from '@/utils/db';
import { toast } from 'react-toastify';

const OfflineContext = createContext();

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [downloadedBooks, setDownloadedBooks] = useState([]);
    const [storageUsage, setStorageUsage] = useState(0);
    const [downloadingIds, setDownloadingIds] = useState(new Set());

    // Check online status
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);

            const handleOnline = () => setIsOnline(true);
            const handleOffline = () => setIsOnline(false);

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    // Load initial data
    useEffect(() => {
        refreshOfflineData();
    }, []);

    const refreshOfflineData = async () => {
        try {
            const books = await getAllOfflineBooks();
            const usage = await getStorageUsage();
            setDownloadedBooks(books);
            setStorageUsage(usage);
        } catch (error) {
            console.error("Error loading offline data:", error);
        }
    };

    const downloadBook = async (book, pdfUrl, coverUrl) => {
        if (downloadingIds.has(book.id)) return;

        try {
            setDownloadingIds(prev => new Set(prev).add(book.id));
            toast.info(`جاري تحميل كتاب: ${book.title}...`);

            // Fetch Blobs
            // Note: We need to handle CORS. If images/PDFs are on Supabase, ensure CORS is configured.
            // For now, we assume standard fetch works or we might need a proxy if CORS fails.

            const [coverRes, pdfRes] = await Promise.all([
                fetch(coverUrl).catch(e => null),
                fetch(pdfUrl).catch(e => null)
            ]);

            if (!pdfRes || !pdfRes.ok) throw new Error("فشل تحميل ملف الكتاب");

            const pdfBlob = await pdfRes.blob();
            const coverBlob = coverRes && coverRes.ok ? await coverRes.blob() : null;

            await saveBookToOffline(book, coverBlob, pdfBlob);

            toast.success("تم تحميل الكتاب بنجاح للقراءة بدون نت!");
            await refreshOfflineData();
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("حدث خطأ أثناء تحميل الكتاب. تأكد من اتصالك بالإنترنت.");
        } finally {
            setDownloadingIds(prev => {
                const next = new Set(prev);
                next.delete(book.id);
                return next;
            });
        }
    };

    const removeBook = async (id) => {
        try {
            await deleteOfflineBook(id);
            toast.success("تم حذف الكتاب من الجهاز.");
            await refreshOfflineData();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("فشل حذف الكتاب.");
        }
    };

    const isBookDownloaded = (id) => {
        return downloadedBooks.some(b => b.id === id);
    };

    return (
        <OfflineContext.Provider value={{
            isOnline,
            downloadedBooks,
            storageUsage,
            downloadBook,
            removeBook,
            isBookDownloaded,
            isDownloading: (id) => downloadingIds.has(id)
        }}>
            {children}
        </OfflineContext.Provider>
    );
};
