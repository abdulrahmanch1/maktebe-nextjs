import Link from 'next/link';

export const metadata = {
    title: 'مكتبة دار القرَاء | الصفحة الرئيسية',
    description: 'مكتبة دار القرَاء - وجهتك الأولى لقراءة وتحميل آلاف الكتب العربية مجاناً',
    alternates: {
        canonical: '/',
    },
};

export default function HomePage() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            direction: 'rtl'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>مرحباً بك في دار القرّاء</h1>
            <p style={{ fontSize: '1.5rem', marginBottom: '40px', opacity: 0.8 }}>
                الصفحة الرئيسية قيد التصميم...
            </p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    href="/books"
                    style={{
                        padding: '15px 30px',
                        backgroundColor: 'var(--accent-color)',
                        color: 'white',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        transition: 'transform 0.2s'
                    }}
                >
                    تصفح الكتب 📚
                </Link>
                <Link
                    href="/authors"
                    style={{
                        padding: '15px 30px',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        transition: 'transform 0.2s'
                    }}
                >
                    المؤلفون والعلماء 👤
                </Link>
            </div>
        </div>
    );
}
