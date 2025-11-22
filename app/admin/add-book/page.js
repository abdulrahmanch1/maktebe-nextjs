import { Suspense } from 'react';
import AdminPageClient from '../AdminPageClient';

export default function AddBookPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminPageClient />
        </Suspense>
    );
}
