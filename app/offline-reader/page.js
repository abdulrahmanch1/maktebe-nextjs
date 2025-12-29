'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PdfViewerClient from '@/app/read/[id]/PdfViewerClient';

const OfflineReaderContent = () => {
    const searchParams = useSearchParams();
    const bookId = searchParams.get('id');

    if (!bookId) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>
                <h2>خطأ في الرابط</h2>
                <p>لم يتم تحديد الكتاب المطلوب.</p>
                <a href="/offline" style={{ color: '#4caf50', textDecoration: 'underline' }}>العودة للمكتبة المحملة</a>
            </div>
        );
    }

    // We pass null for pdfUrl so PdfViewerClient knows to check offline storage immediately
    // or we can pass a dummy one, but the logic we added handles missing/failing URLs.
    // Ideally, PdfViewerClient should trigger offline logic if pdfUrl is null/undefined.
    return <PdfViewerClient pdfUrl={null} bookTitle="جاري التحميل..." bookId={bookId} />;
};

const OfflineReaderPage = () => {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>جاري التحميل...</div>}>
            <OfflineReaderContent />
        </Suspense>
    );
};

export default OfflineReaderPage;
