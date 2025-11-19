'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ConditionalLayout({ children }) {
    const pathname = usePathname();
    const isReadPage = pathname?.startsWith('/read/');

    if (isReadPage) {
        return <>{children}</>;
    }

    return (
        <div className="main-layout">
            <Header />
            <main className="main-content">{children}</main>
            <Footer />
        </div>
    );
}
